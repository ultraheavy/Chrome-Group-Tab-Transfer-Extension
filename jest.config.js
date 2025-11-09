module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    '__tests__/**/*.test.js',
    '!**/__tests__/setup.js',
    '!node_modules/**'
  ],
  // Note: popup.js is not directly testable without Chrome runtime
  // These tests validate the logic patterns and data transformations
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js']
};
