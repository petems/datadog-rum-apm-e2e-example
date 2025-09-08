const mongoose = require('mongoose');
const mockingoose = require('mockingoose');
const PageModel = require('./pageModel');

// Create a dummy ObjectId for testing author field
const dummyAuthorId = new mongoose.Types.ObjectId();

describe('PageModel', () => {
  beforeEach(() => {
    mockingoose.resetAll();
  });

  describe('Page Schema', () => {
    it('should create a page with all fields', async () => {
      const pageData = {
        id: 1,
        title: 'Test Page',
        body: 'This is test content',
        hasAttachment: false,
        createdDate: new Date(),
        updatedDate: new Date(),
        author: dummyAuthorId,
      };

      mockingoose(PageModel).toReturn(pageData, 'save');
      const savedPage = await PageModel.create(pageData);

      expect(savedPage.id).toBe(1);
      expect(savedPage.title).toBe('Test Page');
      expect(savedPage.body).toBe('This is test content');
      expect(savedPage.hasAttachment).toBe(false);
      expect(savedPage.createdDate).toBeInstanceOf(Date);
      expect(savedPage.updatedDate).toBeInstanceOf(Date);
    });

    it('should create a page with minimal required fields', async () => {
      const pageData = {
        id: 2,
        title: 'Minimal Page',
        body: 'Minimal content',
        author: dummyAuthorId,
      };

      mockingoose(PageModel).toReturn(pageData, 'save');
      const savedPage = await PageModel.create(pageData);

      expect(savedPage.id).toBe(2);
      expect(savedPage.title).toBe('Minimal Page');
      expect(savedPage.body).toBe('Minimal content');
    });

    it('should allow pages without id field', async () => {
      const pageData = {
        title: 'No ID Page',
        body: 'Content without ID',
        author: dummyAuthorId,
      };

      mockingoose(PageModel).toReturn(pageData, 'save');
      const savedPage = await PageModel.create(pageData);

      expect(savedPage.title).toBe('No ID Page');
      expect(savedPage.body).toBe('Content without ID');
    });

    it('should find pages by id', async () => {
      const doc = {
        id: 100,
        title: 'Findable Page',
        body: 'Can be found by id',
        author: dummyAuthorId,
      };

      mockingoose(PageModel).toReturn([doc], 'find');
      const foundPages = await PageModel.find({ id: 100 });

      expect(foundPages).toHaveLength(1);
      expect(foundPages[0].title).toBe('Findable Page');
    });

    it('should update a page', async () => {
      mockingoose(PageModel).toReturn(
        { acknowledged: true, modifiedCount: 1 },
        'updateOne'
      );

      const res = await PageModel.updateOne(
        { id: 200 },
        { title: 'Updated Title', body: 'Updated Content' }
      );

      expect(res.modifiedCount).toBe(1);
    });

    it('should delete a page by id', async () => {
      mockingoose(PageModel).toReturn({ deletedCount: 1 }, 'deleteOne');

      const res = await PageModel.deleteOne({ id: 300 });

      expect(res.deletedCount).toBe(1);
    });

    it('should find multiple pages', async () => {
      const docs = [
        {
          id: 401,
          title: 'Page One',
          body: 'Content One',
          author: dummyAuthorId,
        },
        {
          id: 402,
          title: 'Page Two',
          body: 'Content Two',
          author: dummyAuthorId,
        },
      ];

      mockingoose(PageModel).toReturn(docs, 'find');
      const allPages = await PageModel.find({});
      expect(allPages).toHaveLength(2);

      mockingoose(PageModel).toReturn(docs, 'find');
      const sortedPages = await PageModel.find({}).sort({ id: 1 });
      expect(sortedPages[0].id).toBe(401);
      expect(sortedPages[1].id).toBe(402);
    });

    it('should handle boolean fields correctly', async () => {
      const withAttachment = {
        id: 500,
        title: 'Page with attachment',
        body: 'Has attachment',
        hasAttachment: true,
        author: dummyAuthorId,
      };

      const withoutAttachment = {
        id: 501,
        title: 'Page without attachment',
        body: 'No attachment',
        hasAttachment: false,
        author: dummyAuthorId,
      };

      mockingoose(PageModel).toReturn(withAttachment, 'findOne');
      const foundWith = await PageModel.findOne({ id: 500 });

      mockingoose(PageModel).toReturn(withoutAttachment, 'findOne');
      const foundWithout = await PageModel.findOne({ id: 501 });

      expect(foundWith.hasAttachment).toBe(true);
      expect(foundWithout.hasAttachment).toBe(false);
    });
  });
});
