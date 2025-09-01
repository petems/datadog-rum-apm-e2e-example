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

// Mock user objects for testing
const mockUser = {
  id: 'user123',
  email: 'test@example.com',
  role: 'user',
};

const mockAdminUser = {
  id: 'admin456',
  email: 'admin@example.com',
  role: 'admin',
};

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
      const mockQueryResult = {
        populate: jest.fn().mockResolvedValue(mockPages),
      };
      pageModel.find.mockReturnValue(mockQueryResult);

      const result = await getAllPages(mockAdminUser);

      expect(pageModel.find).toHaveBeenCalledWith({});
      expect(mockQueryResult.populate).toHaveBeenCalledWith('author', 'email');
      expect(logger.info).toHaveBeenCalledWith(
        `API Successfully found pages, count: ${mockPages.length}, user: ${mockAdminUser.email}, role: ${mockAdminUser.role}`
      );
      expect(result).toEqual(mockPages);
    });

    it('should handle empty results', async () => {
      const mockQueryResult = {
        populate: jest.fn().mockResolvedValue([]),
      };
      pageModel.find.mockReturnValue(mockQueryResult);

      const result = await getAllPages(mockUser);

      expect(pageModel.find).toHaveBeenCalledWith({ author: mockUser.id });
      expect(result).toEqual([]);
      expect(logger.info).toHaveBeenCalledWith(
        `API Successfully found pages, count: 0, user: ${mockUser.email}, role: ${mockUser.role}`
      );
    });

    it('should filter pages by user for non-admin users', async () => {
      const mockPages = [{ id: 1, title: 'User Page', body: 'User Content' }];
      const mockQueryResult = {
        populate: jest.fn().mockResolvedValue(mockPages),
      };
      pageModel.find.mockReturnValue(mockQueryResult);

      const result = await getAllPages(mockUser);

      expect(pageModel.find).toHaveBeenCalledWith({ author: mockUser.id });
      expect(mockQueryResult.populate).toHaveBeenCalledWith('author', 'email');
      expect(result).toEqual(mockPages);
    });
  });

  describe('getPageById', () => {
    it('should return page and log success when found', async () => {
      const mockPage = { id: 1, title: 'Page 1', body: 'Content 1' };
      const mockQueryResult = {
        populate: jest.fn().mockResolvedValue([mockPage]),
      };
      pageModel.find.mockReturnValue(mockQueryResult);

      const result = await getPageById(1, mockAdminUser);

      expect(pageModel.find).toHaveBeenCalledWith({ id: 1 });
      expect(mockQueryResult.populate).toHaveBeenCalledWith('author', 'email');
      expect(logger.info).toHaveBeenCalledWith(
        { page: [mockPage] },
        'API Successfully found page'
      );
      expect(result).toEqual([mockPage]);
    });

    it('should log warning when page not found', async () => {
      const mockQueryResult = {
        populate: jest.fn().mockResolvedValue([]),
      };
      pageModel.find.mockReturnValue(mockQueryResult);

      const result = await getPageById(999, mockUser);

      expect(pageModel.find).toHaveBeenCalledWith({
        id: 999,
        author: mockUser.id,
      });
      expect(logger.warn).toHaveBeenCalledWith(
        'Page: 999 not found or not accessible by user: test@example.com'
      );
      expect(result).toEqual([]);
    });

    it('should filter pages by user for non-admin users', async () => {
      const mockQueryResult = {
        populate: jest.fn().mockResolvedValue([]),
      };
      pageModel.find.mockReturnValue(mockQueryResult);

      await getPageById(1, mockUser);

      expect(pageModel.find).toHaveBeenCalledWith({
        id: 1,
        author: mockUser.id,
      });
    });
  });

  describe('deletePageById', () => {
    it('should delete page and log success', async () => {
      pageModel.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const result = await deletePageById(1, mockUser);

      expect(pageModel.deleteOne).toHaveBeenCalledWith({
        id: 1,
        author: mockUser.id,
      });
      expect(logger.info).toHaveBeenCalledWith(
        'Successful delete of page: 1 by user: test@example.com'
      );
      expect(result).toBe(true);
    });

    it('should throw error when user is not provided', async () => {
      await expect(deletePageById(1)).rejects.toThrow(
        'User authentication required to delete pages'
      );
    });

    it('should throw error when page not found or access denied', async () => {
      pageModel.deleteOne.mockResolvedValue({ deletedCount: 0 });

      await expect(deletePageById(1, mockUser)).rejects.toThrow(
        "Page 1 not found or you don't have permission to delete it"
      );
    });

    it('should allow admin to delete any page', async () => {
      pageModel.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const result = await deletePageById(1, mockAdminUser);

      expect(pageModel.deleteOne).toHaveBeenCalledWith({ id: 1 });
      expect(result).toBe(true);
    });
  });

  describe('updatePage', () => {
    it('should update page properties and save', async () => {
      const mockPage = {
        id: 1,
        title: 'Old Title',
        body: 'Old Body',
        author: mockUser.id,
        save: jest.fn().mockResolvedValue(true),
      };
      const updateBody = { title: 'New Title', body: 'New Body' };

      const result = await updatePage(mockPage, updateBody, mockUser);

      expect(mockPage.title).toBe('New Title');
      expect(mockPage.body).toBe('New Body');
      expect(mockPage.updatedDate).toBeDefined();
      expect(mockPage.save).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        { page: mockPage },
        'Updating page by user: test@example.com'
      );
      expect(result).toBe(mockPage);
    });

    it('should throw error when user is not provided', async () => {
      const mockPage = { id: 1, title: 'Title', body: 'Body' };
      const updateBody = { title: 'New Title', body: 'New Body' };

      await expect(updatePage(mockPage, updateBody)).rejects.toThrow(
        'User authentication required to update pages'
      );
    });

    it('should throw error when user tries to update someone elses page', async () => {
      const mockPage = {
        id: 1,
        title: 'Old Title',
        body: 'Old Body',
        author: 'otherId',
      };
      const updateBody = { title: 'New Title', body: 'New Body' };

      await expect(updatePage(mockPage, updateBody, mockUser)).rejects.toThrow(
        'You can only update your own pages'
      );
    });

    it('should allow admin to update any page', async () => {
      const mockPage = {
        id: 1,
        title: 'Old Title',
        body: 'Old Body',
        author: 'otherId',
        save: jest.fn().mockResolvedValue(true),
      };
      const updateBody = { title: 'New Title', body: 'New Body' };

      const result = await updatePage(mockPage, updateBody, mockAdminUser);

      expect(mockPage.title).toBe('New Title');
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

      const result = await createPage(body, mockUser);

      expect(pageModel.find).toHaveBeenCalledWith({ id: { $ne: '' } }, 'id', {
        sort: { id: 'descending' },
      });
      expect(pageModel).toHaveBeenCalledWith({
        id: 6,
        title: 'New Page',
        body: 'New Content',
        author: mockUser.id,
        createdDate: expect.any(Number),
        updatedDate: expect.any(Number),
      });
      expect(result.save).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        { page: expect.any(Object) },
        'Creating page by author: user123'
      );
    });

    it('should throw error when user is not provided', async () => {
      const body = { title: 'New Page', body: 'New Content' };

      await expect(createPage(body)).rejects.toThrow(
        'User authentication required to create pages'
      );
    });

    it('should use ID 1 when no pages exist', async () => {
      const mockQuery = {
        limit: jest.fn().mockResolvedValue([]),
      };
      pageModel.find.mockReturnValue(mockQuery);
      const body = { title: 'First Page', body: 'First Content' };

      await createPage(body, mockUser);

      expect(pageModel).toHaveBeenCalledWith({
        id: 1,
        title: 'First Page',
        body: 'First Content',
        author: mockUser.id,
        createdDate: expect.any(Number),
        updatedDate: expect.any(Number),
      });
    });
  });
});
