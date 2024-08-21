import { ConfigInterface } from '../config/index.js';
import { Host } from '../host/index.js';
import { Log } from '../log.js';
import { NodeFetchCookie } from './nodefetchcookie.js';

export abstract class Client {
  protected constructor(
    protected fetch: NodeFetchCookie,
    protected host: Host,
    protected token: string,
    protected config: ConfigInterface,
    protected log: Log
  ) {}

  public abstract makeBackup(): Promise<Blob>;
  public abstract restoreBackup(backup: Blob): Promise<true | never>;
  public getId = (): string => this.host.getId();
}
