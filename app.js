// This line must come before importing any instrumented module.
require('dd-trace').init({
  enabled: true,
  analytics: true,
  logInjection: true,
  // debug: true
});
const rum = require('./config/rum');

// Basic imports
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const logger = require('./logger');
require('./mongo');

const app = express();

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
const indexRouter = require('./routes/index');
const pagesRouter = require('./routes/pages');
const apiRouter = require('./routes/api');
const apiPagesRouter = require('./routes/api-pages');
app.use('/', indexRouter);
app.use('/page', pagesRouter);
app.use('/api/page', apiRouter);
app.use('/api/pages', apiPagesRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, _next) {
  res.locals.message = err.message;
  res.locals.error = err;

  //TODO: Why does the error handling cause posting a new page to fail
  //Workaround for this getting thrown from mangage-pages.getNextPageId
  if (
    err.name === 'NotFoundError' &&
    (req.path === '/page' || req.path === '/page/')
  ) {
    logger.info('Mongoose NotFoundError, skipping');
    return;
  }

  // Render the error page
  const statusCode = err.status || 500;
  res.status(statusCode);
  const errorDetails = {
    statusCode,
    message: err.message,
  };

  res.render('error', { ...errorDetails, rum });
});

module.exports = app;
