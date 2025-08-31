let uri = 'mongodb://localhost:27017';
if (process.env.DOCKER) {
  uri = 'mongodb://mongo:27017';
}

const options = {
  dbName: 'pages',
};

module.exports = {
  uri,
  options,
};
