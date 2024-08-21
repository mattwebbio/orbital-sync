import { Log } from '../log.js';
import { ConfigInterface } from '../config/index.js';
import { NotifyV5 } from './v5/index.js';
import { Version } from '../config/version.js';

export class NotifyFactory {
  static create(version: Version, config: ConfigInterface, log: Log) {
    switch (version) {
      case Version.v5:
        return new NotifyV5(config, log);
      default:
        throw Error();
    }
  }
}
