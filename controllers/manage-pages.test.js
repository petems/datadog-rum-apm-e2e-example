const {
  createPage,
  deletePageById,
  getAllPages,
  getPageById,
  updatePage,
} = require('./manage-pages');
const pageModel = require('../mongo/models/pageModel');
const mockingoose = require('mockingoose');
const logger = require('../logger');

jest.mock('../logger');
jest.mock('dd-trace', () => ({
  trace: jest.fn((name, fn) => fn()),
  wrap: jest.fn((name, fn) => fn),
}));

// Mock user objects for testing
const mockUser = {
  id: '507f1f77bcf86cd799439011',
  email: 'test@example.com',
  role: 'user',
};

const mockAdminUser = {
  id: '507f1f77bcf86cd799439012',
  email: 'admin@example.com',
  role: 'admin',
};

describe('manage-pages controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockingoose.resetAll();
  });

  describe('getAllPages', () => {
    it('should return all pages and log success', async () => {
      const mockPages = [
        { id: 1, title: 'Page 1', body: 'Content 1' },
        { id: 2, title: 'Page 2', body: 'Content 2' },
      ];
      const findSpy = jest.spyOn(pageModel, 'find');
      mockingoose(pageModel).toReturn(mockPages, 'find');

      const result = await getAllPages(mockAdminUser);

      expect(findSpy).toHaveBeenCalledWith({});
      expect(logger.info).toHaveBeenCalledWith(
        `API Successfully found pages, count: ${mockPages.length}, user: ${mockAdminUser.email}, role: ${mockAdminUser.role}`
      );
      expect(result).toHaveLength(mockPages.length);
      expect(result[0]).toMatchObject(mockPages[0]);
      expect(result[1]).toMatchObject(mockPages[1]);
      findSpy.mockRestore();
    });

    it('should handle empty results', async () => {
      const findSpy = jest.spyOn(pageModel, 'find');
      mockingoose(pageModel).toReturn([], 'find');

      const result = await getAllPages(mockUser);

      expect(findSpy).toHaveBeenCalledWith({ author: mockUser.id });
      expect(result).toEqual([]);
      expect(logger.info).toHaveBeenCalledWith(
        `API Successfully found pages, count: 0, user: ${mockUser.email}, role: ${mockUser.role}`
      );
      findSpy.mockRestore();
    });

    it('should filter pages by user for non-admin users', async () => {
      const mockPages = [{ id: 1, title: 'User Page', body: 'User Content' }];
      const findSpy = jest.spyOn(pageModel, 'find');
      mockingoose(pageModel).toReturn(mockPages, 'find');

      const result = await getAllPages(mockUser);

      expect(findSpy).toHaveBeenCalledWith({ author: mockUser.id });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject(mockPages[0]);
      findSpy.mockRestore();
    });
  });

  describe('getPageById', () => {
    it('should return page and log success when found', async () => {
      const mockPage = { id: 1, title: 'Page 1', body: 'Content 1' };
      const findSpy = jest.spyOn(pageModel, 'find');
      mockingoose(pageModel).toReturn([mockPage], 'find');

      const result = await getPageById(1, mockAdminUser);

      expect(findSpy).toHaveBeenCalledWith({ id: 1 });
      expect(logger.info).toHaveBeenCalledWith(
        { page: expect.arrayContaining([expect.objectContaining(mockPage)]) },
        'API Successfully found page'
      );
      expect(result[0]).toMatchObject(mockPage);
      findSpy.mockRestore();
    });

    it('should log warning when page not found', async () => {
      const findSpy = jest.spyOn(pageModel, 'find');
      mockingoose(pageModel).toReturn([], 'find');

      const result = await getPageById(999, mockUser);

      expect(findSpy).toHaveBeenCalledWith({
        id: 999,
        author: mockUser.id,
      });
      expect(logger.warn).toHaveBeenCalledWith(
        'Page: 999 not found or not accessible by user: test@example.com'
      );
      expect(result).toEqual([]);
      findSpy.mockRestore();
    });

    it('should filter pages by user for non-admin users', async () => {
      const findSpy = jest.spyOn(pageModel, 'find');
      mockingoose(pageModel).toReturn([], 'find');

      await getPageById(1, mockUser);

      expect(findSpy).toHaveBeenCalledWith({
        id: 1,
        author: mockUser.id,
      });
      findSpy.mockRestore();
    });
  });

  describe('deletePageById', () => {
    it('should delete page and log success', async () => {
      const deleteSpy = jest.spyOn(pageModel, 'deleteOne');
      mockingoose(pageModel).toReturn({ deletedCount: 1 }, 'deleteOne');

      const result = await deletePageById(1, mockUser);

      expect(deleteSpy).toHaveBeenCalledWith({
        id: 1,
        author: mockUser.id,
      });
      expect(logger.info).toHaveBeenCalledWith(
        'Successful delete of page: 1 by user: test@example.com'
      );
      expect(result).toBe(true);
      deleteSpy.mockRestore();
    });

    it('should throw error when user is not provided', async () => {
      await expect(deletePageById(1)).rejects.toThrow(
        'User authentication required to delete pages'
      );
    });

    it('should throw error when page not found or access denied', async () => {
      mockingoose(pageModel).toReturn({ deletedCount: 0 }, 'deleteOne');

      await expect(deletePageById(1, mockUser)).rejects.toThrow(
        "Page 1 not found or you don't have permission to delete it"
      );
    });

    it('should allow admin to delete any page', async () => {
      const deleteSpy = jest.spyOn(pageModel, 'deleteOne');
      mockingoose(pageModel).toReturn({ deletedCount: 1 }, 'deleteOne');

      const result = await deletePageById(1, mockAdminUser);

      expect(deleteSpy).toHaveBeenCalledWith({ id: 1 });
      expect(result).toBe(true);
      deleteSpy.mockRestore();
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
      mockingoose.resetAll();
    });

    it('should create new page with generated ID', async () => {
      const body = { title: 'New Page', body: 'New Content' };
      const findSpy = jest.spyOn(pageModel, 'find');
      mockingoose(pageModel).toReturn([{ id: 5 }], 'find');
      mockingoose(pageModel).toReturn(doc => doc, 'save');

      const result = await createPage(body, mockUser);

      expect(findSpy).toHaveBeenCalledWith({ id: { $ne: '' } }, 'id', {
        sort: { id: 'descending' },
      });
      const obj = result.toObject();
      expect(obj).toMatchObject({
        id: 6,
        title: 'New Page',
        body: 'New Content',
      });
      expect(obj.author.toString()).toBe(mockUser.id);
      expect(logger.info).toHaveBeenCalledWith(
        { page: expect.any(Object) },
        `Creating page by author: ${mockUser.id}`
      );
      findSpy.mockRestore();
    });

    it('should throw error when user is not provided', async () => {
      const body = { title: 'New Page', body: 'New Content' };

      await expect(createPage(body)).rejects.toThrow(
        'User authentication required to create pages'
      );
    });

    it('should use ID 1 when no pages exist', async () => {
      const findSpy = jest.spyOn(pageModel, 'find');
      mockingoose(pageModel).toReturn([], 'find');
      mockingoose(pageModel).toReturn(doc => doc, 'save');

      await createPage(
        { title: 'First Page', body: 'First Content' },
        mockUser
      );

      expect(findSpy).toHaveBeenCalledWith({ id: { $ne: '' } }, 'id', {
        sort: { id: 'descending' },
      });
      expect(logger.info).toHaveBeenCalledWith(
        { page: expect.any(Object) },
        `Creating page by author: ${mockUser.id}`
      );
      findSpy.mockRestore();
    });
  });
});
