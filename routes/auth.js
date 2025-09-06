const express = require('express');
const logger = require('../logger');
const cookieParser = require('cookie-parser');
const { csrfProtection, generateCsrfToken } = require('../middlewares/csrf');
const helmet = require('helmet');
const cors = require('cors');
const User = require('../mongo/models/userModel');
const {
  validatePasswordPolicy,
  hashPassword,
  verifyPassword,
} = require('../utils/password');
const {
  signAccess,
  signRefresh,
  verifyRefresh,
  decode,
} = require('../utils/jwt');
const { setRefreshCookie, clearRefreshCookie } = require('../utils/cookies');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const { authLimiter } = require('../middlewares/rateLimiter');
const traceLogger = require('../middlewares/traceLogger');

const router = express.Router();

router.use(cookieParser());
router.use(helmet());

// Log incoming trace headers for debugging RUM->APM correlation
router.use(traceLogger);
router.use(
  cors({
    origin: process.env.CORS_ORIGIN || [
      'http://localhost:5173',
      'http://localhost:3000',
    ],
    credentials: true,
  })
);

// CSRF protection for state-changing requests using double submit cookie pattern
router.use(csrfProtection);

// Public endpoint for clients to fetch a CSRF token
router.get('/csrf', (req, res) => {
  const token = generateCsrfToken(req, res);
  return res.status(200).json({ csrfToken: token });
});

// Helpers
function toPublicUser(user) {
  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    tokenVersion: user.tokenVersion,
  };
}

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({
      code: 'BAD_REQUEST',
      message: 'email and password are required',
    });
  }
  if (!validatePasswordPolicy(password)) {
    return res.status(400).json({
      code: 'WEAK_PASSWORD',
      message: 'Password must be min 8 chars and include a letter and a number',
    });
  }
  try {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res
        .status(409)
        .json({ code: 'CONFLICT', message: 'Email already registered' });
    }
    const passwordHash = await hashPassword(password);
    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      role: 'user',
    });
    return res.status(201).json({ user: toPublicUser(user) });
  } catch {
    return res
      .status(500)
      .json({ code: 'INTERNAL_ERROR', message: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, csrfProtection, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    logger &&
      logger.warn(
        { path: req.path, method: req.method, requestId: req.requestId },
        'Login failed: missing email or password'
      );
    return res.status(400).json({
      code: 'BAD_REQUEST',
      message: 'email and password are required',
    });
  }
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    // Mitigate timing-based user enumeration by doing a real password check even when user is missing
    let ok = false;
    if (user) {
      ok = await verifyPassword(password, user.passwordHash);
    } else {
      // Generate a dummy hash then verify to consume comparable time
      const dummyHash = await hashPassword('invalidpassword');
      ok = await verifyPassword(password, dummyHash);
    }
    if (!user || !ok) {
      const hashPrefix = user?.passwordHash?.slice(0, 4) || null;
      logger &&
        logger.warn(
          {
            path: req.path,
            method: req.method,
            requestId: req.requestId,
            email,
            userFound: Boolean(user),
            hashPrefix,
          },
          'Login failed: invalid credentials'
        );
      return res
        .status(401)
        .json({ code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' });
    }

    const access = signAccess({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    });
    const refresh = signRefresh({
      sub: user._id.toString(),
      tokenVersion: user.tokenVersion,
    });
    setRefreshCookie(res, refresh);
    logger &&
      logger.info(
        {
          path: req.path,
          method: req.method,
          requestId: req.requestId,
          userId: user._id.toString(),
        },
        'Login success'
      );
    return res
      .status(200)
      .json({ accessToken: access, user: toPublicUser(user) });
  } catch {
    return res
      .status(500)
      .json({ code: 'INTERNAL_ERROR', message: 'Login failed' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', authLimiter, csrfProtection, async (req, res) => {
  const token = req.cookies?.refresh_token;
  if (!token) {
    return res
      .status(401)
      .json({ code: 'UNAUTHORIZED', message: 'Missing refresh token' });
  }
  try {
    const payload = verifyRefresh(token);
    if (typeof payload.sub !== 'string') {
      return res
        .status(401)
        .json({ code: 'UNAUTHORIZED', message: 'Invalid token' });
    }
    const user = await User.findById(payload.sub);
    if (!user) {
      return res
        .status(401)
        .json({ code: 'UNAUTHORIZED', message: 'Invalid token' });
    }
    if (user.tokenVersion !== payload.tokenVersion) {
      return res
        .status(401)
        .json({ code: 'UNAUTHORIZED', message: 'Token revoked' });
    }
    // Rotate
    const newRefresh = signRefresh({
      sub: user._id.toString(),
      tokenVersion: user.tokenVersion,
    });
    setRefreshCookie(res, newRefresh);
    const access = signAccess({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    });
    return res.status(200).json({ accessToken: access });
  } catch {
    // Attempt reuse detection: decode and bump tokenVersion to invalidate sessions
    try {
      const decoded = decode(token);
      if (decoded && typeof decoded.sub === 'string') {
        await User.findByIdAndUpdate(
          { _id: { $eq: decoded.sub } },
          {
            $inc: { tokenVersion: 1 },
          }
        );
      }
    } catch (e) {
      // no-op: decoding may fail; ensure non-empty catch for lint
      void e;
    }
    return res
      .status(401)
      .json({ code: 'UNAUTHORIZED', message: 'Invalid refresh token' });
  }
});

// POST /api/auth/logout
router.post(
  '/logout',
  authLimiter,
  csrfProtection,
  authenticate,
  async (req, res) => {
    try {
      await User.findByIdAndUpdate(
        { _id: { $eq: req.user.id } },
        { $inc: { tokenVersion: 1 } }
      );
      clearRefreshCookie(res);
      return res.status(200).json({ message: 'Logged out' });
    } catch {
      return res
        .status(500)
        .json({ code: 'INTERNAL_ERROR', message: 'Logout failed' });
    }
  }
);

// GET /api/auth/me
router.get('/me', authLimiter, authenticate, async (req, res) => {
  return res.status(200).json({
    user: { id: req.user.id, email: req.user.email, role: req.user.role },
  });
});

// GET /api/protected
router.get(
  '/protected',
  authLimiter,
  authenticate,
  authorize(['admin']),
  (req, res) => {
    return res.status(200).json({ message: 'Admin content' });
  }
);

// CSRF error handler for this router
router.use((err, _req, res, _next) => {
  if (
    err &&
    (err.code === 'EBADCSRFTOKEN' ||
      err.message?.toLowerCase().includes('csrf'))
  ) {
    return res
      .status(403)
      .json({ code: 'CSRF_TOKEN_INVALID', message: 'Invalid CSRF token' });
  }
  return res
    .status(500)
    .json({ code: 'INTERNAL_ERROR', message: 'Unexpected error' });
});

module.exports = router;
