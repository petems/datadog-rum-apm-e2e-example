module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test patterns
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    '**/*.js',
    '!node_modules/**',
    '!coverage/**',
    '!**/*.config.js',
    '!**/*.test.js',
    '!**/*.spec.js',
    '!bin/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
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
  verbose: process.env.CI === 'true'
};