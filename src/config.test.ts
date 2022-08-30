import { jest } from '@jest/globals';

describe('Config', () => {
  const INITIAL_ENV = Object.assign({}, process.env);
  let Config: typeof import('./config').Config;
  let MissingEnvironmentVariableError: typeof import('./config').MissingEnvironmentVariableError;

  const resetEnv = () => (process.env = Object.assign({}, INITIAL_ENV));
  const resetImport = async () => {
    jest.resetModules();
    ({ Config, MissingEnvironmentVariableError } = await import('./config'));
  };

  beforeEach(async () => {
    await resetImport();
  });

  afterEach(() => {
    resetEnv();
  });

  describe('primaryHost', () => {
    test('should throw if "PRIMARY_HOST_BASE_URL" is undefined', () => {
      process.env['PRIMARY_HOST_PASSWORD'] = 'mypassword';

      expect(() => Config.primaryHost).toThrow(MissingEnvironmentVariableError);
      expect(() => Config.primaryHost).toThrow(
        'The environment variable PRIMARY_HOST_BASE_URL is required but not defined.'
      );
    });

    test('should throw if "PRIMARY_HOST_PASSWORD" is undefined', () => {
      process.env['PRIMARY_HOST_BASE_URL'] = 'http://10.0.0.2';

      expect(() => Config.primaryHost).toThrow(MissingEnvironmentVariableError);
      expect(() => Config.primaryHost).toThrow(
        'The environment variable PRIMARY_HOST_PASSWORD is required but not defined.'
      );
    });

    test('should return primary host and memoize value', () => {
      process.env['PRIMARY_HOST_BASE_URL'] = 'http://10.0.0.2';
      process.env['PRIMARY_HOST_PASSWORD'] = 'mypassword';

      const expected = {
        baseUrl: 'http://10.0.0.2',
        password: 'mypassword'
      };

      expect(Config.primaryHost).toStrictEqual(expected);
      resetEnv();
      expect(Config.primaryHost).toStrictEqual(expected);
    });
  });

  describe('secondaryHosts', () => {
    test('should throw if "SECONDARY_HOST_1_BASE_URL" is undefined', () => {
      process.env['SECONDARY_HOST_1_PASSWORD'] = 'mypassword';

      expect(() => Config.secondaryHosts).toThrow(MissingEnvironmentVariableError);
      expect(() => Config.secondaryHosts).toThrow(
        'The environment variable SECONDARY_HOST_1_BASE_URL is required but not defined.'
      );
    });

    test('should throw if "SECONDARY_HOST_1_PASSWORD" is undefined', () => {
      process.env['SECONDARY_HOST_1_BASE_URL'] = 'http://10.0.0.3';

      expect(() => Config.secondaryHosts).toThrow(MissingEnvironmentVariableError);
      expect(() => Config.secondaryHosts).toThrow(
        'The environment variable SECONDARY_HOST_1_PASSWORD is required but not defined.'
      );
    });

    test('should return single secondary host and memoize value', () => {
      process.env['SECONDARY_HOST_1_BASE_URL'] = 'http://10.0.0.3';
      process.env['SECONDARY_HOST_1_PASSWORD'] = 'mypassword';

      const expected = [
        {
          baseUrl: 'http://10.0.0.3',
          password: 'mypassword'
        }
      ];

      expect(Config.secondaryHosts).toStrictEqual(expected);
      resetEnv();
      expect(Config.secondaryHosts).toStrictEqual(expected);
    });

    test('should return multiple secondary hosts', () => {
      process.env['SECONDARY_HOST_1_BASE_URL'] = 'http://10.0.0.3';
      process.env['SECONDARY_HOST_1_PASSWORD'] = 'mypassword1';
      process.env['SECONDARY_HOST_2_BASE_URL'] = 'http://10.0.0.4';
      process.env['SECONDARY_HOST_2_PASSWORD'] = 'mypassword2';
      process.env['SECONDARY_HOST_3_BASE_URL'] = 'http://10.0.0.5';
      process.env['SECONDARY_HOST_3_PASSWORD'] = 'mypassword3';
      process.env['SECONDARY_HOST_5_BASE_URL'] = 'http://10.0.0.7';
      process.env['SECONDARY_HOST_5_PASSWORD'] = 'mypassword4';

      expect(Config.secondaryHosts).toStrictEqual([
        {
          baseUrl: 'http://10.0.0.3',
          password: 'mypassword1'
        },
        {
          baseUrl: 'http://10.0.0.4',
          password: 'mypassword2'
        },
        {
          baseUrl: 'http://10.0.0.5',
          password: 'mypassword3'
        }
      ]);
    });
  });

  describe('syncOptions', () => {
    test('should return defaults', () => {
      expect(Config.syncOptions).toStrictEqual({
        whitelist: true,
        regexWhitelist: true,
        blacklist: true,
        regexlist: true,
        adlist: true,
        client: true,
        group: true,
        auditlog: false,
        staticdhcpleases: false,
        localdnsrecords: true,
        localcnamerecords: true,
        flushtables: true
      });
    });

    test('should accept overrides and memoize', () => {
      process.env['SYNC_WHITELIST'] = 'false';
      process.env['SYNC_REGEX_WHITELIST'] = 'false';
      process.env['SYNC_BLACKLIST'] = 'false';
      process.env['SYNC_REGEXLIST'] = 'false';
      process.env['SYNC_ADLIST'] = 'false';
      process.env['SYNC_CLIENT'] = 'false';
      process.env['SYNC_GROUP'] = 'false';
      process.env['SYNC_AUDITLOG'] = 'true';
      process.env['SYNC_STATICDHCPLEASES'] = 'true';
      process.env['SYNC_LOCALDNSRECORDS'] = 'false';
      process.env['SYNC_LOCALCNAMERECORDS'] = 'false';
      process.env['SYNC_FLUSHTABLES'] = 'false';

      const expected = {
        whitelist: false,
        regexWhitelist: false,
        blacklist: false,
        regexlist: false,
        adlist: false,
        client: false,
        group: false,
        auditlog: true,
        staticdhcpleases: true,
        localdnsrecords: false,
        localcnamerecords: false,
        flushtables: false
      };

      expect(Config.syncOptions).toStrictEqual(expected);
      resetEnv();
      expect(Config.syncOptions).toStrictEqual(expected);
    });
  });

  describe('verboseMode', () => {
    test('should return default false', () => {
      expect(Config.verboseMode).toStrictEqual(false);
    });

    test('should accept override and memoize', () => {
      process.env['VERBOSE'] = 'true';

      expect(Config.verboseMode).toStrictEqual(true);
      resetEnv();
      expect(Config.verboseMode).toStrictEqual(true);
    });
  });

  describe('runOnce', () => {
    test('should return default false', () => {
      expect(Config.runOnce).toStrictEqual(false);
    });

    test('should accept override and memoize', () => {
      process.env['RUN_ONCE'] = 'true';

      expect(Config.runOnce).toStrictEqual(true);
      resetEnv();
      expect(Config.runOnce).toStrictEqual(true);
    });
  });

  describe('intervalMinutes', () => {
    test('should return default value', () => {
      expect(Config.intervalMinutes).toStrictEqual(30);
    });

    test('should disregard bad values', async () => {
      process.env['INTERVAL_MINUTES'] = '-1';
      expect(Config.intervalMinutes).toStrictEqual(30);

      await resetImport();
      process.env['INTERVAL_MINUTES'] = 'abc';
      expect(Config.intervalMinutes).toStrictEqual(30);

      await resetImport();
      process.env['INTERVAL_MINUTES'] = '0';
      expect(Config.intervalMinutes).toStrictEqual(30);
    });

    test('should accept override and memoize', () => {
      process.env['INTERVAL_MINUTES'] = '5';

      expect(Config.intervalMinutes).toStrictEqual(5);
      resetEnv();
      expect(Config.intervalMinutes).toStrictEqual(5);
    });
  });

  describe('honeybadgerApiKey', () => {
    test('should return undefined', () => {
      expect(Config.honeybadgerApiKey).toBeUndefined();
    });

    test('should allow override', () => {
      process.env['HONEYBADGER_API_KEY'] = 'hbp_x';

      expect(Config.honeybadgerApiKey).toStrictEqual('hbp_x');
    });
  });
});
