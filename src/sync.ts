import { ConfigInterface } from './config/index.js';
import { Version } from './config/version.js';
import { Log } from './log.js';
import { NotifyFactory } from './notify/factory.js';
import { ClientFacory } from './client/factory.js';
import chalk from 'chalk';

export class Sync {
  static async perform(
    config: ConfigInterface,
    { log: _log }: { log?: Log } = {}
  ): Promise<void> {
    const version: Version = config.version as unknown as Version;
    const log = _log ?? new Log(config.verbose);
    const notify = NotifyFactory.create(version, config, log);

    try {
      const primaryClient = await ClientFacory.createSource(version, config, log);
      const backup = await primaryClient.makeBackup();

      const restores = await Promise.all(
        ClientFacory.createDestinations(version, config, log).map(async (client) => {
          log.info(chalk.dim(`Restoring to client ${(await client).getId()}`));
          return client
            .then(async (client) => await client.restoreBackup(backup))
            .catch((error) => notify.ofThrow(error, true));
        })
      );

      const secondaryClientCount = restores.length;
      const successfulRestoreCount = restores.filter(Boolean).length;

      if (secondaryClientCount === successfulRestoreCount) {
        await notify.ofSuccess({
          message: `${successfulRestoreCount}/${secondaryClientCount} hosts synced.`
        });
      } else if (successfulRestoreCount > 0) {
        await notify.ofFailure({
          sendNotification: config.notify.onSuccess || config.notify.onFailure,
          message: `${successfulRestoreCount}/${secondaryClientCount} hosts synced.`
        });
      } else {
        await notify.ofFailure({
          message: `${successfulRestoreCount}/${secondaryClientCount} hosts synced.`
        });
      }
    } catch (e: unknown) {
      await notify.ofThrow(e);
    }
  }
}
