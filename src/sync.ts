import chalk from 'chalk';
import sleep from 'sleep-promise';
import { ClientV5 } from './client/v5/index.js';
import { Config } from './config/environment.js';
import { Log } from './log.js';
import { Notify } from './notify.js';

export class Sync {
  static async perform(): Promise<void> {
    try {
      const primaryHost = await ClientV5.create(Config.primaryHost);
      const backup = await primaryHost.downloadBackup();

      const secondaryHostCount = Config.secondaryHosts.length;
      const successfulRestoreCount = (
        await Promise.all(
          Config.secondaryHosts.map((host) =>
            ClientV5.create(host)
              .then((client) => client.uploadBackup(backup))
              .catch((error) => Notify.ofThrow(error, true))
          )
        )
      ).filter(Boolean).length;

      if (secondaryHostCount === successfulRestoreCount) {
        await Notify.ofSuccess({
          message: `${successfulRestoreCount}/${secondaryHostCount} hosts synced.`
        });
      } else if (successfulRestoreCount > 0) {
        await Notify.ofFailure({
          sendNotification: Config.notifyOnSuccess || Config.notifyOnFailure,
          message: `${successfulRestoreCount}/${secondaryHostCount} hosts synced.`
        });
      } else {
        await Notify.ofFailure({
          message: `${successfulRestoreCount}/${secondaryHostCount} hosts synced.`
        });
      }
    } catch (e: unknown) {
      await Notify.ofThrow(e);
    }

    if (!Config.runOnce) {
      Log.info(chalk.dim(`Waiting ${Config.intervalMinutes} minutes...`));
      await sleep(Config.intervalMinutes * 60 * 1000);
    }
  }
}
