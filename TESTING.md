# Testing Guide

This document describes the testing setup for the Tab Groups Export/Import extension.

## Test Types

We have two types of tests:

1. **Unit Tests** - Test logic patterns and data transformations in isolation
2. **E2E Tests** - Test actual browser behavior with Puppeteer

See [E2E_TESTING.md](./E2E_TESTING.md) for detailed E2E testing documentation.

## Test Framework

We use **Jest** for unit testing with mocked Chrome APIs. The tests focus on:
- Export/import data validation
- Data formatting and transformation logic
- Chrome API interactions
- Edge cases and error handling

## Setup

Install dependencies:

```bash
npm install
```

## Running Tests

### Run unit tests only
```bash
npm test
# or
npm run test:unit
```

### Run E2E tests only
```bash
npm run test:e2e
```

### Run ALL tests (unit + E2E)
```bash
npm run test:all
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Generate coverage report
```bash
npm run test:coverage
```

## Test Structure

```
__tests__/
├── setup.js              # Chrome API mocks and test configuration
├── validation.test.js    # Export validation logic tests
├── formatting.test.js    # Data formatting tests (tab counts, filenames)
├── export-import.test.js # Export/import data structure tests
└── chrome-api.test.js    # Chrome API interaction tests
```

## Test Coverage

**Important Note:** These tests validate the **logic patterns and data transformations** used in the extension, not the actual `popup.js` file execution (which requires Chrome runtime). This is standard for Chrome extension testing.

Coverage tracking focuses on test completeness:
- **35 unit tests** covering all core logic
- **Validation, formatting, export/import, and API interactions**
- **Logic patterns** match actual implementation

## What's Tested

### ✅ Validation Logic
- Export validation (requires at least one group or ungrouped tabs)
- Empty selection prevention
- Combined selection scenarios

### ✅ Data Formatting
- Tab count singular/plural ("1 tab" vs "2 tabs")
- Filename sanitization (removes invalid characters)
- History entry formatting

### ✅ Export/Import Data
- JSON structure validation
- Pinned state handling
- URL extraction from objects and strings
- Empty group handling
- Special characters in URLs

### ✅ Chrome API Interactions
- Tab group queries
- Tab queries
- Window creation
- Downloads
- Storage operations
- Clipboard API

## Mocked Chrome APIs

All Chrome APIs are mocked in `__tests__/setup.js`:
- `chrome.tabGroups.*`
- `chrome.tabs.*`
- `chrome.windows.*`
- `chrome.downloads.*`
- `chrome.storage.local.*`
- `navigator.clipboard.*`

## Writing New Tests

When adding new functionality:

1. **Add test file** in `__tests__/` with `.test.js` suffix
2. **Mock Chrome APIs** as needed in test setup
3. **Test edge cases** (empty data, invalid input, etc.)
4. **Follow naming convention**:
   ```javascript
   describe('Feature Name', () => {
     test('should do something specific', () => {
       // Arrange
       const input = 'test';

       // Act
       const result = processInput(input);

       // Assert
       expect(result).toBe('expected');
     });
   });
   ```

## Limitations

These tests focus on **unit testing** of logic and data transformations. They do NOT test:
- Actual Chrome extension behavior in browser
- Real Chrome API responses
- UI interactions (click events, DOM manipulation)
- Network requests
- File system operations

For full E2E testing, consider using Puppeteer or Chrome extension testing frameworks.

## CI/CD Integration

To run tests in CI:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: |
    npm install
    npm test
```

## Debugging Tests

Run a specific test file:
```bash
npx jest __tests__/validation.test.js
```

Run tests matching a pattern:
```bash
npx jest --testNamePattern="should format"
```

Enable verbose output:
```bash
npx jest --verbose
```

## Coverage Reports

After running `npm run test:coverage`, open:
```
coverage/lcov-report/index.html
```

This shows line-by-line coverage of your code.
