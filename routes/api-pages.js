require('dd-trace');
var logger = require('../logger');
var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var managePages = require('../controllers/manage-pages');

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended: true}));

/* GET all pages listing. */
router.get('/', async (req, res, next) => {
  try {
    logger.info({headers: req.headers}, 'API Requesting All Pages');
    let result = await managePages.getAllPages();
    res.status(200).json(result);
  } catch (error) {
    logger.error({error: error.message}, 'Error getting all pages');
    res.status(500).json({error: 'Internal server error'});
  }
});

/* POST new page listing. */
router.post('/', async (req, res, next) => {
  try {
    logger.info({headers: req.headers}, 'API Posting New Page');
    
    // Validate required fields
    if (!req.body.title || !req.body.content) {
      return res.status(400).json({error: 'Title and content are required'});
    }

    // Map content to body for consistency with existing controller
    const pageData = {
      title: req.body.title,
      body: req.body.content,
      author: req.body.author
    };

    let result = await managePages.createPage(pageData);
    logger.info('Finished creating page');
    res.status(201).json(result);
  } catch (error) {
    logger.error({error: error.message}, 'Error creating page');
    res.status(500).json({error: 'Internal server error'});
  }
});

module.exports = router;