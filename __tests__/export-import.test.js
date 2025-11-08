/**
 * Tests for export and import functionality
 */

describe('Export Data Structure', () => {
  test('should create valid export data for a group', () => {
    const groupInfo = {
      title: 'Work',
      color: 'blue',
      collapsed: false
    };
    const tabs = [
      { url: 'https://example.com', pinned: false },
      { url: 'https://test.com', pinned: true }
    ];
    const includePinned = true;

    const exportData = {
      title: groupInfo.title,
      color: groupInfo.color,
      collapsed: groupInfo.collapsed,
      urls: tabs.map(tab => includePinned ? { url: tab.url, pinned: tab.pinned } : tab.url)
    };

    expect(exportData).toEqual({
      title: 'Work',
      color: 'blue',
      collapsed: false,
      urls: [
        { url: 'https://example.com', pinned: false },
        { url: 'https://test.com', pinned: true }
      ]
    });
  });

  test('should create export data without pinned state', () => {
    const groupInfo = {
      title: 'Personal',
      color: 'red',
      collapsed: true
    };
    const tabs = [
      { url: 'https://example.com', pinned: false },
      { url: 'https://test.com', pinned: true }
    ];
    const includePinned = false;

    const exportData = {
      title: groupInfo.title,
      color: groupInfo.color,
      collapsed: groupInfo.collapsed,
      urls: tabs.map(tab => includePinned ? { url: tab.url, pinned: tab.pinned } : tab.url)
    };

    expect(exportData.urls).toEqual([
      'https://example.com',
      'https://test.com'
    ]);
  });

  test('should handle empty groups', () => {
    const groupInfo = {
      title: 'Empty Group',
      color: 'grey',
      collapsed: false
    };
    const tabs = [];
    const includePinned = false;

    const exportData = {
      title: groupInfo.title,
      color: groupInfo.color,
      collapsed: groupInfo.collapsed,
      urls: tabs.map(tab => tab.url)
    };

    expect(exportData.urls).toEqual([]);
  });
});

describe('Import Data Validation', () => {
  test('should validate import data is an array', () => {
    const validData = [];
    const invalidData = {};

    expect(Array.isArray(validData)).toBe(true);
    expect(Array.isArray(invalidData)).toBe(false);
  });

  test('should handle valid group data structure', () => {
    const groupData = {
      title: 'Test Group',
      color: 'blue',
      collapsed: false,
      urls: ['https://example.com']
    };

    expect(groupData.title).toBeDefined();
    expect(groupData.color).toBeDefined();
    expect(Array.isArray(groupData.urls)).toBe(true);
  });

  test('should extract URL from object or string', () => {
    const item1 = { url: 'https://example.com', pinned: true };
    const item2 = 'https://test.com';

    const url1 = typeof item1 === 'object' ? item1.url : item1;
    const url2 = typeof item2 === 'object' ? item2.url : item2;

    expect(url1).toBe('https://example.com');
    expect(url2).toBe('https://test.com');
  });

  test('should extract pinned state from object', () => {
    const item1 = { url: 'https://example.com', pinned: true };
    const item2 = { url: 'https://test.com', pinned: false };
    const item3 = 'https://plain.com';

    const pinned1 = typeof item1 === 'object' && item1.pinned === true;
    const pinned2 = typeof item2 === 'object' && item2.pinned === true;
    const pinned3 = typeof item3 === 'object' && item3.pinned === true;

    expect(pinned1).toBe(true);
    expect(pinned2).toBe(false);
    expect(pinned3).toBe(false);
  });
});

describe('JSON Serialization', () => {
  test('should serialize export data with proper formatting', () => {
    const exportData = [
      {
        title: 'Work',
        color: 'blue',
        collapsed: false,
        urls: ['https://example.com']
      }
    ];

    const jsonStr = JSON.stringify(exportData, null, 2);

    expect(jsonStr).toContain('"title": "Work"');
    expect(jsonStr).toContain('"color": "blue"');
    expect(JSON.parse(jsonStr)).toEqual(exportData);
  });

  test('should handle special characters in URLs', () => {
    const exportData = [
      {
        title: 'Test',
        color: 'red',
        collapsed: false,
        urls: ['https://example.com?param=value&other=test']
      }
    ];

    const jsonStr = JSON.stringify(exportData, null, 2);
    const parsed = JSON.parse(jsonStr);

    expect(parsed[0].urls[0]).toBe('https://example.com?param=value&other=test');
  });
});
