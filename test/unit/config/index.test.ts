import { writeFile } from 'node:fs/promises';
import { temporaryFile } from 'tempy';
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
      piHoleVersion: 'auto',
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
        },
        v6: {
          adlist: true,
          adlist_by_group: true,
          client: true,
          client_by_group: true,
          dhcp_leases: true,
          domainlist: true,
          domainlist_by_group: true,
          group: true
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

  it('should read passwords from files', async () => {
    const passwordFile1 = temporaryFile();
    await writeFile(passwordFile1, 'password_from_file_1', 'utf-8');
    const passwordFile2 = temporaryFile();
    await writeFile(passwordFile2, 'password_from_file_2\n', 'utf-8');

    process.env['PRIMARY_HOST_BASE_URL'] = 'http://localhost:3000';
    process.env['PRIMARY_HOST_PASSWORD_FILE'] = passwordFile1;

    process.env['SECONDARY_HOSTS_1_BASE_URL'] = 'http://localhost:3001';
    process.env['SECONDARY_HOSTS_1_PASSWORD_FILE'] = passwordFile2;

    const config = Config();
    expect(config).toEqual({
      piHoleVersion: 'auto',
      primaryHost: {
        baseUrl: 'http://localhost:3000',
        password: 'password_from_file_1'
      },
      secondaryHosts: [
        {
          baseUrl: 'http://localhost:3001',
          password: 'password_from_file_2'
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
        },
        v6: {
          adlist: true,
          adlist_by_group: true,
          client: true,
          client_by_group: true,
          dhcp_leases: true,
          domainlist: true,
          domainlist_by_group: true,
          group: true
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
