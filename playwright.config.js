const { defineConfig, devices } = require('@playwright/test');
const isCI = !!process.env.CI;

module.exports = defineConfig({
  testDir: './test/e2e',
  // Global setup runs for both local and CI environments
  globalSetup: require.resolve('./test/e2e/global-setup.js'),

  // Parallel execution
  fullyParallel: !isCI,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  // Use single worker for both CI and local to avoid database race conditions
  workers: 1,

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

    // Custom setup for adding headers only to our application requests
    // Note: extraHTTPHeaders is removed to avoid CORS issues with external services
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
        // Mobile testing
        {
          name: 'Mobile Chrome',
          use: { ...devices['Pixel 5'] },
        },
      ],

  // No webServer config - we use docker-compose for consistent environments
  // The global setup handles starting services via docker-compose

  // Test output directories
  outputDir: 'test-results/',
});
