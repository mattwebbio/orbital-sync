import { ErrorNotification } from './notify.js';

export class Config {
  private static _primaryHost?: Host;
  private static _secondaryHosts?: Host[];
  private static _syncOptions?: SyncOptions;
  private static _intervalMinutes?: number;

  static get primaryHost(): Host {
    this._primaryHost ??= new Host(
      this.getRequiredEnv('PRIMARY_HOST_BASE_URL'),
      this.getRequiredEnv('PRIMARY_HOST_PASSWORD')
    );

    return this._primaryHost;
  }

  static get secondaryHosts(): Host[] {
    if (!this._secondaryHosts) {
      this._secondaryHosts = [
        new Host(
          this.getRequiredEnv('SECONDARY_HOST_1_BASE_URL'),
          this.getRequiredEnv('SECONDARY_HOST_1_PASSWORD')
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
            this.getRequiredEnv(`SECONDARY_HOST_${count}_PASSWORD`)
          ));

        count++;
      }
    }

    return this._secondaryHosts;
  }

  //TODO look at usages
  static get allHostUrls(): string[] {
    return [this.primaryHost, ...this.secondaryHosts].map((host) => host.fullUrl);
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

  static get updateGravity(): boolean {
    return process.env['UPDATE_GRAVITY'] !== 'false';
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

  static get notifyViaSmtp(): boolean {
    return process.env['NOTIFY_VIA_SMTP'] === 'true';
  }

  static get smtpHost(): string {
    return this.getRequiredEnv('SMTP_HOST');
  }

  static get smtpPort(): string {
    return process.env['SMTP_PORT'] ?? '587';
  }

  static get smtpTls(): boolean {
    return process.env['SMTP_TLS'] === 'true';
  }

  static get smtpUser(): string | undefined {
    return process.env['SMTP_USER'];
  }

  static get smtpPassword(): string | undefined {
    return process.env['SMTP_PASSWORD'];
  }

  static get smtpFrom(): string | undefined {
    return process.env['SMTP_FROM'];
  }

  static get smtpTo(): string {
    return this.getRequiredEnv('SMTP_TO');
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
      throw new ErrorNotification({
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

export class Host {
  baseUrl: string;
  path: string;
  fullUrl: string;
  password: string;

  constructor(baseUrl: string, password: string, path?: string) {
    this.path = path ?? '/admin';
    this.baseUrl = baseUrl;
    this.password = password
    this.fullUrl = this.baseUrl + this.path
  }
}


