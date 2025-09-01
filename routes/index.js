const express = require('express');
const logger = require('../logger');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const managePages = require('../controllers/manage-pages');
const rum = require('../config/rum');
const { verifyAccess } = require('../utils/jwt');

// Optional auth via Authorization header or refresh cookie
const optionalAuthenticate = (req, _res, next) => {
  const authHeader = req.headers.authorization || '';
  const bearer = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;
  const token = bearer || null;

  if (!token) {
    // Try to infer user from a previously validated session (handled client-side)
    req.user = null;
    return next();
  }

  try {
    const payload = verifyAccess(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      tokenVersion: payload.tokenVersion,
    };
  } catch {
    req.user = null;
  }
  return next();
};

// Rate limiting for index page - prevent abuse of database queries
const indexRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/* GET home page. */
router.get(
  '/',
  indexRateLimit,
  optionalAuthenticate,
  async function (req, res) {
    logger.info(
      `Request for index page: ${req.url}, user: ${req.user?.email || 'anonymous'}`
    );

    try {
      const pagesObject = {};

      // Authenticated users (including admins) see pages
      if (req.user) {
        const pages = await managePages.getAllPages(req.user);
        pages.forEach((page, index) => {
          pagesObject[index] = {
            id: page.id,
            title: page.title,
            body: page.body,
            createdDate: page.createdDate
              ? new Date(page.createdDate).toDateString()
              : 'No Date Provided',
            author: page.author,
          };
        });
        logger.info(
          `Found pages: ${pages.length} for user: ${req.user.email} (${req.user.role})`
        );
      }

      res.render('index', {
        title: 'Home Page',
        pages: pagesObject,
        user: req.user,
        isAdmin: req.user?.role === 'admin',
        rum,
      });
    } catch (error) {
      logger.error(`Error encountered: ${error.message}`);
      res.render('error', {
        statusCode: 500,
        message: 'Internal Server Error',
        rum,
      });
    }
  }
);

// Also handle /v1 route
router.get(
  '/v1',
  indexRateLimit,
  optionalAuthenticate,
  async function (req, res) {
    logger.info(
      `Request for index page: ${req.url}, user: ${req.user?.email || 'anonymous'}`
    );

    try {
      const pagesObject = {};

      // Only fetch and show pages for authenticated users
      if (req.user) {
        const pages = await managePages.getAllPages(req.user);

        // Convert to the format expected by the template
        pages.forEach((page, index) => {
          pagesObject[index] = {
            id: page.id,
            title: page.title,
            body: page.body,
            createdDate: page.createdDate
              ? new Date(page.createdDate).toDateString()
              : 'No Date Provided',
            author: page.author, // This will include author info for admins
          };
        });

        logger.info(`Found pages: ${pages.length} for user: ${req.user.email}`);
      } else {
        logger.info('Anonymous user - hiding pages');
      }

      res.render('index', {
        title: 'Home Page',
        pages: pagesObject,
        user: req.user,
        rum,
      });
    } catch (error) {
      logger.error(`Error encountered: ${error.message}`);
      res.render('error', {
        statusCode: 500,
        message: 'Internal Server Error',
        rum,
      });
    }
  }
);

module.exports = router;
