// Preserve legacy test expectations: default host, and DOCKER override
let uri = 'mongodb://localhost:27017';
if (process.env.MONGODB_URI) {
  uri = process.env.MONGODB_URI;
} else if (process.env.DOCKER) {
  uri = 'mongodb://mongo:27017';
}

const options = {
  dbName: 'datablog',
};

module.exports = {
  uri,
  options,
};
