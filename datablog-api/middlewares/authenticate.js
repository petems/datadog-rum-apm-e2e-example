const { verifyAccess } = require('../utils/jwt');
const logger = require('../logger');

function authenticate(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    logger.warn(
      {
        requestId: req.requestId,
        path: req.path,
        method: req.method,
      },
      'Auth failed: missing Bearer token'
    );
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
  } catch {
    logger.warn(
      {
        requestId: req.requestId,
        path: req.path,
        method: req.method,
      },
      'Auth failed: invalid or expired token'
    );
    return res
      .status(401)
      .json({ code: 'UNAUTHORIZED', message: 'Invalid or expired token' });
  }
}

module.exports = authenticate;
