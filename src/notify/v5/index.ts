import { ConfigInterface } from '../../config/index.js';
import { Log } from '../../log.js';
import { Notify } from '../index.js';
import { HostV5 } from '../../host/v5/index.js';

export class NotifyV5 extends Notify {
  constructor(config: ConfigInterface, log: Log) {
    super(config, log);

    this.allHostUrls = [config.sync.primaryHost, ...config.sync.secondaryHosts].map(
      (host) => new HostV5(host).fullUrl
    );
  }
}
