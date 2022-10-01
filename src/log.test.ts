import { jest } from '@jest/globals';
import chalk from 'chalk';
import { Config } from './config';
import { Log } from './log';

describe('Log', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2022, 7, 27, 8, 17, 31) });
  });

  afterEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
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

    test('should log stringified', () => {
      const consoleLog = jest.spyOn(console, 'log');

      Log.info({ foo: 'bar' });

      expect(consoleLog).toHaveBeenCalledTimes(1);
      expect(consoleLog).toHaveBeenCalledWith(
        // eslint-disable-next-line no-useless-escape
        `${chalk.dim('8/27/2022, 8:17:31 AM')}: {\"foo\":\"bar\"}`
      );
    });
  });

  describe('verbose', () => {
    test('should not log if not verboseMode', () => {
      const logInfo = jest.spyOn(Log, 'info');

      Log.verbose('Hello world');

      expect(logInfo).not.toHaveBeenCalled();
    });

    test('should not log if empty', () => {
      jest.spyOn(Config, 'verboseMode', 'get').mockReturnValue(true);
      const logInfo = jest.spyOn(Log, 'info');

      Log.verbose(undefined);

      expect(logInfo).not.toHaveBeenCalled();
    });

    test('should log if verboseMode', () => {
      jest.spyOn(Config, 'verboseMode', 'get').mockReturnValue(true);
      const logInfo = jest.spyOn(Log, 'info');

      Log.verbose('Hello world');

      expect(logInfo).toHaveBeenCalledTimes(1);
      expect(logInfo).toHaveBeenCalledWith('Hello world');
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
