// Test setup to handle HttpOnly cookie warnings in superagent/cookiejar
// This suppresses the expected warnings about HttpOnly cookies in test environments

const originalConsoleWarn = console.warn;

// Suppress HttpOnly cookie warnings during tests
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

// Restore original console.warn after tests
afterAll(() => {
  console.warn = originalConsoleWarn;
});

module.exports = {
  suppressHttpOnlyWarnings: () => {
    console.warn = (...args) => {
      const message = args.join(' ');
      if (
        message.includes(
          "Invalid cookie header encountered. Header: 'HttpOnly'"
        )
      ) {
        return;
      }
      originalConsoleWarn.apply(console, args);
    };
  },

  restoreConsoleWarn: () => {
    console.warn = originalConsoleWarn;
  },
};
