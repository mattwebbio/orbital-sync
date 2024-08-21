import { describe, expect, jest, test } from '@jest/globals';
import nock from 'nock';
import { Blob } from 'node-fetch';
import { ClientV5 } from '../../src/client/v5';
import { Config, ConfigInterfaceV5 } from '../../src/config/index';
import { Log } from '../../src/log';
import { ErrorNotification } from '../../src/notify';
import { Sync } from '../../src/sync';
import { Version } from '../../src/config/version';
import { NotifyV5 } from '../../src/notify/v5';

describe('sync', () => {
  let clientCreate: ReturnType<typeof jest.spyOn>;
  let notifyOfFailure: ReturnType<typeof jest.spyOn>;
  let notifyQueueError: ReturnType<typeof jest.spyOn>;
  let notifyOfSuccess: ReturnType<typeof jest.spyOn>;
  let processExit: ReturnType<typeof jest.spyOn>;
  let primaryHostClient: ClientV5;
  let secondaryHostClient1: ClientV5;
  let secondaryHostClient2: ClientV5;

  const primaryHostValue = { baseUrl: 'http://10.0.0.2', password: 'password1' };
  const secondaryHostsValue = [
    { baseUrl: 'http://10.0.0.3', password: 'password2' },
    { baseUrl: 'http://10.0.0.4', password: 'password3' }
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
    const config = Config(Version.v5, {
      sync: {
        primaryHost: primaryHostValue,
        secondaryHosts: secondaryHostsValue,
        runOnce: true
      }
    });
    const log = new Log(config.verbose);
    const notify = new NotifyV5(config, log);

    processExit = jest.spyOn(process, 'exit').mockReturnValue(undefined as never);
    primaryHostClient = {
      makeBackup: jest.fn(() => primaryResult ?? Promise.resolve(backupData))
    } as unknown as ClientV5;
    secondaryHostClient1 = {
      restoreBackup: jest.fn(() => secondaryOneResult ?? Promise.resolve(true))
    } as unknown as ClientV5;
    secondaryHostClient2 = {
      restoreBackup: jest.fn(() => secondaryTwoResult ?? Promise.resolve(true))
    } as unknown as ClientV5;
    clientCreate = jest
      .spyOn(ClientV5, 'create')
      .mockResolvedValueOnce(primaryHostClient)
      .mockResolvedValueOnce(secondaryHostClient1)
      .mockResolvedValueOnce(secondaryHostClient2);
    notifyOfFailure = jest.spyOn(notify, 'ofFailure');
    notifyQueueError = jest.spyOn(notify, 'queueError');
    notifyOfSuccess = jest.spyOn(notify, 'ofSuccess');

    return { config, notify, log };
  };

  const expectSyncToHaveBeenPerformed = ({
    options,
    log
  }: {
    options: ConfigInterfaceV5;
    log: Log;
  }) => {
    expect(clientCreate).toHaveBeenCalledTimes(3);
    expect(clientCreate).toHaveBeenNthCalledWith(1, {
      host: expect.objectContaining(primaryHostValue),
      options,
      log
    });
    expect(clientCreate).toHaveBeenNthCalledWith(2, {
      host: expect.objectContaining(secondaryHostsValue[0]),
      options,
      log
    });
    expect(clientCreate).toHaveBeenNthCalledWith(3, {
      host: expect.objectContaining(secondaryHostsValue[1]),
      options,
      log
    });
    expect(primaryHostClient.makeBackup).toHaveBeenCalledTimes(1);
    expect(secondaryHostClient1.restoreBackup).toHaveBeenCalledTimes(1);
    expect(secondaryHostClient1.restoreBackup).toHaveBeenCalledWith(backupData);
    expect(secondaryHostClient2.restoreBackup).toHaveBeenCalledTimes(1);
    expect(secondaryHostClient2.restoreBackup).toHaveBeenCalledWith(backupData);
  };

  test('should perform sync and succeed', async () => {
    const { config, log } = prepare();

    await Sync.perform(config, { log });

    expectSyncToHaveBeenPerformed({ options: config, log });
    expect(notifyOfFailure).not.toHaveBeenCalled();
    expect(notifyQueueError).not.toHaveBeenCalled();
    expect(notifyOfSuccess).toHaveBeenCalledTimes(1);
    expect(notifyOfSuccess).toHaveBeenCalledWith({
      message: '2/2 hosts synced.'
    });
    expect(processExit).not.toHaveBeenCalled();
  });

  test('should perform sync and partially succeed', async () => {
    const { config, log } = prepare({
      secondaryTwoResult: Promise.reject(new ErrorNotification({ message: 'foobar' }))
    });

    await Sync.perform(config, { log });

    expectSyncToHaveBeenPerformed({ options: config, log });
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
    const { config, log } = prepare({
      secondaryOneResult: Promise.reject(new ErrorNotification({ message: 'foobar' })),
      secondaryTwoResult: Promise.reject(
        new ErrorNotification({ message: 'hello world' })
      )
    });

    await Sync.perform(config, { log });

    expectSyncToHaveBeenPerformed({ options: config, log });
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
    const { config, log } = prepare({
      primaryResult: Promise.reject(
        new ErrorNotification({ message: 'Backup failed to download' })
      )
    });

    await Sync.perform(config, { log });

    expect(notifyOfSuccess).not.toHaveBeenCalled();
    expect(notifyQueueError).not.toHaveBeenCalled();
    expect(notifyOfFailure).toHaveBeenCalledTimes(1);
    expect(notifyOfFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Backup failed to download'
      })
    );
    expect(secondaryHostClient1.restoreBackup).not.toHaveBeenCalled();
    expect(secondaryHostClient2.restoreBackup).not.toHaveBeenCalled();
    expect(processExit).toHaveBeenCalledTimes(1);
  });
});
