var bunyan = require('bunyan')
var logger = bunyan.createLogger({
    name: 'datablog',
    serializers: bunyan.stdSerializers
});

module.exports = logger;