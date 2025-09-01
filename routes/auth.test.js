const request = require('supertest');
const bcrypt = require('bcryptjs');

// Mock logger early so route logs don't print during tests
jest.mock('../logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));
const logger = require('../logger');

// Mock User model used by routes/auth
jest.mock('../mongo/models/userModel', () => ({
  findOne: jest.fn(),
}));
const User = require('../mongo/models/userModel');

// Ensure NODE_ENV is 'test' so app doesn't connect to Mongo or init tracing
process.env.NODE_ENV = 'test';

const app = require('../app');

describe('Auth routes - login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  async function getCsrf(agent) {
    const res = await agent.get('/api/auth/csrf');
    expect(res.status).toBe(200);
    const token = res.body.csrfToken;
    expect(typeof token).toBe('string');
    const cookies = res.headers['set-cookie'] || [];
    expect(cookies.join(';')).toMatch(/_csrf=/);
    return { token, cookie: cookies[0] };
  }

  test('returns 200 and accessToken on successful login', async () => {
    const password = 'AdminPassword123';
    const passwordHash = await bcrypt.hash(password, 12);
    User.findOne.mockResolvedValue({
      _id: { toString: () => 'user123' },
      email: 'admin@example.com',
      role: 'admin',
      tokenVersion: 0,
      passwordHash,
    });

    const agent = request.agent(app);
    const { token, cookie } = await getCsrf(agent);

    const res = await agent
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .set('csrf-token', token)
      .set('Cookie', cookie)
      .send({ email: 'admin@example.com', password });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe('admin@example.com');
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/login', method: 'POST' }),
      'Login success'
    );
  });

  test('returns 401 and logs details when password is invalid', async () => {
    const wrongHash = await bcrypt.hash('WrongPassword999', 12);
    User.findOne.mockResolvedValue({
      _id: { toString: () => 'user123' },
      email: 'admin@example.com',
      role: 'admin',
      tokenVersion: 0,
      passwordHash: wrongHash,
    });

    const agent = request.agent(app);
    const { token, cookie } = await getCsrf(agent);

    const res = await agent
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .set('csrf-token', token)
      .set('Cookie', cookie)
      .send({ email: 'admin@example.com', password: 'AdminPassword123' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual(
      expect.objectContaining({ code: 'INVALID_CREDENTIALS' })
    );
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/login',
        method: 'POST',
        email: 'admin@example.com',
        userFound: true,
      }),
      'Login failed: invalid credentials'
    );
  });

  test('returns 401 and logs userFound=false when user not found', async () => {
    User.findOne.mockResolvedValue(null);

    const agent = request.agent(app);
    const { token, cookie } = await getCsrf(agent);

    const res = await agent
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .set('csrf-token', token)
      .set('Cookie', cookie)
      .send({ email: 'missing@example.com', password: 'something' });

    expect(res.status).toBe(401);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'missing@example.com',
        userFound: false,
        hashPrefix: null,
      }),
      'Login failed: invalid credentials'
    );
  });
});

