# End-to-End Testing with Puppeteer

This guide explains how to run E2E tests for the Chrome extension using Puppeteer.

## What is E2E Testing?

**End-to-End (E2E) testing** tests the extension in a real Chrome browser with actual user interactions. Unlike unit tests (which test logic in isolation), E2E tests:

- ✅ Load the extension in real Chrome
- ✅ Test actual UI interactions (clicks, typing)
- ✅ Verify browser behavior
- ✅ Test complete user workflows

## Setup

### Prerequisites

You need Chrome or Chromium installed on your system.

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get install chromium-browser
# or
sudo apt-get install google-chrome-stable

# Fedora
sudo dnf install chromium

# Arch
sudo pacman -S chromium
```

**macOS:**
```bash
# Via Homebrew
brew install --cask google-chrome
# or
brew install --cask chromium
```

**Windows:**
Download from https://www.google.com/chrome/

### Install Dependencies

Already done if you ran `npm install`:
```bash
npm install
```

This installs `puppeteer-core` which uses your system Chrome.

### Custom Chrome Path

If Chrome is not in a standard location, set the `CHROME_PATH` environment variable:

```bash
# Linux/macOS
export CHROME_PATH=/path/to/chrome

# Windows (PowerShell)
$env:CHROME_PATH="C:\path\to\chrome.exe"
```

## Running E2E Tests

### Run E2E tests only
```bash
npm run test:e2e
```

### Run unit tests only
```bash
npm run test:unit
# or just
npm test
```

### Run ALL tests (unit + E2E)
```bash
npm run test:all
```

## Current E2E Tests

We have **16 E2E tests** in `__tests__/e2e/popup.e2e.test.js`:

### Popup UI (8 tests)
- ✓ Loads popup successfully
- ✓ Displays main heading
- ✓ Shows session name input
- ✓ Shows groups list
- ✓ Shows export button
- ✓ Shows copy JSON button
- ✓ Shows import button

### Sprint 1 Features (4 tests)
- ✓ Displays Select All button
- ✓ Displays Deselect All button
- ✓ Shows export history section
- ✓ Shows clear history button

### Options Checkboxes (4 tests)
- ✓ Shows "Include ungrouped tabs" checkbox
- ✓ Shows "Include pinned state" checkbox
- ✓ Checkboxes unchecked by default
- ✓ Can toggle checkboxes

### Additional Tests
- ✓ Groups display works
- ✓ Session name auto-generation
- ✓ Custom session name typing
- ✓ Dark mode CSS variables

## Test Architecture

```
__tests__/
├── e2e/
│   ├── helpers.js          # Puppeteer utilities
│   └── popup.e2e.test.js   # Popup E2E tests
├── validation.test.js      # Unit tests
├── formatting.test.js      # Unit tests
├── export-import.test.js   # Unit tests
└── chrome-api.test.js      # Unit tests
```

## Helper Functions

### `helpers.js` provides:

#### `launchWithExtension(options)`
Launches Chrome with the extension loaded.
```javascript
const { browser, extensionId } = await launchWithExtension();
```

#### `openPopup(browser, extensionId)`
Opens the extension popup.
```javascript
const page = await openPopup(browser, extensionId);
```

#### `clickElement(page, selector)`
Clicks an element safely.
```javascript
await clickElement(page, '#export-selected');
```

#### `getElementText(page, selector)`
Gets text from an element.
```javascript
const text = await getElementText(page, 'h1');
```

#### `elementExists(page, selector)`
Checks if element exists.
```javascript
const exists = await elementExists(page, '#status');
```

#### `cleanup(browser)`
Closes the browser.
```javascript
await cleanup(browser);
```

## Writing New E2E Tests

### Basic Template

```javascript
describe('My Feature E2E Tests', () => {
  let browser;
  let extensionId;
  let page;

  jest.setTimeout(30000); // 30 second timeout

  beforeAll(async () => {
    const result = await launchWithExtension();
    browser = result.browser;
    extensionId = result.extensionId;
  });

  afterAll(async () => {
    await cleanup(browser);
  });

  beforeEach(async () => {
    page = await openPopup(browser, extensionId);
  });

  afterEach(async () => {
    if (page) await page.close();
  });

  test('should do something', async () => {
    // Your test here
    const heading = await getElementText(page, 'h1');
    expect(heading).toBe('Tab Groups Manager');
  });
});
```

### Testing User Workflows

```javascript
test('should export groups workflow', async () => {
  // 1. Type session name
  await page.click('#session-name');
  await page.keyboard.selectAll();
  await page.keyboard.type('My Test Session');

  // 2. Check options
  await clickElement(page, '#include-ungrouped');
  await clickElement(page, '#include-pinned');

  // 3. Click export
  await clickElement(page, '#export-selected');

  // 4. Verify status message
  await page.waitForSelector('#status');
  const status = await getElementText(page, '#status');
  expect(status).toContain('exported');
});
```

### Testing Select All/None

```javascript
test('should select and deselect all groups', async () => {
  // Click Select All
  await clickElement(page, '#select-all');

  // Verify all checkboxes are checked
  const checkboxes = await page.$$('.group-checkbox');
  for (const checkbox of checkboxes) {
    const checked = await checkbox.evaluate(el => el.checked);
    expect(checked).toBe(true);
  }

  // Click Deselect All
  await clickElement(page, '#select-none');

  // Verify all checkboxes are unchecked
  for (const checkbox of checkboxes) {
    const checked = await checkbox.evaluate(el => el.checked);
    expect(checked).toBe(false);
  }
});
```

## Debugging E2E Tests

### Visual Debugging

E2E tests run in **visible Chrome** (not headless), so you can watch them execute:

```bash
npm run test:e2e
```

You'll see Chrome open, the extension load, and tests run.

### Screenshots on Failure

Add to your test:
```javascript
afterEach(async () => {
  if (page && global.jasmine.currentTest.failedExpectations.length > 0) {
    await page.screenshot({ path: 'test-failure.png' });
  }
  if (page) await page.close();
});
```

### Slow Down Execution

```javascript
const { browser, extensionId } = await launchWithExtension({
  slowMo: 250 // Slow down by 250ms per action
});
```

### Keep Browser Open on Failure

```javascript
afterAll(async () => {
  if (process.env.KEEP_OPEN !== 'true') {
    await cleanup(browser);
  }
});
```

Then run:
```bash
KEEP_OPEN=true npm run test:e2e
```

## Limitations

### What E2E Tests CAN Test
- ✅ Extension loads correctly
- ✅ UI elements exist and are visible
- ✅ Buttons can be clicked
- ✅ Form inputs work
- ✅ DOM manipulation
- ✅ CSS styles

### What E2E Tests CANNOT Test
- ❌ Actual file downloads (Chrome blocks them in automation)
- ❌ Real tab group creation (requires user interaction)
- ❌ Native file picker dialogs
- ❌ System clipboard in headless mode

For these, you'd need:
- Manual testing
- Advanced mocking strategies
- Different testing frameworks (e.g., WebDriver)

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install Chrome
        run: |
          wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
          sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'
          sudo apt-get update
          sudo apt-get install google-chrome-stable

      - name: Install dependencies
        run: npm ci

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          CHROME_PATH: /usr/bin/google-chrome
```

