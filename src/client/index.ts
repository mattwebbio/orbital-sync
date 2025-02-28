import chalk from 'chalk';
import nodeFetch from 'node-fetch';
import { Host } from './host.js';
import { ClientV5 } from './v5/index.js';
import { ClientV6 } from './v6/index.js';
import { Log } from '../log.js';
import { PiholeVersion, SyncOptionsV5, SyncOptionsV6 } from '../config/index.js';

export interface PiholeClient {
  downloadBackup(): Promise<Blob>;
  uploadBackup(backup: Blob): Promise<true | never>;
  updateGravity(): Promise<true | never>;
}

export async function createClient({
  host,
  version,
  optionsV5,
  optionsV6,
  log
}: {
  host: Host;
  version: PiholeVersion;
  optionsV5: SyncOptionsV5;
  optionsV6: SyncOptionsV6;
  log: Log;
}): Promise<PiholeClient> {
  // If version is set explicitly, use that version's client
  if (version === 'v5') {
    return ClientV5.create({ host, options: optionsV5, log });
  }

  if (version === 'v6') {
    return ClientV6.create({ host, options: optionsV6, log });
  }

  // Auto-detect Pi-hole version
  log.info(chalk.yellow(`🔍 Auto-detecting Pi-hole version for ${host.fullUrl}...`));

  try {
    // Try to access v6 API endpoint to detect version
    const response = await nodeFetch(`${host.fullUrl}/api/v1/status`, {
      method: 'GET'
    });

    // If we get a 200 or 401 response, it's v6
    if (response.status === 200 || response.status === 401) {
      log.info(chalk.green(`✅ Detected Pi-hole v6 for ${host.fullUrl}`));
      return ClientV6.create({ host, options: optionsV6, log });
    }

    // Otherwise, fall back to v5
    log.info(chalk.green(`✅ Using Pi-hole v5 client for ${host.fullUrl}`));
    return ClientV5.create({ host, options: optionsV5, log });
  } catch (error) {
    log.info(chalk.green(`${error}`));
    // If there's an error during detection, try v5
    log.info(
      chalk.green(
        `✅ Using Pi-hole v5 client for ${host.fullUrl} (auto-detection failed)`
      )
    );
    return ClientV5.create({ host, options: optionsV5, log });
  }
}
