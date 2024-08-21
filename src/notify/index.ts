import Honeybadger from '@honeybadger-io/js';
import Sentry from '@sentry/node';
import { FetchError } from 'node-fetch';
import nodemailer from 'nodemailer';
import { Log } from '../log.js';
import { ConfigInterface } from '../config/index.js';

export abstract class Notify {
  private errorQueue: NotificationInterface[] = [];
  private _honeybadger?: Honeybadger;
  private _sentry?: typeof Sentry;
  private _smtpClient?: nodemailer.Transporter;
  protected allHostUrls: string[];

  constructor(
    private config: ConfigInterface,
    private log: Log = new Log(config.verbose)
  ) {
    this.allHostUrls = [];
  }

  async ofThrow(error: unknown, queue = false): Promise<void> {
    if (error instanceof ErrorNotification) {
      if (!queue || (error as NotificationInterface).exit) await this.ofFailure(error);
      else this.queueError(error);
    } else if (error instanceof FetchError && error.code === 'ECONNREFUSED') {
      const messageSubstring = error.message.split('ECONNREFUSED')[0];
      const url = this.allHostUrls.find((url) => messageSubstring.includes(url));

      await this.ofThrow(
        new ErrorNotification({
          message: `The host "${url}" refused to connect. Is it down?`,
          verbose: error.message
        }),
        queue
      );
    } else {
      if (error instanceof Error || typeof error === 'string') {
        this.honeybadger?.notify(error);
        this.sentry?.captureException(error);
      }
      await this.ofFailure({
        message: `An unexpected error was thrown:\n- ${error?.toString() ?? error}`
      });
    }
  }

  async ofSuccess({
    message,
    verbose,
    sendNotification
  }: NotificationInterface): Promise<void> {
    if (this.errorQueue.length > 0) {
      await this.ofFailure({
        message: `Sync succeeded, but there were some unexpected errors. ${message}`
      });

      return;
    }

    this.log.info(`✔️ Success: ${message}`);
    this.log.verbose(verbose);

    if (sendNotification ?? this.config.notify.onSuccess) {
      await this.dispatch('✔️ Success', message);
    }
  }

  ofFailure({ exit }: NotificationInterface & { exit: true }): never;
  ofFailure({ exit }: NotificationInterface): Promise<void>;
  async ofFailure({
    message,
    verbose,
    sendNotification,
    exit
  }: NotificationInterface): Promise<void> {
    this.log.error(`⚠ Failure: ${message}`);
    this.log.verbose(verbose);

    const errors = this.errorQueue.map((notif) => notif.message);
    this.errorQueue = [];

    if (sendNotification ?? this.config.notify.onFailure) {
      let formatted = message;
      if (errors.length > 0) {
        formatted = formatted.concat(
          '\n\nThe following errors occurred during sync:\n- ',
          errors.join('\n- ')
        );
      }

      await this.dispatch(`⚠ Failed`, formatted);
    }

    if (exit || this.config.runOnce) process.exit(1);
  }

  queueError(error: NotificationInterface): void {
    this.log.error(`⚠ Error: ${error.message}`);
    this.log.verbose(error.verbose);

    this.errorQueue.push(error);
  }

  private get honeybadger(): Honeybadger | undefined {
    if (this.config.notify.exceptions?.honeybadgerApiKey === undefined) return;

    this._honeybadger ??= Honeybadger.configure({
      apiKey: this.config.notify.exceptions.honeybadgerApiKey
    });

    return this._honeybadger;
  }

  private get sentry(): typeof Sentry | undefined {
    if (this.config.notify.exceptions?.sentryDsn === undefined) return;

    if (this._sentry === undefined) {
      Sentry.init({
        dsn: this.config.notify.exceptions.sentryDsn
      });

      this._sentry = Sentry;
    }

    return this._sentry;
  }

  private async dispatch(subject: string, contents: string): Promise<void> {
    await Promise.allSettled([this.dispatchSmtp(subject, contents)]);
  }

  private async dispatchSmtp(subject: string, contents: string): Promise<void> {
    try {
      if (this.config.notify.smtp?.enabled && this.smtpClient) {
        this.log.verbose('➡️ Dispatching notification email...');

        await this.smtpClient.sendMail({
          from: this.config.notify.smtp.from
            ? `"Orbital Sync" <${this.config.notify.smtp.from}>`
            : undefined,
          to: this.config.notify.smtp.to,
          subject: `Orbital Sync: ${subject}`,
          text: `Orbital Sync\n${subject}\n\n${contents}`,
          html: `<p><h2>Orbital Sync</h2>${subject}</p><p>${contents.replaceAll(
            '\n',
            '<br />'
          )}</p>`
        });

        this.log.verbose('✔️ Notification email dispatched.');
      }
    } catch (e) {
      const error: NotificationInterface = {
        message: 'SMTP is misconfigured. Please check your configuration.'
      };
      if (e instanceof Error) error.verbose = e.message;
      else error.verbose = JSON.stringify(e);

      this.queueError(error);
    }
  }

  private get smtpClient(): nodemailer.Transporter | undefined {
    if (!this.config.notify.smtp?.enabled) return;
    if (!this.config.notify.smtp?.host)
      throw new Error('SMTP is enabled but no host is provided.');

    if (!this._smtpClient) {
      this.log.verbose('➡️ Creating SMTP client...');

      this._smtpClient = nodemailer.createTransport({
        host: this.config.notify.smtp.host,
        port: this.config.notify.smtp.port,
        secure: this.config.notify.smtp.tls,
        auth: this.config.notify.smtp.user
          ? {
              user: this.config.notify.smtp.user,
              pass: this.config.notify.smtp.password
            }
          : undefined
      });

      this.log.verbose('✔️ SMTP client created successfully.');
    }

    return this._smtpClient;
  }
}

export class ErrorNotification extends Error implements NotificationInterface {
  verbose?: string | Record<string, unknown> | undefined;

  constructor(args: NotificationInterface) {
    super(args.message);
    Object.assign(this, args);
  }
}

export interface NotificationInterface {
  message: string;
  verbose?: string | Record<string, unknown>;
  sendNotification?: boolean;
  exit?: boolean;
}
