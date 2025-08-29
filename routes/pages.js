/* eslint-disable consistent-return */
const express = require('express');
const router = express.Router();
const logger = require('../logger');
const rum = require('../config/rum');

//StatsD Setup
const StatsD = require('hot-shots');
const dogstatsd = new StatsD();

/* GET individual page listing. */
router.get('/:page_id', async (req, res) => {
  const page_id = req.params.page_id;
  logger.info(`Requesting Paged URL: ${req.url}, ID: ${page_id}`);

  // Validate page_id: only allow digits to prevent SSRF/path traversal
  if (!/^\d+$/.test(page_id)) {
    logger.warn({ page_id }, 'Invalid page_id provided, denied');
    res.status(400).render('error', {
      statusCode: 400,
      message: 'Invalid page ID',
      rum,
    });
    return;
  }

  dogstatsd.increment('page.views', [`page:${page_id}`]);

  try {
    const response = await fetch(`http://localhost:3000/api/page/${page_id}`);

    if (response.ok) {
      const pageArr = await response.json();
      const page = pageArr[0];
      logger.info({ page }, 'Response on end result');

      // Get the nice format for the date / handling for missing date
      const niceDate = page.createdDate
        ? new Date().toDateString(page.createdDate)
        : 'No Date Provided';
      page.niceDate = niceDate;

      res.render('page', { ...page, rum });
    } else if (response.status === 404) {
      logger.warn({ page_id }, `GET Page: ${page_id} not found`);
      res.render('error', {
        statusCode: 404,
        message: 'Page not found',
        rum,
      });
    } else {
      logger.error(`Unexpected output: ${response.status}`);
      res.render('error', {
        statusCode: response.status,
        message: 'Unexpected Error',
        rum,
      });
    }
  } catch (err) {
    logger.error(`Error: ${err.message}`);
    res.render('error', {
      statusCode: 500,
      message: 'Internal Server Error',
      rum,
    });
  }
});

/* GET new page listing. */
router.get('/', function (req, res) {
  logger.info(`Requesting Blank URL: ${req.url}`);
  const curDate = new Date().toDateString();
  res.render('new-page', { currentDate: curDate, rum });
});

/* GET edit page */
router.get('/:page_id/edit', async (req, res) => {
  const page_id = req.params.page_id;
  logger.info(`Requesting Paged URL: ${req.url}, ID: ${page_id}`);

  // Validate page_id: only allow digits to prevent SSRF/path traversal
  if (!/^\d+$/.test(page_id)) {
    logger.warn({ page_id }, 'Invalid page_id provided, denied');
    res.status(400).render('error', {
      statusCode: 400,
      message: 'Invalid page ID',
      rum,
    });
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/api/page/${page_id}`);

    if (response.ok) {
      const pageArr = await response.json();
      const page = pageArr[0];
      logger.info({ page }, 'Response on end result');

      // Get the nice format for the date / handling for missing date
      const niceDate = page.createdDate
        ? new Date().toDateString(page.createdDate)
        : 'No Date Provided';
      page.niceDate = niceDate;

      res.render('edit-page', { ...page, rum });
    } else if (response.status === 404) {
      logger.warn({ page_id }, `GET Edit Page: ${page_id} not found`);
      res.render('error', {
        statusCode: 404,
        message: 'Page not found',
        rum,
      });
    } else {
      logger.error(`Unexpected output: ${response.status}`);
      res.render('error', {
        statusCode: response.status,
        message: 'Unexpected Error',
        rum,
      });
    }
  } catch (err) {
    logger.error(`Error: ${err.message}`);
    res.render('error', {
      statusCode: 500,
      message: 'Internal Server Error',
      rum,
    });
  }
});

module.exports = router;
