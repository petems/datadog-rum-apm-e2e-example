// Initialize Datadog tracing only outside of tests
if (process.env.NODE_ENV !== 'test') {
  // This line must come before importing any instrumented module.
  require('dd-trace').init({
    // Allow tests/CI to disable via env; default enabled in non-test
    enabled: process.env.DD_TRACE_ENABLED !== 'false',
    analytics: true,
    logInjection: true,
    // debug: true
  });
}

// Basic imports
const createError = require('http-errors');
const express = require('express');
const logger = require('./logger');
// Avoid establishing DB connections during unit tests to prevent open handles
if (process.env.NODE_ENV !== 'test') {
  require('./mongo');
}
const helmet = require('helmet');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();

// Hide implementation details from response headers
app.disable('x-powered-by');

// CORS configuration for frontend service
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Handlers for JSON and URL Encodings
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Attach a per-request ID for correlation and expose header
app.use((req, res, next) => {
  const headerId = req.headers['x-request-id'];
  // Prefer RFC 4122 if available
  const genId =
    (typeof crypto.randomUUID === 'function' && crypto.randomUUID()) ||
    crypto.randomBytes(16).toString('hex');
  const requestId = (headerId && String(headerId)) || genId;
  req.requestId = requestId;
  res.locals.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
});

// Security headers via Helmet (API-focused, no CSP for scripts)
app.use(
  helmet({
    contentSecurityPolicy: false, // Not needed for API-only service
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow cross-origin for API
    referrerPolicy: { policy: 'no-referrer' },
  })
);

// Health check endpoint
app.get('/healthz', (req, res) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    requestId: req.requestId,
    service: 'datablog-api'
  };

  res.status(200).json(healthStatus);
});

// API Routes only
const apiRouter = require('./routes/api');
const apiPagesRouter = require('./routes/api-pages');
const authRouter = require('./routes/auth');
app.use('/api/page', apiRouter);
app.use('/api/pages', apiPagesRouter);
app.use('/api/auth', authRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, _next) {
  // Determine status and log with stack trace
  const statusCode = err.status || 500;
  const logPayload = {
    err, // bunyan will include name/message/stack
    statusCode,
    method: req.method,
    path: req.path,
    url: req.originalUrl,
    query: req.query,
    requestId: req.requestId,
    user: req.user
      ? { id: req.user.id, email: req.user.email, role: req.user.role }
      : null,
  };
  if (statusCode >= 500) {
    logger.error(logPayload, 'Unhandled application error');
  } else {
    logger.warn(logPayload, 'Request error');
  }

  // Return JSON error for API service
  res.status(statusCode).json({ 
    statusCode, 
    message: err.message,
    requestId: req.requestId,
    service: 'datablog-api'
  });
});

module.exports = app;