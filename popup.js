// Tab Groups Manager Pro - Popup Script v2.0
// Now with session management, search, and pinned favorites

document.addEventListener('DOMContentLoaded', () => {
  // Tab switching
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;

      // Update active tab button
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update active tab view
      document.querySelectorAll('.tab-view').forEach(view => {
        view.classList.remove('active');
      });
      document.getElementById(`${targetTab}-tab`).classList.add('active');

      // Load sessions and stats when switching to sessions tab
      if (targetTab === 'sessions') {
        loadSessions();
        loadStats(); // Load stats at the top
      }

      // Load automation settings when switching to tools tab
      if (targetTab === 'tools') {
        loadAutomationSettings();
      }
    });
  });

  // Export tab elements
  const sessionNameInput = document.getElementById('session-name');
  const includeUngroupedCheckbox = document.getElementById('include-ungrouped');
  const includePinnedCheckbox = document.getElementById('include-pinned');
  const groupsListDiv = document.getElementById('groups-list');
  const statusDiv = document.getElementById('status');

  // Sessions tab elements
  const sessionSearch = document.getElementById('session-search');
  const pinnedSessionsList = document.getElementById('pinned-sessions-list');
  const allSessionsList = document.getElementById('all-sessions-list');

  // Hold loaded group info
  let groups = [];
  let allSessions = {};
  let selectedFormat = 'json'; // Default export format

  // Generate a default session name based on the current date/time
  function generateDefaultSessionName() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const datePart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const timePart = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    return `Session ${datePart} ${timePart}`;
  }

  // Initialize session name input
  sessionNameInput.value = generateDefaultSessionName();

  // Load the current tab groups and render them
  async function loadGroups() {
    groupsListDiv.textContent = 'Loading…';
    try {
      const tabGroups = await chrome.tabGroups.query({});
      const items = [];
      for (const group of tabGroups) {
        const tabs = await chrome.tabs.query({ groupId: group.id });
        items.push({
          id: group.id,
          title: group.title || '(Untitled)',
          color: group.color,
          collapsed: group.collapsed,
          tabCount: tabs.length,
        });
      }
      groups = items;
      const container = document.createElement('div');
      items.forEach((g) => {
        const item = document.createElement('div');
        item.className = 'group-item';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'group-checkbox';
        checkbox.dataset.groupId = String(g.id);
        checkbox.checked = true;
        const colorDot = document.createElement('div');
        colorDot.className = 'group-color';
        colorDot.style.backgroundColor = g.color;
        const titleSpan = document.createElement('span');
        titleSpan.className = 'group-title';
        titleSpan.textContent = `${g.title} (${g.tabCount} tab${g.tabCount !== 1 ? 's' : ''})`;
        item.appendChild(checkbox);
        item.appendChild(colorDot);
        item.appendChild(titleSpan);
        container.appendChild(item);
      });
      groupsListDiv.innerHTML = '';
      if (items.length === 0) {
        groupsListDiv.textContent = 'No groups found.';
      } else {
        groupsListDiv.appendChild(container);
      }
    } catch (err) {
      groupsListDiv.textContent = 'Failed to load groups.';
      console.error(err);
    }
  }

  loadGroups();

  // Format selector logic
  const formatBtns = document.querySelectorAll('.format-btn');
  formatBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active state
      formatBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedFormat = btn.dataset.format;
    });
  });

  // Export format functions
  function exportAsMarkdown(exportData) {
    let markdown = '# Tab Groups Export\n\n';
    markdown += `*Exported on ${new Date().toLocaleString()}*\n\n`;

    exportData.forEach(group => {
      markdown += `## ${group.title || 'Untitled Group'}\n\n`;
      markdown += `**Color:** ${group.color}  \n`;
      markdown += `**Tabs:** ${group.urls.length}\n\n`;

      group.urls.forEach(item => {
        const url = typeof item === 'object' ? item.url : item;
        const isPinned = typeof item === 'object' && item.pinned;

        // Try to extract domain/title from URL
        let displayText = url;
        try {
          const urlObj = new URL(url);
          displayText = urlObj.hostname + urlObj.pathname;
        } catch (e) {
          // Keep as-is if URL parsing fails
        }

        markdown += `- [${displayText}](${url})`;
        if (isPinned) markdown += ' 📌';
        markdown += '\n';
      });

      markdown += '\n';
    });

    return markdown;
  }

  function exportAsCSV(exportData) {
    let csv = 'Group Name,Tab Title,URL,Color,Pinned\n';

    exportData.forEach(group => {
      const groupName = (group.title || 'Untitled Group').replace(/"/g, '""');
      const color = group.color || '';

      group.urls.forEach(item => {
        const url = typeof item === 'object' ? item.url : item;
        const isPinned = typeof item === 'object' && item.pinned ? 'Yes' : 'No';

        // Extract title from URL
        let title = url;
        try {
          const urlObj = new URL(url);
          title = urlObj.hostname;
        } catch (e) {
          // Keep as-is
        }

        // Escape CSV values
        const escapedGroup = `"${groupName}"`;
        const escapedTitle = `"${title.replace(/"/g, '""')}"`;
        const escapedUrl = `"${url.replace(/"/g, '""')}"`;

        csv += `${escapedGroup},${escapedTitle},${escapedUrl},${color},${isPinned}\n`;
      });
    });

    return csv;
  }

  function exportAsPlainText(exportData) {
    let text = 'TAB GROUPS EXPORT\n';
    text += `Exported: ${new Date().toLocaleString()}\n`;
    text += '='.repeat(50) + '\n\n';

    exportData.forEach(group => {
      text += `${group.title || 'Untitled Group'} (${group.urls.length} tabs)\n`;
      text += '-'.repeat(50) + '\n';

      group.urls.forEach(item => {
        const url = typeof item === 'object' ? item.url : item;
        const isPinned = typeof item === 'object' && item.pinned;
        text += url;
        if (isPinned) text += ' [PINNED]';
        text += '\n';
      });

      text += '\n';
    });

    return text;
  }

  function exportAsBookmarks(exportData) {
    let html = '<!DOCTYPE NETSCAPE-Bookmark-file-1>\n';
    html += '<!-- This is an automatically generated file.\n';
    html += '     It will be read and overwritten.\n';
    html += '     DO NOT EDIT! -->\n';
    html += '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n';
    html += '<TITLE>Bookmarks</TITLE>\n';
    html += '<H1>Bookmarks</H1>\n';
    html += '<DL><p>\n';

    // Add timestamp folder
    const timestamp = Math.floor(Date.now() / 1000);
    html += `    <DT><H3 ADD_DATE="${timestamp}" LAST_MODIFIED="${timestamp}">Tab Groups Export</H3>\n`;
    html += '    <DL><p>\n';

    exportData.forEach(group => {
      const groupName = group.title || 'Untitled Group';
      html += `        <DT><H3 ADD_DATE="${timestamp}" LAST_MODIFIED="${timestamp}">${escapeHtml(groupName)}</H3>\n`;
      html += '        <DL><p>\n';

      group.urls.forEach(item => {
        const url = typeof item === 'object' ? item.url : item;
        const isPinned = typeof item === 'object' && item.pinned;

        // Extract title from URL
        let title = url;
        try {
          const urlObj = new URL(url);
          title = urlObj.hostname + urlObj.pathname;
        } catch (e) {
          // Keep as-is
        }

        if (isPinned) title = '📌 ' + title;

        html += `            <DT><A HREF="${escapeHtml(url)}" ADD_DATE="${timestamp}">${escapeHtml(title)}</A>\n`;
      });

      html += '        </DL><p>\n';
    });

    html += '    </DL><p>\n';
    html += '</DL><p>\n';

    return html;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Get file extension and MIME type for selected format
  function getFormatInfo(format) {
    const formats = {
      json: { ext: 'json', mime: 'application/json' },
      markdown: { ext: 'md', mime: 'text/markdown' },
      csv: { ext: 'csv', mime: 'text/csv' },
      plaintext: { ext: 'txt', mime: 'text/plain' },
      bookmarks: { ext: 'html', mime: 'text/html' }
    };
    return formats[format] || formats.json;
  }

  // Convert export data to selected format
  function convertToFormat(exportData, format) {
    switch (format) {
      case 'markdown':
        return exportAsMarkdown(exportData);
      case 'csv':
        return exportAsCSV(exportData);
      case 'plaintext':
        return exportAsPlainText(exportData);
      case 'bookmarks':
        return exportAsBookmarks(exportData);
      case 'json':
      default:
        return JSON.stringify(exportData, null, 2);
    }
  }

  // Select/Deselect all groups
  document.getElementById('select-all').addEventListener('click', () => {
    document.querySelectorAll('.group-checkbox').forEach(cb => cb.checked = true);
  });

  document.getElementById('select-none').addEventListener('click', () => {
    document.querySelectorAll('.group-checkbox').forEach(cb => cb.checked = false);
  });

  // Collect export data from current groups
  async function collectExportData() {
    const selectedIds = [];
    const checkboxes = document.querySelectorAll('.group-checkbox');
    checkboxes.forEach((cb) => {
      if (cb.checked) {
        selectedIds.push(parseInt(cb.dataset.groupId, 10));
      }
    });
    const includeUngrouped = includeUngroupedCheckbox.checked;
    const includePinned = includePinnedCheckbox.checked;

    if (selectedIds.length === 0 && !includeUngrouped) {
      throw new Error('No groups selected');
    }

    const exportData = [];

    for (const id of selectedIds) {
      const gInfo = groups.find((g) => g.id === id);
      if (!gInfo) continue;
      const tabs = await chrome.tabs.query({ groupId: id });
      const urls = tabs.map((tab) => {
        return includePinned ? { url: tab.url, pinned: tab.pinned } : tab.url;
      });
      exportData.push({
        title: gInfo.title || '',
        color: gInfo.color,
        collapsed: gInfo.collapsed,
        urls,
      });
    }

    if (includeUngrouped) {
      const ungroupedTabs = await chrome.tabs.query({ groupId: chrome.tabGroups.TAB_GROUP_ID_NONE });
      if (ungroupedTabs.length > 0) {
        const urls = ungroupedTabs.map((tab) => {
          return includePinned ? { url: tab.url, pinned: tab.pinned } : tab.url;
        });
        exportData.push({
          title: 'Ungrouped',
          color: 'grey',
          collapsed: false,
          urls,
        });
      }
    }

    return exportData;
  }

  // Save session to storage
  async function saveSession(name, data) {
    const sessionId = `session-${Date.now()}`;
    const session = {
      id: sessionId,
      name: name,
      timestamp: Date.now(),
      data: data,
      pinned: false,
      tabCount: data.reduce((sum, g) => sum + g.urls.length, 0),
      groupCount: data.length
    };

    const result = await chrome.storage.local.get('sessions');
    const sessions = result.sessions || {};
    sessions[sessionId] = session;

    // Keep only last 50 sessions
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

    return session;
  }

  // Copy to clipboard (in selected format)
  document.getElementById('copy-json').addEventListener('click', async () => {
    statusDiv.textContent = 'Copying…';
    try {
      const exportData = await collectExportData();
      const formattedContent = convertToFormat(exportData, selectedFormat);
      await navigator.clipboard.writeText(formattedContent);

      // Save to sessions (always save as JSON)
      let sessionName = sessionNameInput.value.trim();
      if (!sessionName) sessionName = generateDefaultSessionName();
      await saveSession(sessionName, exportData);

      const formatName = selectedFormat.toUpperCase();
      statusDiv.textContent = `✓ Copied as ${formatName} and saved "${sessionName}"`;
      statusDiv.style.color = '#28a745';
      setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.style.color = '';
      }, 3000);
    } catch (err) {
      console.error('Error during copy:', err);
      statusDiv.textContent = err.message === 'No groups selected'
        ? '⚠️ No groups selected'
        : 'Error copying to clipboard';
      statusDiv.style.color = '#d9534f';
      setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.style.color = '';
      }, 5000);
    }
  });

  // Export selected groups (in selected format)
  document.getElementById('export-selected').addEventListener('click', async () => {
    statusDiv.textContent = 'Exporting…';
    try {
      const exportData = await collectExportData();

      let sessionName = sessionNameInput.value.trim();
      if (!sessionName) sessionName = generateDefaultSessionName();

      // Get format-specific info
      const formatInfo = getFormatInfo(selectedFormat);
      const filenameBase = sessionName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${filenameBase}.${formatInfo.ext}`;

      // Convert to selected format
      const formattedContent = convertToFormat(exportData, selectedFormat);

      const blob = new Blob([formattedContent], { type: formatInfo.mime });
      const url = URL.createObjectURL(blob);
      await chrome.downloads.download({ url, filename, saveAs: true });
      setTimeout(() => URL.revokeObjectURL(url), 10000);

      // Save to sessions (always save as JSON)
      await saveSession(sessionName, exportData);

      const formatName = selectedFormat.toUpperCase();
      statusDiv.textContent = `✓ Exported as ${formatName} and saved "${sessionName}"`;
      statusDiv.style.color = '#28a745';
      setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.style.color = '';
      }, 3000);
    } catch (err) {
      console.error('Error during export:', err);
      statusDiv.textContent = err.message === 'No groups selected'
        ? '⚠️ No groups selected'
        : 'Error during export';
      statusDiv.style.color = '#d9534f';
      setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.style.color = '';
      }, 5000);
    }
  });

  // Import JSON
  document.getElementById('import-btn').addEventListener('click', () => {
    const fileInput = document.getElementById('file-input');
    fileInput.value = '';
    fileInput.click();
  });

  document.getElementById('file-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    statusDiv.textContent = 'Importing…';
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error('Invalid JSON: expected an array');

      await restoreSessionData(data);

      statusDiv.textContent = `✓ Imported successfully`;
      statusDiv.style.color = '#28a745';
      setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.style.color = '';
      }, 3000);
    } catch (err) {
      console.error('Error during import:', err);
      statusDiv.textContent = 'Error during import';
      statusDiv.style.color = '#d9534f';
      setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.style.color = '';
      }, 5000);
    }
  });

  // Restore session data (used by import and session restore)
  // SPRINT 4: Added tab deduplication - skips URLs already open in current window
  async function restoreSessionData(data) {
    const newWindow = await chrome.windows.create({ focused: true });

    const defaultTabs = await chrome.tabs.query({ windowId: newWindow.id });
    if (defaultTabs.length === 1 && defaultTabs[0].url === 'chrome://newtab/') {
      await chrome.tabs.remove(defaultTabs[0].id);
    }

    // SPRINT 4: Build set of existing URLs in the new window for deduplication
    const existingTabs = await chrome.tabs.query({ windowId: newWindow.id });
    const existingUrls = new Set(existingTabs.map(tab => tab.url));
    let skippedDuplicates = 0;

    let importedGroups = 0;
    for (const groupData of data) {
      const urls = Array.isArray(groupData.urls) ? groupData.urls : [];
      const tabIds = [];

      for (const item of urls) {
        const url = typeof item === 'object' ? item.url : item;
        const pinned = typeof item === 'object' && item.pinned === true;

        // SPRINT 4: Skip if URL already exists in window
        if (existingUrls.has(url)) {
          console.log('Skipping duplicate URL:', url);
          skippedDuplicates++;
          continue;
        }

        try {
          const tab = await chrome.tabs.create({ url, active: false, windowId: newWindow.id, pinned });
          if (tab.id !== undefined && tab.id !== chrome.tabs.TAB_ID_NONE) {
            tabIds.push(tab.id);
            existingUrls.add(url); // Add to set to prevent duplicates within this session
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

    // Show deduplication info if any duplicates were skipped
    if (skippedDuplicates > 0) {
      console.log(`Skipped ${skippedDuplicates} duplicate URLs during restore`);
    }

    return importedGroups;
  }

  // Load and display saved sessions
  async function loadSessions() {
    try {
      const result = await chrome.storage.local.get('sessions');
      allSessions = result.sessions || {};
      renderSessions();
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  }

  // Render sessions (filtered by search if applicable)
  function renderSessions() {
    const searchTerm = sessionSearch.value.toLowerCase();
    const sessionArray = Object.values(allSessions);

    // Filter by search
    const filtered = searchTerm
      ? sessionArray.filter(s => {
          return s.name.toLowerCase().includes(searchTerm) ||
                 s.data.some(g => g.title.toLowerCase().includes(searchTerm));
        })
      : sessionArray;

    // Separate pinned and unpinned
    const pinned = filtered.filter(s => s.pinned).sort((a, b) => b.timestamp - a.timestamp);
    const unpinned = filtered.filter(s => !s.pinned).sort((a, b) => b.timestamp - a.timestamp);

    // Render pinned
    if (pinned.length === 0) {
      pinnedSessionsList.innerHTML = '<div class="empty-state">No pinned sessions</div>';
    } else {
      pinnedSessionsList.innerHTML = '';
      pinned.forEach(session => {
        pinnedSessionsList.appendChild(createSessionItem(session));
      });
    }

    // Render all
    if (unpinned.length === 0) {
      allSessionsList.innerHTML = '<div class="empty-state">No saved sessions</div>';
    } else {
      allSessionsList.innerHTML = '';
      unpinned.forEach(session => {
        allSessionsList.appendChild(createSessionItem(session));
      });
    }
  }

  // Create session list item
  function createSessionItem(session) {
    const item = document.createElement('div');
    item.className = `session-item${session.pinned ? ' pinned' : ''}`;

    // Sprint 5: Add checkbox for merge functionality
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'session-checkbox';
    checkbox.dataset.sessionId = session.id;
    checkbox.addEventListener('change', updateMergeControls);

    const info = document.createElement('div');
    info.className = 'session-info';

    const name = document.createElement('div');
    name.className = 'session-name';
    name.textContent = session.name;

    // Sprint 5: Add layout badge if it's a window layout
    if (session.isLayout && session.windowCount) {
      const layoutBadge = document.createElement('span');
      layoutBadge.className = 'layout-badge';
      layoutBadge.textContent = `${session.windowCount}W`;
      layoutBadge.title = `${session.windowCount} window layout`;
      name.appendChild(layoutBadge);
    }

    const meta = document.createElement('div');
    meta.className = 'session-meta';
    const date = new Date(session.timestamp).toLocaleString();
    meta.textContent = `${date} • ${session.tabCount} tabs • ${session.groupCount} groups`;

    info.appendChild(name);
    info.appendChild(meta);

    const actions = document.createElement('div');
    actions.className = 'session-actions';

    // Star/unstar button
    const starBtn = document.createElement('button');
    starBtn.className = `icon-btn star${session.pinned ? ' active' : ''}`;
    starBtn.innerHTML = '⭐';
    starBtn.title = session.pinned ? 'Unpin' : 'Pin';
    starBtn.addEventListener('click', async () => {
      await togglePin(session.id);
      await autoSyncIfEnabled(); // Sprint 5: Auto-sync when pinning
    });

    // Sprint 5: Restore as layout button (if it's a layout)
    if (session.isLayout) {
      const layoutBtn = document.createElement('button');
      layoutBtn.className = 'icon-btn';
      layoutBtn.innerHTML = '⬜';
      layoutBtn.title = 'Restore as window layout';
      layoutBtn.addEventListener('click', () => restoreLayout(session));
      actions.appendChild(layoutBtn);
    }

    // Restore button
    const restoreBtn = document.createElement('button');
    restoreBtn.className = 'icon-btn';
    restoreBtn.innerHTML = '↻';
    restoreBtn.title = 'Restore session';
    restoreBtn.addEventListener('click', () => restoreSession(session.id));

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'icon-btn';
    deleteBtn.innerHTML = '🗑';
    deleteBtn.title = 'Delete session';
    deleteBtn.addEventListener('click', () => deleteSession(session.id));

    actions.appendChild(starBtn);
    actions.appendChild(restoreBtn);
    actions.appendChild(deleteBtn);

    item.appendChild(checkbox);
    item.appendChild(info);
    item.appendChild(actions);

    return item;
  }

  // Toggle pin status
  async function togglePin(sessionId) {
    try {
      const result = await chrome.storage.local.get('sessions');
      const sessions = result.sessions || {};
      if (sessions[sessionId]) {
        sessions[sessionId].pinned = !sessions[sessionId].pinned;
        await chrome.storage.local.set({ sessions });
        allSessions = sessions;
        renderSessions();
      }
    } catch (err) {
      console.error('Failed to toggle pin:', err);
    }
  }

  // Restore a saved session
  async function restoreSession(sessionId) {
    try {
      const session = allSessions[sessionId];
      if (!session) return;

      await restoreSessionData(session.data);

      // Show brief success message
      const temp = document.createElement('div');
      temp.style.cssText = 'position: fixed; top: 10px; left: 50%; transform: translateX(-50%); background: #28a745; color: white; padding: 8px 16px; border-radius: 4px; font-size: 12px; z-index: 9999;';
      temp.textContent = `✓ Restored "${session.name}"`;
      document.body.appendChild(temp);
      setTimeout(() => temp.remove(), 2000);
    } catch (err) {
      console.error('Failed to restore session:', err);
      alert('Failed to restore session');
    }
  }

  // Delete a saved session
  async function deleteSession(sessionId) {
    if (!confirm('Delete this session?')) return;

    try {
      const result = await chrome.storage.local.get('sessions');
      const sessions = result.sessions || {};
      delete sessions[sessionId];
      await chrome.storage.local.set({ sessions });
      allSessions = sessions;
      renderSessions();
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  }

  // Search sessions
  sessionSearch.addEventListener('input', () => {
    renderSessions();
  });

  // ========== AUTOMATION TAB ==========

  // Automation tab elements
  const scheduleEnabled = document.getElementById('schedule-enabled');
  const schedulesList = document.getElementById('schedules-list');
  const addScheduleBtn = document.getElementById('add-schedule');
  const autogroupingEnabled = document.getElementById('autogrouping-enabled');
  const rulesList = document.getElementById('rules-list');
  const addRuleBtn = document.getElementById('add-rule');

  let schedules = [];
  let rules = [];

  // Load automation settings
  async function loadAutomationSettings() {
    try {
      const result = await chrome.storage.local.get(['schedules', 'scheduleEnabled', 'rules', 'autogroupingEnabled']);
      schedules = result.schedules || [];
      scheduleEnabled.checked = result.scheduleEnabled || false;
      rules = result.rules || [];
      autogroupingEnabled.checked = result.autogroupingEnabled || false;
      renderSchedules();
      renderRules();
    } catch (err) {
      console.error('Failed to load automation settings:', err);
    }
  }

  // Render schedules
  function renderSchedules() {
    if (schedules.length === 0) {
      schedulesList.innerHTML = '<div class="empty-state" style="padding: 10px; font-size: 11px;">No schedules configured</div>';
    } else {
      schedulesList.innerHTML = '';
      schedules.forEach((schedule, index) => {
        schedulesList.appendChild(createScheduleItem(schedule, index));
      });
    }
  }

  // Create schedule item
  function createScheduleItem(schedule, index) {
    const item = document.createElement('div');
    item.className = 'schedule-item';

    const timeRow = document.createElement('div');
    timeRow.className = 'schedule-time-row';

    const startLabel = document.createElement('label');
    startLabel.innerHTML = 'Start Time:<br><input type="time" value="' + schedule.startTime + '" data-index="' + index + '" data-field="startTime" />';

    const endLabel = document.createElement('label');
    endLabel.innerHTML = 'End Time:<br><input type="time" value="' + schedule.endTime + '" data-index="' + index + '" data-field="endTime" />';

    timeRow.appendChild(startLabel);
    timeRow.appendChild(endLabel);

    const sessionLabel = document.createElement('label');
    sessionLabel.style.marginTop = '6px';
    const select = document.createElement('select');
    select.dataset.index = index;
    select.dataset.field = 'sessionId';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select session...';
    select.appendChild(defaultOption);

    Object.values(allSessions).forEach(session => {
      const option = document.createElement('option');
      option.value = session.id;
      option.textContent = session.name;
      if (session.id === schedule.sessionId) option.selected = true;
      select.appendChild(option);
    });

    sessionLabel.appendChild(document.createTextNode('Session to load:'));
    sessionLabel.appendChild(document.createElement('br'));
    sessionLabel.appendChild(select);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = 'Remove Schedule';
    removeBtn.addEventListener('click', () => removeSchedule(index));

    item.appendChild(timeRow);
    item.appendChild(sessionLabel);
    item.appendChild(removeBtn);

    // Add change listeners
    item.querySelectorAll('input, select').forEach(input => {
      input.addEventListener('change', (e) => {
        const idx = parseInt(e.target.dataset.index);
        const field = e.target.dataset.field;
        schedules[idx][field] = e.target.value;
        saveSchedules();
      });
    });

    return item;
  }

  // Add schedule
  async function addSchedule() {
    const newSchedule = {
      startTime: '09:00',
      endTime: '17:00',
      sessionId: ''
    };
    schedules.push(newSchedule);
    await saveSchedules();
    renderSchedules();
  }

  // Remove schedule
  async function removeSchedule(index) {
    schedules.splice(index, 1);
    await saveSchedules();
    renderSchedules();
  }

  // Save schedules
  async function saveSchedules() {
    try {
      await chrome.storage.local.set({ schedules });
      // Notify background script to update alarms
      chrome.runtime.sendMessage({ action: 'updateSchedules' });
    } catch (err) {
      console.error('Failed to save schedules:', err);
    }
  }

  // Toggle schedule enabled
  scheduleEnabled.addEventListener('change', async () => {
    try {
      await chrome.storage.local.set({ scheduleEnabled: scheduleEnabled.checked });
      chrome.runtime.sendMessage({ action: 'updateSchedules' });
    } catch (err) {
      console.error('Failed to toggle schedule:', err);
    }
  });

  addScheduleBtn.addEventListener('click', addSchedule);

  // Render rules
  function renderRules() {
    if (rules.length === 0) {
      rulesList.innerHTML = '<div class="empty-state" style="padding: 10px; font-size: 11px;">No rules configured</div>';
    } else {
      rulesList.innerHTML = '';
      rules.forEach((rule, index) => {
        rulesList.appendChild(createRuleItem(rule, index));
      });
    }
  }

  // Create rule item
  function createRuleItem(rule, index) {
    const item = document.createElement('div');
    item.className = 'rule-item';

    const patternLabel = document.createElement('label');
    patternLabel.textContent = 'URL Pattern (e.g., github.com/*, localhost:*):';
    const patternInput = document.createElement('input');
    patternInput.type = 'text';
    patternInput.value = rule.pattern || '';
    patternInput.placeholder = 'example.com/*';
    patternInput.dataset.index = index;
    patternInput.dataset.field = 'pattern';
    patternLabel.appendChild(patternInput);

    const groupNameLabel = document.createElement('label');
    groupNameLabel.textContent = 'Group Name:';
    groupNameLabel.style.marginTop = '6px';
    const groupNameInput = document.createElement('input');
    groupNameInput.type = 'text';
    groupNameInput.value = rule.groupName || '';
    groupNameInput.placeholder = 'My Group';
    groupNameInput.dataset.index = index;
    groupNameInput.dataset.field = 'groupName';
    groupNameLabel.appendChild(groupNameInput);

    const colorLabel = document.createElement('label');
    colorLabel.textContent = 'Group Color:';
    colorLabel.style.marginTop = '6px';
    const colorSelect = document.createElement('select');
    colorSelect.dataset.index = index;
    colorSelect.dataset.field = 'color';

    const colors = ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'];
    colors.forEach(color => {
      const option = document.createElement('option');
      option.value = color;
      option.textContent = color.charAt(0).toUpperCase() + color.slice(1);
      if (color === rule.color) option.selected = true;
      colorSelect.appendChild(option);
    });
    colorLabel.appendChild(colorSelect);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = 'Remove Rule';
    removeBtn.addEventListener('click', () => removeRule(index));

    item.appendChild(patternLabel);
    item.appendChild(groupNameLabel);
    item.appendChild(colorLabel);
    item.appendChild(removeBtn);

    // Add change listeners
    item.querySelectorAll('input, select').forEach(input => {
      input.addEventListener('change', (e) => {
        const idx = parseInt(e.target.dataset.index);
        const field = e.target.dataset.field;
        rules[idx][field] = e.target.value;
        saveRules();
      });
    });

    return item;
  }

  // Add rule
  async function addRule() {
    const newRule = {
      pattern: '',
      groupName: '',
      color: 'blue'
    };
    rules.push(newRule);
    await saveRules();
    renderRules();
  }

  // Remove rule
  async function removeRule(index) {
    rules.splice(index, 1);
    await saveRules();
    renderRules();
  }

  // Save rules
  async function saveRules() {
    try {
      await chrome.storage.local.set({ rules });
      // Notify background script
      chrome.runtime.sendMessage({ action: 'updateRules' });
    } catch (err) {
      console.error('Failed to save rules:', err);
    }
  }

  // Toggle autogrouping enabled
  autogroupingEnabled.addEventListener('change', async () => {
    try {
      await chrome.storage.local.set({ autogroupingEnabled: autogroupingEnabled.checked });
      chrome.runtime.sendMessage({ action: 'updateRules' });
    } catch (err) {
      console.error('Failed to toggle autogrouping:', err);
    }
  });

  addRuleBtn.addEventListener('click', addRule);

  // ========== SPRINT 4: STATS TAB ==========

  // Stats elements (now in sessions tab)
  const statTotalSessions = document.getElementById('stat-total-sessions');
  const statTotalTabs = document.getElementById('stat-total-tabs');

  // Calculate and display quick statistics
  async function loadStats() {
    try {
      const result = await chrome.storage.local.get('sessions');
      const sessions = result.sessions || {};
      const sessionArray = Object.values(sessions);

      if (sessionArray.length === 0) {
        statTotalSessions.textContent = '0';
        statTotalTabs.textContent = '0';
        return;
      }

      // Total sessions
      statTotalSessions.textContent = sessionArray.length;

      // Total tabs across all sessions
      const totalTabs = sessionArray.reduce((sum, s) => sum + s.tabCount, 0);
      statTotalTabs.textContent = totalTabs.toLocaleString();
    } catch (err) {
      console.error('Failed to load stats:', err);
      statTotalSessions.textContent = '-';
      statTotalTabs.textContent = '-';
    }
  }

  // ========== SPRINT 4: TOOLS TAB ==========

  // Tools tab elements
  const closeUngroupedBtn = document.getElementById('close-ungrouped');
  const removeDuplicatesBtn = document.getElementById('remove-duplicates');
  const closeOldTabsBtn = document.getElementById('close-old-tabs');
  const daysInput = document.getElementById('days-input');
  const groupByDomainBtn = document.getElementById('group-by-domain');
  const domainInput = document.getElementById('domain-input');
  const toolsStatus = document.getElementById('tools-status');

  // Helper function to show status message
  function showToolsStatus(message, isError = false) {
    toolsStatus.textContent = message;
    toolsStatus.style.color = isError ? '#d9534f' : '#28a745';
    setTimeout(() => {
      toolsStatus.textContent = '';
      toolsStatus.style.color = '';
    }, 3000);
  }

  // Close all ungrouped tabs
  closeUngroupedBtn.addEventListener('click', async () => {
    try {
      const ungroupedTabs = await chrome.tabs.query({
        groupId: chrome.tabGroups.TAB_GROUP_ID_NONE,
        pinned: false // Don't close pinned tabs
      });

      if (ungroupedTabs.length === 0) {
        showToolsStatus('No ungrouped tabs to close');
        return;
      }

      const tabIds = ungroupedTabs.map(tab => tab.id);
      await chrome.tabs.remove(tabIds);
      showToolsStatus(`Closed ${tabIds.length} ungrouped tabs`);
    } catch (err) {
      console.error('Error closing ungrouped tabs:', err);
      showToolsStatus('Error closing ungrouped tabs', true);
    }
  });

  // Remove duplicate tabs in current window
  removeDuplicatesBtn.addEventListener('click', async () => {
    try {
      const allTabs = await chrome.tabs.query({ currentWindow: true });
      console.log('Total tabs in window:', allTabs.length);

      const urlMap = new Map();
      const duplicates = [];

      allTabs.forEach(tab => {
        if (tab.url && tab.url !== 'chrome://newtab/') {
          if (urlMap.has(tab.url)) {
            // This is a duplicate
            duplicates.push(tab.id);
            console.log('Found duplicate:', tab.url);
          } else {
            // First occurrence
            urlMap.set(tab.url, tab.id);
          }
        }
      });

      console.log('Duplicates found:', duplicates.length);

      if (duplicates.length === 0) {
        showToolsStatus('No duplicate tabs found');
        return;
      }

      await chrome.tabs.remove(duplicates);
      showToolsStatus(`✓ Removed ${duplicates.length} duplicate tab${duplicates.length > 1 ? 's' : ''}`);
    } catch (err) {
      console.error('Error removing duplicates:', err);
      showToolsStatus(`Error: ${err.message}`, true);
    }
  });

  // Close tabs older than X days
  closeOldTabsBtn.addEventListener('click', async () => {
    try {
      const days = parseInt(daysInput.value);
      if (isNaN(days) || days < 1) {
        showToolsStatus('Please enter a valid number of days', true);
        return;
      }

      const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
      const allTabs = await chrome.tabs.query({});

      // Note: Chrome doesn't provide tab creation time via the API
      // We'll use lastAccessed as a proxy (requires "tabs" permission)
      const oldTabs = allTabs.filter(tab => {
        return tab.lastAccessed && tab.lastAccessed < cutoffTime && !tab.pinned;
      });

      if (oldTabs.length === 0) {
        showToolsStatus(`No tabs older than ${days} days found`);
        return;
      }

      if (!confirm(`This will close ${oldTabs.length} tabs older than ${days} days. Continue?`)) {
        return;
      }

      const tabIds = oldTabs.map(tab => tab.id);
      await chrome.tabs.remove(tabIds);
      showToolsStatus(`Closed ${tabIds.length} tabs older than ${days} days`);
    } catch (err) {
      console.error('Error closing old tabs:', err);
      showToolsStatus('Error closing old tabs', true);
    }
  });

  // Group tabs by domain
  groupByDomainBtn.addEventListener('click', async () => {
    try {
      const domain = domainInput.value.trim();
      if (!domain) {
        showToolsStatus('Please enter a domain', true);
        return;
      }

      const [currentWindow] = await chrome.windows.getCurrent();
      const allTabs = await chrome.tabs.query({ windowId: currentWindow.id });

      const matchingTabs = allTabs.filter(tab => {
        try {
          const urlObj = new URL(tab.url);
          return urlObj.hostname.includes(domain) || urlObj.hostname === domain;
        } catch (e) {
          return false;
        }
      });

      if (matchingTabs.length === 0) {
        showToolsStatus(`No tabs found for domain: ${domain}`, true);
        return;
      }

      // Create a new group with these tabs
      const tabIds = matchingTabs.map(tab => tab.id);
      const groupId = await chrome.tabs.group({ tabIds });

      // Set group properties
      await chrome.tabGroups.update(groupId, {
        title: domain,
        color: 'blue'
      });

      showToolsStatus(`Grouped ${tabIds.length} tabs from ${domain}`);
      domainInput.value = ''; // Clear input
    } catch (err) {
      console.error('Error grouping by domain:', err);
      showToolsStatus('Error grouping tabs', true);
    }
  });

  // =============================================================================
  // SPRINT 5: ADVANCED FEATURES
  // =============================================================================

  // --- 1. SMART MERGE ---
  let mergeMode = false;
  const mergeControls = document.getElementById('merge-controls');
  const mergeSelectedBtn = document.getElementById('merge-selected');
  const cancelMergeBtn = document.getElementById('cancel-merge');

  // Toggle merge mode when checkboxes are clicked
  function updateMergeControls() {
    const checkedCount = document.querySelectorAll('.session-checkbox:checked').length;
    if (checkedCount >= 2 && !mergeMode) {
      mergeControls.style.display = 'flex';
      mergeMode = true;
    } else if (checkedCount < 2 && mergeMode) {
      mergeControls.style.display = 'none';
      mergeMode = false;
    }
  }

  // Merge selected sessions
  mergeSelectedBtn.addEventListener('click', async () => {
    const selectedCheckboxes = document.querySelectorAll('.session-checkbox:checked');
    if (selectedCheckboxes.length < 2) {
      alert('Please select at least 2 sessions to merge');
      return;
    }

    const sessionIds = Array.from(selectedCheckboxes).map(cb => cb.dataset.sessionId);
    const sessionsToMerge = sessionIds.map(id => allSessions[id]).filter(Boolean);

    // Prompt for merged session name
    const defaultName = `Merged Session ${new Date().toLocaleString()}`;
    const mergedName = prompt('Enter name for merged session:', defaultName);
    if (!mergedName) return;

    // Merge session data
    const mergedData = [];
    const urlMap = new Map(); // For deduplication

    sessionsToMerge.forEach(session => {
      session.data.forEach(group => {
        // Deduplicate URLs
        const uniqueUrls = [];
        group.urls.forEach(urlItem => {
          const url = typeof urlItem === 'object' ? urlItem.url : urlItem;
          if (!urlMap.has(url)) {
            urlMap.set(url, true);
            uniqueUrls.push(urlItem);
          }
        });

        if (uniqueUrls.length > 0) {
          mergedData.push({
            ...group,
            urls: uniqueUrls
          });
        }
      });
    });

    // Save merged session
    await saveSession(mergedName, mergedData);

    // Clear checkboxes and reload
    document.querySelectorAll('.session-checkbox').forEach(cb => cb.checked = false);
    mergeControls.style.display = 'none';
    mergeMode = false;
    await loadSessions();

    showToast(`Merged ${sessionsToMerge.length} sessions into "${mergedName}"`);
  });

  cancelMergeBtn.addEventListener('click', () => {
    document.querySelectorAll('.session-checkbox').forEach(cb => cb.checked = false);
    mergeControls.style.display = 'none';
    mergeMode = false;
  });

  // --- 2. CLOUD SYNC ---
  const cloudSyncToggle = document.getElementById('cloud-sync-toggle');
  const syncDetails = document.getElementById('sync-details');
  const syncStatusBadge = document.getElementById('sync-status-badge');
  const quotaText = document.getElementById('quota-text');
  const quotaFill = document.getElementById('quota-fill');
  const syncNowBtn = document.getElementById('sync-now-btn');

  // Load cloud sync settings
  async function loadCloudSyncSettings() {
    try {
      const result = await chrome.storage.local.get('cloudSyncEnabled');
      const enabled = result.cloudSyncEnabled || false;
      cloudSyncToggle.checked = enabled;
      syncDetails.style.display = enabled ? 'block' : 'none';

      if (enabled) {
        await updateSyncQuota();
      }
    } catch (err) {
      console.error('Failed to load cloud sync settings:', err);
    }
  }

  // Update sync quota display
  async function updateSyncQuota() {
    try {
      const QUOTA_BYTES = 102400; // 100 KB limit for chrome.storage.sync

      // Get bytes in use with proper API call
      chrome.storage.sync.getBytesInUse(null, (bytesInUse) => {
        if (chrome.runtime.lastError) {
          console.error('Quota check error:', chrome.runtime.lastError);
          quotaText.textContent = 'Unable to check';
          return;
        }

        const usageKB = (bytesInUse / 1024).toFixed(1);
        const percentage = (bytesInUse / QUOTA_BYTES) * 100;

        quotaText.textContent = `${usageKB} / 100 KB`;
        quotaFill.style.width = `${Math.min(percentage, 100)}%`;

        // Update quota bar color based on usage
        quotaFill.className = 'quota-fill';
        if (percentage > 90) {
          quotaFill.classList.add('danger');
        } else if (percentage > 70) {
          quotaFill.classList.add('warning');
        }
      });
    } catch (err) {
      console.error('Failed to get quota:', err);
      quotaText.textContent = 'Error';
    }
  }

  // Toggle cloud sync
  cloudSyncToggle.addEventListener('change', async () => {
    const enabled = cloudSyncToggle.checked;

    try {
      await chrome.storage.local.set({ cloudSyncEnabled: enabled });
      syncDetails.style.display = enabled ? 'block' : 'none';

      if (enabled) {
        await syncToCloud();
      }
    } catch (err) {
      console.error('Failed to toggle cloud sync:', err);
      cloudSyncToggle.checked = !enabled;
    }
  });

  // Sync pinned sessions to cloud
  async function syncToCloud() {
    try {
      syncStatusBadge.textContent = 'Syncing...';
      syncStatusBadge.className = 'sync-status syncing';
      syncStatusBadge.style.display = 'inline-block';

      // Get all sessions
      const result = await chrome.storage.local.get('sessions');
      const sessions = result.sessions || {};

      // Filter only pinned sessions
      const pinnedSessions = {};
      Object.entries(sessions).forEach(([id, session]) => {
        if (session.pinned) {
          pinnedSessions[id] = session;
        }
      });

      // Sync to chrome.storage.sync
      await chrome.storage.sync.set({ pinnedSessions });

      syncStatusBadge.textContent = 'Synced';
      syncStatusBadge.className = 'sync-status synced';

      await updateSyncQuota();

      setTimeout(() => {
        syncStatusBadge.style.display = 'none';
      }, 3000);
    } catch (err) {
      console.error('Sync failed:', err);
      syncStatusBadge.textContent = 'Error';
      syncStatusBadge.className = 'sync-status error';

      if (err.message && err.message.includes('QUOTA_BYTES')) {
        alert('Cloud sync quota exceeded. Please unpin some sessions to free up space.');
      }
    }
  }

  syncNowBtn.addEventListener('click', syncToCloud);

  // Load cloud sync settings when switching to settings tab
  tabBtns.forEach(btn => {
    if (btn.dataset.tab === 'settings') {
      btn.addEventListener('click', () => {
        loadCloudSyncSettings();
      });
    }
  });

  // Auto-sync when pinning/unpinning sessions (if cloud sync is enabled)
  async function autoSyncIfEnabled() {
    try {
      const result = await chrome.storage.local.get('cloudSyncEnabled');
      if (result.cloudSyncEnabled) {
        await syncToCloud();
      }
    } catch (err) {
      console.error('Auto-sync failed:', err);
    }
  }

  // --- 3. WINDOW LAYOUTS ---
  const saveLayoutBtn = document.getElementById('save-layout-btn');

  // Save window layout
  saveLayoutBtn.addEventListener('click', async () => {
    statusDiv.textContent = 'Saving window layout...';

    try {
      // Get all windows
      const windows = await chrome.windows.getAll({ populate: true });
      const layoutData = [];

      for (const window of windows) {
        // Get window bounds
        const windowInfo = {
          left: window.left,
          top: window.top,
          width: window.width,
          height: window.height,
          state: window.state,
          groups: []
        };

        // Get tab groups in this window
        const tabGroups = await chrome.tabGroups.query({ windowId: window.id });

        for (const group of tabGroups) {
          const tabs = await chrome.tabs.query({ groupId: group.id, windowId: window.id });
          const urls = tabs.map(tab => ({ url: tab.url, pinned: tab.pinned }));

          windowInfo.groups.push({
            title: group.title || 'Untitled',
            color: group.color,
            collapsed: group.collapsed,
            urls
          });
        }

        // Also get ungrouped tabs
        const ungroupedTabs = await chrome.tabs.query({
          groupId: chrome.tabGroups.TAB_GROUP_ID_NONE,
          windowId: window.id
        });

        if (ungroupedTabs.length > 0) {
          const urls = ungroupedTabs.map(tab => ({ url: tab.url, pinned: tab.pinned }));
          windowInfo.groups.push({
            title: 'Ungrouped',
            color: 'grey',
            collapsed: false,
            urls
          });
        }

        layoutData.push(windowInfo);
      }

      // Save as session with layout metadata
      let sessionName = sessionNameInput.value.trim();
      if (!sessionName) sessionName = generateDefaultSessionName();

      const sessionId = `session-${Date.now()}`;
      const session = {
        id: sessionId,
        name: sessionName,
        timestamp: Date.now(),
        data: layoutData.flatMap(w => w.groups), // For backward compatibility
        layout: layoutData, // Window layout information
        isLayout: true,
        pinned: false,
        tabCount: layoutData.reduce((sum, w) => sum + w.groups.reduce((s, g) => s + g.urls.length, 0), 0),
        groupCount: layoutData.reduce((sum, w) => sum + w.groups.length, 0),
        windowCount: layoutData.length
      };

      const result = await chrome.storage.local.get('sessions');
      const sessions = result.sessions || {};
      sessions[sessionId] = session;

      // Keep only last 50 sessions
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

      statusDiv.textContent = `✓ Saved window layout "${sessionName}"`;
      statusDiv.style.color = '#28a745';
      setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.style.color = '';
      }, 3000);
    } catch (err) {
      console.error('Failed to save layout:', err);
      statusDiv.textContent = 'Error saving layout';
      statusDiv.style.color = '#d9534f';
      setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.style.color = '';
      }, 5000);
    }
  });

  // Restore window layout
  async function restoreLayout(session) {
    try {
      if (!session.layout || !session.isLayout) {
        // Fall back to regular restore
        await restoreSessionData(session.data);
        return;
      }

      // Restore each window
      for (const windowData of session.layout) {
        const newWindow = await chrome.windows.create({
          focused: false,
          left: windowData.left,
          top: windowData.top,
          width: windowData.width,
          height: windowData.height,
          state: windowData.state === 'maximized' ? 'maximized' : 'normal'
        });

        // Close default blank tab
        const defaultTabs = await chrome.tabs.query({ windowId: newWindow.id });
        if (defaultTabs.length === 1 && defaultTabs[0].url === 'chrome://newtab/') {
          await chrome.tabs.remove(defaultTabs[0].id);
        }

        // Restore groups in this window
        for (const groupData of windowData.groups) {
          const urls = Array.isArray(groupData.urls) ? groupData.urls : [];
          const tabIds = [];

          for (const item of urls) {
            const url = typeof item === 'object' ? item.url : item;
            const pinned = typeof item === 'object' && item.pinned === true;
            try {
              const tab = await chrome.tabs.create({
                url,
                active: false,
                windowId: newWindow.id,
                pinned
              });
              if (tab.id !== undefined && tab.id !== chrome.tabs.TAB_ID_NONE) {
                tabIds.push(tab.id);
              }
            } catch (createErr) {
              console.warn('Failed to create tab:', url, createErr);
            }
          }

          if (tabIds.length === 0) continue;

          const groupId = await chrome.tabs.group({ tabIds, createProperties: { windowId: newWindow.id } });
          const updateProps = {};
          if (groupData.title) updateProps.title = groupData.title;
          if (groupData.color) updateProps.color = groupData.color;
          if (typeof groupData.collapsed === 'boolean') updateProps.collapsed = groupData.collapsed;

          if (Object.keys(updateProps).length > 0) {
            await chrome.tabGroups.update(groupId, updateProps);
          }
        }
      }

      showToast(`Restored layout "${session.name}" with ${session.windowCount} windows`);
    } catch (err) {
      console.error('Failed to restore layout:', err);
      alert('Failed to restore window layout');
    }
  }

  // Helper function to show toast notifications
  function showToast(message) {
    const temp = document.createElement('div');
    temp.style.cssText = 'position: fixed; top: 10px; left: 50%; transform: translateX(-50%); background: #28a745; color: white; padding: 8px 16px; border-radius: 4px; font-size: 12px; z-index: 9999;';
    temp.textContent = message;
    document.body.appendChild(temp);
    setTimeout(() => temp.remove(), 2000);
  }

  // =============================================================================
  // END SPRINT 5
  // =============================================================================
});
