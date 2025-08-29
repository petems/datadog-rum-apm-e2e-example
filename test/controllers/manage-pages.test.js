const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');

// Mock the Datadog tracer to avoid initialization in tests
jest.mock('dd-trace', () => ({
  trace: (name, fn) => fn(),
  wrap: (name, fn) => fn,
  init: () => ({}),
}));

describe('Page Management API', () => {
  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/datablog-test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
  });

  afterAll(async () => {
    // Clean up database connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  beforeEach(async () => {
    // Clean up test data before each test
    if (mongoose.connection.models.Page) {
      await mongoose.connection.models.Page.deleteMany({});
    }
  });

  describe('GET /api/pages', () => {
    it('should return an array of pages', async () => {
      const response = await request(app)
        .get('/api/pages')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should handle database errors gracefully', async () => {
      // Mock a database error
      const originalFind = mongoose.Model.find;
      mongoose.Model.find = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/pages')
        .expect(500);

      expect(response.body).toHaveProperty('error');

      // Restore original method
      mongoose.Model.find = originalFind;
    });
  });

  describe('POST /api/pages', () => {
    it('should create a new page with valid data', async () => {
      const pageData = {
        title: 'Test Page',
        content: 'This is test content',
        author: 'Test Author'
      };

      const response = await request(app)
        .post('/api/pages')
        .send(pageData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.title).toBe(pageData.title);
      expect(response.body.content).toBe(pageData.content);
    });

    it('should validate required fields', async () => {
      const invalidPageData = {
        content: 'Content without title'
      };

      const response = await request(app)
        .post('/api/pages')
        .send(invalidPageData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Application Health', () => {
    it('should respond to health check', async () => {
      await request(app)
        .get('/')
        .expect(200);
    });

    it('should serve static assets', async () => {
      await request(app)
        .get('/stylesheets/style.css')
        .expect(200);
    });
  });
});