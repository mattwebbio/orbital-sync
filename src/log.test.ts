import { jest } from '@jest/globals';
import chalk from 'chalk';
import { Log } from './log';

describe('Log', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2022, 7, 27, 8, 17, 31) });
  });

  afterEach(() => {
    jest.resetModules();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('info', () => {
    test('should log with dimmed date', () => {
      const consoleLog = jest.spyOn(console, 'log');

      Log.info('Hello world');

      expect(consoleLog).toHaveBeenCalledTimes(1);
      expect(consoleLog).toHaveBeenCalledWith(
        `${chalk.dim('8/27/2022, 8:17:31 AM')}: Hello world`
      );
    });
  });

  describe('logError', () => {
    test('should log with dimmed date', () => {
      const consoleError = jest.spyOn(console, 'error');

      Log.error('Hello world');

      expect(consoleError).toHaveBeenCalledTimes(1);
      expect(consoleError).toHaveBeenCalledWith(
        `${chalk.dim('8/27/2022, 8:17:31 AM')}: ${chalk.red('Hello world')}`
      );
    });
  });
});
