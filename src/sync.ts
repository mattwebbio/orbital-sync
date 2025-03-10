import chalk from 'chalk';
import sleep from 'sleep-promise';
import { Host } from './client/host.js';
import { ClientFactory } from './client/index.js';
import { ConfigInterface } from './config/index.js';
import { Log } from './log.js';
import { Notify } from './notify.js';
import { FetchError } from 'node-fetch';

const numRetries = 6;

export class Sync {
  static async perform(
    config: ConfigInterface,
    { notify: _notify, log: _log }: { notify?: Notify; log?: Log } = {}
  ): Promise<void> {
    const notify = _notify ?? new Notify(config);
    const log = _log ?? new Log(config.verbose);

    try {
      const primaryHost = await ClientFactory.createClient({
        host: new Host(config.primaryHost),
        version: config.piHoleVersion || 'auto',
        options: config.sync.v6 || config.sync.v5,
        log
      });
      const backup = await primaryHost.downloadBackup();

      const secondaryHostCount = config.secondaryHosts?.length ?? 0;
      const successfulRestoreCount = (
        await Promise.all(
          config.secondaryHosts.map((host) =>
            ClientFactory.createClient({
              host: new Host(host),
              version: config.piHoleVersion || 'auto',
              options: config.sync.v6 || config.sync.v5,
              log
            })
              .then(async (client) => {
                let success: boolean = await client.uploadBackup(backup);

                if (success && config.updateGravity) {
                  // Cannot update gravity right away for v6, so try and loop while the target is able to process
                  if (client.getVersion() === 6) {
                    success = false;
                    let retry = 0;
                    // Retry up to 5 times with increasing wait times
                    while (!success && retry <= numRetries) {
                      try {
                        success = await client.updateGravity();
                      } catch (e) {
                        // Only consider fetch errors, otherwise rethrow the exception
                        if (e instanceof FetchError) {
                          log.info(chalk.red(e));
                          if (retry > numRetries) {
                            log.info(
                              chalk.red(
                                `Exhausted retries waiting for ${client.getHost().fullUrl} to be up. Check the server!`
                              )
                            );
                          } else {
                            log.info(
                              chalk.yellow(
                                `Sleeping for ${++retry}s and waiting for ${client.getHost().fullUrl} to be up...`
                              )
                            );
                            await sleep(1000 * retry);
                          }
                        } else {
                          throw e;
                        }
                      }
                    }
                  }
                }
                return success;
              })
              .catch((error) => notify.ofThrow(error, true))
          )
        )
      ).filter(Boolean).length;

      if (secondaryHostCount === successfulRestoreCount) {
        await notify.ofSuccess({
          message: `${successfulRestoreCount}/${secondaryHostCount} hosts synced.`
        });
      } else if (successfulRestoreCount > 0) {
        await notify.ofFailure({
          sendNotification: config.notify.onSuccess || config.notify.onFailure,
          message: `${successfulRestoreCount}/${secondaryHostCount} hosts synced.`
        });
      } else {
        await notify.ofFailure({
          message: `${successfulRestoreCount}/${secondaryHostCount} hosts synced.`
        });
      }
    } catch (e: unknown) {
      await notify.ofThrow(e);
    }
  }
}
