var pageModel = require('../mongo/models/pageModel');
var logger = require('../logger');
const tracer = require('dd-trace');

var getAllPages = () => {
  return pageModel.find({}, function(err, pages) {
    if(err){
      logger.error('Error encountered' + err);
      throw err;
    } 

    logger.info('API Successfully found all pages, count: ' + pages.length);
    return pages;
  });
}

var getPageById = (page_id) => {
  return pageModel.find({id: page_id}, function(err, pages) {
    if(err){
      logger.error('Error encountered' + err);
      throw err;
    } 

    if(pages.length == 0)
      logger.warn('Page: ' + page_id + ' not found');
    else 
      logger.info({page: pages}, 'API Successfully found page');

    return pages;
  });
}

var createPage = async (body) => {

  // Setup Manual Tracing using await tracer.trace 
  let id = await tracer.trace('manage-pages.getNextPageId', async() => {
    return await getNextPageId();
  })
  let result = await tracer.trace('manage-pages.savePage', async() => {
    return await savePage(id, body.title, body.body);
  })

  // Original without Tracing
  //let id = await getNextPageId();
  //let result = await savePage(id, body.title, body.body);

  return result;
}

var deletePageById = (page_id) => {
  return pageModel.deleteOne( {id: page_id}, function(err) {
    if (err) {
      logger.error(err, 'Error when deleting');
      return false;
    }
    logger.info('Successful delete of page: ' + page_id); 
      
    return true;
  })
}

var updatePage = async (pageModel, body) => {
  let curDate = Date.now();
  pageModel.title = body.title;
  pageModel.body = body.body;
  pageModel.updatedDate = curDate;

  logger.info({page: pageModel}, 'Updating Article article');

  await pageModel.save(function(err){
    if(err) {
      logger.error({page: pageModel}, 'Error updating page');
      throw err;
    }
  }); 

  logger.info({page: pageModel}, 'Successful page saving');
  return pageModel; 
}

async function savePage(id, title, body) {
  let curDate = Date.now();

  // Create new page
  let newPage = pageModel({
    id: id,
    title: title,
    body: body,
    createdDate: curDate,
    updatedDate: curDate,
  })

  logger.info({page: newPage}, 'Creating article');

  await newPage.save(function(err){
    if(err) {
      logger.error({page: newPage}, 'Error creating new page');
      throw err;
    }
  }); 

  logger.info({page: newPage}, 'Successful page saving');
  return newPage; 
}
    

async function getNextPageId() {
  // Get Latest ID to get 'next' ID
  // TODO: why is this throwing NotFoundError that is bypassing the error handling
  try {
    let latestPage = await pageModel.find({id: {$ne: ''}}, 'id', {sort: {id: 'descending'}}, function(err, pages) {
      if(err) {
        logger.error('Error encountered' + err);
        throw err;
      }        
    }).limit(1);

    let newId = latestPage.length == 0 ? 1 : latestPage[0].id + 1;
    logger.info('No page id provided, using id: ' + newId);
    return newId;
  }
  catch(e) {
    logger.error('Exception when getting next page id: ' + e);
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
    createPage: createPage,
    deletePageById: deletePageById,
    getAllPages: getAllPages,
    getPageById: getPageById,
    updatePage: updatePage
}