import { SyncOptionsV5 } from '../client/v5/sync-options.js';
import { ErrorNotification } from '../notify.js';
import { Host } from '../client/host.js';
import { BaseConfig } from './base.js';
import { NotifySmtpConfig } from './notify/smtp.js';
import { NotifyConfig } from './notify/index.js';
import { NotifyExceptionsConfig } from './notify/exceptions.js';

export class EnvironmentConfig extends BaseConfig {
  private _primaryHost?: Host;
  private _secondaryHosts?: Host[];
  private _syncOptions?: SyncOptionsV5;
  private _intervalMinutes?: number;

  get primaryHost(): Host {
    this._primaryHost ??= new Host(
      this.getRequiredEnv('PRIMARY_HOST_BASE_URL'),
      this.getRequiredEnv('PRIMARY_HOST_PASSWORD'),
      process.env['PRIMARY_HOST_PATH']
    );

    return this._primaryHost;
  }

  get secondaryHosts(): Host[] {
    if (!this._secondaryHosts) {
      this._secondaryHosts = [
        new Host(
          this.getRequiredEnv('SECONDARY_HOST_1_BASE_URL'),
          this.getRequiredEnv('SECONDARY_HOST_1_PASSWORD'),
          process.env['SECONDARY_HOST_1_PATH']
        )
      ];

      let count = 2;
      while (
        process.env[`SECONDARY_HOST_${count}_BASE_URL`] !== undefined &&
        process.env[`SECONDARY_HOST_${count}_PASSWORD`] !== undefined
      ) {
        this._secondaryHosts.push(
          new Host(
            this.getRequiredEnv(`SECONDARY_HOST_${count}_BASE_URL`),
            this.getRequiredEnv(`SECONDARY_HOST_${count}_PASSWORD`),
            process.env[`SECONDARY_HOST_${count}_PATH`]
          )
        );

        count++;
      }
    }

    return this._secondaryHosts;
  }

  get syncOptions(): SyncOptionsV5 {
    this._syncOptions ??= {
      whitelist: process.env['SYNC_WHITELIST'] !== 'false',
      regexWhitelist: process.env['SYNC_REGEX_WHITELIST'] !== 'false',
      blacklist: process.env['SYNC_BLACKLIST'] !== 'false',
      regexlist: process.env['SYNC_REGEXLIST'] !== 'false',
      adlist: process.env['SYNC_ADLIST'] !== 'false',
      client: process.env['SYNC_CLIENT'] !== 'false',
      group: process.env['SYNC_GROUP'] !== 'false',
      auditlog: process.env['SYNC_AUDITLOG'] === 'true',
      staticdhcpleases: process.env['SYNC_STATICDHCPLEASES'] === 'true',
      localdnsrecords: process.env['SYNC_LOCALDNSRECORDS'] !== 'false',
      localcnamerecords: process.env['SYNC_LOCALCNAMERECORDS'] !== 'false',
      flushtables: process.env['SYNC_FLUSHTABLES'] !== 'false'
    };

    return this._syncOptions;
  }

  get updateGravity(): boolean {
    return process.env['UPDATE_GRAVITY'] !== 'false';
  }

  get verboseMode(): boolean {
    return process.env['VERBOSE'] === 'true';
  }

  get notify(): NotifyConfig {
    return {
      onSuccess: process.env['NOTIFY_ON_SUCCESS'] === 'true',
      onFailure: process.env['NOTIFY_ON_FAILURE'] !== 'false',
      smtp: this.smtp,
      exceptions: this.exceptions
    };
  }

  private get smtp(): NotifySmtpConfig {
    const enabled = process.env['NOTIFY_VIA_SMTP'] === 'true';

    if (enabled)
      return {
        enabled,
        host: this.getRequiredEnv('SMTP_HOST'),
        port: process.env['SMTP_PORT'] ?? '587',
        tls: process.env['SMTP_TLS'] === 'true',
        user: process.env['SMTP_USER'],
        password: process.env['SMTP_PASSWORD'],
        from: process.env['SMTP_FROM'],
        to: this.getRequiredEnv('SMTP_TO')
      };
    else return { enabled };
  }

  private get exceptions(): NotifyExceptionsConfig {
    return {
      honeybadgerApiKey: process.env['HONEYBADGER_API_KEY'],
      sentryDsn: process.env['SENTRY_DSN']
    };
  }

  get runOnce(): boolean {
    return process.env['RUN_ONCE'] === 'true';
  }

  get intervalMinutes(): number {
    if (this._intervalMinutes) return this._intervalMinutes;

    if (process.env['INTERVAL_MINUTES']) {
      const parsed = parseInt(process.env['INTERVAL_MINUTES']);
      if (parsed && parsed > 0) this._intervalMinutes = parsed;
    }

    this._intervalMinutes ??= 30;
    return this._intervalMinutes;
  }

  private getRequiredEnv(variable: string): string {
    const value = process.env[variable];

    if (value === undefined)
      throw new ErrorNotification({
        message: `The environment variable ${variable} is required but not defined.`,
        exit: true
      });

    return value;
  }
}
