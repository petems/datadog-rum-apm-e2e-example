var express = require('express');
var logger = require('../logger');
var router = express.Router();

var pageModel = require('../mongo/models/pageModel');
var rum = require('../config/rum');

/* GET home page. */
router.get('/(|v1)', function(req, res, next) {
  logger.info('Request for index page: ' + req.url);

  pageModel.find({}, null, {sort: {id: 'descending'}}, function(err, pages) {
    logger.info('Found pages: ' + pages.length); 
    if(err){
      logger.error('Error encountered' + err);
      throw err;
    }

    res.render('index', { title: 'Home Page', pages: pages, rum: rum});
  }).limit(25);

  
});

module.exports = router;
