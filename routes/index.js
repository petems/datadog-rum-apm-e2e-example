const express = require('express');
const logger = require('../logger');
const router = express.Router();

const pageModel = require('../mongo/models/pageModel');
const rum = require('../config/rum');

/* GET home page. */
router.get('/(|v1)', function (req, res) {
  logger.info(`Request for index page: ${req.url}`);

  pageModel
    .find({}, null, { sort: { id: 'descending' } }, function (err, pages) {
      logger.info(`Found pages: ${pages.length}`);
      if (err) {
        logger.error(`Error encountered${err}`);
        throw err;
      }

      res.render('index', { title: 'Home Page', pages, rum });
    })
    .limit(25);
});

module.exports = router;
