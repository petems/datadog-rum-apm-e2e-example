let uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
if (process.env.DOCKER && !process.env.MONGODB_URI) {
  uri = 'mongodb://mongo:27017';
}

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: 'pages',
};

module.exports = {
  uri,
  options,
};
