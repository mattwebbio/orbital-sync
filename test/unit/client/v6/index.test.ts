import nock from 'nock';
import { Blob } from 'node-fetch';
import { ClientV6 } from '../../../../src/client/v6';
import { Host } from '../../../../src/client/host';
import { Config } from '../../../../src/config/index';
import { ErrorNotification } from '../../../../src/notify';
import { Log } from '../../../../src/log';

describe('Client', () => {
  describe('V6', () => {
    const goodResponse =
      '{"session":{"valid":true,"totp":true,"sid":"IEFZjjlRXX0FMaemtB8opQ=","csrf":"+Y5Qx4Qxa5XXYSzz8Nu7gw=","validity":1800,"message":"app-password correct"},"took":0.074608087539672852}';
    const host = new Host({
      baseUrl: 'http://10.0.0.2',
      password: 'mypassword'
    });
    const config = Config({
      primaryHost: { baseUrl: host.baseUrl, password: host.password },
      secondaryHosts: [{ baseUrl: host.baseUrl, password: host.password }]
    });
    const log = new Log(false);

    const createClient = async () => {
      nock(host.baseUrl).get('/api/auth').reply(200);
      nock(host.baseUrl).post('/api/auth').reply(200, goodResponse);

      return {
        teleporter: nock(host.baseUrl),
        client: await ClientV6.create({ host, log, options: config.sync.v6 })
      };
    };

    beforeEach(() => {
      nock.disableNetConnect();
    });

    describe('create', () => {
      test('should throw error if status code is not ok', async () => {
        const initialRequest = nock(host.baseUrl).get('/api/auth').reply(200);
        const loginRequest = nock(host.baseUrl).post('/api/auth').reply(500);

        const expectError = expect(
          ClientV6.create({ host, log, options: config.sync.v6 })
        ).rejects;

        await expectError.toBeInstanceOf(ErrorNotification);
        await expectError.toMatchObject({
          message:
            'There was an error logging in to "http://10.0.0.2" - are you able to log in with the configured password?',
          verbose: {
            host: 'http://10.0.0.2',
            path: '/api/auth',
            status: 500,
            responseBody: ''
          }
        });
        initialRequest.done();
        loginRequest.done();
      });

      test('should return client', async () => {
        const initialRequest = nock(host.baseUrl).get('/api/auth').reply(200);
        const loginRequest = nock(host.baseUrl)
          .post('/api/auth')
          .reply(200, goodResponse);

        await expect(
          ClientV6.create({ host, log, options: config.sync.v6 })
        ).resolves.toBeInstanceOf(ClientV6);

        initialRequest.done();
        loginRequest.done();
      });
    });

    describe('downloadBackup', () => {
      let client: ClientV6;
      let teleporter: nock.Scope;

      beforeEach(async () => {
        ({ client, teleporter } = await createClient());
      });

      afterEach(() => {
        teleporter.done();
      });

      test('should throw error if response is non-200', async () => {
        teleporter.get('/api/teleporter').reply(500);

        const expectError = expect(client.downloadBackup()).rejects;

        await expectError.toBeInstanceOf(ErrorNotification);
        await expectError.toMatchObject({
          message: 'Failed to download backup from "http://10.0.0.2".',
          verbose: {
            host: 'http://10.0.0.2',
            path: '/api/teleporter',
            status: 500,
            responseBody: ''
          }
        });
      });

      test('should return response data', async () => {
        teleporter.get('/api/teleporter').reply(200, undefined, {
          'content-type': 'application/zip',
          'content-disposition': 'attachement; filename="backup.zip"'
        });

        const backup = await client.downloadBackup();

        expect(backup).toBeInstanceOf(Blob);
      });
    });

    describe('uploadBackup', () => {
      const backup = new Blob([]);
      let client: ClientV6;
      let teleporter: nock.Scope;

      beforeEach(async () => {
        ({ client, teleporter } = await createClient());
      });

      afterEach(() => {
        teleporter.done();
      });

      test('should return success if response is 200', async () => {
        teleporter.post('/api/teleporter').reply(200);

        const response = expect(client.uploadBackup(backup)).resolves;

        await response.toEqual(true);
      });

      test('should throw error if response is non-200', async () => {
        teleporter.post('/api/teleporter').reply(500);

        const expectError = expect(client.uploadBackup(backup)).rejects;

        await expectError.toBeInstanceOf(ErrorNotification);
        await expectError.toMatchObject({
          message: 'Failed to upload backup to "http://10.0.0.2".',
          verbose: {
            host: 'http://10.0.0.2',
            path: '/api/teleporter',
            status: 500,
            responseBody: ''
          }
        });
      });
    });

    describe('updateGravity', () => {
      let client: ClientV6;
      let teleporter: nock.Scope;

      beforeEach(async () => {
        ({ client, teleporter } = await createClient());
      });

      afterEach(() => {
        teleporter.done();
      });

      test('should upload backup and update gravity successfully', async () => {
        teleporter
          .post('/api/action/gravity', undefined)
          .reply(200, '[✓] TCP (IPv6)\n[✓] Pi-hole blocking is enabled\n[✓] Done');

        const result = await client.updateGravity();

        expect(result).toStrictEqual(true);
      });

      test('should throw error if gravity update fails', async () => {
        teleporter.post('/api/action/gravity', undefined).reply(401, '');

        const expectError = expect(client.updateGravity()).rejects;

        await expectError.toBeInstanceOf(ErrorNotification);
        await expectError.toMatchObject({
          message: 'Failed updating gravity on "http://10.0.0.2".',
          verbose: {
            host: 'http://10.0.0.2',
            path: '/api/action/gravity',
            status: 401,
            eventStream: ''
          }
        });
      });
    });
  });
});
