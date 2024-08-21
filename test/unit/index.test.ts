import { describe, expect, jest, test } from '@jest/globals';
import nock from 'nock';
import { Sync } from '../../src/sync';

describe('entrypoint', () => {
  const initialEnv = Object.assign({}, process.env);

  beforeEach(() => {
    nock.disableNetConnect();
    process.env['VERSION'] = 'v5';
    process.env['PRIMARY_HOST_BASE_URL'] = 'http://localhost:3000';
    process.env['PRIMARY_HOST_PASSWORD'] = 'password';
    process.env['SECONDARY_HOST_1_BASE_URL'] = 'http://localhost:3001';
    process.env['SECONDARY_HOST_1_PASSWORD'] = 'password';
    process.env['RUN_ONCE'] = 'true';
  });

  afterEach(() => {
    jest.resetModules();
    process.env = Object.assign({}, initialEnv);
  });

  test('should perform sync', async () => {
    const sync = jest.spyOn(Sync, 'perform').mockImplementation(() => Promise.resolve());

    await import('../../src/index');

    expect(sync).toHaveBeenCalledTimes(1);
  });
});
