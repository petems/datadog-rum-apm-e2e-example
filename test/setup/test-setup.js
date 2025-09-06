// Test environment setup that runs before each test file
const mongoose = require('mongoose');

// Increase timeout for database operations in tests
jest.setTimeout(30000);

// Suppress HttpOnly cookie warnings from superagent/cookiejar during tests
// These warnings are expected when testing secure cookie configurations
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  const message = args.join(' ');

  // Suppress the specific HttpOnly cookie warning from cookiejar
  if (
    message.includes("Invalid cookie header encountered. Header: 'HttpOnly'")
  ) {
    return; // Don't log this expected warning
  }

  // Log all other warnings normally
  originalConsoleWarn.apply(console, args);
};

// Mock console methods to reduce test noise (uncomment if needed)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// Clean up after each test
afterEach(async () => {
  // Clear all mocks
  jest.clearAllMocks();
});

// Clean up database connections after all tests
afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});
