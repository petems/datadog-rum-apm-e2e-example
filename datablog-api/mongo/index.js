const mongoose = require('mongoose');
const logger = require('../logger');
const mongooseConfig = require('../config/mongo');

function connectWithRetry(attempt = 1) {
  mongoose
    .connect(mongooseConfig.uri, mongooseConfig.options)
    .then(() => {
      logger.info('Successful connection to database');
    })
    .catch(err => {
      const delay = Math.min(5000, 250 * attempt);
      logger.error(
        `Mongo connection failed (attempt ${attempt}): ${err.message}. Retrying in ${delay}ms`
      );
      setTimeout(() => connectWithRetry(attempt + 1), delay);
    });
}

// Start initial connection with retry/backoff. Do not throw to avoid crashing app at startup.
connectWithRetry();

// Log disconnections/errors and attempt re-connects
mongoose.connection.on('disconnected', () => {
  logger.error('Mongo disconnected - attempting to reconnect');
  // Let Mongoose reconnect on its own; if it fails we'll schedule a retry
});

mongoose.connection.on('error', err => {
  logger.error(`Mongo connection error: ${err.message}`);
});

module.exports = mongoose;
