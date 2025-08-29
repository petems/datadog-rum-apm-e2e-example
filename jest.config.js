module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Test patterns
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],

  // Exclude Playwright tests from Jest
  testPathIgnorePatterns: ['/node_modules/', '/test/e2e/'],

  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    '**/*.js',
    '!node_modules/**',
    '!coverage/**',
    '!**/*.config.js',
    '!**/*.test.js',
    '!**/*.spec.js',
    '!bin/**',
    '!scripts/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 25,
      functions: 30,
      lines: 50,
      statements: 50,
    },
  },

  // Setup and teardown
  globalSetup: './test/setup/global-setup.js',
  globalTeardown: './test/setup/global-teardown.js',
  setupFilesAfterEnv: ['./test/setup/test-setup.js'],

  // Test timeout
  testTimeout: 10000,

  // Mock configuration
  clearMocks: true,
  resetMocks: false,
  restoreMocks: true,

  // Verbose output for CI
  verbose: process.env.CI === 'true',
};
