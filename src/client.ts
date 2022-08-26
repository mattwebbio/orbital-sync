import chalk from 'chalk';
import fetchCookie from 'fetch-cookie';
import nodeFetch, { Blob, FormData, RequestInfo, RequestInit, Response } from 'node-fetch';
import { parse } from 'node-html-parser';
import { log } from './log.js';
import { Config } from './config.js';
import type { Host } from './config.js';

export class Client {
  private constructor(
    private fetch: NodeFetchCookie,
    private host: Host,
    private token: string
  ) {}

  public static async create(host: Host): Promise<Client> {
    log(chalk.yellow(`➡️ Signing in to ${host.baseUrl}...`));
    const fetch = fetchCookie(nodeFetch);

    await fetch(`${host.baseUrl}/admin/index.php?login`, { "method": "GET" });
    const response = await fetch(`${host.baseUrl}/admin/index.php?login`, {
      "headers": {
        "content-type": "application/x-www-form-urlencoded"
      },
      "body": `pw=${encodeURIComponent(host.password)}&persistentlogin=off`,
      "method": "POST"
    });
    if (response.status !== 200)
      throw new LoginError(host, { status: response.status, responseBody: await response.text() });

    const token = this.parseResponseForToken(host, await response.text());

    log(chalk.green(`✔️ Successfully signed in to ${host.baseUrl}!`));
    return new this(fetch, host, token);
  }

  private static parseResponseForToken(host: Host, responseBody: string): string {
    const root = parse(responseBody);
    const tokenDiv = root.querySelector('#token');
    if (!tokenDiv) throw new NoTokenError(host, { responseBody: root.innerHTML });

    const token = tokenDiv.innerText;
    if (token.length != 44) throw new MalformedTokenError(host, { responseBody: token });

    return token;
  }

  public async downloadBackup(): Promise<Blob> {
    log(chalk.yellow(`➡️ Downloading backup from ${this.host.baseUrl}...`));
    const form = this.generateForm();

    const response = await this.fetch(`${this.host.baseUrl}/admin/scripts/pi-hole/php/teleporter.php`, {
      "body": form,
      "method": "POST"
    });
    if (response.status !== 200 || response.headers.get('content-type') !== 'application/gzip')
      throw new BackupDownloadError(this.host, { status: response.status, responseBody: await response.text() })

    const data = await response.arrayBuffer();

    log(chalk.green(`✔️ Backup from ${this.host.baseUrl} completed!`));
    return new Blob([data]);
  }

  public async uploadBackup(backup: Blob): Promise<void> {
    log(chalk.yellow(`➡️ Uploading backup to ${this.host.baseUrl}...`));

    const form = this.generateForm();
    form.append('action', 'in');
    form.append('zip_file', backup, 'backup.tar.gz');

    const response = await this.fetch(`${this.host.baseUrl}/admin/scripts/pi-hole/php/teleporter.php`, {
      "body": form,
      "method": "POST"
    });
    const text = await response.text();
    if (response.status !== 200 || !text.endsWith('OK'))
      throw new BackupUploadError(this.host, { status: response.status, responseBody: text });

    log(chalk.green(`✔️ Backup uploaded to ${this.host.baseUrl}!`));
    if (Config.verbose) log(`Result:\n${chalk.blue(text)}`);
  }

  private generateForm(): typeof FormData.prototype {
    const form = new FormData();
    form.append('token', this.token);

    form.append('whitelist', Config.sync.whitelist);
    form.append('regex_whitelist', Config.sync.regex_whitelist);
    form.append('blacklist', Config.sync.blacklist);
    form.append('regexlist', Config.sync.regexlist);
    form.append('adlist', Config.sync.adlist);
    form.append('client', Config.sync.client);
    form.append('group', Config.sync.group);
    form.append('auditlog', Config.sync.auditlog);
    form.append('staticdhcpleases', Config.sync.staticdhcpleases);
    form.append('localdnsrecords', Config.sync.localdnsrecords);
    form.append('localcnamerecords', Config.sync.localcnamerecords);
    form.append('flushtables', Config.sync.flushtables);

    return form;
  }
}

class BaseError extends Error {
  constructor(host: Host, { status, responseBody }: { status?: number, responseBody?: string }) {
    let msg = `Host: ${host.baseUrl}`;
    if (status) msg += `\n\nStatus Code:\n${status}`;
    if (responseBody) msg += `\n\nResponse Body:\n${responseBody}`;

    super(msg);
  }
}

export class LoginError extends BaseError {}
export class NoTokenError extends BaseError {}
export class MalformedTokenError extends BaseError {}
export class BackupDownloadError extends BaseError {}
export class BackupUploadError extends BaseError {}

type NodeFetchCookie = ReturnType<typeof fetchCookie<RequestInfo, RequestInit, Response>>;
