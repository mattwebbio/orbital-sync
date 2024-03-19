import { Config } from '../../../src/config/index';

describe('Config', () => {
  const initialEnv = Object.assign({}, process.env);

  afterEach(() => {
    process.env = Object.assign({}, initialEnv);
  });

  it('should generate configuration', () => {
    process.env['PRIMARY_HOST_BASE_URL'] = 'http://localhost:3000';
    process.env['PRIMARY_HOST_PASSWORD'] = 'password';

    process.env['SECONDARY_HOSTS_1_BASE_URL'] = 'http://localhost:3001';
    process.env['SECONDARY_HOSTS_1_PASSWORD'] = 'password';

    const config = Config();
    expect(config).toEqual({
      primaryHost: {
        baseUrl: 'http://localhost:3000',
        password: 'password'
      },
      secondaryHosts: [
        {
          baseUrl: 'http://localhost:3001',
          password: 'password'
        }
      ],
      sync: {
        v5: {
          adList: true,
          auditLog: false,
          blacklist: true,
          client: true,
          flushTables: true,
          group: true,
          localCnameRecords: true,
          localDnsRecords: true,
          regexList: true,
          regexWhitelist: true,
          staticDhcpLeases: false,
          whitelist: true
        }
      },
      notify: {
        exceptions: {
          honeybadgerApiKey: undefined,
          sentryDsn: undefined
        },
        onFailure: true,
        onSuccess: false,
        smtp: {
          enabled: false,
          from: undefined,
          host: undefined,
          password: undefined,
          port: undefined,
          tls: false,
          to: undefined,
          user: undefined
        }
      },
      intervalMinutes: 60,
      runOnce: false,
      updateGravity: true,
      verbose: false
    });
  });
});
