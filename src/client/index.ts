import chalk from 'chalk';
import nodeFetch from 'node-fetch';
import { Host } from './host.js';
import { ClientV5 } from './v5/index.js';
import { ClientV6 } from './v6/index.js';
import { Log } from '../log.js';
import { Version, SyncOptionsV5, SyncOptionsV6 } from '../config/index.js';

export interface Client {
  downloadBackup(): Promise<Blob>;
  uploadBackup(backup: Blob): Promise<true | never>;
  updateGravity(): Promise<true | never>;
  getHost(): Host;
  getVersion(): number;
  cleanup(): Promise<void>;
}

export class ClientFactory {
  public static async createClient({
    host,
    version,
    options,
    log
  }: {
    host: Host;
    version?: Version;
    options: SyncOptionsV6 | SyncOptionsV5;
    log: Log;
  }): Promise<Client> {
    version ??= 'auto';

    if (version === '5') {
      return ClientV5.create({ host, options: options as SyncOptionsV5, log });
    } else if (version === '6') {
      return ClientV6.create({ host, options: options as SyncOptionsV6, log });
    } else {
      // Auto-detect Pi-hole version
      log.info(chalk.yellow(`Checking PiHole version for ${host.fullUrl}...`));

      try {
        // Get the documentation URl since that does not require a password.
        const response = await nodeFetch(`${host.fullUrl}/api/docs`, {
          method: 'GET'
        });

        if (response.status === 200) {
          log.info(chalk.green(`✔️ PiHole (v6) API is available for ${host.fullUrl}`));
          return ClientV6.create({ host, options: options as SyncOptionsV6, log });
        }

        // Otherwise, assume v5
        log.info(
          chalk.green(
            `✔️ PiHole (v6) API is NOT available, assuming v5 for ${host.fullUrl}`
          )
        );
        return ClientV5.create({ host, options: options as SyncOptionsV5, log });
      } catch (error) {
        log.info(chalk.red(`${error}`));
        // default to V6
        return ClientV6.create({ host, options: options as SyncOptionsV6, log });
      }
    }
  }
}
