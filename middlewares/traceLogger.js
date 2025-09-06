const logger = require('../logger');

/**
 * Middleware to log incoming trace headers for debugging RUM->APM correlation
 * This helps verify that RUM headers are being properly received by the backend
 */
function traceLogger(req, res, next) {
  // Only log trace headers if DEBUG environment variable is set
  if (process.env.DEBUG === 'true' || process.env.DEBUG === '1') {
    // Extract trace-related headers
    const traceHeaders = {};
    const traceHeaderNames = [
      'traceparent',
      'tracestate',
      'x-datadog-trace-id',
      'x-datadog-parent-id',
      'x-datadog-sampling-priority',
      'x-datadog-origin',
      'x-datadog-tags',
      'x-request-id',
    ];

    traceHeaderNames.forEach(headerName => {
      const value = req.headers[headerName];
      if (value) {
        traceHeaders[headerName] = value;
      }
    });

    // Log trace headers if any are present (for debugging RUM->APM correlation)
    if (Object.keys(traceHeaders).length > 0) {
      logger.info(
        {
          requestId: req.requestId,
          method: req.method,
          path: req.path,
          traceHeaders,
        },
        'RUM trace headers received - APM correlation working'
      );
    }
  }

  next();
}

module.exports = traceLogger;
