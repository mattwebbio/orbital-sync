import { SyncOptionsV5 } from '../client/v5/sync-options.js';
import { ErrorNotification } from '../notify.js';
import { Host } from '../host.js';

export class EnvironmentConfig {
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

  get allHostUrls(): string[] {
    return [this.primaryHost, ...this.secondaryHosts].map((host) => host.fullUrl);
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

  get notifyOnSuccess(): boolean {
    return process.env['NOTIFY_ON_SUCCESS'] === 'true';
  }

  get notifyOnFailure(): boolean {
    return process.env['NOTIFY_ON_FAILURE'] !== 'false';
  }

  get notifyViaSmtp(): boolean {
    return process.env['NOTIFY_VIA_SMTP'] === 'true';
  }

  get smtpHost(): string {
    return this.getRequiredEnv('SMTP_HOST');
  }

  get smtpPort(): string {
    return process.env['SMTP_PORT'] ?? '587';
  }

  get smtpTls(): boolean {
    return process.env['SMTP_TLS'] === 'true';
  }

  get smtpUser(): string | undefined {
    return process.env['SMTP_USER'];
  }

  get smtpPassword(): string | undefined {
    return process.env['SMTP_PASSWORD'];
  }

  get smtpFrom(): string | undefined {
    return process.env['SMTP_FROM'];
  }

  get smtpTo(): string {
    return this.getRequiredEnv('SMTP_TO');
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

  get honeybadgerApiKey(): string | undefined {
    return process.env['HONEYBADGER_API_KEY'];
  }

  get sentryDsn(): string | undefined {
    return process.env['SENTRY_DSN'];
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
