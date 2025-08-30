function authorize(roles = []) {
  return (req, res, next) => {
    const allowed = Array.isArray(roles) ? roles : [roles];
    if (!req.user) {
      return res
        .status(401)
        .json({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
    }
    if (allowed.length > 0 && !allowed.includes(req.user.role)) {
      return res
        .status(403)
        .json({ code: 'FORBIDDEN', message: 'Insufficient role' });
    }
    return next();
  };
}

module.exports = authorize;
