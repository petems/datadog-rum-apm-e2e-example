const request = require('supertest');
const express = require('express');
const router = require('./api-pages');
const managePages = require('../controllers/manage-pages');
const logger = require('../logger');

jest.mock('../controllers/manage-pages');
jest.mock('../logger');
jest.mock('dd-trace', () => ({
  trace: jest.fn((name, fn) => fn()),
  wrap: jest.fn((name, fn) => fn),
}));

const app = express();
app.use('/api/page', router);

describe('API Pages Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/page', () => {
    it('should return all pages successfully', async () => {
      const mockPages = [
        { id: 1, title: 'Page 1', body: 'Content 1' },
        { id: 2, title: 'Page 2', body: 'Content 2' },
      ];
      managePages.getAllPages.mockResolvedValue(mockPages);

      const response = await request(app).get('/api/page');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPages);
      expect(managePages.getAllPages).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        { headers: expect.any(Object) },
        'API Requesting All Pages'
      );
    });

    it('should handle errors when getting all pages', async () => {
      const errorMessage = 'Database connection failed';
      managePages.getAllPages.mockRejectedValue(new Error(errorMessage));

      const response = await request(app).get('/api/page');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server error' });
      expect(logger.error).toHaveBeenCalledWith(
        { error: errorMessage },
        'Error getting all pages'
      );
    });
  });

  describe('POST /api/page', () => {
    it('should create a new page successfully', async () => {
      const newPage = {
        id: 1,
        title: 'New Page',
        body: 'New Content',
        createdDate: Date.now(),
        updatedDate: Date.now(),
      };
      const requestBody = {
        title: 'New Page',
        content: 'New Content',
        author: 'John Doe',
      };

      managePages.createPage.mockResolvedValue(newPage);

      const response = await request(app)
        .post('/api/page')
        .send(requestBody)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body).toEqual(newPage);
      expect(managePages.createPage).toHaveBeenCalledWith({
        title: 'New Page',
        body: 'New Content',
        author: 'John Doe',
      });
      expect(logger.info).toHaveBeenCalledWith(
        { headers: expect.any(Object) },
        'API Posting New Page'
      );
      expect(logger.info).toHaveBeenCalledWith('Finished creating page');
    });

    it('should return 400 when title is missing', async () => {
      const requestBody = {
        content: 'New Content',
        author: 'John Doe',
      };

      const response = await request(app)
        .post('/api/page')
        .send(requestBody)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Title and content are required',
      });
      expect(managePages.createPage).not.toHaveBeenCalled();
    });

    it('should return 400 when content is missing', async () => {
      const requestBody = {
        title: 'New Page',
        author: 'John Doe',
      };

      const response = await request(app)
        .post('/api/page')
        .send(requestBody)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Title and content are required',
      });
      expect(managePages.createPage).not.toHaveBeenCalled();
    });

    it('should handle errors when creating page', async () => {
      const errorMessage = 'Database error';
      const requestBody = {
        title: 'New Page',
        content: 'New Content',
        author: 'John Doe',
      };

      managePages.createPage.mockRejectedValue(new Error(errorMessage));

      const response = await request(app)
        .post('/api/page')
        .send(requestBody)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server error' });
      expect(logger.error).toHaveBeenCalledWith(
        { error: errorMessage },
        'Error creating page'
      );
    });

    it('should handle URL-encoded form data', async () => {
      const newPage = { id: 1, title: 'Form Page', body: 'Form Content' };

      managePages.createPage.mockResolvedValue(newPage);

      const response = await request(app)
        .post('/api/page')
        .send('title=Form Page&content=Form Content')
        .set('Content-Type', 'application/x-www-form-urlencoded');

      expect(response.status).toBe(201);
      expect(managePages.createPage).toHaveBeenCalledWith({
        title: 'Form Page',
        body: 'Form Content',
        author: undefined,
      });
    });
  });
});
