const bcrypt = require('bcryptjs');

function isBcryptHash(hash) {
  return typeof hash === 'string' && /^\$2[aby]\$/.test(hash);
}

// Min 8 chars, at least 1 letter & 1 number
const PASSWORD_POLICY = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

function validatePasswordPolicy(pw) {
  return PASSWORD_POLICY.test(pw);
}

async function hashPassword(password) {
  const saltRounds = 12;
  const salt = await bcrypt.genSalt(saltRounds);
  return bcrypt.hash(password, salt);
}

async function verifyPassword(password, hash) {
  // Support only bcrypt; reject non-bcrypt hashes
  if (!isBcryptHash(hash)) return false;
  return bcrypt.compare(password, hash);
}

module.exports = {
  validatePasswordPolicy,
  hashPassword,
  verifyPassword,
};
