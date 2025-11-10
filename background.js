// Background service worker for Tab Groups Manager Pro
// Handles keyboard shortcuts, context menus, and background tasks

// Create context menu on installation
chrome.runtime.onInstalled.addListener(async () => {
  // Create context menu items
  chrome.contextMenus.create({
    id: 'save-current-session',
    title: 'Save Current Tab Groups',
    contexts: ['page', 'action']
  });

  chrome.contextMenus.create({
    id: 'separator-1',
    type: 'separator',
    contexts: ['page', 'action']
  });

  chrome.contextMenus.create({
    id: 'restore-menu',
    title: 'Restore Session',
    contexts: ['page', 'action']
  });

  // Initialize automation features
  await setupScheduleAlarms();
  await updateAutoGroupingRules();
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'save-current-session') {
    await quickSaveSession();
  } else if (info.menuItemId.startsWith('restore-')) {
    const sessionId = info.menuItemId.replace('restore-', '');
    await restoreSession(sessionId);
  }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'quick-export') {
    await quickSaveSession();
  } else if (command === 'quick-restore-last') {
    await restoreLastSession();
  }
});

// Quick save current session
async function quickSaveSession() {
  try {
    const tabGroups = await chrome.tabGroups.query({});
    const exportData = [];

    for (const group of tabGroups) {
      const tabs = await chrome.tabs.query({ groupId: group.id });
      const urls = tabs.map(tab => ({ url: tab.url, pinned: tab.pinned }));
      exportData.push({
        title: group.title || 'Untitled',
        color: group.color,
        collapsed: group.collapsed,
        urls
      });
    }

    // Also get ungrouped tabs
    const ungroupedTabs = await chrome.tabs.query({ groupId: chrome.tabGroups.TAB_GROUP_ID_NONE });
    if (ungroupedTabs.length > 0) {
      const urls = ungroupedTabs.map(tab => ({ url: tab.url, pinned: tab.pinned }));
      exportData.push({
        title: 'Ungrouped',
        color: 'grey',
        collapsed: false,
        urls
      });
    }

    // Save to storage
    const sessionId = `session-${Date.now()}`;
    const session = {
      id: sessionId,
      name: generateSessionName(),
      timestamp: Date.now(),
      data: exportData,
      pinned: false,
      tabCount: exportData.reduce((sum, g) => sum + g.urls.length, 0),
      groupCount: exportData.length
    };

    const result = await chrome.storage.local.get('sessions');
    const sessions = result.sessions || {};
    sessions[sessionId] = session;

    // Keep only last 50 sessions to avoid storage issues
    const sessionArray = Object.values(sessions);
    if (sessionArray.length > 50) {
      sessionArray.sort((a, b) => b.timestamp - a.timestamp);
      const kept = sessionArray.slice(0, 50);
      const newSessions = {};
      kept.forEach(s => newSessions[s.id] = s);
      await chrome.storage.local.set({ sessions: newSessions });
    } else {
      await chrome.storage.local.set({ sessions });
    }

    // Show notification
    await chrome.notifications?.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Session Saved',
      message: `Saved "${session.name}" (${session.tabCount} tabs)`
    });

  } catch (err) {
    console.error('Quick save failed:', err);
  }
}

// Restore last saved session
async function restoreLastSession() {
  try {
    const result = await chrome.storage.local.get('sessions');
    const sessions = result.sessions || {};
    const sessionArray = Object.values(sessions);

    if (sessionArray.length === 0) {
      await chrome.notifications?.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'No Sessions',
        message: 'No saved sessions found'
      });
      return;
    }

    // Sort by timestamp and get most recent
    sessionArray.sort((a, b) => b.timestamp - a.timestamp);
    const lastSession = sessionArray[0];

    await restoreSession(lastSession.id);
  } catch (err) {
    console.error('Restore last session failed:', err);
  }
}

