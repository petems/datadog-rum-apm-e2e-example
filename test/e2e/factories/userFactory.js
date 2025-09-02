const { Factory } = require('fishery');
const { faker } = require('@faker-js/faker');
const bcrypt = require('bcryptjs');

const userFactory = Factory.define(({ params }) => {
  const email = params.email || faker.internet.email().toLowerCase();
  const role = params.role || 'user';
  const password = params.password || 'TestPassword123';
  
  return {
    email,
    passwordHash: bcrypt.hashSync(password, 12),
    role,
    tokenVersion: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    // Store plain password for test use (not saved to DB)
    _plainPassword: password,
  };
});

module.exports = userFactory;