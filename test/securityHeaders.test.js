const request = require('supertest');

describe('Security headers', () => {
  let app;

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    app = require('../app');
  });

  it('does not expose X-Powered-By header', async () => {
    const res = await request(app).get('/');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('sets key security headers via Helmet', async () => {
    const res = await request(app).get('/');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeDefined();
    expect(res.headers['content-security-policy']).toBeDefined();
  });
});
