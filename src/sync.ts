import { Host } from './client/host.js';
import { createClient } from './client/index.js';
import { ConfigInterface, PiholeVersion } from './config/index.js';
import { Log } from './log.js';
import { Notify } from './notify.js';

export class Sync {
  static async perform(
    config: ConfigInterface,
    { notify: _notify, log: _log }: { notify?: Notify; log?: Log } = {}
  ): Promise<void> {
    const notify = _notify ?? new Notify(config);
    const log = _log ?? new Log(config.verbose);

    try {
      const version = (config.sync.version || 'auto') as PiholeVersion;
      const primaryHost = await createClient({
        host: new Host(config.primaryHost),
        version,
        optionsV5: config.sync.v5,
        optionsV6: config.sync.v6,
        log
      });
      const backup = await primaryHost.downloadBackup();

      const secondaryHostCount = config.secondaryHosts?.length ?? 0;
      const successfulRestoreCount = (
        await Promise.all(
          config.secondaryHosts.map((host) =>
            createClient({
              host: new Host(host),
              version,
              optionsV5: config.sync.v5,
              optionsV6: config.sync.v6,
              log
            })
              .then(async (client) => {
                let success = await client.uploadBackup(backup);

                if (success && config.updateGravity)
                  success = await client.updateGravity();

                return success;
              })
              .catch((error) => {
                notify.ofThrow(error, true);
                return false; // Explicitly return false to indicate failure
              })
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
