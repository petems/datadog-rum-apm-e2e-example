require('dd-trace');
const logger = require('../logger');
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const managePages = require('../controllers/manage-pages');

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

/* GET all pages listing. */
router.get('/', async (req, res) => {
  try {
    logger.info({ headers: req.headers }, 'API Requesting All Pages');
    const result = await managePages.getAllPages();
    res.status(200).json(result);
  } catch (error) {
    logger.error({ error: error.message }, 'Error getting all pages');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* POST new page listing. */
router.post('/', async (req, res) => {
  try {
    logger.info({ headers: req.headers }, 'API Posting New Page');

    // Validate required fields
    if (!req.body.title || !req.body.content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    // Basic length limits to avoid overly large payloads
    if (req.body.title.length > 200 || req.body.content.length > 10000) {
      return res.status(413).json({ error: 'Payload too large' });
    }

    // Map content to body for consistency with existing controller
    const pageData = {
      title: req.body.title,
      body: req.body.content,
      author: req.body.author,
    };

    const result = await managePages.createPage(pageData);
    logger.info('Finished creating page');
    return res.status(201).json(result);
  } catch (error) {
    logger.error({ error: error.message }, 'Error creating page');
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
