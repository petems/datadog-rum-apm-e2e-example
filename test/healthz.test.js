const request = require('supertest');
const app = require('../app');

describe('Health Check Endpoint', () => {
  describe('GET /healthz', () => {
    it('should return health status information', async () => {
      const response = await request(app)
        .get('/healthz')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('requestId');

      // Validate timestamp is a valid ISO string
      expect(() => new Date(response.body.timestamp)).not.toThrow();

      // Validate uptime is a number
      expect(typeof response.body.uptime).toBe('number');
      expect(response.body.uptime).toBeGreaterThan(0);

      // Validate requestId exists
      expect(response.body.requestId).toBeTruthy();
      expect(typeof response.body.requestId).toBe('string');
    });

    it('should include correct environment from NODE_ENV', async () => {
      const response = await request(app).get('/healthz').expect(200);

      expect(response.body.environment).toBe('test');
    });

    it('should return unique request IDs for different requests', async () => {
      const response1 = await request(app).get('/healthz').expect(200);
      const response2 = await request(app).get('/healthz').expect(200);

      expect(response1.body.requestId).not.toBe(response2.body.requestId);
    });
  });
});
