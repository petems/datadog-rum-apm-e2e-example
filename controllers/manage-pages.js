const pageModel = require('../mongo/models/pageModel');
const logger = require('../logger');
const tracer = require('dd-trace');

let getAllPages = async (user = null) => {
  const query = {};

  // Regular users can only see their own pages
  // Admins can see all pages
  if (user && user.role !== 'admin') {
    query.author = user.id;
  }

  const pages = await pageModel.find(query).populate('author', 'email');
  logger.info(
    `API Successfully found pages, count: ${pages.length}, user: ${user?.email || 'anonymous'}, role: ${user?.role || 'none'}`
  );
  return pages;
};

let getPageById = async (page_id, user = null) => {
  const query = { id: page_id };

  // Regular users can only access their own pages
  // Admins can access any page
  if (user && user.role !== 'admin') {
    query.author = user.id;
  }

  const pages = await pageModel.find(query).populate('author', 'email');

  if (pages.length === 0) {
    logger.warn(
      `Page: ${page_id} not found or not accessible by user: ${user?.email || 'anonymous'}`
    );
  } else {
    logger.info({ page: pages }, 'API Successfully found page');
  }

  return pages;
};

let createPage = async (body, user) => {
  if (!user) {
    throw new Error('User authentication required to create pages');
  }

  const pageBody = body.body || body.content;
  if (!body.title || !pageBody) {
    throw new Error('Title and content are required');
  }

  // Setup Manual Tracing using await tracer.trace
  const id = await tracer.trace('manage-pages.getNextPageId', async () => {
    return await getNextPageId();
  });
  const result = await tracer.trace('manage-pages.savePage', async () => {
    return await savePage(id, body.title, pageBody, user.id);
  });

  // Original without Tracing
  //let id = await getNextPageId();
  //let result = await savePage(id, body.title, pageBody, user.id);

  return result;
};

let deletePageById = async (page_id, user) => {
  if (!user) {
    throw new Error('User authentication required to delete pages');
  }

  const query = { id: page_id };

  // Regular users can only delete their own pages
  // Admins can delete any page
  if (user.role !== 'admin') {
    query.author = user.id;
  }

  const result = await pageModel.deleteOne(query);

  if (result.deletedCount === 0) {
    throw new Error(
      `Page ${page_id} not found or you don't have permission to delete it`
    );
  }

  logger.info(`Successful delete of page: ${page_id} by user: ${user.email}`);
  return true;
};

let updatePage = async (pageModel, body, user) => {
  if (!user) {
    throw new Error('User authentication required to update pages');
  }

  // Regular users can only update their own pages
  // Admins can update any page
  if (user.role !== 'admin' && pageModel.author.toString() !== user.id) {
    throw new Error('You can only update your own pages');
  }

  const curDate = Date.now();
  pageModel.title = body.title;
  pageModel.body = body.content || body.body; // Support both 'content' and 'body' fields
  pageModel.updatedDate = curDate;

  logger.info({ page: pageModel }, `Updating page by user: ${user.email}`);

  await pageModel.save();

  logger.info({ page: pageModel }, 'Successful page saving');
  return pageModel;
};

async function savePage(id, title, body, authorId) {
  const curDate = Date.now();

  // Create new page
  const newPage = pageModel({
    id,
    title,
    body,
    author: authorId,
    createdDate: curDate,
    updatedDate: curDate,
  });

  logger.info({ page: newPage }, `Creating page by author: ${authorId}`);

  await newPage.save();

  logger.info({ page: newPage }, 'Successful page saving');
  return newPage;
}

async function getNextPageId() {
  // Get Latest ID to get 'next' ID
  // TODO: why is this throwing NotFoundError that is bypassing the error handling
  try {
    const latestPage = await pageModel
      .find({ id: { $ne: '' } }, 'id', { sort: { id: 'descending' } })
      .limit(1);

    const newId = latestPage.length === 0 ? 1 : latestPage[0].id + 1;
    logger.info(`No page id provided, using id: ${newId}`);
    return newId;
  } catch (e) {
    logger.error(`Exception when getting next page id: ${e}`);
    throw e;
  }
}

// Setup Manual Tracing using the wrapper
createPage = tracer.wrap('manage-pages.createPage', createPage);
deletePageById = tracer.wrap('manage-pages.deletePageById', deletePageById);
getAllPages = tracer.wrap('manage-pages.getAllPages', getAllPages);
getPageById = tracer.wrap('manage-pages.getPageById', getPageById);
updatePage = tracer.wrap('manage-pages.updatePage', updatePage);

module.exports = {
  createPage,
  deletePageById,
  getAllPages,
  getPageById,
  updatePage,
};
