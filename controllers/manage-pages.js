const pageModel = require('../mongo/models/pageModel');
const logger = require('../logger');
const tracer = require('dd-trace');

let getAllPages = async () => {
  const pages = await pageModel.find({});
  logger.info(`API Successfully found all pages, count: ${pages.length}`);
  return pages;
};

let getPageById = async page_id => {
  // Ensure numeric lookup to avoid implicit casting or operator injection
  const numericId = Number(page_id);
  const pages = await pageModel.find({ id: numericId });

  if (pages.length === 0) {
    logger.warn(`Page: ${page_id} not found`);
  } else {
    logger.info({ page: pages }, 'API Successfully found page');
  }

  return pages;
};

let createPage = async body => {
  // Setup Manual Tracing using await tracer.trace
  const id = await tracer.trace('manage-pages.getNextPageId', async () => {
    return await getNextPageId();
  });
  const result = await tracer.trace('manage-pages.savePage', async () => {
    return await savePage(id, body.title, body.body);
  });

  // Original without Tracing
  //let id = await getNextPageId();
  //let result = await savePage(id, body.title, body.body);

  return result;
};

let deletePageById = async page_id => {
  const numericId = Number(page_id);
  const result = await pageModel.deleteOne({ id: numericId });
  if (result && result.deletedCount > 0) {
    logger.info(`Successful delete of page: ${page_id}`);
    return true;
  }
  logger.warn({ page_id }, 'No document deleted');
  return false;
};

let updatePage = async (pageModel, body) => {
  const curDate = Date.now();
  pageModel.title = body.title;
  pageModel.body = body.body;
  pageModel.updatedDate = curDate;

  logger.info({ page: pageModel }, 'Updating Article article');

  await pageModel.save();

  logger.info({ page: pageModel }, 'Successful page saving');
  return pageModel;
};

async function savePage(id, title, body) {
  const curDate = Date.now();

  // Create new page
  const newPage = pageModel({
    id,
    title,
    body,
    createdDate: curDate,
    updatedDate: curDate,
  });

  logger.info({ page: newPage }, 'Creating article');

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
