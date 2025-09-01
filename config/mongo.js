// Resolve MongoDB connection string with sensible CI/ops overrides
// Priority: explicit MONGODB_URI -> DOCKER hint -> localhost
let uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
if (!process.env.MONGODB_URI && process.env.DOCKER) {
  uri = 'mongodb://mongo:27017';
}

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  // Keep default DB for local/dev unless URI explicitly specifies one
  dbName: 'pages',
};

module.exports = {
  uri,
  options,
};
