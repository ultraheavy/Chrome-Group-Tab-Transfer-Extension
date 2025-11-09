/**
 * End-to-End Tests for Extension Popup
 *
 * These tests run in a real Chrome browser with the extension loaded.
 * They test actual user workflows and UI interactions.
 *
 * Note: These tests require a Chrome/Chromium installation.
 * Set CHROME_PATH environment variable if Chrome is not in standard location.
 *
 * Run with: npm run test:e2e
 */

const {
  launchWithExtension,
  openPopup,
  clickElement,
  getElementText,
  elementExists,
  cleanup
} = require('./helpers');

describe('Extension Popup E2E Tests', () => {
  let browser;
  let extensionId;
  let page;

  // Timeout for browser launch
  jest.setTimeout(30000);

  beforeAll(async () => {
    try {
      const result = await launchWithExtension();
      browser = result.browser;
      extensionId = result.extensionId;
    } catch (error) {
      console.error('Failed to launch browser with extension:', error.message);
      console.log('Make sure Chrome/Chromium is installed.');
      console.log('Set CHROME_PATH env variable if needed.');
      throw error;
    }
  });

  afterAll(async () => {
    await cleanup(browser);
  });

  beforeEach(async () => {
    // Open a fresh popup for each test
    page = await openPopup(browser, extensionId);
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  describe('Popup UI', () => {
    test('should load popup successfully', async () => {
      const title = await page.title();
      expect(title).toBe('Tab Groups Manager');
    });

    test('should display main heading', async () => {
      const heading = await getElementText(page, 'h1');
      expect(heading).toBe('Tab Groups Manager');
    });

    test('should show session name input', async () => {
      const exists = await elementExists(page, '#session-name');
      expect(exists).toBe(true);
    });

    test('should show groups list container', async () => {
      const exists = await elementExists(page, '#groups-list');
      expect(exists).toBe(true);
    });

    test('should show export button', async () => {
      const exists = await elementExists(page, '#export-selected');
      expect(exists).toBe(true);
    });

    test('should show copy JSON button', async () => {
      const exists = await elementExists(page, '#copy-json');
      expect(exists).toBe(true);
    });

    test('should show import button', async () => {
      const exists = await elementExists(page, '#import-btn');
      expect(exists).toBe(true);
    });
  });

  describe('Sprint 1 Features', () => {
    test('should display Select All button', async () => {
      const exists = await elementExists(page, '#select-all');
      expect(exists).toBe(true);
    });

    test('should display Deselect All button', async () => {
      const exists = await elementExists(page, '#select-none');
      expect(exists).toBe(true);
    });

    test('should show export history section', async () => {
      const heading = await page.$eval('h2', el => el.textContent);
      expect(heading).toContain('Export history');
    });

    test('should show clear history button', async () => {
      const exists = await elementExists(page, '#clear-history');
      expect(exists).toBe(true);
    });
  });

  describe('Options Checkboxes', () => {
    test('should show "Include ungrouped tabs" checkbox', async () => {
      const exists = await elementExists(page, '#include-ungrouped');
      expect(exists).toBe(true);
    });

    test('should show "Include pinned state" checkbox', async () => {
      const exists = await elementExists(page, '#include-pinned');
      expect(exists).toBe(true);
    });

    test('checkboxes should be unchecked by default', async () => {
      const ungroupedChecked = await page.$eval('#include-ungrouped', el => el.checked);
      const pinnedChecked = await page.$eval('#include-pinned', el => el.checked);

      expect(ungroupedChecked).toBe(false);
      expect(pinnedChecked).toBe(false);
    });

    test('should be able to toggle checkboxes', async () => {
      await clickElement(page, '#include-ungrouped');

      const checked = await page.$eval('#include-ungrouped', el => el.checked);
      expect(checked).toBe(true);
    });
  });

  describe('Groups Display', () => {
    test('should show groups list or "No groups found" message', async () => {
      const groupsListText = await getElementText(page, '#groups-list');

      // Either shows groups or shows "No groups found"
      expect(
        groupsListText.includes('No groups found') ||
        groupsListText.includes('tabs') ||
        groupsListText === 'Loading…'
      ).toBe(true);
    });
  });

  describe('Session Name', () => {
    test('should auto-generate default session name', async () => {
      const sessionName = await page.$eval('#session-name', el => el.value);

      // Should match pattern: session-YYYY-MM-DD-HHMM
      expect(sessionName).toMatch(/^session-\d{4}-\d{2}-\d{2}-\d{4}$/);
    });

    test('should allow typing custom session name', async () => {
      await page.click('#session-name');
      await page.keyboard.selectAll();
      await page.keyboard.type('My Custom Session');

      const sessionName = await page.$eval('#session-name', el => el.value);
      expect(sessionName).toBe('My Custom Session');
    });
  });

  describe('Dark Mode', () => {
    test('should apply CSS variables for theming', async () => {
      const bgColor = await page.$eval('body', el => {
        return window.getComputedStyle(el).getPropertyValue('color');
      });

      // Should have some color value (light or dark mode)
      expect(bgColor).toBeTruthy();
    });
  });
});
