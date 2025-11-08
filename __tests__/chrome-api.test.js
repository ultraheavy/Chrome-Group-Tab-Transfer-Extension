/**
 * Tests for Chrome API interactions
 */

describe('Chrome API Mocking', () => {
  test('should mock chrome.tabGroups.query', async () => {
    const mockGroups = [
      { id: 1, title: 'Work', color: 'blue', collapsed: false },
      { id: 2, title: 'Personal', color: 'red', collapsed: true }
    ];

    chrome.tabGroups.query.mockResolvedValue(mockGroups);

    const groups = await chrome.tabGroups.query({});

    expect(groups).toEqual(mockGroups);
    expect(chrome.tabGroups.query).toHaveBeenCalledWith({});
  });

  test('should mock chrome.tabs.query', async () => {
    const mockTabs = [
      { id: 1, url: 'https://example.com', pinned: false },
      { id: 2, url: 'https://test.com', pinned: true }
    ];

    chrome.tabs.query.mockResolvedValue(mockTabs);

    const tabs = await chrome.tabs.query({ groupId: 1 });

    expect(tabs).toEqual(mockTabs);
    expect(chrome.tabs.query).toHaveBeenCalledWith({ groupId: 1 });
  });

  test('should mock chrome.windows.create', async () => {
    const mockWindow = { id: 123, focused: true };

    chrome.windows.create.mockResolvedValue(mockWindow);

    const newWindow = await chrome.windows.create({ focused: true });

    expect(newWindow).toEqual(mockWindow);
    expect(chrome.windows.create).toHaveBeenCalledWith({ focused: true });
  });

  test('should mock chrome.downloads.download', async () => {
    chrome.downloads.download.mockResolvedValue(456);

    const downloadId = await chrome.downloads.download({
      url: 'blob:mock-url',
      filename: 'test.json',
      saveAs: true
    });

    expect(downloadId).toBe(456);
    expect(chrome.downloads.download).toHaveBeenCalled();
  });

  test('should mock navigator.clipboard.writeText', async () => {
    await navigator.clipboard.writeText('test content');

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test content');
  });
});

describe('Storage API', () => {
  test('should mock chrome.storage.local.get', async () => {
    const mockHistory = {
      exportHistory: [
        { filename: 'test.json', date: '2025-01-01', count: 3 }
      ]
    };

    chrome.storage.local.get.mockResolvedValue(mockHistory);

    const result = await chrome.storage.local.get('exportHistory');

    expect(result).toEqual(mockHistory);
    expect(chrome.storage.local.get).toHaveBeenCalledWith('exportHistory');
  });

  test('should mock chrome.storage.local.set', async () => {
    const historyData = {
      exportHistory: [
        { filename: 'new.json', date: '2025-01-15', count: 5 }
      ]
    };

    chrome.storage.local.set.mockResolvedValue();

    await chrome.storage.local.set(historyData);

    expect(chrome.storage.local.set).toHaveBeenCalledWith(historyData);
  });

  test('should mock chrome.storage.local.remove', async () => {
    chrome.storage.local.remove.mockResolvedValue();

    await chrome.storage.local.remove('exportHistory');

    expect(chrome.storage.local.remove).toHaveBeenCalledWith('exportHistory');
  });
});

describe('Tab Group Operations', () => {
  test('should update group properties', async () => {
    const groupId = 123;
    const updateProps = {
      title: 'Updated Title',
      color: 'green',
      collapsed: true
    };

    chrome.tabGroups.update.mockResolvedValue();

    await chrome.tabGroups.update(groupId, updateProps);

    expect(chrome.tabGroups.update).toHaveBeenCalledWith(groupId, updateProps);
  });

  test('should move group to window', async () => {
    const groupId = 123;
    const windowId = 456;

    chrome.tabGroups.move.mockResolvedValue();

    await chrome.tabGroups.move(groupId, { windowId, index: -1 });

    expect(chrome.tabGroups.move).toHaveBeenCalledWith(groupId, { windowId, index: -1 });
  });

  test('should create tabs', async () => {
    const mockTab = { id: 789, url: 'https://example.com' };

    chrome.tabs.create.mockResolvedValue(mockTab);

    const tab = await chrome.tabs.create({
      url: 'https://example.com',
      active: false,
      windowId: 456,
      pinned: false
    });

    expect(tab).toEqual(mockTab);
    expect(chrome.tabs.create).toHaveBeenCalled();
  });

  test('should group tabs together', async () => {
    const tabIds = [1, 2, 3];
    const groupId = 999;

    chrome.tabs.group.mockResolvedValue(groupId);

    const resultGroupId = await chrome.tabs.group({ tabIds });

    expect(resultGroupId).toBe(groupId);
    expect(chrome.tabs.group).toHaveBeenCalledWith({ tabIds });
  });

  test('should remove tabs', async () => {
    const tabId = 123;

    chrome.tabs.remove.mockResolvedValue();

    await chrome.tabs.remove(tabId);

    expect(chrome.tabs.remove).toHaveBeenCalledWith(tabId);
  });
});
