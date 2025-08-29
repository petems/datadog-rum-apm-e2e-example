describe('RUM Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should use default values when environment variables are not set', () => {
    delete process.env.DD_CLIENT_TOKEN;
    delete process.env.DD_APPLICATION_ID;
    delete process.env.DD_ENV;
    delete process.env.DD_SERVICE;
    delete process.env.DD_VERSION;

    const rumConfig = require('./rum');

    expect(rumConfig.clientToken).toBeUndefined();
    expect(rumConfig.applicationId).toBeUndefined();
    expect(rumConfig.env).toBe('development');
    expect(rumConfig.service).toBe('datablog-ui');
    expect(rumConfig.version).toBe('2.0.0');
  });

  it('should use environment variables when provided', () => {
    process.env.DD_CLIENT_TOKEN = 'test-client-token';
    process.env.DD_APPLICATION_ID = 'test-app-id';
    process.env.DD_ENV = 'production';
    process.env.DD_SERVICE = 'custom-service';
    process.env.DD_VERSION = '3.0.0';

    const rumConfig = require('./rum');

    expect(rumConfig.clientToken).toBe('test-client-token');
    expect(rumConfig.applicationId).toBe('test-app-id');
    expect(rumConfig.env).toBe('production');
    expect(rumConfig.service).toBe('custom-service-ui');
    expect(rumConfig.version).toBe('3.0.0');
  });

  it('should append "-ui" to DD_SERVICE for service name', () => {
    process.env.DD_SERVICE = 'my-app';

    const rumConfig = require('./rum');

    expect(rumConfig.service).toBe('my-app-ui');
  });

  it('should use default service name when DD_SERVICE is not set', () => {
    delete process.env.DD_SERVICE;

    const rumConfig = require('./rum');

    expect(rumConfig.service).toBe('datablog-ui');
  });

  it('should have all required RUM properties', () => {
    const rumConfig = require('./rum');

    expect(rumConfig).toHaveProperty('clientToken');
    expect(rumConfig).toHaveProperty('applicationId');
    expect(rumConfig).toHaveProperty('env');
    expect(rumConfig).toHaveProperty('service');
    expect(rumConfig).toHaveProperty('version');
  });

  it('should handle empty DD_SERVICE environment variable', () => {
    process.env.DD_SERVICE = '';

    const rumConfig = require('./rum');

    expect(rumConfig.service).toBe('datablog-ui');
  });

  it('should handle various environment combinations', () => {
    process.env.DD_ENV = 'staging';
    process.env.DD_VERSION = '1.5.0';
    delete process.env.DD_SERVICE;

    const rumConfig = require('./rum');

    expect(rumConfig.env).toBe('staging');
    expect(rumConfig.version).toBe('1.5.0');
    expect(rumConfig.service).toBe('datablog-ui');
  });
});
