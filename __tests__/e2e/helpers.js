/**
 * Puppeteer E2E Test Utilities for Chrome Extension
 *
 * This module provides helper functions to:
 * - Launch Chrome with the extension loaded
 * - Navigate to the extension popup
 * - Interact with extension UI elements
 */

const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

/**
 * Find Chrome executable path
 * Tries common locations across different operating systems
 */
function findChrome() {
  const possiblePaths = [
    // Linux
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
    // macOS
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    // Windows (via WSL or native)
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ];

  for (const chromePath of possiblePaths) {
    if (fs.existsSync(chromePath)) {
      return chromePath;
    }
  }

  // If nothing found, return default and let user override via env
  return process.env.CHROME_PATH || 'google-chrome';
}

/**
 * Launch Chrome with the extension loaded
 * @param {Object} options - Launch options
 * @returns {Promise<{browser: Browser, extensionId: string}>}
 */
async function launchWithExtension(options = {}) {
  const extensionPath = path.join(__dirname, '../..');

  const browser = await puppeteer.launch({
    executablePath: options.executablePath || findChrome(),
    headless: false, // Extensions don't work in headless mode
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      ...(options.args || [])
    ],
    ...options
  });

  // Get the extension ID
  const targets = await browser.targets();
  const extensionTarget = targets.find(
    target => target.type() === 'service_worker' && target.url().includes('chrome-extension://')
  );

  if (!extensionTarget) {
    throw new Error('Extension not loaded properly');
  }

  const extensionId = new URL(extensionTarget.url()).hostname;

  return { browser, extensionId };
}

/**
 * Open the extension popup in a page
 * @param {Browser} browser - Puppeteer browser instance
 * @param {string} extensionId - The extension ID
 * @returns {Promise<Page>}
 */
async function openPopup(browser, extensionId) {
  const popupUrl = `chrome-extension://${extensionId}/popup.html`;
  const page = await browser.newPage();
  await page.goto(popupUrl);
  return page;
}

/**
 * Create a new tab with test groups
 * This creates real tab groups in Chrome for testing
 * @param {Browser} browser - Puppeteer browser instance
 * @returns {Promise<Page>}
 */
async function createTestTabGroups(browser) {
  const page = await browser.newPage();

  // We can't directly create tab groups via Puppeteer API
  // But we can create tabs and the extension can group them
  await page.goto('https://example.com');
  await page.goto('https://example.org');

  return page;
}

/**
 * Wait for an element and click it
 * @param {Page} page - Puppeteer page
 * @param {string} selector - CSS selector
 */
async function clickElement(page, selector) {
  await page.waitForSelector(selector);
  await page.click(selector);
}

/**
 * Get text content from an element
 * @param {Page} page - Puppeteer page
 * @param {string} selector - CSS selector
 * @returns {Promise<string>}
 */
async function getElementText(page, selector) {
  await page.waitForSelector(selector);
  return page.$eval(selector, el => el.textContent);
}

/**
 * Check if an element exists
 * @param {Page} page - Puppeteer page
 * @param {string} selector - CSS selector
 * @returns {Promise<boolean>}
 */
async function elementExists(page, selector) {
  try {
    await page.waitForSelector(selector, { timeout: 1000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Clean up: close browser
 * @param {Browser} browser - Puppeteer browser instance
 */
async function cleanup(browser) {
  if (browser) {
    await browser.close();
  }
}

module.exports = {
  findChrome,
  launchWithExtension,
  openPopup,
  createTestTabGroups,
  clickElement,
  getElementText,
  elementExists,
  cleanup
};
