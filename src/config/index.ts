import { SyncOptionsV5 } from '../client/v5/sync-options.js';
import { Host } from '../host.js';

export abstract class Configuration {
  abstract get primaryHost(): Host;
  abstract get secondaryHosts(): Host[];
  abstract get allHostUrls(): string[];
  abstract get syncOptions(): SyncOptionsV5;
  abstract get updateGravity(): boolean;
  abstract get verboseMode(): boolean;
  abstract get notifyOnSuccess(): boolean;
  abstract get notifyOnFailure(): boolean;
  abstract get notifyViaSmtp(): boolean;
  abstract get smtpHost(): string;
  abstract get smtpPort(): string;
  abstract get smtpTls(): boolean;
  abstract get smtpUser(): string | undefined;
  abstract get smtpPassword(): string | undefined;
  abstract get smtpFrom(): string | undefined;
  abstract get smtpTo(): string | undefined;
  abstract get runOnce(): boolean;
  abstract get intervalMinutes(): number;
  abstract get honeybadgerApiKey(): string | undefined;
  abstract get sentryDsn(): string | undefined;
}
