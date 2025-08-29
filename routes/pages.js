const express = require('express');
const router = express.Router();
const logger = require('../logger');
const http = require('http');
const rum = require('../config/rum');

//StatsD Setup
const StatsD = require('hot-shots');
const dogstatsd = new StatsD();

/* GET individual page listing. */
router.get('/:page_id', async (req, res) => {
  const page_id = req.params.page_id;
  logger.info(`Requesting Paged URL: ${req.url}, ID: ${page_id}`);

  dogstatsd.increment('page.views', [`page:${page_id}`]);

  let pageData = '';
  http
    .get(`http://localhost:3000/api/page/${page_id}`, resp => {
      // A chunk of data has been recieved.
      resp.on('data', chunk => {
        pageData += chunk;
      });

      // The whole response has been received. Print out the result.
      resp.on('end', () => {
        if (resp.statusCode === 200) {
          const pageArr = JSON.parse(pageData);
          const page = pageArr[0];
          logger.info({ page }, 'Response on end result');

          // Get the nice format for the date / handling for missing date
          const niceDate = page.createdDate
            ? new Date().toDateString(page.createdDate)
            : 'No Date Provided';
          page.niceDate = niceDate;

          res.render('page', { ...page, rum });
        } else if (resp.statusCode === 404) {
          logger.warn({ page_id }, `GET Page: ${page_id} not found`);
          res.render('error', {
            statusCode: 404,
            message: 'Page not found',
            rum,
          });
        } else {
          logger.error(`Unexpected output: ${resp.statusCode}`);
          res.render('error', {
            statusCode: resp.statusCode,
            message: 'Unexpected Error',
            rum,
          });
        }
      });
    })
    .on('error', err => {
      logger.error(`Error: ${err.message}`);
    });
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

  // Validate page_id to avoid SSRF or path traversal
  // Accept only UUIDs or numbers; adapt regex as needed for your IDs
  const validPageId = /^[a-zA-Z0-9_-]+$/.test(page_id);
  if (!validPageId) {
    logger.warn({ page_id }, 'Blocked request with invalid page_id');
    return res.status(400).render('error', {
      statusCode: 400,
      message: 'Invalid page ID',
      rum,
    });
  }

  let pageData = '';
  http
    .get(`http://localhost:3000/api/page/${page_id}`, resp => {
      // A chunk of data has been recieved.
      resp.on('data', chunk => {
        pageData += chunk;
      });

      // The whole response has been received. Print out the result.
      resp.on('end', () => {
        if (resp.statusCode === 200) {
          const pageArr = JSON.parse(pageData);
          const page = pageArr[0];
          logger.info({ page }, 'Response on end result');

          // Get the nice format for the date / handling for missing date
          const niceDate = page.createdDate
            ? new Date().toDateString(page.createdDate)
            : 'No Date Provided';
          page.niceDate = niceDate;

          res.render('edit-page', { ...page, rum });
        } else if (resp.statusCode === 404) {
          logger.warn({ page_id }, `GET Edit Page: ${page_id} not found`);
          res.render('error', {
            statusCode: 404,
            message: 'Page not found',
            rum,
          });
        } else {
          logger.error(`Unexpected output: ${resp.statusCode}`);
          res.render('error', {
            statusCode: resp.statusCode,
            message: 'Unexpected Error',
            rum,
          });
        }
      });
    })
    .on('error', err => {
      logger.error(`Error: ${err.message}`);
    });
});

module.exports = router;
