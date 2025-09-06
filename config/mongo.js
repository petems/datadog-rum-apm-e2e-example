let uri = 'mongodb://localhost:27017';
if (process.env.MONGODB_URI) {
  uri = process.env.MONGODB_URI;
}

const options = {
  dbName: 'datablog',
};

module.exports = {
  uri,
  options,
};
