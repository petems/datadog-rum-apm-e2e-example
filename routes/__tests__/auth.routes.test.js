const request = require('supertest'); // eslint-disable-line no-unused-vars
const express = require('express');
const cookieParser = require('cookie-parser');
jest.mock('../../mongo/models/userModel', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));
const authRouter = require('../auth');
const User = require('../../mongo/models/userModel');

describe('Auth Routes', () => {
  let app;
  let agent;
  let userState;

  beforeAll(async () => {
    const { hashPassword } = require('../../utils/password');
    userState = {
      _id: '507f1f77bcf86cd799439011',
      email: 'user@example.com',
      passwordHash: await hashPassword('Password1'),
      role: 'user',
      tokenVersion: 0,
    };
    User.create.mockImplementation(async doc => ({
      _id: 'aaaaaaaaaaaaaaaaaaaaaaaa',
      email: doc.email,
      role: 'user',
      tokenVersion: 0,
    }));
    User.findOne.mockImplementation(async query => {
      if (query.email === userState.email) {
        return { ...userState };
      }
      return null;
    });
    User.findById.mockImplementation(async id =>
      id === userState._id ? { ...userState } : null
    );
    User.findByIdAndUpdate.mockImplementation(async (id, update) => {
      if (
        id === userState._id &&
        update &&
        update.$inc &&
        update.$inc.tokenVersion
      ) {
        userState.tokenVersion += update.$inc.tokenVersion;
      }
      return { ...userState };
    });

    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/auth', authRouter);
    agent = require('supertest').agent(app);
  });

  afterAll(() => {
    jest.resetAllMocks();
  });

  test('GET /api/auth/csrf returns csrf token', async () => {
    const res = await agent.get('/api/auth/csrf');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('csrfToken');
  });

  test('POST /api/auth/register enforces password policy', async () => {
    const csrfRes = await agent.get('/api/auth/csrf');
    const csrfToken = csrfRes.body.csrfToken;
    const res = await agent
      .post('/api/auth/register')
      .set('csrf-token', csrfToken)
      .send({ email: 'new@example.com', password: 'weak' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('WEAK_PASSWORD');
  });

  test('POST /api/auth/login returns access token and sets refresh cookie', async () => {
    const csrfRes = await agent.get('/api/auth/csrf');
    const csrfToken = csrfRes.body.csrfToken;
    const res = await agent
      .post('/api/auth/login')
      .set('csrf-token', csrfToken)
      .send({ email: 'user@example.com', password: 'Password1' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    const setCookie = res.headers['set-cookie'] || [];
    expect(setCookie.join(';')).toMatch(/refresh_token=/);
    const accessToken = res.body.accessToken;

    // Refresh should succeed and return a new access token
    const csrfRes2 = await agent.get('/api/auth/csrf');
    const csrfToken2 = csrfRes2.body.csrfToken;
    const refreshRes = await agent
      .post('/api/auth/refresh')
      .set('csrf-token', csrfToken2);
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body).toHaveProperty('accessToken');

    // Me should work with Authorization header
    const meRes = await agent
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.user).toMatchObject({
      email: userState.email,
      role: 'user',
    });

    // Logout should invalidate refresh by bumping tokenVersion
    const csrfRes3 = await agent.get('/api/auth/csrf');
    const csrfToken3 = csrfRes3.body.csrfToken;
    const logoutRes = await agent
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('csrf-token', csrfToken3);
    expect(logoutRes.status).toBe(200);

    // Attempt refresh again should now fail with 401 due to tokenVersion mismatch
    const csrfRes4 = await agent.get('/api/auth/csrf');
    const csrfToken4 = csrfRes4.body.csrfToken;
    const refreshRes2 = await agent
      .post('/api/auth/refresh')
      .set('csrf-token', csrfToken4);
    expect(refreshRes2.status).toBe(401);
  });
});
