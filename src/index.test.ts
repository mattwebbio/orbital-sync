import { describe, expect, jest, test } from '@jest/globals';
import nock from 'nock';
import { Config } from './config';
import { Sync } from './sync';

describe('entrypoint', () => {
  beforeEach(() => {
    nock.disableNetConnect();
  });

  afterEach(() => {
    jest.resetModules();
  });

  test('should perform sync', async () => {
    const sync = jest.spyOn(Sync, 'perform').mockImplementation(() => Promise.resolve());
    const runOnce = jest.spyOn(Config, 'runOnce', 'get').mockReturnValue(true);

    await import('./index');

    expect(runOnce).toHaveBeenCalledTimes(1);
    expect(sync).toHaveBeenCalledTimes(1);
  });
});
