import Honeybadger from '@honeybadger-io/js';
import { jest } from '@jest/globals';
import nock from 'nock';
import { FetchError } from 'node-fetch';
import nodemailer from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';
import { Config } from './config';
import { Log } from './log';
import { ErrorNotification, Notify } from './notify';

describe('Notify', () => {
  const logInfo = jest.spyOn(Log, 'info');
  const logError = jest.spyOn(Log, 'error');
  const logVerbose = jest.spyOn(Log, 'verbose');
  const sendMail = jest.fn();
  const createTransport = jest
    .spyOn(nodemailer, 'createTransport')
    .mockReturnValue({ sendMail } as unknown as Mail);
  const notifyViaSmtp = jest.spyOn(Config, 'notifyViaSmtp', 'get');
  const processExit = jest
    .spyOn(process, 'exit')
    .mockImplementation(jest.fn<typeof process.exit>());
  let notifyOfFailure: ReturnType<typeof jest.spyOn>;
  let verboseMode: ReturnType<typeof jest.spyOn>;

  beforeAll(() => {
    jest.spyOn(Config, 'smtpHost', 'get').mockReturnValue('smtp.example.com');
    jest.spyOn(Config, 'smtpUser', 'get').mockReturnValue('user@example.com');
    jest.spyOn(Config, 'smtpFrom', 'get').mockReturnValue('from@example.com');
    jest.spyOn(Config, 'smtpTo', 'get').mockReturnValue('to@example.com');
    jest.spyOn(Config, 'smtpPassword', 'get').mockReturnValue('pass');
  });

  beforeEach(() => {
    nock.disableNetConnect();
    logInfo.mockClear();
    logError.mockClear();
    logVerbose.mockClear();
    sendMail.mockClear();
    processExit.mockClear();
    notifyViaSmtp.mockReset();
    notifyOfFailure?.mockRestore();
    verboseMode?.mockRestore();
  });

  afterAll(() => {
    expect(createTransport).toHaveBeenCalledTimes(1);
    expect(createTransport).toHaveBeenCalledWith({
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      auth: {
        user: 'user@example.com',
        pass: 'pass'
      }
    });
  });

  describe('ofSuccess', () => {
    test('should log success', async () => {
      notifyOfFailure = jest.spyOn(Notify, 'ofFailure');

      await Notify.ofSuccess({
        message: '3/3 hosts synced.',
        verbose: 'Example verbose context'
      });

      expect(logInfo).toHaveBeenCalledTimes(1);
      expect(logInfo).toHaveBeenCalledWith('✔️ Success: 3/3 hosts synced.');
      expect(notifyOfFailure).not.toHaveBeenCalled();
      expect(processExit).not.toHaveBeenCalled();
    });

    test('should log verbose context', async () => {
      verboseMode = jest.spyOn(Config, 'verboseMode', 'get').mockReturnValue(true);

      await Notify.ofSuccess({
        message: '3/3 hosts synced.',
        verbose: 'Example verbose context'
      });

      expect(logInfo).toHaveBeenCalledTimes(2);
      expect(logInfo).toHaveBeenCalledWith('✔️ Success: 3/3 hosts synced.');
      expect(logInfo).toHaveBeenCalledWith('Example verbose context');
    });

    test('should notify as failure if errors present', async () => {
      notifyOfFailure = jest.spyOn(Notify, 'ofFailure');
      Notify.queueError({ message: 'Example error' });

      await Notify.ofSuccess({
        message: '3/3 hosts synced.',
        verbose: 'Example verbose context'
      });

      expect(logInfo).not.toHaveBeenCalled();
      expect(notifyOfFailure).toHaveBeenCalledTimes(1);
      expect(notifyOfFailure).toHaveBeenCalledWith({
        message:
          'Sync succeeded, but there were some unexpected errors. 3/3 hosts synced.'
      });
      expect(processExit).not.toHaveBeenCalled();
    });

    test('should dispatch email', async () => {
      jest.spyOn(Config, 'notifyViaSmtp', 'get').mockReturnValue(true);
      const notifyOnSuccess = jest
        .spyOn(Config, 'notifyOnSuccess', 'get')
        .mockReturnValue(true);
      sendMail.mockReturnValue(Promise.resolve());

      await Notify.ofSuccess({
        message: '3/3 hosts synced.',
        verbose: 'Example verbose context'
      });

      expect(notifyOnSuccess).toHaveBeenCalledTimes(1);
      expect(sendMail).toHaveBeenCalledTimes(1);
      expect(sendMail).toHaveBeenCalledWith({
        from: '"Orbital Sync" <from@example.com>',
        to: 'to@example.com',
        subject: 'Orbital Sync: ✔️ Success',
        text: 'Orbital Sync\n✔️ Success\n\n3/3 hosts synced.',
        html: '<p><h2>Orbital Sync</h2>✔️ Success</p><p>3/3 hosts synced.</p>'
      });
      expect(processExit).not.toHaveBeenCalled();
    });
  });

  describe('ofFailure', () => {
    test('should log error', async () => {
      await Notify.ofFailure({
        message: 'Example failure message',
        verbose: 'Example verbose context'
      });

      expect(logError).toHaveBeenCalledTimes(1);
      expect(logError).toHaveBeenCalledWith('⚠ Failure: Example failure message');
      expect(processExit).not.toHaveBeenCalled();
    });

    test('should log verbose context', async () => {
      verboseMode = jest.spyOn(Config, 'verboseMode', 'get').mockReturnValue(true);

      await Notify.ofFailure({
        message: 'Example failure message',
        verbose: 'Example verbose context'
      });

      expect(logError).toHaveBeenCalledTimes(1);
      expect(logError).toHaveBeenCalledWith('⚠ Failure: Example failure message');
      expect(logVerbose).toHaveBeenCalledTimes(1);
      expect(logVerbose).toHaveBeenCalledWith('Example verbose context');
    });

    test('should notify and exit', async () => {
      await Notify.ofFailure({
        message: 'Example catastrophic failure',
        exit: true
      });

      expect(processExit).toHaveBeenCalledTimes(1);
      expect(processExit).toHaveBeenCalledWith(1);
    });

    test('should dispatch email', async () => {
      jest.spyOn(Config, 'notifyViaSmtp', 'get').mockReturnValue(true);
      sendMail.mockReturnValue(Promise.resolve());

      await Notify.ofFailure({
        message: 'Example failure message',
        verbose: 'Example verbose context'
      });

      expect(sendMail).toHaveBeenCalledTimes(1);
      expect(sendMail).toHaveBeenCalledWith({
        from: '"Orbital Sync" <from@example.com>',
        to: 'to@example.com',
        subject: 'Orbital Sync: ⚠ Failed',
        text: 'Orbital Sync\n⚠ Failed\n\nExample failure message',
        html: '<p><h2>Orbital Sync</h2>⚠ Failed</p><p>Example failure message</p>'
      });
      expect(processExit).not.toHaveBeenCalled();
    });
  });

  describe('ofThrow', () => {
    test('should prepend Notify of unexpected error', async () => {
      notifyOfFailure = jest.spyOn(Notify, 'ofFailure');

      await Notify.ofThrow(new Error('Example thrown error'));

      expect(notifyOfFailure).toHaveBeenCalledTimes(1);
      expect(notifyOfFailure).toHaveBeenCalledWith({
        message: 'An unexpected error was thrown:\n- Error: Example thrown error'
      });
    });

    test('should Notify on throw', async () => {
      notifyOfFailure = jest.spyOn(Notify, 'ofFailure');

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
      notifyOfFailure = jest.spyOn(Notify, 'ofFailure');
      const allHostBaseUrls = jest
        .spyOn(Config, 'allHostUrls', 'get')
        .mockReturnValue(['http://10.0.0.2/admin', 'http://10.0.0.3/admin']);

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
          message: 'The host "http://10.0.0.3/admin" refused to connect. Is it down?',
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

  describe('dispatchSmtp', () => {
    test('should queue configuration error', async () => {
      const queueError = jest.spyOn(Notify, 'queueError');
      jest.spyOn(Config, 'notifyViaSmtp', 'get').mockImplementation(() => {
        throw new Error('Example configuration error');
      });

      await Notify.ofFailure({
        message: 'Example failure message',
        verbose: 'Example verbose context'
      });

      expect(queueError).toHaveBeenCalledTimes(1);
      expect(queueError).toHaveBeenCalledWith({
        message: 'SMTP is misconfigured. Please check your configuration.',
        verbose: 'Example configuration error'
      });
      expect(sendMail).not.toHaveBeenCalled();
      expect(processExit).not.toHaveBeenCalled();
      queueError.mockRestore();
    });
  });
});
