let jwt;
try {
  jwt = require('jsonwebtoken');
} catch (e) {
  if (process.env.NODE_ENV === 'production') {
    throw e;
  }
  // Lightweight fallback for test/dev when jsonwebtoken isn't installed
  jwt = {
    sign: (payload, _secret, _opts = {}) =>
      Buffer.from(JSON.stringify({ payload })).toString('base64url'),
    verify: (token, _secret) => {
      const raw = Buffer.from(token, 'base64url').toString('utf8');
      const obj = JSON.parse(raw);
      return obj.payload;
    },
    decode: token => {
      try {
        const raw = Buffer.from(token, 'base64url').toString('utf8');
        const obj = JSON.parse(raw);
        return obj.payload;
      } catch {
        return null;
      }
    },
  };
}

const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL || '15m';
const REFRESH_TTL = process.env.REFRESH_TOKEN_TTL || '7d';
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'change-me';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'change-me-too';

// Enforce non-default secrets in production
if (
  process.env.NODE_ENV === 'production' &&
  (ACCESS_SECRET === 'change-me' || REFRESH_SECRET === 'change-me-too')
) {
  throw new Error('FATAL: JWT secrets must be set in production');
}

function signAccess(payload, opts = {}) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_TTL, ...opts });
}

function verifyAccess(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

function signRefresh(payload, opts = {}) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_TTL, ...opts });
}

function verifyRefresh(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

module.exports = {
  signAccess,
  verifyAccess,
  signRefresh,
  verifyRefresh,
  decode: token => jwt.decode(token),
};
