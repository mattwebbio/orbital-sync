import { jest } from '@jest/globals';
import nock from 'nock';
import { Blob } from 'node-fetch';
import { Client } from './client';
import { Host } from './config';
import { Config } from './config';
import { ErrorNotification } from './notify';

describe('Client', () => {
  const host = new Host('http://10.0.0.2', 'mypassword');

  const createClient = async () => {
    nock(host.fullUrl).get('/index.php?login').reply(200);
    nock(host.fullUrl)
      .post('/index.php?login')
      .reply(
        200,
        '<html><body><div id="token">abcdefgijklmnopqrstuvwxyzabcdefgijklmnopqrst</div></body></html>'
      );

    return { teleporter: nock(host.fullUrl), client: await Client.create(host) };
  };

  beforeEach(() => {
    nock.disableNetConnect();
  });

  describe('create', () => {
    test('should throw error if status code is not ok', async () => {
      const initialRequest = nock(host.fullUrl).get('/index.php?login').reply(200);
      const loginRequest = nock(host.fullUrl).post('/index.php?login').reply(500);

      const expectError = expect(Client.create(host)).rejects;

      await expectError.toBeInstanceOf(ErrorNotification);
      await expectError.toMatchObject({
        message:
          'There was an error logging in to "http://10.0.0.2" - are you able to log in with the configured password?',
        verbose: {
          host: 'http://10.0.0.2',
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

      const expectError = expect(Client.create(host)).rejects;

      await expectError.toBeInstanceOf(ErrorNotification);
      await expectError.toMatchObject({
        message:
          'No token could be found while logging in to "http://10.0.0.2" - are you able to log in with the configured password?',
        verbose: {
          host: 'http://10.0.0.2',
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

      const expectError = expect(Client.create(host)).rejects;

      await expectError.toBeInstanceOf(ErrorNotification);
      await expectError.toMatchObject({
        message:
          'A token was found but could not be validated while logging in to "http://10.0.0.2" - are you able to log in with the configured password?',
        verbose: {
          host: 'http://10.0.0.2',
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

      await expect(Client.create(host)).resolves.toBeInstanceOf(Client);

      initialRequest.done();
      loginRequest.done();
    });
  });

  describe('downloadBackup', () => {
    let client: Client;
    let teleporter: nock.Scope;

    beforeEach(async () => {
      ({ client, teleporter } = await createClient());
    });

    afterEach(() => {
      teleporter.done();
    });

    test('should throw error if response is non-200', async () => {
      teleporter.post('/scripts/pi-hole/php/teleporter.php').reply(500);

      const expectError = expect(client.downloadBackup()).rejects;

      await expectError.toBeInstanceOf(ErrorNotification);
      await expectError.toMatchObject({
        message: 'Failed to download backup from "http://10.0.0.2".',
        verbose: {
          host: 'http://10.0.0.2',
          status: 500,
          responseBody: ''
        }
      });
    });

    test('should throw error if content type is not gzip', async () => {
      teleporter
        .post('/scripts/pi-hole/php/teleporter.php')
        .reply(200, undefined, { 'content-type': 'text/html' });

      const expectError = expect(client.downloadBackup()).rejects;

      await expectError.toBeInstanceOf(ErrorNotification);
      await expectError.toMatchObject({
        message: 'Failed to download backup from "http://10.0.0.2".',
        verbose: {
          host: 'http://10.0.0.2',
          status: 200,
          responseBody: ''
        }
      });
    });

    test('should return response data', async () => {
      const syncOptions = jest.spyOn(Config, 'syncOptions', 'get');

      let requestBody = '';
      teleporter
        .post('/scripts/pi-hole/php/teleporter.php', (body) => (requestBody = body))
        .reply(200, undefined, { 'content-type': 'application/gzip' });

      const backup = await client.downloadBackup();

      expect(backup).toBeInstanceOf(Blob);
      expect(syncOptions).toHaveBeenCalled();
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
      expect(requestBody).toContain('name="auditlog"\r\n\r\nfalse');
      expect(requestBody).toContain('name="staticdhcpleases"\r\n\r\nfalse');
      expect(requestBody).toContain('name="localdnsrecords"\r\n\r\ntrue');
      expect(requestBody).toContain('name="localcnamerecords"\r\n\r\ntrue');
      expect(requestBody).toContain('name="flushtables"\r\n\r\ntrue');
      expect(requestBody).not.toContain('name="action"\r\n\r\nin');
      expect(requestBody).not.toContain('name="zip_file"\r\n\r\nin');
      expect(requestBody.match(/Content-Disposition: form-data; name=/g)).toHaveLength(
        13
      );
    });
  });

  describe('uploadBackup', () => {
    const backup = new Blob([]);
    let client: Client;
    let teleporter: nock.Scope;

    beforeEach(async () => {
      ({ client, teleporter } = await createClient());
    });

    afterEach(() => {
      teleporter.done();
    });

    test('should throw error if response is non-200', async () => {
      teleporter.post('/scripts/pi-hole/php/teleporter.php').reply(500);

      const expectError = expect(client.uploadBackup(backup)).rejects;

      await expectError.toBeInstanceOf(ErrorNotification);
      await expectError.toMatchObject({
        message: 'Failed to upload backup to "http://10.0.0.2".',
        verbose: {
          host: 'http://10.0.0.2',
          status: 500,
          responseBody: ''
        }
      });
    });

    test('should throw error if response does not end with "OK"', async () => {
      teleporter.post('/scripts/pi-hole/php/teleporter.php').reply(200);

      const expectError = expect(client.uploadBackup(backup)).rejects;

      await expectError.toBeInstanceOf(ErrorNotification);
      await expectError.toMatchObject({
        message: 'Failed to upload backup to "http://10.0.0.2".',
        verbose: {
          host: 'http://10.0.0.2',
          status: 200,
          responseBody: ''
        }
      });
    });

    test('should throw error if gravity update fails', async () => {
      teleporter
        .post('/scripts/pi-hole/php/teleporter.php')
        .reply(
          200,
          'Processed adlist (14 entries)<br>\n' +
          'Processed adlist group assignments (13 entries)<br>\n' +
          'Processed blacklist (exact) (0 entries)<br>\n' +
          'Processed blacklist (regex) (3 entries)<br>\n' +
          'Processed client (8 entries)<br>\n' +
          'Processed client group assignments (16 entries)<br>\n' +
          'Processed local DNS records (41 entries)<br>\n' +
          'Processed domain_audit (0 entries)<br>\n' +
          'Processed black-/whitelist group assignments (10 entries)<br>\n' +
          'Processed group (3 entries)<br>\n' +
          'Processed whitelist (exact) (4 entries)<br>\n' +
          'Processed whitelist (regex) (0 entries)<br>\n' +
          'OK'
        );
      teleporter
        .get('/scripts/pi-hole/php/gravity.sh.php', undefined)
        .reply(200, '\ndata: \n\ndata:      [✓] TCP (IPv6)\ndata: \ndata: \n\ndata:');

      const expectError = expect(client.uploadBackup(backup)).rejects;

      await expectError.toBeInstanceOf(ErrorNotification);
      await expectError.toMatchObject({
        message: 'Failed updating gravity on "http://10.0.0.2".',
        verbose: {
          host: 'http://10.0.0.2',
          status: 200,
          eventStream: '[✓] TCP (IPv6)'
        }
      });
    });

    test('should upload backup and update gravity successfully', async () => {
      const syncOptions = jest.spyOn(Config, 'syncOptions', 'get');

      let requestBody = '';
      teleporter
        .post('/scripts/pi-hole/php/teleporter.php', (body) => (requestBody = body))
        .reply(
          200,
          'Processed adlist (14 entries)<br>\n' +
          'Processed adlist group assignments (13 entries)<br>\n' +
          'Processed blacklist (exact) (0 entries)<br>\n' +
          'Processed blacklist (regex) (3 entries)<br>\n' +
          'Processed client (8 entries)<br>\n' +
          'Processed client group assignments (16 entries)<br>\n' +
          'Processed local DNS records (41 entries)<br>\n' +
          'Processed domain_audit (0 entries)<br>\n' +
          'Processed black-/whitelist group assignments (10 entries)<br>\n' +
          'Processed group (3 entries)<br>\n' +
          'Processed whitelist (exact) (4 entries)<br>\n' +
          'Processed whitelist (regex) (0 entries)<br>\n' +
          'OK'
        );
      teleporter
        .get('/scripts/pi-hole/php/gravity.sh.php', undefined)
        .reply(
          200,
          '\ndata: \n\ndata:      [✓] TCP (IPv6)\ndata: \ndata: \n\ndata:   [✓] Pi-hole blocking is enabled\ndata: \n\ndata:'
        );

      const result = await client.uploadBackup(backup);

      expect(result).toStrictEqual(true);
      expect(syncOptions).toHaveBeenCalled();
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
      expect(requestBody).toContain('name="auditlog"\r\n\r\nfalse');
      expect(requestBody).toContain('name="staticdhcpleases"\r\n\r\nfalse');
      expect(requestBody).toContain('name="localdnsrecords"\r\n\r\ntrue');
      expect(requestBody).toContain('name="localcnamerecords"\r\n\r\ntrue');
      expect(requestBody).toContain('name="flushtables"\r\n\r\ntrue');
      expect(requestBody).toContain('name="action"\r\n\r\nin');
      expect(requestBody).toContain(
        'name="zip_file"; filename="backup.tar.gz"\r\nContent-Type: application/octet-stream'
      );
      expect(requestBody.match(/Content-Disposition: form-data; name=/g)).toHaveLength(
        15
      );
    });

    test('should not update gravity if `updateGravity` is disabled', async () => {
      const syncOptions = jest.spyOn(Config, 'syncOptions', 'get');
      const updateGravity = jest
        .spyOn(Config, 'updateGravity', 'get')
        .mockReturnValue(false);

      let requestBody = '';
      teleporter
        .post('/scripts/pi-hole/php/teleporter.php', (body) => (requestBody = body))
        .reply(
          200,
          'Processed adlist (14 entries)<br>\n' +
          'Processed adlist group assignments (13 entries)<br>\n' +
          'Processed blacklist (exact) (0 entries)<br>\n' +
          'Processed blacklist (regex) (3 entries)<br>\n' +
          'Processed client (8 entries)<br>\n' +
          'Processed client group assignments (16 entries)<br>\n' +
          'Processed local DNS records (41 entries)<br>\n' +
          'Processed domain_audit (0 entries)<br>\n' +
          'Processed black-/whitelist group assignments (10 entries)<br>\n' +
          'Processed group (3 entries)<br>\n' +
          'Processed whitelist (exact) (4 entries)<br>\n' +
          'Processed whitelist (regex) (0 entries)<br>\n' +
          'OK'
        );

      const result = await client.uploadBackup(backup);

      expect(result).toStrictEqual(true);
      expect(syncOptions).toHaveBeenCalled();
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
      expect(requestBody).toContain('name="auditlog"\r\n\r\nfalse');
      expect(requestBody).toContain('name="staticdhcpleases"\r\n\r\nfalse');
      expect(requestBody).toContain('name="localdnsrecords"\r\n\r\ntrue');
      expect(requestBody).toContain('name="localcnamerecords"\r\n\r\ntrue');
      expect(requestBody).toContain('name="flushtables"\r\n\r\ntrue');
      expect(requestBody).toContain('name="action"\r\n\r\nin');
      expect(requestBody).toContain(
        'name="zip_file"; filename="backup.tar.gz"\r\nContent-Type: application/octet-stream'
      );
      expect(requestBody.match(/Content-Disposition: form-data; name=/g)).toHaveLength(
        15
      );
      updateGravity.mockRestore();
    });
  });
});
