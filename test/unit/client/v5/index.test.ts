import nock from 'nock';
import { Blob } from 'node-fetch';
import { ClientV5 } from '../../../../src/client/v5';
import { Config } from '../../../../src/config/index';
import { ErrorNotification } from '../../../../src/notify';
import { Log } from '../../../../src/log';
import { Version } from '../../../../src/config/version';
import { HostV5 } from '../../../../src/host/v5';

describe('Client', () => {
  describe('V5', () => {
    const host = new HostV5({
      baseUrl: 'http://10.0.0.2',
      password: 'mypassword',
      path: '/admin'
    });
    const config = Config(Version.v5, {
      sync: {
        primaryHost: { baseUrl: host.baseUrl, password: host.password },
        secondaryHosts: [{ baseUrl: host.baseUrl, password: host.password }]
      }
    });
    const log = new Log(false);

    const createClient = async () => {
      nock(host.fullUrl).get('/index.php?login').reply(200);
      nock(host.fullUrl)
        .post('/index.php?login')
        .reply(
          200,
          '<html><body><div id="token">abcdefgijklmnopqrstuvwxyzabcdefgijklmnopqrst</div></body></html>'
        );

      return {
        teleporter: nock(host.fullUrl),
        client: await ClientV5.create({ host, config, log })
      };
    };

    beforeEach(() => {
      nock.disableNetConnect();
    });

    describe('create', () => {
      test('should throw error if status code is not ok', async () => {
        const initialRequest = nock(host.fullUrl).get('/index.php?login').reply(200);
        const loginRequest = nock(host.fullUrl).post('/index.php?login').reply(500);

        const expectError = expect(ClientV5.create({ host, config, log })).rejects;

        await expectError.toBeInstanceOf(ErrorNotification);
        await expectError.toMatchObject({
          message:
            'There was an error logging in to "http://10.0.0.2/admin" - are you able to log in with the configured password?',
          verbose: {
            host: 'http://10.0.0.2',
            path: '/admin',
            status: 500,
            responseBody: ''
          }
        });
        initialRequest.done();
        loginRequest.done();
      });

      test('should throw error if no token is present', async () => {
        const initialRequest = nock(host.fullUrl).get('/index.php?login').reply(200);
        const loginRequest = nock(host.fullUrl).post('/index.php?login').reply(200);

        const expectError = expect(ClientV5.create({ host, config, log })).rejects;

        await expectError.toBeInstanceOf(ErrorNotification);
        await expectError.toMatchObject({
          message:
            'No token could be found while logging in to "http://10.0.0.2/admin" - are you able to log in with the configured password?',
          verbose: {
            host: 'http://10.0.0.2',
            path: '/admin',
            innerHtml: ''
          }
        });
        initialRequest.done();
        loginRequest.done();
      });

      test('should throw error if token is in incorrect format', async () => {
        const initialRequest = nock(host.fullUrl).get('/index.php?login').reply(200);
        const loginRequest = nock(host.fullUrl)
          .post('/index.php?login')
          .reply(200, '<html><body><div id="token">abcdef</div></body></html>');

        const expectError = expect(ClientV5.create({ host, config, log })).rejects;

        await expectError.toBeInstanceOf(ErrorNotification);
        await expectError.toMatchObject({
          message:
            'A token was found but could not be validated while logging in to "http://10.0.0.2/admin" - are you able to log in with the configured password?',
          verbose: {
            host: 'http://10.0.0.2',
            path: '/admin',
            token: 'abcdef'
          }
        });
        initialRequest.done();
        loginRequest.done();
      });

      test('should return client', async () => {
        const initialRequest = nock(host.fullUrl).get('/index.php?login').reply(200);
        const loginRequest = nock(host.fullUrl)
          .post('/index.php?login')
          .reply(
            200,
            '<html><body><div id="token">abcdefgijklmnopqrstuvwxyzabcdefgijklmnopqrst</div></body></html>'
          );

        await expect(ClientV5.create({ host, config, log })).resolves.toBeInstanceOf(
          ClientV5
        );

        initialRequest.done();
        loginRequest.done();
      });
    });

    describe('makeBackup', () => {
      let client: ClientV5;
      let teleporter: nock.Scope;

      beforeEach(async () => {
        ({ client, teleporter } = await createClient());
      });

      afterEach(() => {
        teleporter.done();
      });

      test('should throw error if response is non-200', async () => {
        teleporter.post('/scripts/pi-hole/php/teleporter.php').reply(500);

        const expectError = expect(client.makeBackup()).rejects;

        await expectError.toBeInstanceOf(ErrorNotification);
        await expectError.toMatchObject({
          message: 'Failed to download backup from "http://10.0.0.2/admin".',
          verbose: {
            host: 'http://10.0.0.2',
            path: '/admin',
            status: 500,
            responseBody: ''
          }
        });
      });

      test('should throw error if content type is not gzip', async () => {
        teleporter
          .post('/scripts/pi-hole/php/teleporter.php')
          .reply(200, undefined, { 'content-type': 'text/html' });

        const expectError = expect(client.makeBackup()).rejects;

        await expectError.toBeInstanceOf(ErrorNotification);
        await expectError.toMatchObject({
          message: 'Failed to download backup from "http://10.0.0.2/admin".',
          verbose: {
            host: 'http://10.0.0.2',
            path: '/admin',
            status: 200,
            responseBody: ''
          }
        });
      });

      test('should return response data', async () => {
        let requestBody = '';
        teleporter
          .post('/scripts/pi-hole/php/teleporter.php', (body) => (requestBody = body))
          .reply(200, undefined, { 'content-type': 'application/gzip' });

        const backup = await client.makeBackup();

        expect(backup).toBeInstanceOf(Blob);
        expect(requestBody).toContain(
          'name="token"\r\n\r\nabcdefgijklmnopqrstuvwxyzabcdefgijklmnopqrst'
        );
        expect(requestBody).toContain('name="whitelist"\r\n\r\ntrue');
        expect(requestBody).toContain('name="regex_whitelist"\r\n\r\ntrue');
        expect(requestBody).toContain('name="blacklist"\r\n\r\ntrue');
        expect(requestBody).toContain('name="regexlist"\r\n\r\ntrue');
        expect(requestBody).toContain('name="adlist"\r\n\r\ntrue');
        expect(requestBody).toContain('name="client"\r\n\r\ntrue');
        expect(requestBody).toContain('name="group"\r\n\r\ntrue');
        expect(requestBody).not.toContain('name="auditlog"');
        expect(requestBody).not.toContain('name="staticdhcpleases"');
        expect(requestBody).toContain('name="localdnsrecords"\r\n\r\ntrue');
        expect(requestBody).toContain('name="localcnamerecords"\r\n\r\ntrue');
        expect(requestBody).toContain('name="flushtables"\r\n\r\ntrue');
        expect(requestBody).not.toContain('name="action"\r\n\r\nin');
        expect(requestBody).not.toContain('name="zip_file"\r\n\r\nin');
        expect(requestBody.match(/Content-Disposition: form-data; name=/g)).toHaveLength(
          11
        );
      });
    });

    describe('restoreBackup', () => {
      const backup = new Blob([]);
      let client: ClientV5;
      let teleporter: nock.Scope;

      beforeEach(async () => {
        ({ client, teleporter } = await createClient());
      });

      afterEach(() => {
        teleporter.done();
      });

      test('should throw error if response is non-200', async () => {
        teleporter.post('/scripts/pi-hole/php/teleporter.php').reply(500);

        const expectError = expect(client.restoreBackup(backup)).rejects;

        await expectError.toBeInstanceOf(ErrorNotification);
        await expectError.toMatchObject({
          message: 'Failed to upload backup to "http://10.0.0.2/admin".',
          verbose: {
            host: 'http://10.0.0.2',
            path: '/admin',
            status: 500,
            responseBody: ''
          }
        });
      });

      test('should throw error if response does not end with "OK" or "Done importing"', async () => {
        teleporter.post('/scripts/pi-hole/php/teleporter.php').reply(200);

        const expectError = expect(client.restoreBackup(backup)).rejects;

        await expectError.toBeInstanceOf(ErrorNotification);
        await expectError.toMatchObject({
          message: 'Failed to upload backup to "http://10.0.0.2/admin".',
          verbose: {
            host: 'http://10.0.0.2',
            path: '/admin',
            status: 200,
            responseBody: ''
          }
        });
      });
    });

    // describe('updateGravity', () => {
    //   let client: ClientV5;
    //   let teleporter: nock.Scope;

    //   beforeEach(async () => {
    //     ({ client, teleporter } = await createClient());
    //   });

    //   afterEach(() => {
    //     teleporter.done();
    //   });

    //   // test('should upload backup and update gravity successfully', async () => {
    //   //   teleporter
    //   //     .get('/scripts/pi-hole/php/gravity.sh.php', undefined)
    //   //     .reply(
    //   //       200,
    //   //       '\ndata: \n\ndata:      [✓] TCP (IPv6)\ndata: \ndata: \n\ndata:   [✓] Pi-hole blocking is enabled\ndata: \n\ndata:'
    //   //     );

    //   //   const result = await client.updateGravity();

    //   //   expect(result).toStrictEqual(true);
    //   // });

    //   // test('should throw error if gravity update fails', async () => {
    //   //   teleporter
    //   //     .get('/scripts/pi-hole/php/gravity.sh.php', undefined)
    //   //     .reply(200, '\ndata: \n\ndata:      [✓] TCP (IPv6)\ndata: \ndata: \n\ndata:');

    //   //   const expectError = expect(client.updateGravity()).rejects;

    //   //   await expectError.toBeInstanceOf(ErrorNotification);
    //   //   await expectError.toMatchObject({
    //   //     message: 'Failed updating gravity on "http://10.0.0.2/admin".',
    //   //     verbose: {
    //   //       host: 'http://10.0.0.2',
    //   //       path: '/admin',
    //   //       status: 200,
    //   //       eventStream: '[✓] TCP (IPv6)'
    //   //     }
    //   //   });
    //   // });
    // });
  });
});
