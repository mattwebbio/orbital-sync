import chalk from 'chalk';
import fetchCookie from 'fetch-cookie';
import nodeFetch, {
  Blob,
  FetchError,
  FormData,
  RequestInfo,
  RequestInit,
  Response
} from 'node-fetch';
import type { Host } from '../host.js';
import { Log } from '../../log.js';
import { ErrorNotification } from '../../notify.js';
import type { SyncOptionsV6 } from '../../config/index.js';
import sleep from 'sleep-promise';

export type PiHoleSession = {
  valid: boolean;
  totp: boolean;
  sid: string;
  csrf: string;
  validity: number;
  message: string;
};

export type PiHoleAuthResponse = {
  session: PiHoleSession;
};

export class ClientV6 {
  private constructor(
    private fetch: NodeFetchCookie,
    private host: Host,
    private token: string,
    private options: SyncOptionsV6,
    private log: Log,
    private version: 6
  ) {}

  public static async create({
    host,
    options,
    log
  }: {
    host: Host;
    options: SyncOptionsV6;
    log: Log;
  }): Promise<ClientV6> {
    log.info(chalk.yellow(`➡️ Signing in to ${host.fullUrl}...`));
    const fetch = fetchCookie(nodeFetch);
    const path = '/api/auth';
    await fetch(`${host.fullUrl}/api/auth`, { method: 'GET' });
    const response = await fetch(`${host.fullUrl}${path}`, {
      headers: {
        'content-type': 'application/json'
      },
      body: `{"password":"${host.password}"}`,
      method: 'POST'
    });
    if (response.status !== 200) {
      throw new ErrorNotification({
        message: `There was an error logging in to "${host.fullUrl}" - are you able to log in with the configured password?`,
        verbose: {
          host: host.fullUrl,
          path,
          status: response.status,
          responseBody: await response.text()
        }
      });
    }

    const body: PiHoleAuthResponse = (await response.json()) as PiHoleAuthResponse;
    const token = body.session.sid;

    log.info(chalk.green(`✔️ Successfully signed in to ${host.fullUrl}!`));
    return new this(fetch, host, token, options, log, 6);
  }

  public getVersion(): number {
    return this.version;
  }

  public getHost(): Host {
    return this.host;
  }

  public async downloadBackup(): Promise<Blob> {
    this.log.info(chalk.yellow(`➡️ Downloading backup from ${this.host.fullUrl}...`));

    const path = '/api/teleporter';
    const response = await this.fetch(`${this.host.fullUrl}${path}`, {
      headers: {
        accept: 'application/zip',
        sid: this.token
      },
      method: 'GET'
    });

    if (response.status !== 200) {
      throw new ErrorNotification({
        message: `Failed to download backup from "${this.host.fullUrl}".`,
        verbose: {
          host: this.host.fullUrl,
          path,
          status: response.status,
          responseBody: await response.text()
        }
      });
    }

    const data = await response.arrayBuffer();

    this.log.info(chalk.green(`✔️ Backup from ${this.host.fullUrl} completed!`));
    return new Blob([data]);
  }

  public async uploadBackup(backup: Blob): Promise<true | never> {
    this.log.info(chalk.yellow(`➡️ Uploading backup to ${this.host.fullUrl}...`));
    const path = '/api/teleporter';
    const form = this.generateForm();
    form.append('file', backup, 'backup.zip');

    const uploadResponse = await this.fetch(`${this.host.fullUrl}${path}`, {
      headers: {
        accept: 'application/json',
        sid: this.token
      },
      body: form,
      method: 'POST'
    });
    const uploadText = await uploadResponse.text();
    if (uploadResponse.status !== 200) {
      throw new ErrorNotification({
        message: `Failed to upload backup to "${this.host.fullUrl}".`,
        verbose: {
          host: this.host.fullUrl,
          path,
          status: uploadResponse.status,
          responseBody: uploadText
        }
      });
    }

    this.log.info(chalk.green(`✔️ Backup uploaded to ${this.host.fullUrl}!`));
    this.log.verbose(`Result:\n${chalk.blue(uploadText)}`);

    return true;
  }

  public async updateGravity(attempt = 1): Promise<true | never> {
    const path = '/api/action/gravity';

    if (attempt > this.options.gravityUpdateRetryCount) {
      throw new ErrorNotification({
        message: `Exhausted ${attempt} retries updating gravity on ${this.host.fullUrl}.`,
        verbose: {
          host: this.host.fullUrl,
          path
        }
      });
    }

    try {
      this.log.info(
        chalk.yellow(`➡️ Attempting to update gravity on ${this.host.fullUrl}...`)
      );
      const gravityUpdateResponse = await this.fetch(`${this.host.fullUrl}${path}`, {
        headers: {
          accept: 'text/plain',
          sid: this.token
        },
        method: 'POST',
        body: null
      });

      const updateText = (await gravityUpdateResponse.text()).trim();
      if (gravityUpdateResponse.status >= 502 && gravityUpdateResponse.status <= 504) {
        this.log.verbose(chalk.red(`⚠️ ${gravityUpdateResponse.status} - ${updateText}`));
        await this.exponentialSleep(attempt);
        return this.updateGravity(attempt + 1);
      }

      if (gravityUpdateResponse.status !== 200) {
        throw new ErrorNotification({
          message: `Failed updating gravity on "${this.host.fullUrl}".`,
          verbose: {
            host: this.host.fullUrl,
            path,
            status: gravityUpdateResponse.status,
            eventStream: updateText
          }
        });
      }

      this.log.info(chalk.green(`✔️ Gravity updated on ${this.host.fullUrl}!`));
      this.log.verbose(`Result:\n${chalk.blue(updateText)}`);
    } catch (error) {
      if (!(error instanceof FetchError)) throw error;

      this.log.verbose(chalk.red(error));
      await this.exponentialSleep(attempt);
      return this.updateGravity(attempt + 1);
    }

    return true;
  }

  private exponentialSleep(attempt: number): Promise<void> {
    const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 60000);
    this.log.info(
      chalk.yellow(
        `Sleeping for ${backoffMs / 1000}s and waiting for ${this.host.fullUrl} to be up...`
      )
    );
    return sleep(backoffMs);
  }

  private generateForm(): typeof FormData.prototype {
    const form = new FormData();

    form.append(
      'import',
      JSON.stringify({
        config: this.options.config,
        dhcp_leases: this.options.dhcp_leases,
        gravity: {
          group: this.options.group,
          adlist: this.options.adlist,
          adlist_by_group: this.options.adlist_by_group,
          domainlist: this.options.domainlist,
          domainlist_by_group: this.options.domainlist_by_group,
          client: this.options.client,
          client_by_group: this.options.client_by_group
        }
      })
    );

    return form;
  }
}

type NodeFetchCookie = ReturnType<typeof fetchCookie<RequestInfo, RequestInit, Response>>;
