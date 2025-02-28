import chalk from 'chalk';
import fetchCookie from 'fetch-cookie';
import fs from 'fs';
import path from 'path';
import { fileTypeFromBuffer } from 'file-type';
// @ts-ignore
import { Readable } from 'stream';
import FormData from 'form-data';
import nodeFetch, { Blob, RequestInfo, RequestInit, Response } from 'node-fetch';
// Parser not needed for v6 API
import type { Host } from '../host.js';
import { Log } from '../../log.js';
import { ErrorNotification } from '../../notify.js';
import type { SyncOptionsV6 } from '../../config/index.js';

export class ClientV6 {
  private constructor(
    private fetch: NodeFetchCookie,
    private host: Host,
    private sid: string,
    private options: SyncOptionsV6,
    private log: Log
  ) {}

  private get baseApiUrl(): string {
    return this.host.fullUrl.replace('/admin', '');
  }

  public static async create({
    host,
    options,
    log
  }: {
    host: Host;
    options: SyncOptionsV6;
    log: Log;
  }): Promise<ClientV6> {
    const baseApiUrl = host.fullUrl.replace('/admin', '');
    log.info(chalk.yellow(`➡️ Signing in to ${baseApiUrl}...`));
    const fetch = fetchCookie(nodeFetch);

    // Pi-hole v6 uses api/auth endpoint for authentication
    const loginResponse = await nodeFetch(`${baseApiUrl}/api/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password: host.password })
    });
    const loginData = (await loginResponse.json()) as {
      session: { sid?: string; status?: string };
    };

    if (loginResponse.status !== 200 || !loginData?.session?.sid) {
      throw new ErrorNotification({
        message: `There was an error logging in to "${baseApiUrl}" - are you able to log in with the configured password?`,
        verbose: {
          host: host.baseUrl,
          path: host.path,
          status: loginResponse.status,
          responseBody: JSON.stringify(loginData)
        }
      });
    }

    const sid = loginData?.session?.sid;

    log.info(chalk.green(`✔️ Successfully signed in to ${baseApiUrl}!`));
    return new this(fetch, host, sid, options, log);
  }

  public async downloadBackup(): Promise<Blob> {
    this.log.info(chalk.yellow(`➡️ Downloading backup from ${this.baseApiUrl}...`));

    // In v6, we can use the sid as a header instead of a query parameter
    const response = await nodeFetch(`${this.baseApiUrl}/api/teleporter`, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        sid: this.sid
      }
    });

    if (response.status !== 200)
      throw new ErrorNotification({
        message: `Failed to download backup from "${this.baseApiUrl}".`,
        verbose: {
          host: this.host.baseUrl,
          path: this.host.path,
          status: response.status,
          responseBody: await response.text()
        }
      });
    const data = await response.arrayBuffer();

    this.log.info(chalk.green(`✔️ Backup from ${this.baseApiUrl} completed!`));
    return new Blob([data]);
  }

  public async uploadBackup(backup: Blob): Promise<true | never> {
    this.log.info(chalk.yellow(`➡️ Uploading backup to ${this.baseApiUrl}...`));

    // Get the buffer and verify it's a ZIP file
    const buffer = await backup.arrayBuffer();
    const fileType = await fileTypeFromBuffer(buffer);

    if (!fileType || fileType.ext !== 'zip') {
      throw new ErrorNotification({
        message: `The provided backup is not a valid ZIP archive.`,
        verbose: {
          fileType: fileType ? fileType.ext : 'unknown'
        }
      });
    }

    // Create a NodeJS Buffer from the ArrayBuffer
    const bufferObj = Buffer.from(buffer);

    try {
      // create tmp directory if it doesn't exist
      if (!fs.existsSync('./tmp')) {
        fs.mkdirSync('./tmp');
      }
      // Create a temporary file path in OS temp directory
      const tempDir = fs.mkdtempSync(path.join(path.resolve('./tmp'), 'pihole-backup-'));
      const tempFilePath = path.join(tempDir, 'backup.zip');

      // Write the buffer to a temporary file
      fs.writeFileSync(tempFilePath, bufferObj);

      // Create form using FormData
      const form = new FormData();
      form.append('file', fs.createReadStream(tempFilePath));

      // Upload the form
      const uploadResponse = await nodeFetch(`${this.baseApiUrl}/api/teleporter`, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          ...form.getHeaders(),
          sid: this.sid
        },
        body: form
      });

      const uploadText = await uploadResponse.text();

      // Clean up temporary files
      try {
        fs.unlinkSync(tempFilePath);
        fs.rmSync(tempDir, { recursive: true, force: true }); // Fix for removing non-empty directories
      } catch (cleanupError) {
        console.error('Failed to clean up temporary files:', cleanupError);
      }

      return this.handleUploadResponse(uploadResponse, uploadText);
    } catch (err) {
      console.error('Error during file upload:', err);
      throw new ErrorNotification({
        message: `Failed to upload backup to "${this.baseApiUrl}".`,
        verbose: {
          host: this.host.baseUrl,
          path: this.host.path,
          error: String(err)
        }
      });
    }
  }

  private handleUploadResponse(response: Response, responseText: string): true {
    if (response.status !== 200) {
      throw new ErrorNotification({
        message: `Failed to upload backup to "${this.baseApiUrl}".`,
        verbose: {
          host: this.host.baseUrl,
          path: this.host.path,
          status: response.status,
          responseBody: responseText
        }
      });
    }

    this.log.info(chalk.green(`✔️ Backup uploaded to ${this.baseApiUrl}!`));
    this.log.verbose(`Result:\n${chalk.blue(responseText)}`);

    return true;
  }

  // No longer using the separate generateForm method as we create the form inline in uploadBackup
  // This helps ensure proper form construction and ordering

  public async updateGravity(): Promise<true | never> {
    this.log.info(chalk.yellow(`➡️ Updating gravity on ${this.baseApiUrl}...`));

    // In v6, gravity update is triggered through an API endpoint with sid as header
    const gravityUpdateResponse = await nodeFetch(
      `${this.baseApiUrl}/api/action/gravity`,
      {
        method: 'POST',
        headers: {
          accept: 'text/plain',
          sid: this.sid
        },
        body: null
      }
    );

    const updateData = (await gravityUpdateResponse) as { success?: boolean };

    if (gravityUpdateResponse.status !== 200) {
      throw new ErrorNotification({
        message: `Failed updating gravity on "${this.baseApiUrl}".`,
        verbose: {
          host: this.host.baseUrl,
          path: this.host.path,
          status: gravityUpdateResponse.status,
          responseData: JSON.stringify(updateData)
        }
      });
    }

    this.log.info(chalk.green(`✔️ Gravity updated on ${this.baseApiUrl}!`));
    this.log.verbose(`Result:\n${chalk.blue(JSON.stringify(updateData))}`);

    return true;
  }
}

type NodeFetchCookie = ReturnType<typeof fetchCookie<RequestInfo, RequestInit, Response>>;
