import { describe, expect, jest, test } from '@jest/globals';
import nock from 'nock';
import { EnvironmentConfig } from '../../src/config/environment';
import { Sync } from '../../src/sync';

describe('entrypoint', () => {
  beforeEach(() => {
    nock.disableNetConnect();
  });

  afterEach(() => {
    jest.resetModules();
  });

  test('should perform sync', async () => {
    const sync = jest.spyOn(Sync, 'perform').mockImplementation(() => Promise.resolve());
    const runOnce = jest
      .spyOn(EnvironmentConfig.prototype, 'runOnce', 'get')
      .mockReturnValue(true);

    await import('../../src/index');

    expect(runOnce).toHaveBeenCalledTimes(2);
    expect(sync).toHaveBeenCalledTimes(1);
  });
});
