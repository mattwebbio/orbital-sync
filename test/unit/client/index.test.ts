import { jest } from '@jest/globals';
import { Host } from '../../../src/client/host';
import { ClientV5 } from '../../../src/client/v5/index';
import { ClientV6 } from '../../../src/client/v6/index';
import { createClient } from '../../../src/client/index';
import nodeFetch from 'node-fetch';
import { Log } from '../../../src/log';

jest.mock('node-fetch');
jest.mock('../../../src/client/v5/index');
jest.mock('../../../src/client/v6/index');

describe('createClient', () => {
  const host = new Host({
    baseUrl: 'http://pihole.test',
    password: 'password'
  });
  const options = {
    whitelist: true,
    regexWhitelist: true,
    blacklist: true,
    regexList: true,
    adList: true,
    client: true,
    group: true,
    auditLog: false,
    staticDhcpLeases: false,
    localDnsRecords: true,
    localCnameRecords: true,
    flushTables: true
  };
  const log = new Log(false);

  beforeEach(() => {
    jest.resetAllMocks();
    (ClientV5.create as jest.Mock).mockResolvedValue({});
    (ClientV6.create as jest.Mock).mockResolvedValue({});
  });

  test('should use v5 client when version is explicitly v5', async () => {
    await createClient({
      host,
      version: 'v5',
      optionsV5: options,
      optionsV6: options,
      log
    });

    expect(ClientV5.create).toHaveBeenCalledWith({
      host,
      options,
      log
    });
    expect(ClientV6.create).not.toHaveBeenCalled();
  });

  test('should use v6 client when version is explicitly v6', async () => {
    await createClient({
      host,
      version: 'v6',
      optionsV5: options,
      optionsV6: options,
      log
    });

    expect(ClientV6.create).toHaveBeenCalledWith({
      host,
      options,
      log
    });
    expect(ClientV5.create).not.toHaveBeenCalled();
  });

  test('should detect v6 client when status endpoint returns 200', async () => {
    (nodeFetch as unknown as jest.Mock).mockResolvedValue({
      status: 200
    });

    await createClient({
      host,
      version: 'auto',
      optionsV5: options,
      optionsV6: options,
      log
    });

    expect(nodeFetch).toHaveBeenCalledWith('http://pihole.test/admin/api/v1/status', {
      method: 'GET'
    });
    expect(ClientV6.create).toHaveBeenCalledWith({
      host,
      options,
      log
    });
    expect(ClientV5.create).not.toHaveBeenCalled();
  });

  test('should detect v6 client when status endpoint returns 401', async () => {
    (nodeFetch as unknown as jest.Mock).mockResolvedValue({
      status: 401
    });

    await createClient({
      host,
      version: 'auto',
      optionsV5: options,
      optionsV6: options,
      log
    });

    expect(nodeFetch).toHaveBeenCalledWith('http://pihole.test/admin/api/v1/status', {
      method: 'GET'
    });
    expect(ClientV6.create).toHaveBeenCalledWith({
      host,
      options,
      log
    });
    expect(ClientV5.create).not.toHaveBeenCalled();
  });

  test('should fall back to v5 client when status endpoint returns other code', async () => {
    (nodeFetch as unknown as jest.Mock).mockResolvedValue({
      status: 404
    });

    await createClient({
      host,
      version: 'auto',
      optionsV5: options,
      optionsV6: options,
      log
    });

    expect(nodeFetch).toHaveBeenCalledWith('http://pihole.test/admin/api/v1/status', {
      method: 'GET'
    });
    expect(ClientV5.create).toHaveBeenCalledWith({
      host,
      options,
      log
    });
    expect(ClientV6.create).not.toHaveBeenCalled();
  });

  test('should fall back to v5 client when fetch throws an error', async () => {
    (nodeFetch as unknown as jest.Mock).mockRejectedValue(new Error('Network error'));

    await createClient({
      host,
      version: 'auto',
      optionsV5: options,
      optionsV6: options,
      log
    });

    expect(nodeFetch).toHaveBeenCalledWith('http://pihole.test/admin/api/v1/status', {
      method: 'GET'
    });
    expect(ClientV5.create).toHaveBeenCalledWith({
      host,
      options,
      log
    });
    expect(ClientV6.create).not.toHaveBeenCalled();
  });
});
