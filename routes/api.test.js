const request = require('supertest');
const express = require('express');
const router = require('./api');

jest.mock('../controllers/manage-pages');
jest.mock('../logger');

const app = express();
app.use('/api/page', router);

const managePages = require('../controllers/manage-pages');

describe('API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /:page_id', () => {
    it('should return page when found', async () => {
      const mockPage = { id: 1, title: 'Test Page' };
      managePages.getPageById.mockResolvedValue([mockPage]);

      const response = await request(app).get('/api/page/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([mockPage]);
    });

    it('should return 404 when page not found', async () => {
      managePages.getPageById.mockResolvedValue([]);

      const response = await request(app).get('/api/page/999');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /', () => {
    it('should create new page', async () => {
      const newPage = { id: 1, title: 'New Page' };
      managePages.createPage.mockResolvedValue(newPage);

      const response = await request(app)
        .post('/api/page/')
        .send({ title: 'New Page', body: 'Content' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(newPage);
    });
  });

  describe('DELETE /:page_id', () => {
    it('should delete page successfully', async () => {
      managePages.deletePageById.mockResolvedValue(true);

      const response = await request(app).delete('/api/page/1');

      expect(response.status).toBe(200);
    });
  });
});
