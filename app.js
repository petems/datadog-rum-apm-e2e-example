// This line must come before importing any instrumented module.
const tracer = require('dd-trace').init({
  enabled: true,
  analytics: true,
  logInjection: true,
 // debug: true
})
var rum = require('./config/rum');

// Basic imports
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('./logger');
var bodyParser = require('body-parser');
var mongoose = require('./mongo');

var app = express();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


// FIXME how does express use loggers
//app.use(logger('datablog'));

// Handlers for JSON and URL Encodings
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Create public path containing images, javascript, and stylesheets
app.use(express.static(path.join(__dirname, 'public')));

// Routers for each page
var indexRouter = require('./routes/index');
var pagesRouter = require('./routes/pages');
var apiRouter = require('./routes/api');
var apiPagesRouter = require('./routes/api-pages');
app.use('/', indexRouter);
app.use('/page', pagesRouter);
app.use('/api/page', apiRouter);
app.use('/api/pages', apiPagesRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = err;

  //TODO: Why does the error handling cause posting a new page to fail
  //Workaround for this getting thrown from mangage-pages.getNextPageId
  if(err.name == 'NotFoundError' && (req.path == '/page' || req.path == '/page/')){
    logger.info('Mongoose NotFoundError, skipping');
    return;
  }

  // Render the error page
  let statusCode = (err.status || 500);
  res.status(statusCode);
  errorDetails = {
    statusCode: statusCode,
    message: err.message    
  }

  res.render('error', {...errorDetails, rum: rum});
});

module.exports = app;
