const express = require('express');
const path = require('path');
const helmet = require('helmet');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3000;

// Hide implementation details from response headers
app.disable('x-powered-by');

// Per-request CSP nonce for inline scripts
app.use((req, res, next) => {
  res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
  next();
});

// Security headers via Helmet
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
        'style-src': ["'self'", "'unsafe-inline'"],
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
          process.env.API_BASE_URL || 'http://localhost:3001',
        ],
        'frame-ancestors': ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-origin' },
    referrerPolicy: { policy: 'no-referrer' },
  })
);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'datablog-ui',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Serve the main application
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`datablog-ui server listening on port ${port}`);
});