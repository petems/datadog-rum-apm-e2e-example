const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const mockingoose = require('mockingoose');

// Real models and app
const User = require('../mongo/models/userModel');

// Keep tracing and auto-mongo init disabled in tests
process.env.NODE_ENV = 'test';
const app = require('../app');

// Utility: create bcrypt hash
async function hash(password) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

describe('Auth routes (Mongo integration)', () => {
  beforeEach(() => {
    mockingoose.resetAll();
  });

  async function getCsrf(agent) {
    const res = await agent.get('/api/auth/csrf');
    expect(res.status).toBe(200);
    const token = res.body.csrfToken;
    const cookie = (res.headers['set-cookie'] || [])[0];
    expect(token).toBeTruthy();
    expect(cookie).toMatch(/_csrf=/);
    return { token, cookie };
  }

  test('login succeeds with mocked Mongo user + bcrypt hash', async () => {
    const email = 'admin@example.com';
    const password = 'AdminPassword123';
    const passwordHash = await hash(password);

    mockingoose(User).toReturn(
      {
        _id: new mongoose.Types.ObjectId(),
        email,
        passwordHash,
        role: 'admin',
      },
      'findOne'
    );

    const agent = request.agent(app);
    const { token, cookie } = await getCsrf(agent);

    const res = await agent
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .set('csrf-token', token)
      .set('Cookie', cookie)
      .send({ email, password });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body.user).toEqual(
      expect.objectContaining({ email, role: 'admin' })
    );

    // Verify /me with returned access token
    const me = await agent
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${res.body.accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe(email);
  }, 15000);

  test('login fails for wrong password (mocked Mongo)', async () => {
    const email = 'admin@example.com';
    const passwordHash = await hash('SomeOtherPass123');

    mockingoose(User).toReturn(
      {
        _id: new mongoose.Types.ObjectId(),
        email,
        passwordHash,
        role: 'admin',
      },
      'findOne'
    );

    const agent = request.agent(app);
    const { token, cookie } = await getCsrf(agent);

    const res = await agent
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .set('csrf-token', token)
      .set('Cookie', cookie)
      .send({ email, password: 'AdminPassword123' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual(
      expect.objectContaining({ code: 'INVALID_CREDENTIALS' })
    );
  }, 15000);
});
