const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const cors = require('cors');
const User = require('../mongo/models/userModel');
const {
  validatePasswordPolicy,
  hashPassword,
  verifyPassword,
} = require('../utils/password');
const { signAccess, signRefresh, verifyRefresh } = require('../utils/jwt');
const { setRefreshCookie, clearRefreshCookie } = require('../utils/cookies');
const jwt = require('jsonwebtoken');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const { authLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

router.use(cookieParser());
router.use(helmet());
router.disable('x-powered-by');
router.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);

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
    return res
      .status(400)
      .json({
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
  } catch (err) {
    return res
      .status(500)
      .json({ code: 'INTERNAL_ERROR', message: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res
      .status(400)
      .json({
        code: 'BAD_REQUEST',
        message: 'email and password are required',
      });
  }
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res
        .status(401)
        .json({ code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' });
    }
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
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
    return res
      .status(200)
      .json({ accessToken: access, user: toPublicUser(user) });
  } catch (err) {
    return res
      .status(500)
      .json({ code: 'INTERNAL_ERROR', message: 'Login failed' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  const token = req.cookies?.refresh_token;
  if (!token) {
    return res
      .status(401)
      .json({ code: 'UNAUTHORIZED', message: 'Missing refresh token' });
  }
  try {
    const payload = verifyRefresh(token);
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
  } catch (err) {
    // Attempt reuse detection: decode and bump tokenVersion to invalidate sessions
    try {
      const decoded = jwt.decode(token);
      if (decoded && decoded.sub) {
        await User.findByIdAndUpdate(decoded.sub, {
          $inc: { tokenVersion: 1 },
        });
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
router.post('/logout', authenticate, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { $inc: { tokenVersion: 1 } });
    clearRefreshCookie(res);
    return res.status(200).json({ message: 'Logged out' });
  } catch (err) {
    return res
      .status(500)
      .json({ code: 'INTERNAL_ERROR', message: 'Logout failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  return res
    .status(200)
    .json({
      user: { id: req.user.id, email: req.user.email, role: req.user.role },
    });
});

// GET /api/protected
router.get('/protected', authenticate, authorize(['admin']), (req, res) => {
  return res.status(200).json({ message: 'Admin content' });
});

module.exports = router;
