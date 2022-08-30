import { jest } from '@jest/globals';
import nock from 'nock';
import { Blob } from 'node-fetch';
import {
  BackupDownloadError,
  BackupUploadError,
  Client,
  LoginError,
  MalformedTokenError,
  NoTokenError
} from './client';
import type { Host } from './config';
import { Config } from './config';

describe('Client', () => {
  const host: Host = {
    baseUrl: 'http://10.0.0.2',
    password: 'mypassword'
  };

  const createClient = async () => {
    nock(host.baseUrl).get('/admin/index.php?login').reply(200);
    nock(host.baseUrl)
      .post('/admin/index.php?login')
      .reply(
        200,
        '<html><body><div id="token">abcdefgijklmnopqrstuvwxyzabcdefgijklmnopqrst</div></body></html>'
      );

    return { teleporter: nock(host.baseUrl), client: await Client.create(host) };
  };

  beforeEach(() => {
    nock.disableNetConnect();
  });

  describe('create', () => {
    test('should throw LoginError if status code is not ok', async () => {
      const initialRequest = nock(host.baseUrl).get('/admin/index.php?login').reply(200);
      const loginRequest = nock(host.baseUrl).post('/admin/index.php?login').reply(500);

      await expect(Client.create(host)).rejects.toBeInstanceOf(LoginError);

      initialRequest.done();
      loginRequest.done();
    });

    test('should throw NoTokenError if no token is present', async () => {
      const initialRequest = nock(host.baseUrl).get('/admin/index.php?login').reply(200);
      const loginRequest = nock(host.baseUrl).post('/admin/index.php?login').reply(200);

      await expect(Client.create(host)).rejects.toBeInstanceOf(NoTokenError);

      initialRequest.done();
      loginRequest.done();
    });

    test('should throw MalformedTokenError if token is in incorrect format', async () => {
      const initialRequest = nock(host.baseUrl).get('/admin/index.php?login').reply(200);
      const loginRequest = nock(host.baseUrl)
        .post('/admin/index.php?login')
        .reply(200, '<html><body><div id="token">abcdef</div></body></html>');

      await expect(Client.create(host)).rejects.toBeInstanceOf(MalformedTokenError);

      initialRequest.done();
      loginRequest.done();
    });

    test('should return client', async () => {
      const initialRequest = nock(host.baseUrl).get('/admin/index.php?login').reply(200);
      const loginRequest = nock(host.baseUrl)
        .post('/admin/index.php?login')
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

    test('should throw BackupDownloadError if response is non-200', async () => {
      teleporter.post('/admin/scripts/pi-hole/php/teleporter.php').reply(500);

      await expect(client.downloadBackup()).rejects.toBeInstanceOf(BackupDownloadError);
    });

    test('should throw BackupDownloadError if content type is not gzip', async () => {
      teleporter
        .post('/admin/scripts/pi-hole/php/teleporter.php')
        .reply(200, undefined, { 'content-type': 'text/html' });

      await expect(client.downloadBackup()).rejects.toBeInstanceOf(BackupDownloadError);
    });

    test('should return response data', async () => {
      const syncOptions = jest.spyOn(Config, 'syncOptions', 'get');

      let requestBody = '';
      teleporter
        .post('/admin/scripts/pi-hole/php/teleporter.php', (body) => (requestBody = body))
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

    test('should throw BackupUploadError if response is non-200', async () => {
      teleporter.post('/admin/scripts/pi-hole/php/teleporter.php').reply(500);

      await expect(client.uploadBackup(backup)).rejects.toBeInstanceOf(BackupUploadError);
    });

    test('should throw BackupUploadError if response does not end with "OK"', async () => {
      teleporter.post('/admin/scripts/pi-hole/php/teleporter.php').reply(200);

      await expect(client.uploadBackup(backup)).rejects.toBeInstanceOf(BackupUploadError);
    });

    test('should upload backup successfully', async () => {
      const syncOptions = jest.spyOn(Config, 'syncOptions', 'get');

      let requestBody = '';
      teleporter
        .post('/admin/scripts/pi-hole/php/teleporter.php', (body) => (requestBody = body))
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

      await client.uploadBackup(backup);

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
  });
});
