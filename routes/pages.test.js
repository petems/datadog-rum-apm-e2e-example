const request = require('supertest');
const app = require('../app');
const logger = require('../logger');

// Mock the logger to reduce noise in tests
jest.mock('../logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

// Mock the fetch function
global.fetch = jest.fn();

describe('Pages Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset fetch mock for each test
    global.fetch.mockReset();
  });

  describe('GET /:page_id', () => {
    it('should render page when valid page_id is provided', async () => {
      const mockPage = {
        id: 1,
        title: 'Test Page',
        body: 'Test body',
        createdDate: '2023-01-01',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockPage],
      });

      const response = await request(app).get('/page/1').expect(200);

      expect(response.text).toContain('Test Page');
      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/page/1');
    });

    it('should return 400 for invalid page_id (non-numeric)', async () => {
      const response = await request(app).get('/page/abc').expect(400);

      expect(response.text).toContain('Invalid page ID');
      expect(logger.warn).toHaveBeenCalledWith(
        { page_id: 'abc' },
        'Invalid page_id provided, denied'
      );
    });

    it('should return 400 for invalid page_id (with special characters)', async () => {
      const response = await request(app)
        .get('/page/1;drop%20table%20pages')
        .expect(400);

      expect(response.text).toContain('Invalid page ID');
    });

    it('should render 404 error when page not found', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const response = await request(app).get('/page/999').expect(404);

      expect(response.text).toContain('Page not found');
      expect(logger.warn).toHaveBeenCalledWith(
        { page_id: '999' },
        'GET Page: 999 not found'
      );
    });

    it('should render error for unexpected status codes', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const response = await request(app).get('/page/1').expect(500);

      expect(response.text).toContain('Unexpected Error');
      expect(logger.error).toHaveBeenCalledWith('Unexpected output: 500');
    });

    it('should render error when fetch throws an exception', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const response = await request(app).get('/page/1').expect(500);

      expect(response.text).toContain('Internal Server Error');
      expect(logger.error).toHaveBeenCalledWith('Error: Network error');
    });

    it('should handle missing createdDate gracefully', async () => {
      const mockPage = {
        id: 1,
        title: 'Test Page',
        body: 'Test body',
        // No createdDate
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockPage],
      });

      const response = await request(app).get('/page/1').expect(200);

      expect(response.text).toContain('Test Page');
    });
  });

  describe('GET / (new page)', () => {
    it('should render new page form', async () => {
      const response = await request(app).get('/page/').expect(200);

      expect(response.text).toContain('Create New Page');
      expect(logger.info).toHaveBeenCalledWith('Requesting Blank URL: /');
    });
  });

  describe('GET /:page_id/edit', () => {
    it('should render edit page when valid page_id is provided', async () => {
      const mockPage = {
        id: 1,
        title: 'Test Page',
        body: 'Test body',
        createdDate: '2023-01-01',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockPage],
      });

      const response = await request(app).get('/page/1/edit').expect(200);

      expect(response.text).toContain('Edit Page');
      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/page/1');
    });

    it('should return 400 for invalid page_id in edit route', async () => {
      const response = await request(app).get('/page/abc/edit').expect(400);

      expect(response.text).toContain('Invalid page ID');
      expect(logger.warn).toHaveBeenCalledWith(
        { page_id: 'abc' },
        'Invalid page_id provided, denied'
      );
    });

    it('should render 404 error when edit page not found', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const response = await request(app).get('/page/999/edit').expect(404);

      expect(response.text).toContain('Page not found');
      expect(logger.warn).toHaveBeenCalledWith(
        { page_id: '999' },
        'GET Edit Page: 999 not found'
      );
    });

    it('should render error for unexpected status codes in edit route', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const response = await request(app).get('/page/1/edit').expect(500);

      expect(response.text).toContain('Unexpected Error');
      expect(logger.error).toHaveBeenCalledWith('Unexpected output: 500');
    });

    it('should render error when fetch throws an exception in edit route', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const response = await request(app).get('/page/1/edit').expect(500);

      expect(response.text).toContain('Internal Server Error');
      expect(logger.error).toHaveBeenCalledWith('Error: Network error');
    });
  });
});