// Restore a specific session
async function restoreSession(sessionId) {
  try {
    const result = await chrome.storage.local.get('sessions');
    const sessions = result.sessions || {};
    const session = sessions[sessionId];

    if (!session) {
      console.error('Session not found:', sessionId);
      return;
    }

    const newWindow = await chrome.windows.create({ focused: true });

    // Close the default blank tab
    const defaultTabs = await chrome.tabs.query({ windowId: newWindow.id });
    if (defaultTabs.length === 1 && defaultTabs[0].url === 'chrome://newtab/') {
      await chrome.tabs.remove(defaultTabs[0].id);
    }

    let importedGroups = 0;
    for (const groupData of session.data) {
      const urls = Array.isArray(groupData.urls) ? groupData.urls : [];
      const tabIds = [];

      for (const item of urls) {
        const url = typeof item === 'object' ? item.url : item;
        const pinned = typeof item === 'object' && item.pinned === true;
        try {
          const tab = await chrome.tabs.create({ url, active: false, windowId: newWindow.id, pinned });
          if (tab.id !== undefined && tab.id !== chrome.tabs.TAB_ID_NONE) {
            tabIds.push(tab.id);
          }
        } catch (createErr) {
          console.warn('Failed to create tab:', url, createErr);
        }
      }

      if (tabIds.length === 0) continue;

      const groupId = await chrome.tabs.group({ tabIds });
      const updateProps = {};
      if (groupData.title) updateProps.title = groupData.title;
      if (groupData.color) updateProps.color = groupData.color;
      if (typeof groupData.collapsed === 'boolean') updateProps.collapsed = groupData.collapsed;

      if (Object.keys(updateProps).length > 0) {
        await chrome.tabGroups.update(groupId, updateProps);
      }

      importedGroups++;
    }

    await chrome.notifications?.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Session Restored',
      message: `Restored "${session.name}" (${importedGroups} groups)`
    });

  } catch (err) {
    console.error('Restore session failed:', err);
  }
}

// Generate session name based on date/time
function generateSessionName() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const datePart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const timePart = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  return `Session ${datePart} ${timePart}`;
}

// ========== SPRINT 6: AUTOMATION FEATURES ==========

// Message listener for popup communication
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateSchedules') {
    setupScheduleAlarms();
  } else if (message.action === 'updateRules') {
    updateAutoGroupingRules();
  }
});

// Setup schedule alarms
async function setupScheduleAlarms() {
  try {
    // Clear all existing schedule alarms
    const alarms = await chrome.alarms.getAll();
    for (const alarm of alarms) {
      if (alarm.name.startsWith('schedule-check-')) {
        await chrome.alarms.clear(alarm.name);
      }
    }

    const result = await chrome.storage.local.get(['scheduleEnabled', 'schedules']);
    if (!result.scheduleEnabled || !result.schedules || result.schedules.length === 0) {
      console.log('Schedule automation disabled or no schedules configured');
      return;
    }

    // Create an alarm that checks every minute
    await chrome.alarms.create('schedule-check', { periodInMinutes: 1 });
    console.log('Schedule checking alarm created');
  } catch (err) {
    console.error('Failed to setup schedule alarms:', err);
  }
}

// Alarm listener
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'schedule-check') {
    await checkAndApplySchedules();
  }
});

// Check and apply schedules
async function checkAndApplySchedules() {
  try {
    const result = await chrome.storage.local.get(['scheduleEnabled', 'schedules', 'sessions', 'lastScheduleApplied']);

    if (!result.scheduleEnabled || !result.schedules) {
      return;
    }

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const currentDay = now.toISOString().split('T')[0]; // YYYY-MM-DD

    // Find applicable schedule
    for (const schedule of result.schedules) {
      if (!schedule.sessionId || !schedule.startTime || !schedule.endTime) {
        continue;
      }

      // Check if current time is within schedule window
      if (currentTime >= schedule.startTime && currentTime < schedule.endTime) {
        // Check if we already applied this schedule today
        const scheduleKey = `${schedule.sessionId}-${currentDay}`;
        if (result.lastScheduleApplied === scheduleKey) {
          // Already applied this schedule today
          continue;
        }

        // Find the session
        const sessions = result.sessions || {};
        const session = sessions[schedule.sessionId];

        if (!session) {
          console.warn('Schedule references non-existent session:', schedule.sessionId);
          continue;
        }

        // Apply the schedule by restoring the session
        console.log(`Applying schedule: Loading session "${session.name}" at ${currentTime}`);
        await restoreSession(schedule.sessionId);

        // Mark this schedule as applied for today
        await chrome.storage.local.set({ lastScheduleApplied: scheduleKey });

        // Show notification
        await chrome.notifications?.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Scheduled Session Loaded',
          message: `Loaded "${session.name}" (scheduled for ${schedule.startTime}-${schedule.endTime})`
        });

        break; // Only apply one schedule at a time
      }
    }
  } catch (err) {
    console.error('Failed to check schedules:', err);
  }
}

