import { ClientV5 } from './client/v5/index.js';
import { EnvironmentConfig } from './config/environment.js';
import { Log } from './log.js';
import { Notify } from './notify.js';

export class Sync {
  static async perform(
    config: EnvironmentConfig,
    { notify: _notify, log: _log }: { notify?: Notify; log?: Log } = {}
  ): Promise<void> {
    const notify = _notify ?? new Notify(config);
    const log = _log ?? new Log(config.verboseMode);

    try {
      const primaryHost = await ClientV5.create({
        host: config.primaryHost,
        options: config.syncOptions,
        log
      });
      const backup = await primaryHost.downloadBackup();

      const secondaryHostCount = config.secondaryHosts.length;
      const successfulRestoreCount = (
        await Promise.all(
          config.secondaryHosts.map((host) =>
            ClientV5.create({ host, options: config.syncOptions, log })
              .then(async (client) => {
                let success = await client.uploadBackup(backup);

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
          sendNotification: config.notifyOnSuccess || config.notifyOnFailure,
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
