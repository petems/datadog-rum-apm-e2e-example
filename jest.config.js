module.exports = {
  // Use projects to run both backend and frontend tests
  projects: [
    {
      // Backend tests (Node.js environment)
      displayName: 'backend',
      testEnvironment: 'node',
      testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
      testPathIgnorePatterns: ['/node_modules/', '/test/e2e/', '/public/'],
      coverageDirectory: 'coverage/backend',
      coverageReporters: ['text', 'lcov', 'html'],
      coverageThreshold: {
        global: {
          branches: 25,
          functions: 30,
          lines: 50,
          statements: 50,
        },
      },
      globalSetup: './test/setup/global-setup.js',
      globalTeardown: './test/setup/global-teardown.js',
      setupFilesAfterEnv: ['./test/setup/test-setup.js'],
      testTimeout: 10000,
      clearMocks: true,
      resetMocks: false,
      restoreMocks: true,
    },
    {
      // Frontend tests (happy-dom environment)
      displayName: 'frontend',
      testEnvironment: '@happy-dom/jest-environment',
      testMatch: [
        '**/public/**/__tests__/**/*.js',
        '**/public/**/?(*.)+(spec|test).js',
      ],
      testPathIgnorePatterns: ['/node_modules/', '/test/e2e/'],
      coverageDirectory: 'coverage/frontend',
      coverageReporters: ['text', 'lcov', 'html'],
      setupFilesAfterEnv: ['<rootDir>/test/setup/client-test-setup.js'],
      testTimeout: 10000,
      clearMocks: true,
      resetMocks: false,
      restoreMocks: true,
      transform: {},
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
      },
    },
  ],
};
