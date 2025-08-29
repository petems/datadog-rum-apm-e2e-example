module.exports = async () => {
  // Global test setup
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/datablog-test';
  
  // Disable Datadog tracing in tests unless explicitly enabled
  if (!process.env.DD_TRACE_ENABLED) {
    process.env.DD_TRACE_ENABLED = 'false';
  }
  
  console.log('Global test setup complete');
};