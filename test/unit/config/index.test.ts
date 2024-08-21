import { writeFile } from 'node:fs/promises';
import { temporaryFile } from 'tempy';
import { Config } from '../../../src/config/index';
import { Version } from '../../../src/config/version';

describe('Config', () => {
  const initialEnv = Object.assign({}, process.env);

  afterEach(() => {
    process.env = Object.assign({}, initialEnv);
  });

  it('should generate configuration', () => {
    process.env['VERSION'] = 'v5';
    process.env['PRIMARY_HOST_BASE_URL'] = 'http://localhost:3000';
    process.env['PRIMARY_HOST_PASSWORD'] = 'password';

    process.env['SECONDARY_HOST_1_BASE_URL'] = 'http://localhost:3001';
    process.env['SECONDARY_HOST_1_PASSWORD'] = 'password';

    const config = Config();
    expect(config).toEqual({
      version: Version.v5.valueOf(),
      sync: {
        primaryHost: {
          baseUrl: 'http://localhost:3000',
          password: 'password',
          path: undefined
        },
        secondaryHosts: [
          {
            baseUrl: 'http://localhost:3001',
            password: 'password',
            path: undefined
          }
        ],
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
        whitelist: true,
        updateGravity: true
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
      verbose: false
    });
  });

  it('should read passwords from files', async () => {
    const passwordFile1 = temporaryFile();
    await writeFile(passwordFile1, 'password_from_file_1', 'utf-8');
    const passwordFile2 = temporaryFile();
    await writeFile(passwordFile2, 'password_from_file_2\n', 'utf-8');

    process.env['VERSION'] = 'v5';
    process.env['PRIMARY_HOST_BASE_URL'] = 'http://localhost:3000';
    process.env['PRIMARY_HOST_BASE_URL'] = 'http://localhost:3000';
    process.env['SYNC_PRIMARY_HOST_PASSWORD_FILE'] = passwordFile1;

    process.env['SECONDARY_HOST_1_BASE_URL'] = 'http://localhost:3001';
    process.env['SYNC_SECONDARY_HOSTS_1_PASSWORD_FILE'] = passwordFile2;

    const config = Config();
    expect(config).toEqual({
      version: Version.v5.valueOf(),
      sync: {
        primaryHost: {
          baseUrl: 'http://localhost:3000',
          password: 'password_from_file_1',
          path: undefined
        },
        secondaryHosts: [
          {
            baseUrl: 'http://localhost:3001',
            password: 'password_from_file_2',
            path: undefined
          }
        ],
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
        whitelist: true,
        updateGravity: true
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
      verbose: false
    });
  });
});
