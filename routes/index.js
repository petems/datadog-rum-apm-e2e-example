const express = require('express');
const logger = require('../logger');
const router = express.Router();
const rateLimit = require('express-rate-limit');

// Rate limiting for index page - prevent abuse of database queries
const indexRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/* GET home page - serve static React build */
router.get('/', indexRateLimit, function (req, res) {
  logger.info(`Request for index page: ${req.url}, serving React SPA`);
  // Serve static React build
  res.sendFile('index.html', { root: './client/dist' });
});

// Also handle /v1 route - serve static React build
router.get('/v1', indexRateLimit, function (req, res) {
  logger.info(`Request for v1 page: ${req.url}, serving React SPA`);
  // Serve static React build
  res.sendFile('index.html', { root: './client/dist' });
});

module.exports = router;
