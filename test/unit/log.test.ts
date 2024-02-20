import { jest } from '@jest/globals';
import chalk from 'chalk';
import { Log } from '../../src/log';

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
      const log = new Log(false);
      const consoleLog = jest.spyOn(console, 'log');

      log.info('Hello world');

      expect(consoleLog).toHaveBeenCalledTimes(1);
      expect(consoleLog).toHaveBeenCalledWith(
        `${chalk.dim('8/27/2022, 8:17:31 AM')}: Hello world`
      );
    });

    test('should log stringified', () => {
      const log = new Log(false);
      const consoleLog = jest.spyOn(console, 'log');

      log.info({ foo: 'bar' });

      expect(consoleLog).toHaveBeenCalledTimes(1);
      expect(consoleLog).toHaveBeenCalledWith(
        // eslint-disable-next-line no-useless-escape
        `${chalk.dim('8/27/2022, 8:17:31 AM')}: {\"foo\":\"bar\"}`
      );
    });
  });

  describe('verbose', () => {
    test('should not log if not verboseMode', () => {
      const log = new Log(false);
      const logInfo = jest.spyOn(log, 'info');

      log.verbose('Hello world');

      expect(logInfo).not.toHaveBeenCalled();
    });

    test('should not log if empty', () => {
      const log = new Log(true);
      const logInfo = jest.spyOn(log, 'info');

      log.verbose(undefined);

      expect(logInfo).not.toHaveBeenCalled();
    });

    test('should log if verboseMode', () => {
      const log = new Log(true);
      const logInfo = jest.spyOn(log, 'info');

      log.verbose('Hello world');

      expect(logInfo).toHaveBeenCalledTimes(1);
      expect(logInfo).toHaveBeenCalledWith('Hello world');
    });
  });

  describe('logError', () => {
    test('should log with dimmed date', () => {
      const log = new Log(true);
      const consoleError = jest.spyOn(console, 'error');

      log.error('Hello world');

      expect(consoleError).toHaveBeenCalledTimes(1);
      expect(consoleError).toHaveBeenCalledWith(
        `${chalk.dim('8/27/2022, 8:17:31 AM')}: ${chalk.red('Hello world')}`
      );
    });
  });
});
