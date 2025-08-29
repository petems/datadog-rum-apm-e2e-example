// Test environment setup that runs before each test file
const mongoose = require('mongoose');

// Increase timeout for database operations in tests
jest.setTimeout(30000);

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
