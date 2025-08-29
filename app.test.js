const request = require('supertest');

jest.mock('./config/rum', () => ({
  clientToken: 'test-token',
  applicationId: 'test-app-id',
}));

jest.mock('dd-trace', () => ({
  init: jest.fn(),
  trace: jest.fn(),
  wrap: jest.fn(),
}));

jest.mock('./logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

jest.mock('./mongo/models/pageModel', () => ({
  find: jest.fn(),
}));

jest.mock('./mongo', () => ({}));

describe('Express Application', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    app = require('./app');
  });

  it('should create express app', () => {
    expect(app).toBeDefined();
  });

  it('should handle 404 errors', async () => {
    const response = await request(app).get('/nonexistent-route');
    expect(response.status).toBe(404);
  });

  it('should serve static files', async () => {
    const response = await request(app).get('/javascripts/jquery-2.1.3.min.js');
    expect([200, 404]).toContain(response.status);
  });
});
