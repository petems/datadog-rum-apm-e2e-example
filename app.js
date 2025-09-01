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

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// FIXME how does express use loggers
//app.use(logger('datablog'));

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
        ],
        'frame-ancestors': ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-origin' },
    referrerPolicy: { policy: 'no-referrer' },
  })
);

// Robots.txt and sitemap.xml with dynamic base URL
function inferBaseUrl(req) {
  const proto = (req.headers['x-forwarded-proto'] || req.protocol || 'http')
    .split(',')[0]
    .trim();
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const envBase = process.env.PUBLIC_BASE_URL || process.env.SITE_BASE_URL;
  if (envBase) {
    return envBase.replace(/\/$/, '');
  }
  return `${proto}://${host}`;
}

app.get('/robots.txt', (req, res) => {
  const base = inferBaseUrl(req);
  res
    .type('text/plain')
    .send(`User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`);
});

app.get('/sitemap.xml', (req, res) => {
  const base = inferBaseUrl(req);
  res
    .type('application/xml')
    .send(
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
        `  <url><loc>${base}/</loc></url>\n` +
        `</urlset>\n`
    );
});

// Cache policy: disable caching for dynamic pages
app.use((req, res, next) => {
  res.setHeader(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, private'
  );
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Create public path containing images, javascript, and stylesheets
app.use(
  express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, p) => {
      if (
        /(\.js|\.css|\.png|\.jpg|\.jpeg|\.gif|\.svg|\.ico|\.woff2?|\.ttf|\.eot)$/i.test(
          p
        )
      ) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  })
);

// Routers for each page
const indexRouter = require('./routes/index');
const pagesRouter = require('./routes/pages');
const apiRouter = require('./routes/api');
const apiPagesRouter = require('./routes/api-pages');
const authRouter = require('./routes/auth');
app.use('/', indexRouter);
app.use('/page', pagesRouter);
app.use('/api/page', apiRouter);
app.use('/api/pages', apiPagesRouter);
app.use('/api/auth', authRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, _next) {
  res.locals.message = err.message;
  res.locals.error = err;

  // TODO: Why does the error handling cause posting a new page to fail
  // Workaround for this getting thrown from manage-pages.getNextPageId
  if (
    err.name === 'NotFoundError' &&
    (req.path === '/page' || req.path === '/page/')
  ) {
    logger.info('Mongoose NotFoundError, skipping');
    return;
  }

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

  // Render the error page without exposing stack to users
  res.status(statusCode);
  const errorDetails = {
    statusCode,
    message: err.message,
  };
  res.render('error', { ...errorDetails, rum });
});

module.exports = app;
