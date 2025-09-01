const logger = require('../logger');
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const managePages = require('../controllers/manage-pages');
const escape = require('escape-html');
const authenticate = require('../middlewares/authenticate');

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

// Rate limiter: max 100 requests per 15 min per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

/* GET individual page listing. */
router.get('/:page_id', authenticate, apiLimiter, async (req, res) => {
  const page_id = req.params.page_id;
  logger.info(
    { headers: req.headers },
    `API Requesting Page: ${page_id} for user: ${req.user.email}`
  );

  try {
    const result = await managePages.getPageById(page_id, req.user);

    if (result.length === 0) {
      res.status(404).json({ error: 'Page not found or access denied' });
    } else {
      res.status(200).json(result);
    }
  } catch (error) {
    logger.error({ error: error.message }, 'Error getting page');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* GET new page listing. */
router.get('/', (req, res) => {
  logger.info(`API Requesting Blank URL: ${req.url}`);
  res.status(400).send('Request a page');
  //res.send('Request Valid Page', 404);
});

/* POST new page listing. */
router.post('/', authenticate, apiLimiter, async (req, res) => {
  logger.info(
    { headers: req.headers },
    `API Posting New Page for user: ${req.user.email}`
  );

  try {
    const result = await managePages.createPage(req.body, req.user);
    logger.info('Finished creating page');
    res.status(201).json(result);
  } catch (error) {
    logger.error({ error: error.message }, 'Error creating page');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* PUT update individual page. */
router.put('/:page_id', authenticate, apiLimiter, async (req, res) => {
  const page_id = req.params.page_id;
  logger.info(
    { headers: req.headers },
    `API Updating Page: ${page_id} for user: ${req.user.email}`
  );

  try {
    const pageToEdit = await managePages.getPageById(page_id, req.user);

    if (pageToEdit.length === 0) {
      res.status(404).json({ error: 'Page not found or access denied' });
      return;
    } else if (pageToEdit.length > 1) {
      res.status(400).json({
        error: `Bad Request, multiple pages with id: ${escape(page_id)} found`,
      });
      return;
    }

    const result = await managePages.updatePage(
      pageToEdit[0],
      req.body,
      req.user
    );
    res.status(200).json(result);
  } catch (error) {
    logger.error({ error: error.message }, 'Error updating page');
    res.status(500).json({ error: error.message });
  }
});

/* DELETE individual page */
router.delete('/:page_id', authenticate, apiLimiter, async (req, res) => {
  const page_id = req.params.page_id;
  logger.info(
    { headers: req.headers },
    `API Deleting Page: ${page_id} for user: ${req.user.email}`
  );

  try {
    const result = await managePages.deletePageById(page_id, req.user);
    if (result) {
      res.status(200).json({ message: 'Page deleted successfully' });
    } else {
      res.status(500).json({ error: 'Delete failed' });
    }
  } catch (error) {
    logger.error({ error: error.message }, 'Error deleting page');
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
