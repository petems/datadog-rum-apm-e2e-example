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
    res.render('index', { title: 'Home Page', pages: [], rum }, function (err, html) {
      if (err) {
        logger.error(`Render error (cold start): ${err.message}`);
        return res.status(200).send('OK');
      }
      return res.status(200).send(html);
    });
    return;
  }

  try {
    const pages = await pageModel
      .find({}, null, { sort: { id: 'descending' } })
      .limit(25);
    logger.info(`Found pages: ${pages.length}`);
    return res.render('index', { title: 'Home Page', pages, rum }, function (rErr, html) {
      if (rErr) {
        logger.error(`Render error: ${rErr.message}`);
        return res.status(200).send('OK');
      }
      return res.status(200).send(html);
    });
  } catch (err) {
    // Be resilient during startup or transient DB errors
    logger.error(`DB error on index: ${err.message || err}`);
    return res.render('index', { title: 'Home Page', pages: [], rum }, function (rErr, html) {
      if (rErr) {
        logger.error(`Render error (DB fail): ${rErr.message}`);
        return res.status(200).send('OK');
      }
      return res.status(200).send(html);
    });
  }
});

module.exports = router;
