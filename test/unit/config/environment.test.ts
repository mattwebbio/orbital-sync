import { EnvironmentConfig } from '../../../src/config/environment';
import { EnabledSmtpConfig } from '../../../src/config/notify/smtp';

describe('Config', () => {
  describe('Environment', () => {
    const INITIAL_ENV = Object.assign({}, process.env);
    const resetEnv = () => (process.env = Object.assign({}, INITIAL_ENV));

    afterEach(() => resetEnv());

    const testToHaveDefaultAndOverride = <T>(
      obj: () => T,
      getter: keyof T,
      dflt: string | boolean | undefined,
      env: string
    ) => {
      test('should return default', () => {
        expect(obj()[getter]).toStrictEqual(dflt);
      });

      test('should accept override', () => {
        let override: string | boolean;
        switch (typeof dflt) {
          case 'string':
            override = 'mock_value';
            break;
          case 'boolean':
            override = !dflt;
            break;
          case 'undefined':
            override = 'mock_value';
            break;
        }

        process.env[env] = override.toString();

        expect(obj()[getter]).toStrictEqual(override);
      });
    };

    const testToThrowOrReturn = <T>(obj: () => T, getter: keyof T, env: string) => {
      test('should throw', () => {
        expect(() => obj()[getter]).toThrow(
          expect.objectContaining({
            message: `The environment variable ${env} is required but not defined.`,
            exit: true
          })
        );
      });

      test('should accept override', () => {
        process.env[env] = 'mock_value';

        expect(obj()[getter]).toStrictEqual('mock_value');
      });
    };

    describe('primaryHost', () => {
      test('should error and exit if "PRIMARY_HOST_BASE_URL" is undefined', () => {
        process.env['PRIMARY_HOST_PASSWORD'] = 'mypassword';

        expect(() => new EnvironmentConfig().primaryHost).toThrow(
          expect.objectContaining({
            message:
              'The environment variable PRIMARY_HOST_BASE_URL is required but not defined.',
            exit: true
          })
        );
      });

      test('should error and exit if "PRIMARY_HOST_PASSWORD" is undefined', () => {
        process.env['PRIMARY_HOST_BASE_URL'] = 'http://10.0.0.2';

        expect(() => new EnvironmentConfig().primaryHost).toThrow(
          expect.objectContaining({
            message:
              'The environment variable PRIMARY_HOST_PASSWORD is required but not defined.',
            exit: true
          })
        );
      });

      test('should return primary host and memoize value', () => {
        process.env['PRIMARY_HOST_BASE_URL'] = 'http://10.0.0.2';
        process.env['PRIMARY_HOST_PASSWORD'] = 'mypassword';

        const expected = {
          baseUrl: 'http://10.0.0.2',
          fullUrl: 'http://10.0.0.2/admin',
          path: '/admin',
          password: 'mypassword'
        };

        const config = new EnvironmentConfig();
        expect(config.primaryHost).toEqual(expected);
        resetEnv();
        expect(config.primaryHost).toEqual(expected);
      });
    });

    describe('paths', () => {
      test('should recognize https scheme', () => {
        process.env['PRIMARY_HOST_BASE_URL'] = 'https://10.0.0.2';
        process.env['PRIMARY_HOST_PASSWORD'] = 'mypassword';

        const expected = 'https://10.0.0.2';

        expect(new EnvironmentConfig().primaryHost.baseUrl).toStrictEqual(expected);
      });
      test('should add default /admin path when not provided', () => {
        process.env['PRIMARY_HOST_BASE_URL'] = 'http://10.0.0.2';
        process.env['PRIMARY_HOST_PASSWORD'] = 'mypassword';

        const expected = 'http://10.0.0.2/admin';

        expect(new EnvironmentConfig().primaryHost.fullUrl).toStrictEqual(expected);
      });

      test('should add user defined path', () => {
        process.env['PRIMARY_HOST_BASE_URL'] = 'http://10.0.0.2';
        process.env['PRIMARY_HOST_PASSWORD'] = 'mypassword';
        process.env['PRIMARY_HOST_PATH'] = '/mypath';

        const expected = 'http://10.0.0.2/mypath';
        const expectedPath = '/mypath';

        expect(new EnvironmentConfig().primaryHost.fullUrl).toStrictEqual(expected);
        expect(new EnvironmentConfig().primaryHost.path).toStrictEqual(expectedPath);
      });

      test('should handle single slash in base url', () => {
        process.env['PRIMARY_HOST_BASE_URL'] = 'http://10.0.0.2/';
        process.env['PRIMARY_HOST_PASSWORD'] = 'mypassword';

        const expected = 'http://10.0.0.2/admin';

        expect(new EnvironmentConfig().primaryHost.fullUrl).toStrictEqual(expected);
      });

      test('should trim trailing slash', () => {
        process.env['PRIMARY_HOST_BASE_URL'] = 'http://10.0.0.2';
        process.env['PRIMARY_HOST_PASSWORD'] = 'mypassword';
        process.env['PRIMARY_HOST_PATH'] = '/mypath/';

        const expected = 'http://10.0.0.2/mypath';

        expect(new EnvironmentConfig().primaryHost.fullUrl).toStrictEqual(expected);
      });

      test('should allow empty path', () => {
        process.env['PRIMARY_HOST_BASE_URL'] = 'http://10.0.0.2';
        process.env['PRIMARY_HOST_PASSWORD'] = 'mypassword';
        process.env['PRIMARY_HOST_PATH'] = '';

        const expected = 'http://10.0.0.2';

        expect(new EnvironmentConfig().primaryHost.fullUrl).toStrictEqual(expected);
      });

      test('should allow empty path from slash', () => {
        process.env['PRIMARY_HOST_BASE_URL'] = 'http://10.0.0.2';
        process.env['PRIMARY_HOST_PASSWORD'] = 'mypassword';
        process.env['PRIMARY_HOST_PATH'] = '/';

        const expected = 'http://10.0.0.2';

        expect(new EnvironmentConfig().primaryHost.fullUrl).toStrictEqual(expected);
      });

      test('should add preceeding slash if ommitted', () => {
        process.env['PRIMARY_HOST_BASE_URL'] = 'http://10.0.0.2';
        process.env['PRIMARY_HOST_PASSWORD'] = 'mypassword';
        process.env['PRIMARY_HOST_PATH'] = 'mypath';

        const expected = 'http://10.0.0.2/mypath';

        expect(new EnvironmentConfig().primaryHost.fullUrl).toStrictEqual(expected);
      });

      test('should manage double slash', () => {
        process.env['PRIMARY_HOST_BASE_URL'] = 'http://10.0.0.2/';
        process.env['PRIMARY_HOST_PASSWORD'] = 'mypassword';
        process.env['PRIMARY_HOST_PATH'] = '/mypath';

        const expected = 'http://10.0.0.2/mypath';

        expect(new EnvironmentConfig().primaryHost.fullUrl).toStrictEqual(expected);
      });

      test('should handle path provided in base url', () => {
        process.env['PRIMARY_HOST_BASE_URL'] = 'http://10.0.0.2/mypath/admin';
        process.env['PRIMARY_HOST_PASSWORD'] = 'mypassword';
        process.env['PRIMARY_HOST_PATH'] = '';

        const expected = 'http://10.0.0.2/mypath/admin';
        const expectedPath = '/mypath/admin';
        const expectedBase = 'http://10.0.0.2';

        expect(new EnvironmentConfig().primaryHost.fullUrl).toStrictEqual(expected);
        expect(new EnvironmentConfig().primaryHost.path).toStrictEqual(expectedPath);
        expect(new EnvironmentConfig().primaryHost.baseUrl).toStrictEqual(expectedBase);
      });

      test('should combine path from base url and path env', () => {
        process.env['PRIMARY_HOST_BASE_URL'] = 'http://10.0.0.2/mypath';
        process.env['PRIMARY_HOST_PASSWORD'] = 'mypassword';
        process.env['PRIMARY_HOST_PATH'] = '/admin';

        const expected = 'http://10.0.0.2/mypath/admin';
        const expectedPath = '/mypath/admin';

        expect(new EnvironmentConfig().primaryHost.fullUrl).toStrictEqual(expected);
        expect(new EnvironmentConfig().primaryHost.path).toStrictEqual(expectedPath);
      });

      test('should treat port as base url', () => {
        process.env['PRIMARY_HOST_BASE_URL'] = 'http://10.0.0.2:8080/';
        process.env['PRIMARY_HOST_PASSWORD'] = 'mypassword';
        process.env['PRIMARY_HOST_PATH'] = '/mypath';

        const expected = 'http://10.0.0.2:8080/mypath';
        const expectedPath = '/mypath';

        expect(new EnvironmentConfig().primaryHost.fullUrl).toStrictEqual(expected);
        expect(new EnvironmentConfig().primaryHost.path).toStrictEqual(expectedPath);
      });
    });

    describe('secondaryHosts', () => {
      test('should error and exit if "SECONDARY_HOST_1_BASE_URL" is undefined', () => {
        process.env['SECONDARY_HOST_1_PASSWORD'] = 'mypassword';

        expect(() => new EnvironmentConfig().secondaryHosts).toThrow(
          expect.objectContaining({
            message:
              'The environment variable SECONDARY_HOST_1_BASE_URL is required but not defined.',
            exit: true
          })
        );
      });

      test('should error and exit if "SECONDARY_HOST_1_PASSWORD" is undefined', () => {
        process.env['SECONDARY_HOST_1_BASE_URL'] = 'http://10.0.0.3';

        expect(() => new EnvironmentConfig().secondaryHosts).toThrow(
          expect.objectContaining({
            message:
              'The environment variable SECONDARY_HOST_1_PASSWORD is required but not defined.',
            exit: true
          })
        );
      });

      test('should return single secondary host and memoize value', () => {
        process.env['SECONDARY_HOST_1_BASE_URL'] = 'http://10.0.0.3';
        process.env['SECONDARY_HOST_1_PASSWORD'] = 'mypassword';

        const expected = [
          {
            baseUrl: 'http://10.0.0.3',
            password: 'mypassword',
            fullUrl: 'http://10.0.0.3/admin',
            path: '/admin'
          }
        ];

        const config = new EnvironmentConfig();
        expect(config.secondaryHosts).toEqual(expected);
        resetEnv();
        expect(config.secondaryHosts).toEqual(expected);
      });

      test('should return multiple secondary hosts', () => {
        process.env['SECONDARY_HOST_1_BASE_URL'] = 'http://10.0.0.3';
        process.env['SECONDARY_HOST_1_PASSWORD'] = 'mypassword1';
        process.env['SECONDARY_HOST_1_PATH'] = '/mypath';
        process.env['SECONDARY_HOST_2_BASE_URL'] = 'http://10.0.0.4';
        process.env['SECONDARY_HOST_2_PASSWORD'] = 'mypassword2';
        process.env['SECONDARY_HOST_2_PATH'] = '/mypath';
        process.env['SECONDARY_HOST_3_BASE_URL'] = 'http://10.0.0.5';
        process.env['SECONDARY_HOST_3_PASSWORD'] = 'mypassword3';
        process.env['SECONDARY_HOST_3_PATH'] = '/mypath';
        process.env['SECONDARY_HOST_5_BASE_URL'] = 'http://10.0.0.7';
        process.env['SECONDARY_HOST_5_PASSWORD'] = 'mypassword4';
        process.env['SECONDARY_HOST_5_PATH'] = '/mypath';

        expect(new EnvironmentConfig().secondaryHosts).toEqual([
          {
            baseUrl: 'http://10.0.0.3',
            password: 'mypassword1',
            fullUrl: 'http://10.0.0.3/mypath',
            path: '/mypath'
          },
          {
            baseUrl: 'http://10.0.0.4',
            password: 'mypassword2',
            fullUrl: 'http://10.0.0.4/mypath',
            path: '/mypath'
          },
          {
            baseUrl: 'http://10.0.0.5',
            password: 'mypassword3',
            fullUrl: 'http://10.0.0.5/mypath',
            path: '/mypath'
          }
        ]);
      });
    });

    describe('allHostBaseUrls', () => {
      test('should return all host base URLs', () => {
        process.env['PRIMARY_HOST_BASE_URL'] = 'http://10.0.0.2';
        process.env['PRIMARY_HOST_PASSWORD'] = 'mypassword1';
        process.env['SECONDARY_HOST_1_BASE_URL'] = 'http://10.0.0.3';
        process.env['SECONDARY_HOST_1_PASSWORD'] = 'mypassword2';
        process.env['SECONDARY_HOST_2_BASE_URL'] = 'http://10.0.0.4';
        process.env['SECONDARY_HOST_2_PASSWORD'] = 'mypassword3';

        expect(new EnvironmentConfig().allHostUrls).toStrictEqual([
          'http://10.0.0.2/admin',
          'http://10.0.0.3/admin',
          'http://10.0.0.4/admin'
        ]);
      });
    });

    describe('syncOptions', () => {
      test('should return defaults', () => {
        expect(new EnvironmentConfig().syncOptions).toStrictEqual({
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

        const config = new EnvironmentConfig();
        expect(config.syncOptions).toStrictEqual(expected);
        resetEnv();
        expect(config.syncOptions).toStrictEqual(expected);
      });
    });

    describe('updateGravity', () => {
      testToHaveDefaultAndOverride(
        () => new EnvironmentConfig(),
        'updateGravity',
        true,
        'UPDATE_GRAVITY'
      );
    });

    describe('verboseMode', () => {
      testToHaveDefaultAndOverride(
        () => new EnvironmentConfig(),
        'verboseMode',
        false,
        'VERBOSE'
      );
    });

    describe('notify', () => {
      describe('onSuccess', () => {
        testToHaveDefaultAndOverride(
          () => new EnvironmentConfig().notify,
          'onSuccess',
          false,
          'NOTIFY_ON_SUCCESS'
        );
      });

      describe('onFailure', () => {
        testToHaveDefaultAndOverride(
          () => new EnvironmentConfig().notify,
          'onFailure',
          true,
          'NOTIFY_ON_FAILURE'
        );
      });

      describe('smtp', () => {
        beforeEach(() => {
          process.env['NOTIFY_VIA_SMTP'] = 'true';
          process.env['SMTP_HOST'] = 'smtp.example.com';
          process.env['SMTP_TO'] = 'orbital@example.com';
        });

        describe('enabled', () => {
          beforeEach(() => (process.env['NOTIFY_VIA_SMTP'] = undefined));

          testToHaveDefaultAndOverride(
            () => new EnvironmentConfig().notify.smtp,
            'enabled',
            false,
            'NOTIFY_VIA_SMTP'
          );
        });

        describe('host', () => {
          beforeEach(() => (process.env['SMTP_HOST'] = undefined));

          testToThrowOrReturn(
            () => new EnvironmentConfig().notify.smtp as EnabledSmtpConfig,
            'host',
            'SMTP_HOST'
          );
        });

        describe('port', () => {
          testToHaveDefaultAndOverride(
            () => new EnvironmentConfig().notify.smtp as EnabledSmtpConfig,
            'port',
            '587',
            'SMTP_PORT'
          );
        });

        describe('tls', () => {
          testToHaveDefaultAndOverride(
            () => new EnvironmentConfig().notify.smtp as EnabledSmtpConfig,
            'tls',
            false,
            'SMTP_TLS'
          );
        });

        describe('user', () => {
          testToHaveDefaultAndOverride(
            () => new EnvironmentConfig().notify.smtp as EnabledSmtpConfig,
            'user',
            undefined,
            'SMTP_USER'
          );
        });

        describe('password', () => {
          testToHaveDefaultAndOverride(
            () => new EnvironmentConfig().notify.smtp as EnabledSmtpConfig,
            'password',
            undefined,
            'SMTP_PASSWORD'
          );
        });

        describe('from', () => {
          testToHaveDefaultAndOverride(
            () => new EnvironmentConfig().notify.smtp as EnabledSmtpConfig,
            'from',
            undefined,
            'SMTP_FROM'
          );
        });

        describe('to', () => {
          beforeEach(() => (process.env['SMTP_TO'] = undefined));

          testToThrowOrReturn(
            () => new EnvironmentConfig().notify.smtp as EnabledSmtpConfig,
            'to',
            'SMTP_TO'
          );
        });
      });

      describe('exceptions', () => {
        describe('honeybadgerApiKey', () => {
          testToHaveDefaultAndOverride(
            () => new EnvironmentConfig().notify.exceptions,
            'honeybadgerApiKey',
            undefined,
            'HONEYBADGER_API_KEY'
          );
        });

        describe('sentryDsn', () => {
          testToHaveDefaultAndOverride(
            () => new EnvironmentConfig().notify.exceptions,
            'sentryDsn',
            undefined,
            'SENTRY_DSN'
          );
        });
      });
    });

    describe('runOnce', () => {
      testToHaveDefaultAndOverride(
        () => new EnvironmentConfig(),
        'runOnce',
        false,
        'RUN_ONCE'
      );
    });

    describe('intervalMinutes', () => {
      test('should return default value', () => {
        expect(new EnvironmentConfig().intervalMinutes).toStrictEqual(30);
      });

      test('should disregard bad values', async () => {
        process.env['INTERVAL_MINUTES'] = '-1';
        expect(new EnvironmentConfig().intervalMinutes).toStrictEqual(30);

        process.env['INTERVAL_MINUTES'] = 'abc';
        expect(new EnvironmentConfig().intervalMinutes).toStrictEqual(30);

        process.env['INTERVAL_MINUTES'] = '0';
        expect(new EnvironmentConfig().intervalMinutes).toStrictEqual(30);
      });

      test('should accept override and memoize', () => {
        process.env['INTERVAL_MINUTES'] = '5';

        const config = new EnvironmentConfig();
        expect(config.intervalMinutes).toStrictEqual(5);
        resetEnv();
        expect(config.intervalMinutes).toStrictEqual(5);
      });
    });
  });
});
