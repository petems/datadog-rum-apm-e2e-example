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
const rum = require('./config/rum');

// Basic imports
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const logger = require('./logger');
const fs = require('fs');
// Avoid establishing DB connections during unit tests to prevent open handles
if (process.env.NODE_ENV !== 'test') {
  require('./mongo');
}
const helmet = require('helmet');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');

const app = express();

// Hide implementation details from response headers
app.disable('x-powered-by');

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

// Per-request CSP nonce for inline scripts in templates
app.use((req, res, next) => {
  res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
  next();
});

// Security headers via Helmet (CSP with nonces, no unsafe-inline)
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'default-src': ["'self'"],
        'script-src': [
          "'self'",
          (req, res) => `'nonce-${res.locals.cspNonce}'`,
          'https://www.datadoghq-browser-agent.com',
        ],
        'worker-src': ["'self'", 'blob:'],
        // Allow inline styles for third-party SDKs like Datadog RUM
        // We keep scripts nonce-based and disallow unsafe-inline for scripts
        'style-src': ["'self'", "'unsafe-inline'"],
        // Explicitly allow inline style elements and attributes (CSP3)
        'style-src-elem': ["'self'", "'unsafe-inline'"],
        'style-src-attr': ["'self'", "'unsafe-inline'"],
        'font-src': ["'self'"],
        'img-src': ["'self'", 'data:'],
        'connect-src': [
          "'self'",
          'https://*.datadoghq.com',
          'https://*.datadoghq.eu',
          'https://*.datad0g.com',
          'https://browser-intake-datadoghq.com',
        ],
        'frame-ancestors': ["'self'"],
      },
    },
    // COEP disabled to support Datadog RUM v6 dynamic chunk loading
    // RUM v6 uses dynamic imports for features like Session Replay which require
    // cross-origin resource sharing that conflicts with require-corp policy
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-origin' },
    referrerPolicy: { policy: 'no-referrer' },
  })
);

// Health check endpoint
app.get('/healthz', (req, res) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    requestId: req.requestId,
  };

  res.status(200).json(healthStatus);
});

// Serve API routes
const apiRouter = require('./routes/api');
const apiPagesRouter = require('./routes/api-pages');
const authRouter = require('./routes/auth');
app.use('/api/page', apiRouter);
app.use('/api/pages', apiPagesRouter);
app.use('/api/auth', authRouter);

// Serve React frontend
app.use(express.static(path.join(__dirname, 'frontend/dist')));

app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return next();
  }
  try {
    const htmlPath = path.join(__dirname, 'frontend/dist/index.html');
    let html = fs.readFileSync(htmlPath, 'utf8');
    const rumConfig = `<script nonce="${res.locals.cspNonce}">window.DD_RUM_CONFIG = ${JSON.stringify(rum)}</script>`;
    html = html.replace('</head>', `${rumConfig}</head>`);
    res.send(html);
  } catch (error) {
    logger.error(error, 'Error serving React app');
    next(error);
  }
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, _next) {
  res.locals.message = err.message;
  res.locals.error = err;

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

  res.status(statusCode).json({
    statusCode,
    message: err.message,
    // only include stack in development
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

module.exports = app;
