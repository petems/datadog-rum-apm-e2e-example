describe('Mongo Configuration', () => {
  const EXPECTED_DB_NAME = 'datablog';
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.MONGODB_URI;
    delete process.env.DOCKER;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('URI resolution', () => {
    it('should use localhost by default', () => {
      const mongoConfig = require('./mongo');
      expect(mongoConfig.uri).toBe('mongodb://localhost:27017');
      expect(mongoConfig.options).toEqual({
        dbName: EXPECTED_DB_NAME,
      });
    });

    it('should use mongo host when DOCKER=true', () => {
      process.env.DOCKER = 'true';
      const mongoConfig = require('./mongo');
      expect(mongoConfig.uri).toBe('mongodb://mongo:27017');
      expect(mongoConfig.options).toEqual({
        dbName: EXPECTED_DB_NAME,
      });
    });

    it('should use MONGODB_URI when provided', () => {
      process.env.MONGODB_URI = 'mongodb://custom:27017';
      const mongoConfig = require('./mongo');
      expect(mongoConfig.uri).toBe('mongodb://custom:27017');
      expect(mongoConfig.options).toEqual({
        dbName: EXPECTED_DB_NAME,
      });
    });

    it('should have correct options structure', () => {
      const mongoConfig = require('./mongo');
      expect(mongoConfig.options.useNewUrlParser).toBeUndefined();
      expect(mongoConfig.options.useUnifiedTopology).toBeUndefined();
      expect(mongoConfig.options.dbName).toBe(EXPECTED_DB_NAME);
    });
  });
});
