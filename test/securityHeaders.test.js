const request = require('supertest');

describe('Security headers', () => {
  let app;
  let res;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    app = require('../app');
    res = await request(app).get('/');
  });

  it('does not expose X-Powered-By header', () => {
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('sets key security headers via Helmet', () => {
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeDefined();
    expect(res.headers['content-security-policy']).toBeDefined();
  });
});
