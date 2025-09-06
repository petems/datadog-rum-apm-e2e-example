// Test setup to handle HttpOnly cookie warnings in superagent/cookiejar
// This provides utilities to suppress the expected warnings about HttpOnly cookies in test environments

const originalConsoleWarn = console.warn;

module.exports = {
  suppressHttpOnlyWarnings: () => {
    console.warn = (...args) => {
      const message = args.join(' ');
      if (
        message.includes(
          "Invalid cookie header encountered. Header: 'HttpOnly'"
        )
      ) {
        return; // Don't log this expected warning
      }
      originalConsoleWarn.apply(console, args);
    };
  },

  restoreConsoleWarn: () => {
    console.warn = originalConsoleWarn;
  },
};
