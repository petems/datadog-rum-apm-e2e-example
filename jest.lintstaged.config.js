const base = require('./jest.config.js');

module.exports = {
  ...base,
  // Disable coverage collection and thresholds for lint-staged runs
  collectCoverage: false,
  coverageThreshold: undefined,
  coverageReporters: [],
  collectCoverageFrom: [],
};
