describe('Mongo Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should use localhost URI by default', () => {
    delete process.env.DOCKER;
    delete process.env.MONGODB_URI;

    const mongoConfig = require('./mongo');

    expect(mongoConfig.uri).toBe('mongodb://localhost:27017');
    expect(mongoConfig.options).toEqual({
      dbName: 'datablog',
    });
  });

  it('should use custom URI when MONGODB_URI env is set to mongo service', () => {
    process.env.MONGODB_URI = 'mongodb://mongo:27017';

    const mongoConfig = require('./mongo');

    expect(mongoConfig.uri).toBe('mongodb://mongo:27017');
    expect(mongoConfig.options).toEqual({
      dbName: 'datablog',
    });
  });

  it('should have correct MongoDB connection options', () => {
    const mongoConfig = require('./mongo');

    expect(mongoConfig.options.dbName).toBe('datablog');
  });

  it('should export both uri and options', () => {
    const mongoConfig = require('./mongo');

    expect(mongoConfig).toHaveProperty('uri');
    expect(mongoConfig).toHaveProperty('options');
    expect(typeof mongoConfig.uri).toBe('string');
    expect(typeof mongoConfig.options).toBe('object');
  });

  it('should honor explicit MONGODB_URI when set', () => {
    process.env.MONGODB_URI = 'mongodb://some-host:27018/custom-db';
    delete process.env.DOCKER;

    jest.resetModules();
    const mongoConfig = require('./mongo');

    expect(mongoConfig.uri).toBe('mongodb://some-host:27018/custom-db');
  });
});
