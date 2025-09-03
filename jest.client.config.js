module.exports = {
  // Use jsdom for client-side JavaScript testing
  testEnvironment: 'jsdom',

  // Test patterns - only client-side tests
  testMatch: [
    '**/public/**/__tests__/**/*.js',
    '**/public/**/?(*.)+(spec|test).js',
  ],

  // Don't ignore public directory for client tests
  testPathIgnorePatterns: ['/node_modules/', '/test/e2e/'],

  // Coverage for client-side code only
  collectCoverage: true,
  collectCoverageFrom: [
    'public/**/*.js',
    '!public/**/__tests__/**',
    '!public/**/*.test.js',
    '!public/**/*.spec.js',
  ],
  coverageDirectory: 'coverage/client',
  coverageReporters: ['text', 'lcov', 'html'],

  // Client-side specific setup
  setupFilesAfterEnv: ['<rootDir>/test/setup/client-test-setup.js'],

  // Test timeout
  testTimeout: 10000,

  // Mock configuration
  clearMocks: true,
  resetMocks: false,
  restoreMocks: true,

  // No transform needed for simple JS files
  transform: {},

  // Module name mapping for client-side dependencies
  moduleNameMapper: {
    // Mock any CSS imports if needed
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },

  // Global variables available in tests
  globals: {
    window: {},
    document: {},
    navigator: {},
    localStorage: {},
  },
};
