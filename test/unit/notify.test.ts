import Honeybadger from '@honeybadger-io/js';
import Sentry from '@sentry/node';
import { jest } from '@jest/globals';
import nock from 'nock';
import { FetchError } from 'node-fetch';
import nodemailer from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';
import { EnvironmentConfig } from '../../src/config/environment';
import { Log } from '../../src/log';
import { ErrorNotification, Notify } from '../../src/notify';

describe('Notify', () => {
  let config: EnvironmentConfig;

  let log: Log;
  let logInfo: jest.SpiedFunction<typeof Log.prototype.info>;
  let logError: jest.SpiedFunction<typeof Log.prototype.error>;
  let logVerbose: jest.SpiedFunction<typeof Log.prototype.verbose>;
  const sendMail = jest.fn();
  const createTransport = jest
    .spyOn(nodemailer, 'createTransport')
    .mockReturnValue({ sendMail } as unknown as Mail);
  const processExit = jest
    .spyOn(process, 'exit')
    .mockImplementation(jest.fn<typeof process.exit>());
  let notifyOfFailure: ReturnType<typeof jest.spyOn>;
  let verboseMode: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    config = new EnvironmentConfig();
    jest.spyOn(config, 'notifyViaSmtp', 'get');
    jest.spyOn(config, 'smtpHost', 'get').mockReturnValue('smtp.example.com');
    jest.spyOn(config, 'smtpPort', 'get').mockReturnValue('587');
    jest.spyOn(config, 'smtpUser', 'get').mockReturnValue('user@example.com');
    jest.spyOn(config, 'smtpFrom', 'get').mockReturnValue('from@example.com');
    jest.spyOn(config, 'smtpTo', 'get').mockReturnValue('to@example.com');
    jest.spyOn(config, 'smtpPassword', 'get').mockReturnValue('pass');

    log = new Log(false);
    logInfo = jest.spyOn(log, 'info');
    logError = jest.spyOn(log, 'error');
    logVerbose = jest.spyOn(log, 'verbose');

    nock.disableNetConnect();
    logInfo.mockClear();
    logError.mockClear();
    logVerbose.mockClear();
    sendMail.mockClear();
    processExit.mockClear();
    notifyOfFailure?.mockRestore();
    verboseMode?.mockRestore();
  });

  afterAll(() => {
    expect(createTransport).toHaveBeenCalledTimes(2);
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
      const notify = new Notify(config, log);
      notifyOfFailure = jest.spyOn(notify, 'ofFailure');

      await notify.ofSuccess({
        message: '3/3 hosts synced.',
        verbose: 'Example verbose context'
      });

      expect(logInfo).toHaveBeenCalledTimes(1);
      expect(logInfo).toHaveBeenCalledWith('✔️ Success: 3/3 hosts synced.');
      expect(notifyOfFailure).not.toHaveBeenCalled();
      expect(processExit).not.toHaveBeenCalled();
    });

    test('should log verbose context', async () => {
      log.verboseMode = true;
      const notify = new Notify(config, log);

      await notify.ofSuccess({
        message: '3/3 hosts synced.',
        verbose: 'Example verbose context'
      });

      expect(logInfo).toHaveBeenCalledTimes(2);
      expect(logInfo).toHaveBeenCalledWith('✔️ Success: 3/3 hosts synced.');
      expect(logInfo).toHaveBeenCalledWith('Example verbose context');
    });

    test('should notify as failure if errors present', async () => {
      const notify = new Notify(config, log);
      notifyOfFailure = jest.spyOn(notify, 'ofFailure');
      notify.queueError({ message: 'Example error' });

      await notify.ofSuccess({
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
      const notify = new Notify(config, log);
      jest.spyOn(config, 'notifyViaSmtp', 'get').mockReturnValue(true);
      const notifyOnSuccess = jest
        .spyOn(config, 'notifyOnSuccess', 'get')
        .mockReturnValue(true);
      sendMail.mockReturnValue(Promise.resolve());

      await notify.ofSuccess({
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
      const notify = new Notify(config, log);
      await notify.ofFailure({
        message: 'Example failure message',
        verbose: 'Example verbose context'
      });

      expect(logError).toHaveBeenCalledTimes(1);
      expect(logError).toHaveBeenCalledWith('⚠ Failure: Example failure message');
      expect(processExit).not.toHaveBeenCalled();
    });

    test('should log verbose context', async () => {
      const notify = new Notify(config, log);
      verboseMode = jest.spyOn(config, 'verboseMode', 'get').mockReturnValue(true);

      await notify.ofFailure({
        message: 'Example failure message',
        verbose: 'Example verbose context'
      });

      expect(logError).toHaveBeenCalledTimes(1);
      expect(logError).toHaveBeenCalledWith('⚠ Failure: Example failure message');
      expect(logVerbose).toHaveBeenCalledTimes(1);
      expect(logVerbose).toHaveBeenCalledWith('Example verbose context');
    });

    test('should notify and exit', async () => {
      const notify = new Notify(config, log);
      await notify.ofFailure({
        message: 'Example catastrophic failure',
        exit: true
      });

      expect(processExit).toHaveBeenCalledTimes(1);
      expect(processExit).toHaveBeenCalledWith(1);
    });

    test('should dispatch email', async () => {
      const notify = new Notify(config, log);
      jest.spyOn(config, 'notifyViaSmtp', 'get').mockReturnValue(true);
      sendMail.mockReturnValue(Promise.resolve());

      await notify.ofFailure({
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
      const notify = new Notify(config, log);
      notifyOfFailure = jest.spyOn(notify, 'ofFailure');

      await notify.ofThrow(new Error('Example thrown error'));

      expect(notifyOfFailure).toHaveBeenCalledTimes(1);
      expect(notifyOfFailure).toHaveBeenCalledWith({
        message: 'An unexpected error was thrown:\n- Error: Example thrown error'
      });
    });

    test('should Notify on throw', async () => {
      const notify = new Notify(config, log);
      notifyOfFailure = jest.spyOn(notify, 'ofFailure');

      await notify.ofThrow(
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
      const notify = new Notify(config, log);
      notifyOfFailure = jest.spyOn(notify, 'ofFailure');
      const allHostBaseUrls = jest
        .spyOn(config, 'allHostUrls', 'get')
        .mockReturnValue(['http://10.0.0.2/admin', 'http://10.0.0.3/admin']);

      await notify.ofThrow(
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
      const notify = new Notify(config, log);
      const honeybadgerApiKey = jest
        .spyOn(config, 'honeybadgerApiKey', 'get')
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

      await notify.ofThrow(mockError);
      await notify.ofThrow('Example thrown string');

      expect(honeybadgerNotify).toHaveBeenCalledTimes(2);
      expect(honeybadgerNotify).toHaveBeenCalledWith(mockError);
      expect(honeybadgerNotify).toHaveBeenCalledWith('Example thrown string');
      expect(honeybadgerApiKey).toHaveBeenCalledTimes(3);
      expect(honeybadgerConfigure).toHaveBeenCalledTimes(1);
      expect(honeybadgerConfigure).toHaveBeenCalledWith({ apiKey: 'foobar' });
    });

    test('should send unexpected error to Sentry if configured', async () => {
      const notify = new Notify(config, log);
      const sentryDsn = jest.spyOn(config, 'sentryDsn', 'get').mockReturnValue('foobar');
      const sentryCapture = jest
        .spyOn(Sentry, 'captureException')
        .mockImplementation(jest.fn<typeof Sentry.captureException>());
      const sentryInit = jest.spyOn(Sentry, 'init').mockReturnValue({
        captureException: sentryCapture
      } as unknown as ReturnType<typeof Sentry.init>);
      const mockError = new FetchError('Connection error', 'system', {
        code: 'ECONNRESET'
      });

      await notify.ofThrow(mockError);
      await notify.ofThrow('Example thrown string');

      expect(sentryCapture).toHaveBeenCalledTimes(2);
      expect(sentryCapture).toHaveBeenCalledWith(mockError);
      expect(sentryCapture).toHaveBeenCalledWith('Example thrown string');
      expect(sentryDsn).toHaveBeenCalledTimes(3);
      expect(sentryInit).toHaveBeenCalledTimes(1);
      expect(sentryInit).toHaveBeenCalledWith({ dsn: 'foobar' });
    });
  });

  describe('dispatchSmtp', () => {
    test('should queue configuration error', async () => {
      const notify = new Notify(config, log);
      const queueError = jest.spyOn(notify, 'queueError');
      jest.spyOn(config, 'notifyViaSmtp', 'get').mockImplementation(() => {
        throw new Error('Example configuration error');
      });

      await notify.ofFailure({
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

    test('should stringify non-error objects', async () => {
      const notify = new Notify(config, log);
      const queueError = jest.spyOn(notify, 'queueError');
      jest.spyOn(config, 'notifyViaSmtp', 'get').mockImplementation(() => {
        throw 'Example configuration error';
      });

      await notify.ofFailure({
        message: 'Example failure message',
        verbose: 'Example verbose context'
      });

      expect(queueError).toHaveBeenCalledTimes(1);
      expect(queueError).toHaveBeenCalledWith({
        message: 'SMTP is misconfigured. Please check your configuration.',
        verbose: '"Example configuration error"'
      });
      expect(sendMail).not.toHaveBeenCalled();
      expect(processExit).not.toHaveBeenCalled();
      queueError.mockRestore();
    });
  });
});
