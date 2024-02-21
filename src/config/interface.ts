import { SyncOptionsV5 } from '../client/v5/sync-options.js';
import { Host } from '../host.js';
import { NotifyConfig } from './notify/index.js';

export interface ConfigInterface {
  primaryHost: Host;
  secondaryHosts: Host[];
  syncOptions: SyncOptionsV5;
  updateGravity: boolean;
  verboseMode: boolean;
  notify: NotifyConfig;
  runOnce: boolean;
  intervalMinutes: number;
}
