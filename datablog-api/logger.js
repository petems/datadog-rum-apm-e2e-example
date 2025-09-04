const bunyan = require('bunyan');
const logger = bunyan.createLogger({
  name: 'datablog',
  serializers: bunyan.stdSerializers,
});

module.exports = logger;
