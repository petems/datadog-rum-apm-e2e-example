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
    
    const mongoConfig = require('./mongo');
    
    expect(mongoConfig.uri).toBe('mongodb://localhost:27017');
    expect(mongoConfig.options).toEqual({
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'pages',
    });
  });

  it('should use mongo service URI when DOCKER env is set', () => {
    process.env.DOCKER = 'true';
    
    const mongoConfig = require('./mongo');
    
    expect(mongoConfig.uri).toBe('mongodb://mongo:27017');
    expect(mongoConfig.options).toEqual({
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'pages',
    });
  });

  it('should have correct MongoDB connection options', () => {
    const mongoConfig = require('./mongo');
    
    expect(mongoConfig.options.useNewUrlParser).toBe(true);
    expect(mongoConfig.options.useUnifiedTopology).toBe(true);
    expect(mongoConfig.options.dbName).toBe('pages');
  });

  it('should export both uri and options', () => {
    const mongoConfig = require('./mongo');
    
    expect(mongoConfig).toHaveProperty('uri');
    expect(mongoConfig).toHaveProperty('options');
    expect(typeof mongoConfig.uri).toBe('string');
    expect(typeof mongoConfig.options).toBe('object');
  });
});