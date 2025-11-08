// Enhanced popup script for the Tab Groups Manager extension.
// This version provides a more professional UI with group selection,
// session naming, options to include ungrouped tabs and pinned state,
// and improved status messaging. It still exports and imports tab
// groups as JSON using the chrome.tabGroups and chrome.tabs APIs.

document.addEventListener('DOMContentLoaded', () => {
  const sessionNameInput = document.getElementById('session-name');
  const includeUngroupedCheckbox = document.getElementById('include-ungrouped');
  const includePinnedCheckbox = document.getElementById('include-pinned');
  const groupsListDiv = document.getElementById('groups-list');
  const statusDiv = document.getElementById('status');

  const historyList = document.getElementById('history-list');
  const clearHistoryBtn = document.getElementById('clear-history');

  // Hold loaded group info
  let groups = [];

  // Generate a default session name based on the current date/time
  function generateDefaultSessionName() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const datePart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const timePart = `${pad(now.getHours())}${pad(now.getMinutes())}`;
    return `session-${datePart}-${timePart}`;
  }

  // Initialize session name input
  sessionNameInput.value = generateDefaultSessionName();

  // Load export history from storage and render it
  async function loadHistory() {
    try {
      const result = await chrome.storage.local.get('exportHistory');
      const history = Array.isArray(result.exportHistory) ? result.exportHistory : [];
      renderHistory(history);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  }

  // Render the history list into the UI
  function renderHistory(history) {
    historyList.innerHTML = '';
    if (history.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'No exports yet.';
      historyList.appendChild(li);
      return;
    }
    history.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = `${item.date} – ${item.filename} (${item.count} item${item.count !== 1 ? 's' : ''})`;
      historyList.appendChild(li);
    });
  }

  // Clear export history
  clearHistoryBtn.addEventListener('click', async () => {
    try {
      await chrome.storage.local.remove('exportHistory');
      renderHistory([]);
      statusDiv.textContent = 'History cleared.';
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  });

  // Load the current tab groups and render them as a list with checkboxes
  async function loadGroups() {
    groupsListDiv.textContent = 'Loading…';
    try {
      const tabGroups = await chrome.tabGroups.query({});
      const items = [];
      for (const group of tabGroups) {
        items.push({
          id: group.id,
          title: group.title || '(Untitled)',
          color: group.color,
          collapsed: group.collapsed,
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
        titleSpan.textContent = g.title;
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
  loadHistory();

  // Copy JSON to clipboard when the user clicks the copy button
  document.getElementById('copy-json').addEventListener('click', async () => {
    statusDiv.textContent = 'Copying…';
    try {
      // Determine which group IDs have been selected
      const selectedIds = [];
      const checkboxes = document.querySelectorAll('.group-checkbox');
      checkboxes.forEach((cb) => {
        if (cb.checked) {
          selectedIds.push(parseInt(cb.dataset.groupId, 10));
        }
      });
      const includeUngrouped = includeUngroupedCheckbox.checked;
      const includePinned = includePinnedCheckbox.checked;

      // Validate that at least something is selected
      if (selectedIds.length === 0 && !includeUngrouped) {
        statusDiv.textContent = '⚠️ No groups selected. Please select at least one group or enable "Include ungrouped tabs".';
        statusDiv.style.color = '#d9534f';
        setTimeout(() => {
          statusDiv.textContent = '';
          statusDiv.style.color = '';
        }, 5000);
        return;
      }

      const exportData = [];

      // Collect selected groups
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

      // Optionally include ungrouped tabs
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

      const jsonStr = JSON.stringify(exportData, null, 2);

      // Copy to clipboard
      await navigator.clipboard.writeText(jsonStr);

      statusDiv.textContent = `✓ Copied ${exportData.length} item(s) to clipboard!`;
      statusDiv.style.color = '#28a745';
      setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.style.color = '';
      }, 3000);
    } catch (err) {
      console.error('Error during copy:', err);
      statusDiv.textContent = 'Error copying to clipboard. See console for details.';
      statusDiv.style.color = '#d9534f';
      setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.style.color = '';
      }, 5000);
    }
  });

  // Export selected groups when the user clicks the export button
  document.getElementById('export-selected').addEventListener('click', async () => {
    statusDiv.textContent = 'Exporting…';
    try {
      // Determine which group IDs have been selected
      const selectedIds = [];
      const checkboxes = document.querySelectorAll('.group-checkbox');
      checkboxes.forEach((cb) => {
        if (cb.checked) {
          selectedIds.push(parseInt(cb.dataset.groupId, 10));
        }
      });
      const includeUngrouped = includeUngroupedCheckbox.checked;
      const includePinned = includePinnedCheckbox.checked;
      const exportData = [];

      // Collect selected groups
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

      // Optionally include ungrouped tabs
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

      // Build filename based on session name
      let sessionName = sessionNameInput.value.trim();
      if (!sessionName) {
        sessionName = generateDefaultSessionName();
      }
      const filenameBase = sessionName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${filenameBase}.json`;
      const jsonStr = JSON.stringify(exportData, null, 2);
      // Write JSON to hidden textarea (for copy/paste if needed)
      const output = document.getElementById('export-output');
      output.value = jsonStr;
      // Download the JSON file
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      await chrome.downloads.download({ url, filename, saveAs: true });
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      statusDiv.textContent = `Exported ${exportData.length} item(s) to ${filename}.`;
      // Update export history in storage
      try {
        const stored = await chrome.storage.local.get('exportHistory');
        const history = Array.isArray(stored.exportHistory) ? stored.exportHistory : [];
        const entry = {
          filename,
          date: new Date().toLocaleString(),
          count: exportData.length,
        };
        history.unshift(entry);
        // Keep only the latest 10 entries to avoid growing indefinitely
        const trimmed = history.slice(0, 10);
        await chrome.storage.local.set({ exportHistory: trimmed });
        renderHistory(trimmed);
      } catch (errHist) {
        console.warn('Failed to update history:', errHist);
      }
    } catch (err) {
      console.error('Error during export:', err);
      statusDiv.textContent = 'Error during export. See console for details.';
    }
  });

  // Import JSON when the user selects a file
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
      const newWindow = await chrome.windows.create({ focused: true });
      let importedGroups = 0;
      for (const groupData of data) {
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
            console.warn('Failed to create tab for URL:', url, createErr);
          }
        }
        if (tabIds.length === 0) continue;
        const groupId = await chrome.tabs.group({ tabIds });
        // Apply group properties
        const updateProps = {};
        if (groupData.title) updateProps.title = groupData.title;
        if (groupData.color) updateProps.color = groupData.color;
        if (typeof groupData.collapsed === 'boolean') updateProps.collapsed = groupData.collapsed;
        if (Object.keys(updateProps).length > 0) {
          try {
            await chrome.tabGroups.update(groupId, updateProps);
          } catch (err2) {
            console.warn('Failed to update group:', err2);
          }
        }
        await chrome.tabGroups.move(groupId, { windowId: newWindow.id, index: -1 });
        importedGroups++;
      }
      statusDiv.textContent = `Imported ${importedGroups} item(s).`;
    } catch (err) {
      console.error('Error during import:', err);
      statusDiv.textContent = 'Error during import. See console for details.';
    }
  });
});