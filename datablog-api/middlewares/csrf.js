const { doubleCsrf } = require('csrf-csrf');
const crypto = require('node:crypto');

// Use a stable secret per process (override via env in real deployments)
const CSRF_SECRET =
  process.env.CSRF_SECRET || crypto.randomBytes(32).toString('hex');

// Configure double-csrf to match our app's expectations
const csrfUtils = doubleCsrf({
  // HMAC secret(s)
  getSecret: () => CSRF_SECRET,

  // Bind token to a request-unique identifier
  // Prefer refresh token cookie; otherwise use IP+UA fallback
  getSessionIdentifier: req => {
    const rt = req.cookies && req.cookies.refresh_token;
    if (rt) {
      return rt;
    }
    const ua = req.headers['user-agent'] || '';
    const ip = req.ip || req.connection?.remoteAddress || '';
    return `${ip}!${ua}`;
  },

  // Keep cookie/header compatibility with existing tests and clients
  cookieName: '_csrf',
  cookieOptions: {
    sameSite: 'lax',
    path: '/',
    httpOnly: true,
    // Set to true in production behind HTTPS
    secure: false,
  },
  getCsrfTokenFromRequest: req =>
    req.headers['csrf-token'] || req.headers['x-csrf-token'] || null,

  // Mirror csurf error shape for existing error handler/tests
  errorConfig: {
    statusCode: 403,
    message: 'Invalid CSRF token',
    code: 'EBADCSRFTOKEN',
  },
});

module.exports = {
  csrfProtection: csrfUtils.doubleCsrfProtection,
  generateCsrfToken: csrfUtils.generateCsrfToken,
  validateRequest: csrfUtils.validateRequest,
  invalidCsrfTokenError: csrfUtils.invalidCsrfTokenError,
};
