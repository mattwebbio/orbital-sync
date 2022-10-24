import chalk from 'chalk';
import fetchCookie from 'fetch-cookie';
import nodeFetch, {
  Blob,
  FormData,
  RequestInfo,
  RequestInit,
  Response
} from 'node-fetch';
import { parse } from 'node-html-parser';
import type { Host } from './config.js';
import { Config } from './config.js';
import { Log } from './log.js';
import { ErrorNotification } from './notify.js';

export class Client {
  private constructor(
    private fetch: NodeFetchCookie,
    private host: Host,
    private token: string
  ) { }

  public static async create(host: Host): Promise<Client> {
    Log.info(chalk.yellow(`➡️ Signing in to ${host.baseUrl}...`));
    const fetch = fetchCookie(nodeFetch);

    await fetch(`${host.fullUrl}/index.php?login`, { method: 'GET' });
    const response = await fetch(`${host.fullUrl}/index.php?login`, {
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: `pw=${encodeURIComponent(host.password)}&persistentlogin=off`,
      method: 'POST'
    });
    if (response.status !== 200)
      throw new ErrorNotification({
        message: `There was an error logging in to "${host.baseUrl}" - are you able to log in with the configured password?`,
        verbose: {
          host: host.baseUrl,
          path: host.path,
          status: response.status,
          responseBody: await response.text()
        }
      });

    const token = this.parseResponseForToken(host, await response.text());

    Log.info(chalk.green(`✔️ Successfully signed in to ${host.baseUrl}!`));
    return new this(fetch, host, token);
  }

  private static parseResponseForToken(host: Host, responseBody: string): string {
    const root = parse(responseBody);
    const tokenDiv = root.querySelector('#token');
    if (!tokenDiv)
      throw new ErrorNotification({
        message: `No token could be found while logging in to "${host.baseUrl}" - are you able to log in with the configured password?`,
        verbose: {
          host: host.baseUrl,
          path: host.path,
          innerHtml: root.innerHTML
        }
      });

    const token = tokenDiv.innerText;
    if (token.length != 44)
      throw new ErrorNotification({
        message: `A token was found but could not be validated while logging in to "${host.baseUrl}" - are you able to log in with the configured password?`,
        verbose: {
          host: host.baseUrl,
          path: host.path,
          token: token
        }
      });

    return token;
  }

  public async downloadBackup(): Promise<Blob> {
    Log.info(chalk.yellow(`➡️ Downloading backup from ${this.host.baseUrl}...`));
    const form = this.generateForm();

    const response = await this.fetch(
      `${this.host.fullUrl}/scripts/pi-hole/php/teleporter.php`,
      {
        body: form,
        method: 'POST'
      }
    );
    if (
      response.status !== 200 ||
      response.headers.get('content-type') !== 'application/gzip'
    )
      throw new ErrorNotification({
        message: `Failed to download backup from "${this.host.baseUrl}".`,
        verbose: {
          host: this.host.baseUrl,
          path: this.host.path,
          status: response.status,
          responseBody: await response.text()
        }
      });

    const data = await response.arrayBuffer();

    Log.info(chalk.green(`✔️ Backup from ${this.host.baseUrl} completed!`));
    return new Blob([data]);
  }

  public async uploadBackup(backup: Blob): Promise<true | never> {
    Log.info(chalk.yellow(`➡️ Uploading backup to ${this.host.baseUrl}...`));

    const form = this.generateForm();
    form.append('action', 'in');
    form.append('zip_file', backup, 'backup.tar.gz');

    const uploadResponse = await this.fetch(
      `${this.host.fullUrl}/scripts/pi-hole/php/teleporter.php`,
      {
        body: form,
        method: 'POST'
      }
    );
    const uploadText = await uploadResponse.text();
    if (uploadResponse.status !== 200 || !uploadText.endsWith('OK'))
      throw new ErrorNotification({
        message: `Failed to upload backup to "${this.host.baseUrl}".`,
        verbose: {
          host: this.host.baseUrl,
          path: this.host.path,
          status: uploadResponse.status,
          responseBody: uploadText
        }
      });

    Log.info(chalk.green(`✔️ Backup uploaded to ${this.host.baseUrl}!`));
    Log.verbose(`Result:\n${chalk.blue(uploadText)}`);

    if (Config.updateGravity) {
      Log.info(chalk.yellow(`➡️ Updating gravity on ${this.host.baseUrl}...`));
      const gravityUpdateResponse = await this.fetch(
        `${this.host.fullUrl}/scripts/pi-hole/php/gravity.sh.php`,
        { method: 'GET' }
      );

      const updateText = (await gravityUpdateResponse.text())
        .replaceAll('\ndata:', '')
        .trim();
      if (
        gravityUpdateResponse.status !== 200 ||
        !updateText.endsWith('Pi-hole blocking is enabled')
      )
        throw new ErrorNotification({
          message: `Failed updating gravity on "${this.host.baseUrl}".`,
          verbose: {
            host: this.host.baseUrl,
            path: this.host.path,
            status: gravityUpdateResponse.status,
            eventStream: updateText
          }
        });

      Log.info(chalk.green(`✔️ Gravity updated on ${this.host.baseUrl}!`));
      Log.verbose(`Result:\n${chalk.blue(updateText)}`);
    }

    return true;
  }

  private generateForm(): typeof FormData.prototype {
    const form = new FormData();
    form.append('token', this.token);

    form.append('whitelist', Config.syncOptions.whitelist);
    form.append('regex_whitelist', Config.syncOptions.regexWhitelist);
    form.append('blacklist', Config.syncOptions.blacklist);
    form.append('regexlist', Config.syncOptions.regexlist);
    form.append('adlist', Config.syncOptions.adlist);
    form.append('client', Config.syncOptions.client);
    form.append('group', Config.syncOptions.group);
    form.append('auditlog', Config.syncOptions.auditlog);
    form.append('staticdhcpleases', Config.syncOptions.staticdhcpleases);
    form.append('localdnsrecords', Config.syncOptions.localdnsrecords);
    form.append('localcnamerecords', Config.syncOptions.localcnamerecords);
    form.append('flushtables', Config.syncOptions.flushtables);

    return form;
  }
}

type NodeFetchCookie = ReturnType<typeof fetchCookie<RequestInfo, RequestInit, Response>>;
