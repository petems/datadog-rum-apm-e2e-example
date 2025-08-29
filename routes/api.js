const tracer = require('dd-trace');
var logger = require('../logger');
var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var managePages = require('../controllers/manage-pages');

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended: true}));

/* GET individual page listing. */
router.get('/:page_id', async (req, res, next) => {
  let page_id = req.params.page_id;
  logger.info({headers: req.headers}, 'API Requesting Page: ' + page_id);
  let result = await managePages.getPageById(page_id);
  
  if(result.length == 0) 
    res.status(404).send('Page not found');
  else 
    res.status(200).send(result);
});

/* GET new page listing. */
router.get('/', (req, res, next) => {
  logger.info('API Requesting Blank URL: ' + req.url)
  res.status(400).send("Request a page")
  //res.send('Request Valid Page', 404);
});

/* POST new page listing. */
router.post('/', async (req, res, next) => {
  logger.info({headers: req.headers}, 'API Posting New Page');

  let result = await managePages.createPage(req.body);
  logger.info('Finished creating page');
  res.status(200).send(result);
});

/* PUT update individual page. */
router.put('/:page_id', async (req, res, next) => {
  let page_id = req.params.page_id;
  logger.info({headers: req.headers}, 'API Updating Page: ' + page_id)

  let pageToEdit = await managePages.getPageById(page_id);
  
  if(pageToEdit.length == 0) 
    res.status(404).send('Page not found');
  else if(pageToEdit.length > 1)
    res.status(400).send('Bad Request, multiple pages with id: ' + page_id + ' found');
  
  let result = await managePages.updatePage(pageToEdit[0], req.body);

  res.status(200).send(result);
});

/* DELTE individual page */
router.delete('/:page_id', async (req, res, next) => {
  let page_id = req.params.page_id;
  logger.info({headers: req.headers}, 'API Deleting Page: ' + page_id);
  let result = await managePages.deletePageById(page_id);

  if(result)
    res.status(200).send('Deleted');
  else
    res.status(500).send('Delete failed');
  
});

module.exports = router;
