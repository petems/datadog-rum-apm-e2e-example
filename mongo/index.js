const mongoose = require('mongoose');
const logger = require('../logger');
const mongooseConfig = require('../config/mongo');

mongoose
  .connect(mongooseConfig.uri, mongooseConfig.options)
  .then(() => {
    logger.info('Successful connection to database');
  })
  .catch(err => {
    logger.error(`Could not connect to database: ${err}`);
    throw err;
  });

module.exports = mongoose;
