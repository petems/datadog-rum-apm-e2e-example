const { defineConfig, devices } = require('@playwright/test');
const isCI = !!process.env.CI;

module.exports = defineConfig({
  testDir: './test/e2e',
  // Global setup and teardown for database seeding
  globalSetup: require.resolve('./test/e2e/global-setup.js'),
  globalTeardown: require.resolve('./test/e2e/global-teardown.js'),

  // Parallel execution
  fullyParallel: !isCI,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,

  // Reporter configuration
  reporter: isCI
    ? [['github'], ['json', { outputFile: 'test-results/results.json' }]]
    : [['html'], ['json', { outputFile: 'test-results/results.json' }]],

  // Global test configuration
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    trace: isCI ? 'off' : 'on-first-retry',
    screenshot: isCI ? 'off' : 'only-on-failure',
    video: isCI ? 'off' : 'retain-on-failure',

    // Browser context options
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    locale: 'en-US',
    timezoneId: 'America/New_York',
    launchOptions: {
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    },
  },

  // Test projects for different browsers
  projects: isCI
    ? [
        // Restrict to Chromium in CI for stability and speed
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
      ]
    : [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
        {
          name: 'firefox',
          use: { ...devices['Desktop Firefox'] },
        },
        {
          name: 'webkit',
          use: { ...devices['Desktop Safari'] },
        },
        // Mobile testing
        {
          name: 'Mobile Chrome',
          use: { ...devices['Pixel 5'] },
        },
        {
          name: 'Mobile Safari',
          use: { ...devices['iPhone 12'] },
        },
      ],

  // Local dev server (for development)
  webServer: process.env.CI
    ? undefined
    : {
        // Start the local app for quick iteration
        command: 'npm start',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
        // Force the app to use local Mongo when Playwright boots it
        env: {
          PORT: '3000',
          NODE_ENV: process.env.NODE_ENV || 'development',
          MONGODB_URI:
            process.env.LOCAL_MONGODB_URI ||
            'mongodb://127.0.0.1:27017/datablog',
        },
      },

  // Test output directories
  outputDir: 'test-results/',
});
