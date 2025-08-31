const mongoose = require('mongoose');
const PageModel = require('./pageModel');

describe('PageModel', () => {
  beforeAll(async () => {
    const url = `mongodb://127.0.0.1/test_datablog`;
    // Deprecated options removed in Mongoose 8 / MongoDB driver v4+
    await mongoose.connect(url);
  });

  beforeEach(async () => {
    await PageModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
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
      };

      const page = new PageModel(pageData);
      const savedPage = await page.save();

      expect(savedPage._id).toBeDefined();
      expect(savedPage.id).toBe(1);
      expect(savedPage.title).toBe('Test Page');
      expect(savedPage.body).toBe('This is test content');
      expect(savedPage.hasAttachment).toBe(false);
      expect(savedPage.createdDate).toBeInstanceOf(Date);
      expect(savedPage.updatedDate).toBeInstanceOf(Date);
    });

    it('should create a page with minimal required fields', async () => {
      const page = new PageModel({
        id: 2,
        title: 'Minimal Page',
        body: 'Minimal content',
      });

      const savedPage = await page.save();

      expect(savedPage._id).toBeDefined();
      expect(savedPage.id).toBe(2);
      expect(savedPage.title).toBe('Minimal Page');
      expect(savedPage.body).toBe('Minimal content');
    });

    it('should allow pages without id field', async () => {
      const page = new PageModel({
        title: 'No ID Page',
        body: 'Content without ID',
      });

      const savedPage = await page.save();

      expect(savedPage._id).toBeDefined();
      expect(savedPage.title).toBe('No ID Page');
      expect(savedPage.body).toBe('Content without ID');
    });

    it('should find pages by id', async () => {
      const testPage = new PageModel({
        id: 100,
        title: 'Findable Page',
        body: 'Can be found by id',
      });
      await testPage.save();

      const foundPages = await PageModel.find({ id: 100 });

      expect(foundPages).toHaveLength(1);
      expect(foundPages[0].title).toBe('Findable Page');
    });

    it('should update a page', async () => {
      const page = new PageModel({
        id: 200,
        title: 'Original Title',
        body: 'Original Content',
        createdDate: new Date(),
      });
      await page.save();

      const updatedDate = new Date();
      await PageModel.updateOne(
        { id: 200 },
        {
          title: 'Updated Title',
          body: 'Updated Content',
          updatedDate,
        }
      );

      const updatedPage = await PageModel.findOne({ id: 200 });
      expect(updatedPage.title).toBe('Updated Title');
      expect(updatedPage.body).toBe('Updated Content');
    });

    it('should delete a page by id', async () => {
      const page = new PageModel({
        id: 300,
        title: 'To Be Deleted',
        body: 'This will be deleted',
      });
      await page.save();

      await PageModel.deleteOne({ id: 300 });

      const deletedPage = await PageModel.findOne({ id: 300 });
      expect(deletedPage).toBeNull();
    });

    it('should find multiple pages', async () => {
      const page1 = new PageModel({
        id: 401,
        title: 'Page One',
        body: 'Content One',
      });
      const page2 = new PageModel({
        id: 402,
        title: 'Page Two',
        body: 'Content Two',
      });

      await page1.save();
      await page2.save();

      const allPages = await PageModel.find({});
      expect(allPages).toHaveLength(2);

      const sortedPages = await PageModel.find({}).sort({ id: 1 });
      expect(sortedPages[0].id).toBe(401);
      expect(sortedPages[1].id).toBe(402);
    });

    it('should handle boolean fields correctly', async () => {
      const pageWithAttachment = new PageModel({
        id: 500,
        title: 'Page with attachment',
        body: 'Has attachment',
        hasAttachment: true,
      });

      const pageWithoutAttachment = new PageModel({
        id: 501,
        title: 'Page without attachment',
        body: 'No attachment',
        hasAttachment: false,
      });

      await pageWithAttachment.save();
      await pageWithoutAttachment.save();

      const withAttachment = await PageModel.findOne({ id: 500 });
      const withoutAttachment = await PageModel.findOne({ id: 501 });

      expect(withAttachment.hasAttachment).toBe(true);
      expect(withoutAttachment.hasAttachment).toBe(false);
    });
  });
});
