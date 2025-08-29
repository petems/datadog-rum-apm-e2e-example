const {
  createPage,
  deletePageById,
  getAllPages,
  getPageById,
  updatePage,
} = require('./manage-pages');
const pageModel = require('../mongo/models/pageModel');
const logger = require('../logger');

jest.mock('../mongo/models/pageModel');
jest.mock('../logger');
jest.mock('dd-trace', () => ({
  trace: jest.fn((name, fn) => fn()),
  wrap: jest.fn((name, fn) => fn),
}));

describe('manage-pages controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllPages', () => {
    it('should return all pages and log success', async () => {
      const mockPages = [
        { id: 1, title: 'Page 1', body: 'Content 1' },
        { id: 2, title: 'Page 2', body: 'Content 2' },
      ];
      pageModel.find.mockResolvedValue(mockPages);

      const result = await getAllPages();

      expect(pageModel.find).toHaveBeenCalledWith({});
      expect(logger.info).toHaveBeenCalledWith(
        `API Successfully found all pages, count: ${mockPages.length}`
      );
      expect(result).toEqual(mockPages);
    });

    it('should handle empty results', async () => {
      pageModel.find.mockResolvedValue([]);

      const result = await getAllPages();

      expect(result).toEqual([]);
      expect(logger.info).toHaveBeenCalledWith(
        'API Successfully found all pages, count: 0'
      );
    });
  });

  describe('getPageById', () => {
    it('should return page and log success when found', async () => {
      const mockPage = { id: 1, title: 'Page 1', body: 'Content 1' };
      pageModel.find.mockResolvedValue([mockPage]);

      const result = await getPageById(1);

      expect(pageModel.find).toHaveBeenCalledWith({ id: 1 });
      expect(logger.info).toHaveBeenCalledWith(
        { page: [mockPage] },
        'API Successfully found page'
      );
      expect(result).toEqual([mockPage]);
    });

    it('should log warning when page not found', async () => {
      pageModel.find.mockResolvedValue([]);

      const result = await getPageById(999);

      expect(logger.warn).toHaveBeenCalledWith('Page: 999 not found');
      expect(result).toEqual([]);
    });
  });

  describe('deletePageById', () => {
    it('should delete page and log success', async () => {
      pageModel.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const result = await deletePageById(1);

      expect(pageModel.deleteOne).toHaveBeenCalledWith({ id: 1 });
      expect(logger.info).toHaveBeenCalledWith('Successful delete of page: 1');
      expect(result).toBe(true);
    });
  });

  describe('updatePage', () => {
    it('should update page properties and save', async () => {
      const mockPage = {
        id: 1,
        title: 'Old Title',
        body: 'Old Body',
        save: jest.fn().mockResolvedValue(true),
      };
      const updateBody = { title: 'New Title', body: 'New Body' };

      const result = await updatePage(mockPage, updateBody);

      expect(mockPage.title).toBe('New Title');
      expect(mockPage.body).toBe('New Body');
      expect(mockPage.updatedDate).toBeDefined();
      expect(mockPage.save).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledTimes(2);
      expect(result).toBe(mockPage);
    });
  });

  describe('createPage', () => {
    beforeEach(() => {
      const mockQuery = {
        limit: jest.fn().mockResolvedValue([{ id: 5 }]),
      };
      pageModel.find.mockReturnValue(mockQuery);
      pageModel.mockImplementation(function (data) {
        return {
          ...data,
          save: jest.fn().mockResolvedValue(true),
        };
      });
    });

    it('should create new page with generated ID', async () => {
      const body = { title: 'New Page', body: 'New Content' };

      const result = await createPage(body);

      expect(pageModel.find).toHaveBeenCalledWith(
        { id: { $ne: '' } },
        'id',
        { sort: { id: 'descending' } }
      );
      expect(pageModel).toHaveBeenCalledWith({
        id: 6,
        title: 'New Page',
        body: 'New Content',
        createdDate: expect.any(Number),
        updatedDate: expect.any(Number),
      });
      expect(result.save).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledTimes(3);
    });

    it('should use ID 1 when no pages exist', async () => {
      const mockQuery = {
        limit: jest.fn().mockResolvedValue([]),
      };
      pageModel.find.mockReturnValue(mockQuery);
      const body = { title: 'First Page', body: 'First Content' };

      await createPage(body);

      expect(pageModel).toHaveBeenCalledWith({
        id: 1,
        title: 'First Page',
        body: 'First Content',
        createdDate: expect.any(Number),
        updatedDate: expect.any(Number),
      });
    });

  });
});