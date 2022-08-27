import { jest } from '@jest/globals';
import chalk from 'chalk';
import { log } from './log';

describe('log', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2022, 7, 27, 8, 17, 31) });
  });

  afterEach(() => {
    jest.resetModules();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  test('should log with dimmed date', () => {
    const consoleLog = jest.spyOn(console, 'log');

    log('Hello world');

    expect(consoleLog).toHaveBeenCalledTimes(1);
    expect(consoleLog).toHaveBeenCalledWith(
      `${chalk.dim('8/27/2022, 8:17:31 AM')}: Hello world`
    );
  });
});
