let argon2;
try {
  // Optional dependency; fallback to bcryptjs
  argon2 = require('argon2');
} catch {
  argon2 = null;
}
const bcrypt = require('bcryptjs');

// Min 8 chars, at least 1 letter & 1 number
const PASSWORD_POLICY = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

function validatePasswordPolicy(pw) {
  return PASSWORD_POLICY.test(pw);
}

async function hashPassword(password) {
  if (argon2) {
    return argon2.hash(password, { type: argon2.argon2id });
  }
  const saltRounds = 12;
  const salt = await bcrypt.genSalt(saltRounds);
  return bcrypt.hash(password, salt);
}

async function verifyPassword(password, hash) {
  if (argon2) {
    return argon2.verify(hash, password);
  }
  return bcrypt.compare(password, hash);
}

module.exports = {
  validatePasswordPolicy,
  hashPassword,
  verifyPassword,
};