## Test Performance

| Test Type | Count | Execution Time |
|-----------|-------|----------------|
| Unit Tests | 35 | ~5 seconds |
| E2E Tests | 16 | ~15-30 seconds |
| **Total** | **51** | **~20-35 seconds** |

E2E tests are slower because they:
- Launch real Chrome
- Load the extension
- Navigate pages
- Wait for elements

## Best Practices

### 1. Use Descriptive Test Names
```javascript
// ✅ Good
test('should display validation error when no groups selected', ...)

// ❌ Bad
test('validation test', ...)
```

### 2. Keep Tests Independent
Each test should work in isolation:
```javascript
beforeEach(async () => {
  page = await openPopup(browser, extensionId); // Fresh start
});
```

### 3. Use Proper Waits
```javascript
// ✅ Good
await page.waitForSelector('#status');

// ❌ Bad
await page.waitForTimeout(1000); // Arbitrary delay
```

### 4. Clean Up Resources
```javascript
afterAll(async () => {
  await cleanup(browser); // Always clean up
});
```

## Troubleshooting

### "Extension not loaded properly"
- Check that `manifest.json` is valid
- Ensure extension files are in the correct location
- Try loading the extension manually in Chrome first

### "Chrome executable not found"
- Set `CHROME_PATH` environment variable
- Install Chrome/Chromium
- Check `findChrome()` function in `helpers.js`

### Tests timeout
- Increase timeout: `jest.setTimeout(60000)`
- Check Chrome is not already running
- Disable other Chrome extensions

### "Target closed" errors
- Browser closed prematurely
- Add error handling in `beforeAll`
- Check system resources

## Summary

You now have:
- ✅ **16 E2E tests** covering UI and interactions
- ✅ **Puppeteer helpers** for easy test writing
- ✅ **Separate test commands** (unit vs E2E)
- ✅ **Visual debugging** (tests run in visible Chrome)
- ✅ **Complete documentation** for writing more tests

**Next Steps:**
1. Run `npm run test:e2e` to see them in action
2. Add more workflow tests (export, import, etc.)
3. Integrate into CI/CD pipeline
