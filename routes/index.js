const express = require('express');
const logger = require('../logger');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const pageModel = require('../mongo/models/pageModel');
const mongoose = require('mongoose');
const rum = require('../config/rum');

// Rate limiting for index page - prevent abuse of database queries
const indexRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/* GET home page. */
router.get(['/', '/v1'], indexRateLimit, async function (req, res) {
  logger.info(`Request for index page: ${req.url}`);

  // If DB not connected yet, render empty state instead of erroring
  if (mongoose.connection.readyState !== 1) {
    return res.render('index', { title: 'Home Page', pages: [], rum });
  }

  try {
    const pages = await pageModel
      .find({}, null, { sort: { id: 'descending' } })
      .limit(25)
      .lean();

    logger.info(`Found pages: ${pages.length}`);
    // Render with controlled, static view and known-safe locals
    return res.render('index', { title: 'Home Page', pages, rum });
  } catch (err) {
    // Be resilient during startup or transient DB errors
    logger.error(`Error encountered ${err}`);
    return res.render('index', { title: 'Home Page', pages: [], rum });
  }
});

module.exports = router;
