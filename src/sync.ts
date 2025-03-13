import { Host } from './client/host.js';
import { ClientFactory } from './client/index.js';
import { ConfigInterface } from './config/index.js';
import { Log } from './log.js';
import { Notify } from './notify.js';
import chalk from 'chalk';
import { deepMerge } from './util/deepmerge.js';

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

      let configDataBackup = null;
      let enableSelectiveSync: boolean = false;
      const primaryHostVersion = primaryHost.getVersion();
      if (
        primaryHostVersion === 6 &&
        !config.sync.v6.config &&
        (config.sync.v6.selective_LocalDnsRecords ||
          config.sync.v6.selective_LocalCnameRecords)
      ) {
        try {
          configDataBackup = JSON.parse(await primaryHost.getExistingConfig());
          enableSelectiveSync = true;
        } catch {
          enableSelectiveSync = false;
        }
      }

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
                let success = await client.uploadBackup(backup);

                const clientVersion = client.getVersion();
                if (clientVersion === 6 && success && enableSelectiveSync) {
                  const clientExistingConfig = JSON.parse(
                    await client.getExistingConfig()
                  );
                  if (clientExistingConfig.config.webserver.api.app_sudo) {
                    let patchedConfigDNSRecords = {};
                    let patchedConfigCNAMERecords = {};

                    if (config.sync.v6.selective_LocalDnsRecords) {
                      patchedConfigDNSRecords = {
                        config: {
                          dns: {
                            hosts: configDataBackup.config.dns.hosts
                          }
                        }
                      };
                    }
                    if (config.sync.v6.selective_LocalCnameRecords) {
                      patchedConfigCNAMERecords = {
                        config: {
                          dns: {
                            cnameRecords: configDataBackup.config.dns.cnameRecords
                          }
                        }
                      };
                    }

                    const patchedConfig = deepMerge(
                      {},
                      patchedConfigDNSRecords,
                      patchedConfigCNAMERecords
                    );
                    if (patchedConfig) {
                      success = await client.uploadPatchedConfig(patchedConfig);
                    }
                  } else {
                    log.info(
                      chalk.red(
                        `⚠ Error: Secondary host ${host.baseUrl} has webserver.api.app_sudo set to false in pihole.toml. Skipping selective config sync for this host.`
                      )
                    );
                  }
                }

                if (success && config.updateGravity)
                  success = await client.updateGravity();

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
