import Honeybadger from '@honeybadger-io/js';
import { jest } from '@jest/globals';
import { FetchError } from 'node-fetch';
import { Config } from './config';
import { Log } from './log';
import { ErrorNotification, Notify } from './notify';

describe('Notify', () => {
  let processExit: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    processExit = jest
      .spyOn(process, 'exit')
      .mockImplementation(jest.fn<typeof process.exit>());
  });

  describe('ofFailure', () => {
    test('should log error', async () => {
      const logError = jest.spyOn(Log, 'error');

      await Notify.ofFailure({
        message: 'Example failure message',
        verbose: 'Example verbose context'
      });

      expect(logError).toHaveBeenCalledTimes(1);
      expect(logError).toHaveBeenCalledWith('⚠ Failure: Example failure message');
      expect(processExit).not.toHaveBeenCalled();
    });

    test('should log verbose context', async () => {
      const logError = jest.spyOn(Log, 'error');
      jest.spyOn(Config, 'verboseMode', 'get').mockReturnValue(true);

      await Notify.ofFailure({
        message: 'Example failure message',
        verbose: 'Example verbose context'
      });

      expect(logError).toHaveBeenCalledTimes(2);
      expect(logError).toHaveBeenCalledWith('⚠ Failure: Example failure message');
      expect(logError).toHaveBeenCalledWith('Example verbose context');
    });

    test('should notify and exit', async () => {
      const notifyOfFailure = jest.spyOn(Notify, 'ofFailure');

      (await Notify.ofFailure({
        message: 'Example catastrophic failure',
        exit: true
      })) as unknown;

      expect(notifyOfFailure).toHaveBeenCalledTimes(1);
      expect(notifyOfFailure).toHaveBeenCalledWith({
        message: 'Example catastrophic failure',
        exit: true
      });
      expect(processExit).toHaveBeenCalledTimes(1);
      expect(processExit).toHaveBeenCalledWith(1);
    });
  });

  describe('ofThrow', () => {
    test('should prepend Notify of unexpected error', async () => {
      const notifyOfFailure = jest.spyOn(Notify, 'ofFailure');

      await Notify.ofThrow(new Error('Example thrown error'));

      expect(notifyOfFailure).toHaveBeenCalledTimes(1);
      expect(notifyOfFailure).toHaveBeenCalledWith({
        message: 'An unexpected error was thrown:\n- Error: Example thrown error'
      });
    });

    test('should Notify on throw', async () => {
      const notifyOfFailure = jest.spyOn(Notify, 'ofFailure');

      await Notify.ofThrow(
        new ErrorNotification({
          message: 'Example thrown error',
          exit: true,
          sendNotification: false
        })
      );

      expect(notifyOfFailure).toHaveBeenCalledTimes(1);
      expect(notifyOfFailure).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Example thrown error',
          exit: true,
          sendNotification: false
        })
      );
    });

    test('should Notify on throw of connection refused FetchError', async () => {
      const notifyOfFailure = jest.spyOn(Notify, 'ofFailure');
      const allHostBaseUrls = jest
        .spyOn(Config, 'allHostBaseUrls', 'get')
        .mockReturnValue(['http://10.0.0.2', 'http://10.0.0.3']);

      await Notify.ofThrow(
        new FetchError(
          'request to http://10.0.0.3/admin/index.php?login failed, reason: connect ECONNREFUSED 10.0.0.2:443',
          'system',
          { code: 'ECONNREFUSED' }
        )
      );

      expect(allHostBaseUrls).toHaveBeenCalledTimes(1);
      expect(notifyOfFailure).toHaveBeenCalledTimes(1);
      expect(notifyOfFailure).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'The host "http://10.0.0.3" refused to connect. Is it down?',
          verbose:
            'request to http://10.0.0.3/admin/index.php?login failed, reason: connect ECONNREFUSED 10.0.0.2:443'
        })
      );
    });

    test('should send unexpected error to Honeybadger if configured', async () => {
      const honeybadgerApiKey = jest
        .spyOn(Config, 'honeybadgerApiKey', 'get')
        .mockReturnValue('foobar');
      const honeybadgerNotify = jest
        .spyOn(Honeybadger, 'notify')
        .mockImplementation(jest.fn<typeof Honeybadger.notify>());
      const honeybadgerConfigure = jest.spyOn(Honeybadger, 'configure').mockReturnValue({
        notify: honeybadgerNotify
      } as unknown as ReturnType<typeof Honeybadger.configure>);
      const mockError = new FetchError('Connection error', 'system', {
        code: 'ECONNRESET'
      });

      await Notify.ofThrow(mockError);
      await Notify.ofThrow('Example thrown string');

      expect(honeybadgerNotify).toHaveBeenCalledTimes(2);
      expect(honeybadgerNotify).toHaveBeenCalledWith(mockError);
      expect(honeybadgerNotify).toHaveBeenCalledWith('Example thrown string');
      expect(honeybadgerApiKey).toHaveBeenCalledTimes(3);
      expect(honeybadgerConfigure).toHaveBeenCalledTimes(1);
      expect(honeybadgerConfigure).toHaveBeenCalledWith({ apiKey: 'foobar' });
    });
  });
});
