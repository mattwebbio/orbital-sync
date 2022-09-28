import { Notify } from './notify.js';

export class Config {
  private static _primaryHost?: Host;
  private static _secondaryHosts?: Host[];
  private static _syncOptions?: SyncOptions;
  private static _intervalMinutes?: number;

  static get primaryHost(): Host {
    this._primaryHost ??= {
      baseUrl: this.getRequiredEnv('PRIMARY_HOST_BASE_URL'),
      password: this.getRequiredEnv('PRIMARY_HOST_PASSWORD')
    };

    return this._primaryHost;
  }

  static get secondaryHosts(): Host[] {
    if (!this._secondaryHosts) {
      this._secondaryHosts = [
        {
          baseUrl: this.getRequiredEnv('SECONDARY_HOST_1_BASE_URL'),
          password: this.getRequiredEnv('SECONDARY_HOST_1_PASSWORD')
        }
      ];

      let count = 2;
      while (
        process.env[`SECONDARY_HOST_${count}_BASE_URL`] !== undefined &&
        process.env[`SECONDARY_HOST_${count}_PASSWORD`] !== undefined
      ) {
        this._secondaryHosts.push({
          baseUrl: process.env[`SECONDARY_HOST_${count}_BASE_URL`]!,
          password: process.env[`SECONDARY_HOST_${count}_PASSWORD`]!
        });

        count++;
      }
    }

    return this._secondaryHosts;
  }

  static get allHostBaseUrls(): string[] {
    return [this.primaryHost, ...this.secondaryHosts].map((host) => host.baseUrl);
  }

  static get syncOptions(): SyncOptions {
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

  static get verboseMode(): boolean {
    return process.env['VERBOSE'] === 'true';
  }

  static get notifyOnSuccess(): boolean {
    return process.env['NOTIFY_ON_SUCCESS'] === 'true';
  }

  static get notifyOnFailure(): boolean {
    return process.env['NOTIFY_ON_FAILURE'] !== 'false';
  }

  static get runOnce(): boolean {
    return process.env['RUN_ONCE'] === 'true';
  }

  static get intervalMinutes(): number {
    if (this._intervalMinutes) return this._intervalMinutes;

    if (process.env['INTERVAL_MINUTES']) {
      const parsed = parseInt(process.env['INTERVAL_MINUTES']);
      if (parsed && parsed > 0) this._intervalMinutes = parsed;
    }

    this._intervalMinutes ??= 30;
    return this._intervalMinutes;
  }

  static get honeybadgerApiKey(): string | undefined {
    return process.env['HONEYBADGER_API_KEY'];
  }

  private static getRequiredEnv(variable: string): string {
    const value = process.env[variable];

    if (value === undefined)
      Notify.ofFailure({
        message: `The environment variable ${variable} is required but not defined.`,
        exit: true
      });

    return value;
  }
}

export interface SyncOptions {
  whitelist: boolean;
  regexWhitelist: boolean;
  blacklist: boolean;
  regexlist: boolean;
  adlist: boolean;
  client: boolean;
  group: boolean;
  auditlog: boolean;
  staticdhcpleases: boolean;
  localdnsrecords: boolean;
  localcnamerecords: boolean;
  flushtables: boolean;
}

export interface Host {
  baseUrl: string;
  password: string;
}