// Update auto-grouping rules
let autoGroupingRules = [];
let autoGroupingEnabled = false;

async function updateAutoGroupingRules() {
  try {
    const result = await chrome.storage.local.get(['autogroupingEnabled', 'rules']);
    autoGroupingEnabled = result.autogroupingEnabled || false;
    autoGroupingRules = result.rules || [];
    console.log('Auto-grouping rules updated:', autoGroupingRules.length, 'rules, enabled:', autoGroupingEnabled);
  } catch (err) {
    console.error('Failed to update auto-grouping rules:', err);
  }
}

// Tab creation listener for auto-grouping
chrome.tabs.onCreated.addListener(async (tab) => {
  if (!autoGroupingEnabled || autoGroupingRules.length === 0) {
    return;
  }

  // Wait a bit for the tab to load and get a URL
  setTimeout(async () => {
    try {
      const updatedTab = await chrome.tabs.get(tab.id);
      if (!updatedTab.url || updatedTab.url.startsWith('chrome://') || updatedTab.url.startsWith('chrome-extension://')) {
        return; // Skip chrome internal URLs
      }

      // Check rules
      for (const rule of autoGroupingRules) {
        if (!rule.pattern || !rule.groupName) {
          continue;
        }

        if (matchesPattern(updatedTab.url, rule.pattern)) {
          await applyAutoGroupingRule(updatedTab, rule);
          break; // Only apply first matching rule
        }
      }
    } catch (err) {
      console.error('Failed to apply auto-grouping:', err);
    }
  }, 500); // Wait 500ms for tab to load
});

// Check if URL matches pattern
function matchesPattern(url, pattern) {
  try {
    // Convert glob-style pattern to regex
    // Escape special regex characters except * and ?
    let regexPattern = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');

    const regex = new RegExp(regexPattern, 'i');
    return regex.test(url);
  } catch (err) {
    console.error('Invalid pattern:', pattern, err);
    return false;
  }
}

// Apply auto-grouping rule to tab
async function applyAutoGroupingRule(tab, rule) {
  try {
    // Check if a group with this name already exists in the current window
    const existingGroups = await chrome.tabGroups.query({ windowId: tab.windowId });
    let targetGroupId = null;

    for (const group of existingGroups) {
      if (group.title === rule.groupName) {
        targetGroupId = group.id;
        break;
      }
    }

    if (targetGroupId !== null && targetGroupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
      // Add tab to existing group
      await chrome.tabs.group({ tabIds: [tab.id], groupId: targetGroupId });
      console.log(`Added tab to existing group "${rule.groupName}":`, tab.url);
    } else {
      // Create new group
      const newGroupId = await chrome.tabs.group({ tabIds: [tab.id] });
      await chrome.tabGroups.update(newGroupId, {
        title: rule.groupName,
        color: rule.color || 'blue',
        collapsed: false
      });
      console.log(`Created new group "${rule.groupName}" for tab:`, tab.url);
    }
  } catch (err) {
    console.error('Failed to apply auto-grouping rule:', err);
  }
}

// Initialize automation on extension load
chrome.runtime.onStartup.addListener(async () => {
  await setupScheduleAlarms();
  await updateAutoGroupingRules();
});
