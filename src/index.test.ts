import { describe, expect, jest, test } from '@jest/globals';
import nock from 'nock';
import { Blob } from 'node-fetch';
import { Client } from './client';
import { Config } from './config';

describe('entrypoint', () => {
  beforeEach(() => {
    jest.spyOn(Config, 'runOnce', 'get').mockReturnValue(true);
    nock.disableNetConnect();
  });

  afterEach(() => {
    jest.resetModules();
  });

  test('should perform sync', async () => {
    const primaryHostValue = {
      baseUrl: 'http://10.0.0.2',
      password: 'password1'
    };
    const secondaryHostsValue = [
      {
        baseUrl: 'http://10.0.0.3',
        password: 'password2'
      },
      {
        baseUrl: 'http://10.0.0.4',
        password: 'password3'
      }
    ];
    const primaryHost = jest
      .spyOn(Config, 'primaryHost', 'get')
      .mockReturnValue(primaryHostValue);
    const secondaryHosts = jest
      .spyOn(Config, 'secondaryHosts', 'get')
      .mockReturnValue(secondaryHostsValue);
    const backupData = new Blob([]);
    const primaryHostClient = {
      downloadBackup: jest.fn(() => Promise.resolve(backupData))
    } as unknown as Client;
    const secondaryHostClient1 = {
      uploadBackup: jest.fn(() => Promise.resolve())
    } as unknown as Client;
    const secondaryHostClient2 = {
      uploadBackup: jest.fn(() => Promise.resolve())
    } as unknown as Client;
    const clientCreate = jest
      .spyOn(Client, 'create')
      .mockResolvedValueOnce(primaryHostClient)
      .mockResolvedValueOnce(secondaryHostClient1)
      .mockResolvedValueOnce(secondaryHostClient2);

    await import('./index');

    expect(primaryHost).toHaveBeenCalledTimes(1);
    expect(secondaryHosts).toHaveBeenCalledTimes(1);
    expect(clientCreate).toHaveBeenCalledTimes(3);
    expect(clientCreate).toHaveBeenNthCalledWith(1, primaryHostValue);
    expect(clientCreate).toHaveBeenNthCalledWith(2, secondaryHostsValue[0]);
    expect(clientCreate).toHaveBeenNthCalledWith(3, secondaryHostsValue[1]);
    expect(primaryHostClient.downloadBackup).toHaveBeenCalledTimes(1);
    expect(secondaryHostClient1.uploadBackup).toHaveBeenCalledTimes(1);
    expect(secondaryHostClient1.uploadBackup).toHaveBeenCalledWith(backupData);
    expect(secondaryHostClient2.uploadBackup).toHaveBeenCalledTimes(1);
    expect(secondaryHostClient2.uploadBackup).toHaveBeenCalledWith(backupData);
  });
});
