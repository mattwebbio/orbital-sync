import { ConfigInterface } from '../config/index.js';
import { Version } from '../config/version.js';
import { Host } from './index.js';
import { HostV5 } from './v5/index.js';

export class HostFactory {
  static createSource(version: Version, config: ConfigInterface): Host {
    switch (version) {
      case Version.v5:
        return new HostV5(config.sync.primaryHost);
      default:
        throw Error();
    }
  }

  static createDestinations(version: Version, config: ConfigInterface): Host[] {
    switch (version) {
      case Version.v5:
        return config.sync.secondaryHosts.map((host) => new HostV5(host));
      default:
        throw Error();
    }
  }
}
