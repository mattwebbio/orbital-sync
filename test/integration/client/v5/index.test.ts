import { describe, expect } from '@jest/globals';
import { StartedTestContainer } from 'testcontainers';
import { Blob } from 'node-fetch';
import { createPiholeContainer } from '../../../containers';
import { ClientV5 } from '../../../../src/client/v5';
import { Host } from '../../../../src/client/host';
import { EnvironmentConfig } from '../../../../src/config/environment';
import { Log } from '../../../../src/log';

describe('Client', () => {
  describe('V5', () => {
    let piholeContainer: StartedTestContainer;
    let pihole: Host;
    const config = new EnvironmentConfig();

    beforeAll(async () => {
      piholeContainer = await createPiholeContainer({
        password: 'mock_password'
      }).start();
      pihole = new Host(
        `http://${piholeContainer.getHost()}:${piholeContainer.getMappedPort(80)}`,
        'mock_password'
      );
    }, 60000);

    afterAll(async () => {
      await piholeContainer.stop();
    });

    it('should connect, backup, and upload', async () => {
      const client = await ClientV5.create({
        host: pihole,
        options: config.syncOptions,
        log: new Log(true)
      });

      const backup = await client.downloadBackup();
      expect(backup).toBeInstanceOf(Blob);

      const upload = await client.uploadBackup(backup);
      expect(upload).toBe(true);
    });
  });
});
