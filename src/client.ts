import chalk from 'chalk';
import fetchCookie from 'fetch-cookie';
import fs from 'fs';
import https from 'https';
import nodeFetch, {
  Blob,
  FormData,
  RequestInfo,
  RequestInit,
  Response
} from 'node-fetch';
import { parse } from 'node-html-parser';
import tls from 'tls';
import type { Host } from './config.js';
import { Config } from './config.js';
import { Log } from './log.js';
import { ErrorNotification } from './notify.js';

const customCAPath = "/trusted-certs";
const trustedCAsFetch = (url: RequestInfo, options: RequestInit = {}): Promise<Response> => {
  let agent: https.Agent;
  try {
    const certFiles = fs.readdirSync(customCAPath);
    if (certFiles.length > 0) {
      const suppliedCerts = certFiles.map(certFile => fs.readFileSync(`${customCAPath}/${certFile}`));
      agent = new https.Agent({ ca: [...tls.rootCertificates, ...suppliedCerts] });
    } else {
      Log.verbose(`No custom certificates found in directory: ${customCAPath}`);
      agent = new https.Agent();
    }
  } catch (error) {
    Log.error(`Error loading custom certificates: ${error}`);
    agent = new https.Agent();
  }

  return nodeFetch(url, { agent, ...options });
};

export class Client {
  private constructor(
    private fetch: NodeFetchCookie,
    private host: Host,
    private token: string
  ) {}

  public static async create(host: Host): Promise<Client> {
    Log.info(chalk.yellow(`➡️ Signing in to ${host.fullUrl}...`));
    const fetch = fetchCookie(trustedCAsFetch);

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
        message: `There was an error logging in to "${host.fullUrl}" - are you able to log in with the configured password?`,
        verbose: {
          host: host.baseUrl,
          path: host.path,
          status: response.status,
          responseBody: await response.text()
        }
      });

    const token = this.parseResponseForToken(host, await response.text());

    Log.info(chalk.green(`✔️ Successfully signed in to ${host.fullUrl}!`));
    return new this(fetch, host, token);
  }

  private static parseResponseForToken(host: Host, responseBody: string): string {
    const root = parse(responseBody);
    const tokenDiv = root.querySelector('#token');
    if (!tokenDiv)
      throw new ErrorNotification({
        message: `No token could be found while logging in to "${host.fullUrl}" - are you able to log in with the configured password?`,
        verbose: {
          host: host.baseUrl,
          path: host.path,
          innerHtml: root.innerHTML
        }
      });

    const token = tokenDiv.innerText;
    if (token.length != 44)
      throw new ErrorNotification({
        message: `A token was found but could not be validated while logging in to "${host.fullUrl}" - are you able to log in with the configured password?`,
        verbose: {
          host: host.baseUrl,
          path: host.path,
          token: token
        }
      });

    return token;
  }

  public async downloadBackup(): Promise<Blob> {
    Log.info(chalk.yellow(`➡️ Downloading backup from ${this.host.fullUrl}...`));
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
        message: `Failed to download backup from "${this.host.fullUrl}".`,
        verbose: {
          host: this.host.baseUrl,
          path: this.host.path,
          status: response.status,
          responseBody: await response.text()
        }
      });

    const data = await response.arrayBuffer();

    Log.info(chalk.green(`✔️ Backup from ${this.host.fullUrl} completed!`));
    return new Blob([data]);
  }

  public async uploadBackup(backup: Blob): Promise<true | never> {
    Log.info(chalk.yellow(`➡️ Uploading backup to ${this.host.fullUrl}...`));

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
    if (
      uploadResponse.status !== 200 ||
      !(uploadText.endsWith('OK') || uploadText.endsWith('Done importing'))
    )
      throw new ErrorNotification({
        message: `Failed to upload backup to "${this.host.fullUrl}".`,
        verbose: {
          host: this.host.baseUrl,
          path: this.host.path,
          status: uploadResponse.status,
          responseBody: uploadText
        }
      });

    Log.info(chalk.green(`✔️ Backup uploaded to ${this.host.fullUrl}!`));
    Log.verbose(`Result:\n${chalk.blue(uploadText)}`);

    if (Config.updateGravity) {
      Log.info(chalk.yellow(`➡️ Updating gravity on ${this.host.fullUrl}...`));
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
          message: `Failed updating gravity on "${this.host.fullUrl}".`,
          verbose: {
            host: this.host.baseUrl,
            path: this.host.path,
            status: gravityUpdateResponse.status,
            eventStream: updateText
          }
        });

      Log.info(chalk.green(`✔️ Gravity updated on ${this.host.fullUrl}!`));
      Log.verbose(`Result:\n${chalk.blue(updateText)}`);
    }

    return true;
  }

  private generateForm(): typeof FormData.prototype {
    const form = new FormData();
    form.append('token', this.token);

    if (Config.syncOptions.whitelist) form.append('whitelist', true);
    if (Config.syncOptions.regexWhitelist) form.append('regex_whitelist', true);
    if (Config.syncOptions.blacklist) form.append('blacklist', true);
    if (Config.syncOptions.regexlist) form.append('regexlist', true);
    if (Config.syncOptions.adlist) form.append('adlist', true);
    if (Config.syncOptions.client) form.append('client', true);
    if (Config.syncOptions.group) form.append('group', true);
    if (Config.syncOptions.auditlog) form.append('auditlog', true);
    if (Config.syncOptions.staticdhcpleases) form.append('staticdhcpleases', true);
    if (Config.syncOptions.localdnsrecords) form.append('localdnsrecords', true);
    if (Config.syncOptions.localcnamerecords) form.append('localcnamerecords', true);
    if (Config.syncOptions.flushtables) form.append('flushtables', true);

    return form;
  }
}

type NodeFetchCookie = ReturnType<typeof fetchCookie<RequestInfo, RequestInit, Response>>;
