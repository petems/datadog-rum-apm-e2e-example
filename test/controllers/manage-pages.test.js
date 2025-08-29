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
    const mongoUri =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/datablog-test';
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
      const response = await request(app).get('/api/pages').expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should handle database errors gracefully', async () => {
      // Mock the Page model's find method to throw an error
      const PageModel = require('../../mongo/models/pageModel');
      const originalFind = PageModel.find;
      PageModel.find = jest.fn().mockImplementation((query, callback) => {
        const error = new Error('Database error');
        if (callback) {
          callback(error);
        }
        return Promise.reject(error);
      });

      const response = await request(app).get('/api/pages').expect(500);

      expect(response.body).toHaveProperty('error');

      // Restore original method
      PageModel.find = originalFind;
    });
  });

  describe('POST /api/pages', () => {
    it('should create a new page with valid data', async () => {
      const pageData = {
        title: 'Test Page',
        content: 'This is test content',
        author: 'Test Author',
      };

      const response = await request(app)
        .post('/api/pages')
        .send(pageData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.title).toBe(pageData.title);
      expect(response.body.body).toBe(pageData.content);
    });

    it('should validate required fields', async () => {
      const invalidPageData = {
        content: 'Content without title',
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
      await request(app).get('/').expect(200);
    });

    it('should serve static assets', async () => {
      await request(app).get('/stylesheets/style.css').expect(200);
    });
  });

  describe('Additional API Coverage', () => {
    it('should handle invalid page creation with missing title and content', async () => {
      const response = await request(app)
        .post('/api/pages')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Title and content are required');
    });

    it('should create page with optional author field', async () => {
      const pageData = {
        title: 'Test Page with Author',
        content: 'This is test content with author',
        author: 'John Doe',
      };

      const response = await request(app)
        .post('/api/pages')
        .send(pageData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.title).toBe(pageData.title);
      expect(response.body.body).toBe(pageData.content);
    });
  });
});
