import { ConfigInterface } from '../config/index.js';
import { Version } from '../config/version.js';
import { HostV5 } from '../host/v5/index.js';
import { Log } from '../log.js';
import { Client } from './index.js';
import { ClientV5 } from './v5/index.js';

export class ClientFacory {
  static createSource(
    version: Version,
    config: ConfigInterface,
    log: Log
  ): Promise<Client> {
    switch (version) {
      case Version.v5: {
        const host = new HostV5(config.sync.primaryHost);
        return ClientV5.create({ host, config, log });
      }
      default:
        throw Error();
    }
  }

  public static createDestinations(
    version: Version,
    config: ConfigInterface,
    log: Log
  ): Promise<Client>[] {
    switch (version) {
      case Version.v5:
        return config.sync.secondaryHosts.map((hostConfig) => {
          const host = new HostV5(hostConfig);
          return ClientV5.create({ host, config, log });
        });
      default:
        throw Error();
    }
  }
}
