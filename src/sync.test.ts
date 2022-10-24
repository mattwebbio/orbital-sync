import { describe, expect, jest, test } from '@jest/globals';
import chalk from 'chalk';
import nock from 'nock';
import { Blob } from 'node-fetch';
import { Client } from './client';
import { Config, Host } from './config';
import { Log } from './log';
import { ErrorNotification, Notify } from './notify';
import { Sync } from './sync';

describe('entrypoint', () => {
  let primaryHost: ReturnType<typeof jest.spyOn>;
  let secondaryHosts: ReturnType<typeof jest.spyOn>;
  let clientCreate: ReturnType<typeof jest.spyOn>;
  let notifyOfFailure: ReturnType<typeof jest.spyOn>;
  let notifyQueueError: ReturnType<typeof jest.spyOn>;
  let notifyOfSuccess: ReturnType<typeof jest.spyOn>;
  let processExit: ReturnType<typeof jest.spyOn>;
  let primaryHostClient: Client;
  let secondaryHostClient1: Client;
  let secondaryHostClient2: Client;

  const primaryHostValue = new Host('http://10.0.0.2', 'password1');
  const secondaryHostsValue = [
    new Host('http://10.0.0.3', 'password2'),
    new Host('http://10.0.0.4', 'password3')
  ];
  const backupData = new Blob([]);

  beforeEach(() => {
    nock.disableNetConnect();
    jest.restoreAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.resetModules();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  const prepare = ({
    primaryResult,
    secondaryOneResult,
    secondaryTwoResult
  }: {
    primaryResult?: Promise<Blob>;
    secondaryOneResult?: Promise<boolean | never>;
    secondaryTwoResult?: Promise<boolean | never>;
  } = {}) => {
    jest.spyOn(Config, 'runOnce', 'get').mockReturnValue(true);
    processExit = jest.spyOn(process, 'exit').mockReturnValue(undefined as never);
    primaryHost = jest
      .spyOn(Config, 'primaryHost', 'get')
      .mockReturnValue(primaryHostValue);
    secondaryHosts = jest
      .spyOn(Config, 'secondaryHosts', 'get')
      .mockReturnValue(secondaryHostsValue);
    primaryHostClient = {
      downloadBackup: jest.fn(() => primaryResult ?? Promise.resolve(backupData))
    } as unknown as Client;
    secondaryHostClient1 = {
      uploadBackup: jest.fn(() => secondaryOneResult ?? Promise.resolve(true))
    } as unknown as Client;
    secondaryHostClient2 = {
      uploadBackup: jest.fn(() => secondaryTwoResult ?? Promise.resolve(true))
    } as unknown as Client;
    clientCreate = jest
      .spyOn(Client, 'create')
      .mockResolvedValueOnce(primaryHostClient)
      .mockResolvedValueOnce(secondaryHostClient1)
      .mockResolvedValueOnce(secondaryHostClient2);
    notifyOfFailure = jest.spyOn(Notify, 'ofFailure');
    notifyQueueError = jest.spyOn(Notify, 'queueError');
    notifyOfSuccess = jest.spyOn(Notify, 'ofSuccess');
  };

  const expectSyncToHaveBeenPerformed = () => {
    expect(primaryHost).toHaveBeenCalledTimes(1);
    expect(secondaryHosts).toHaveBeenCalledTimes(2);
    expect(clientCreate).toHaveBeenCalledTimes(3);
    expect(clientCreate).toHaveBeenNthCalledWith(1, primaryHostValue);
    expect(clientCreate).toHaveBeenNthCalledWith(2, secondaryHostsValue[0]);
    expect(clientCreate).toHaveBeenNthCalledWith(3, secondaryHostsValue[1]);
    expect(primaryHostClient.downloadBackup).toHaveBeenCalledTimes(1);
    expect(secondaryHostClient1.uploadBackup).toHaveBeenCalledTimes(1);
    expect(secondaryHostClient1.uploadBackup).toHaveBeenCalledWith(backupData);
    expect(secondaryHostClient2.uploadBackup).toHaveBeenCalledTimes(1);
    expect(secondaryHostClient2.uploadBackup).toHaveBeenCalledWith(backupData);
  };

  test('should perform sync and succeed', async () => {
    prepare();

    await Sync.perform();

    expectSyncToHaveBeenPerformed();
    expect(notifyOfFailure).not.toHaveBeenCalled();
    expect(notifyQueueError).not.toHaveBeenCalled();
    expect(notifyOfSuccess).toHaveBeenCalledTimes(1);
    expect(notifyOfSuccess).toHaveBeenCalledWith({
      message: '2/2 hosts synced.'
    });
    expect(processExit).not.toHaveBeenCalled();
  });

  test('should perform sync and partially succeed', async () => {
    prepare({
      secondaryTwoResult: Promise.reject(new ErrorNotification({ message: 'foobar' }))
    });

    await Sync.perform();

    expectSyncToHaveBeenPerformed();
    expect(notifyOfSuccess).not.toHaveBeenCalled();
    expect(notifyQueueError).toHaveBeenCalledTimes(1);
    expect(notifyQueueError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'foobar'
      })
    );
    expect(notifyOfFailure).toHaveBeenCalledTimes(1);
    expect(notifyOfFailure).toHaveBeenCalledWith({
      sendNotification: true,
      message: '1/2 hosts synced.'
    });
    expect(processExit).toHaveBeenCalledTimes(1);
  });

  test('should perform sync and fail', async () => {
    prepare({
      secondaryOneResult: Promise.reject(new ErrorNotification({ message: 'foobar' })),
      secondaryTwoResult: Promise.reject(
        new ErrorNotification({ message: 'hello world' })
      )
    });

    await Sync.perform();

    expectSyncToHaveBeenPerformed();
    expect(notifyOfSuccess).not.toHaveBeenCalled();
    expect(notifyQueueError).toHaveBeenCalledTimes(2);
    expect(notifyQueueError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'foobar'
      })
    );
    expect(notifyQueueError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'hello world'
      })
    );
    expect(notifyOfFailure).toHaveBeenCalledTimes(1);
    expect(notifyOfFailure).toHaveBeenCalledWith({
      message: '0/2 hosts synced.'
    });
    expect(processExit).toHaveBeenCalledTimes(1);
  });

  test('should perform sync and fail', async () => {
    prepare({
      primaryResult: Promise.reject(
        new ErrorNotification({ message: 'Backup failed to download' })
      )
    });

    await Sync.perform();

    expect(notifyOfSuccess).not.toHaveBeenCalled();
    expect(notifyQueueError).not.toHaveBeenCalled();
    expect(notifyOfFailure).toHaveBeenCalledTimes(1);
    expect(notifyOfFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Backup failed to download'
      })
    );
    expect(secondaryHostClient1.uploadBackup).not.toHaveBeenCalled();
    expect(secondaryHostClient2.uploadBackup).not.toHaveBeenCalled();
    expect(processExit).toHaveBeenCalledTimes(1);
  });

  test('should wait if `runOnce` is false', async () => {
    prepare();
    jest.spyOn(Config, 'runOnce', 'get').mockReturnValue(false);
    const logInfo = jest.spyOn(Log, 'info');

    let syncCompleted = false;
    Sync.perform().then(() => (syncCompleted = true));

    while (!syncCompleted) {
      await jest.runAllTimers();
    }

    expectSyncToHaveBeenPerformed();
    expect(logInfo).toHaveBeenCalledWith(chalk.dim('Waiting 30 minutes...'));
    expect(notifyOfFailure).not.toHaveBeenCalled();
    expect(notifyQueueError).not.toHaveBeenCalled();
    expect(notifyOfSuccess).toHaveBeenCalledTimes(1);
    expect(notifyOfSuccess).toHaveBeenCalledWith({
      message: '2/2 hosts synced.'
    });
    expect(processExit).not.toHaveBeenCalled();
  });
});
