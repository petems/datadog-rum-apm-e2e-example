require('dd-trace');
const logger = require('../logger');
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const managePages = require('../controllers/manage-pages');
const authenticate = require('../middlewares/authenticate');
const traceLogger = require('../middlewares/traceLogger');

// Reasonable content size limits to guard payloads
const MAX_TITLE_LENGTH = 200;
const MAX_CONTENT_LENGTH = 5000;

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

// Log incoming trace headers for debugging RUM->APM correlation
router.use(traceLogger);

// CORS configuration
router.use(
  cors({
    origin: process.env.CORS_ORIGIN || [
      'http://localhost:5173',
      'http://localhost:3000',
    ],
    credentials: true,
  })
);

// Apply rate limiting to API pages (100 requests per 15 minutes per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
router.use(limiter);

/* GET all pages listing. */
router.get('/', authenticate, async (req, res) => {
  try {
    logger.info(
      { headers: req.headers },
      `API Requesting Pages for user: ${req.user.email}`
    );
    const result = await managePages.getAllPages(req.user);
    res.status(200).json(result);
  } catch (error) {
    logger.error({ error: error.message }, 'Error getting all pages');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* POST new page listing. */
router.post('/', authenticate, async (req, res) => {
  try {
    logger.info(
      { headers: req.headers },
      `API Posting New Page for user: ${req.user.email}`
    );

    // Validate required fields
    if (!req.body.title || !req.body.content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    // Basic length limits to avoid overly large payloads
    if (
      req.body.title.length > MAX_TITLE_LENGTH ||
      req.body.content.length > MAX_CONTENT_LENGTH
    ) {
      return res.status(413).json({ error: 'Payload too large' });
    }

    // Map content to body for consistency with existing controller
    const pageData = {
      title: req.body.title,
      body: req.body.content,
    };

    const result = await managePages.createPage(pageData, req.user);
    logger.info('Finished creating page');
    return res.status(201).json(result);
  } catch (error) {
    logger.error({ error: error.message }, 'Error creating page');
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
