import { SyncOptionsV5 } from '../client/v5/sync-options.js';
import { Host } from '../host.js';
import { NotifyConfig } from './notify/index.js';
import { ConfigInterface } from './interface.js';

export abstract class BaseConfig implements ConfigInterface {
  abstract get primaryHost(): Host;
  abstract get secondaryHosts(): Host[];
  abstract get syncOptions(): SyncOptionsV5;
  abstract get updateGravity(): boolean;
  abstract get verboseMode(): boolean;
  abstract get notify(): NotifyConfig;
  abstract get runOnce(): boolean;
  abstract get intervalMinutes(): number;

  get allHostUrls(): string[] {
    return [this.primaryHost, ...this.secondaryHosts].map((host) => host.fullUrl);
  }
}
