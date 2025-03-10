import { Host } from './client/host.js';
import { ClientFactory } from './client/index.js';
import { ConfigInterface } from './config/index.js';
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
