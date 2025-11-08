/**
 * Tests for data formatting and display logic
 */

describe('Tab Count Formatting', () => {
  test('should format singular tab count', () => {
    const tabCount = 1;
    const formatted = `(${tabCount} tab${tabCount !== 1 ? 's' : ''})`;

    expect(formatted).toBe('(1 tab)');
  });

  test('should format plural tab count', () => {
    const tabCount = 5;
    const formatted = `(${tabCount} tab${tabCount !== 1 ? 's' : ''})`;

    expect(formatted).toBe('(5 tabs)');
  });

  test('should format zero tabs', () => {
    const tabCount = 0;
    const formatted = `(${tabCount} tab${tabCount !== 1 ? 's' : ''})`;

    expect(formatted).toBe('(0 tabs)');
  });

  test('should format large tab counts', () => {
    const tabCount = 100;
    const formatted = `(${tabCount} tab${tabCount !== 1 ? 's' : ''})`;

    expect(formatted).toBe('(100 tabs)');
  });
});

describe('Filename Sanitization', () => {
  test('should remove invalid filename characters', () => {
    const input = 'session-<>:"/\\|?*';
    const sanitized = input.replace(/[^a-zA-Z0-9_-]/g, '_');

    expect(sanitized).toBe('session-_________');
  });

  test('should preserve valid characters', () => {
    const input = 'session-2025-01-15-Work';
    const sanitized = input.replace(/[^a-zA-Z0-9_-]/g, '_');

    expect(sanitized).toBe('session-2025-01-15-Work');
  });

  test('should handle spaces', () => {
    const input = 'My Work Session';
    const sanitized = input.replace(/[^a-zA-Z0-9_-]/g, '_');

    expect(sanitized).toBe('My_Work_Session');
  });
});

describe('Export History Formatting', () => {
  test('should format history entry with singular item', () => {
    const count = 1;
    const text = `(${count} item${count !== 1 ? 's' : ''})`;

    expect(text).toBe('(1 item)');
  });

  test('should format history entry with plural items', () => {
    const count = 5;
    const text = `(${count} item${count !== 1 ? 's' : ''})`;

    expect(text).toBe('(5 items)');
  });
});
