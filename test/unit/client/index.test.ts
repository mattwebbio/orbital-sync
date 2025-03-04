import nock from 'nock';
import { ClientFactory } from '../../../src/client';
import { Host } from '../../../src/client/host';
import { Config, SyncOptionsV5, SyncOptionsV6, Version } from '../../../src/config/index';
import { Log } from '../../../src/log';
import { ClientV5 } from '../../../src/client/v5';
import { ClientV6 } from '../../../src/client/v6';

describe('Client', () => {
  const goodResponse =
    '{"session":{"valid":true,"totp":true,"sid":"IEFZjjlRXX0FMaemtB8opQ=","csrf":"+Y5Qx4Qxa5XXYSzz8Nu7gw=","validity":1800,"message":"app-password correct"},"took":0.074608087539672852}';
  const host = new Host({
    baseUrl: 'http://10.0.0.2',
    password: 'mypassword'
  });
  const config = Config({
    piHoleVersion: 'auto',
    primaryHost: { baseUrl: host.baseUrl, password: host.password },
    secondaryHosts: [{ baseUrl: host.baseUrl, password: host.password }]
  });
  const log = new Log(false);

  const createClient = async ({
    host,
    version,
    options,
    log
  }: {
    host: Host;
    version: Version;
    options: SyncOptionsV6 | SyncOptionsV5;
    log: Log;
  }) => {
    // V6 requests
    nock(host.baseUrl).get('/api/auth').reply(200);
    nock(host.baseUrl).post('/api/auth').reply(200, goodResponse);
    // V5 requests
    nock(host.fullUrl).get('/admin/index.php?login').reply(200);
    nock(host.fullUrl)
      .post('/admin/index.php?login')
      .reply(
        200,
        '<html><body><div id="token">abcdefgijklmnopqrstuvwxyzabcdefgijklmnopqrst</div></body></html>'
      );

    return await ClientFactory.createClient({ host, log, options, version });
  };

  beforeEach(() => {
    nock.disableNetConnect();
  });

  describe('create', () => {
    test('should return client v5', async () => {
      await expect(
        createClient({ host, version: '5', log, options: config.sync.v5 })
      ).resolves.toBeInstanceOf(ClientV5);
    });

    test('should return client v6', async () => {
      await expect(
        createClient({ host, version: '6', log, options: config.sync.v6 })
      ).resolves.toBeInstanceOf(ClientV6);
    });

    test('should return client v5 from auto', async () => {
      const initialRequest = nock(host.baseUrl).get('/api/docs').reply(404);

      await expect(
        createClient({ host, version: 'auto', log, options: config.sync.v5 })
      ).resolves.toBeInstanceOf(ClientV5);

      initialRequest.done();
    });

    test('should return client v6 from auto', async () => {
      const initialRequest = nock(host.baseUrl).get('/api/docs').reply(200);

      await expect(
        createClient({ host, version: 'auto', log, options: config.sync.v6 })
      ).resolves.toBeInstanceOf(ClientV6);

      initialRequest.done();
    });

    test('should return client v6 from exception', async () => {
      await expect(
        createClient({ host, version: 'auto', log, options: config.sync.v6 })
      ).resolves.toBeInstanceOf(ClientV6);
    });
  });
});
