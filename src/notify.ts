import Honeybadger from '@honeybadger-io/js';
import { Config } from './config.js';
import { Log } from './log.js';

export class Notify {
  private static errorQueue: NotificationInterface[] = [];
  private static _honeybadger?: Honeybadger;

  static ofThrow(error: unknown, queue = false): void {
    if (error instanceof ErrorNotification) {
      queue ? Notify.queueError(error) : Notify.ofFailure(error);
    } else {
      if (error instanceof Error || typeof error === 'string')
        this.honeybadger?.notify(error);
      Notify.ofFailure({
        message: `An unexpected error was thrown:\n- ${error?.toString() ?? error}`
      });
    }
  }

  static ofSuccess({
    message,
    verbose,
    sendNotification,
    exit
  }: NotificationInterface): void {
    Log.info(`Success: ${message}`);
    if (Config.verboseMode && verbose) Log.info(verbose);

    if (sendNotification ?? Config.notifyOnSuccess) {
      // TODO: Add notification handlers
    }

    if (exit) process.exit(1);
  }

  static ofFailure({ exit }: NotificationInterface & { exit: true }): never;
  static ofFailure({ exit }: NotificationInterface): void;
  static ofFailure({
    message,
    verbose,
    sendNotification,
    exit
  }: NotificationInterface): void {
    Log.error(`⚠ Failure: ${message}`);
    if (Config.verboseMode && verbose) Log.error(verbose);

    const errors = this.errorQueue.map((notif) => notif.message);
    this.errorQueue = [];

    if (sendNotification ?? Config.notifyOnFailure) {
      errors;
      // TODO: Add notification handlers
    }

    if (exit) process.exit(1);
  }

  static queueError(error: NotificationInterface): void {
    Log.error(error.message);
    if (Config.verboseMode && error.verbose) Log.error(error.verbose);

    this.errorQueue.push(error);
  }

  private static get honeybadger(): Honeybadger | undefined {
    if (Config.honeybadgerApiKey === undefined) return;

    this._honeybadger ??= Honeybadger.configure({
      apiKey: Config.honeybadgerApiKey
    });

    return this._honeybadger;
  }
}

export class ErrorNotification extends Error implements NotificationInterface {
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
