module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'popup.js',
    '!**/__tests__/**',
    '!node_modules/**'
  ],
  coverageThreshold: {
    global: {
      statements: 60,
      branches: 50,
      functions: 60,
      lines: 60
    }
  },
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js']
};
