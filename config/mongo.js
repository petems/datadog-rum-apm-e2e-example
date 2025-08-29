var uri = 'mongodb://localhost:27017';
if(process.env.DOCKER)
    var uri = 'mongodb://mongo:27017';

var options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: 'pages'
}

module.exports = {
    uri: uri,
    options: options
}