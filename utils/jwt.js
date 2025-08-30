const jwt = require('jsonwebtoken');

const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL || '15m';
const REFRESH_TTL = process.env.REFRESH_TOKEN_TTL || '7d';
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'change-me';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'change-me-too';

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
};
