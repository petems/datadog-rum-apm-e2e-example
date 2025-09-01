const { verifyAccess } = require('../utils/jwt');
const logger = require('../logger');

function authenticate(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    return res
      .status(401)
      .json({ code: 'UNAUTHORIZED', message: 'Missing token' });
  }
  try {
    const payload = verifyAccess(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      tokenVersion: payload.tokenVersion,
    };
    return next();
  } catch (error) {
    // Log to aid debugging invalid tokens in non-prod too
    logger.warn({ err: error }, 'Authentication failed');
    return res
      .status(401)
      .json({ code: 'UNAUTHORIZED', message: 'Invalid or expired token' });
  }
}

module.exports = authenticate;
