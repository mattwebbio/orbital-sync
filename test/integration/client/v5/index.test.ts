import { describe, expect } from '@jest/globals';
import { StartedTestContainer } from 'testcontainers';
import { Blob } from 'node-fetch';
import { createPiholeContainer } from '../../../containers';
import { ClientV5 } from '../../../../src/client/v5';
import { Host } from '../../../../src/client/host';
import { Config, ConfigInterface } from '../../../../src/config/index';
import { Log } from '../../../../src/log';

describe('Client', () => {
  describe('V5', () => {
    let piholeContainer: StartedTestContainer;
    let pihole: Host;
    let config: ConfigInterface;

    beforeAll(async () => {
      piholeContainer = await createPiholeContainer({
        password: 'mock_password',
        tag: '2024.07.0'
      }).start();
      pihole = new Host({
        baseUrl: `http://${piholeContainer.getHost()}:${piholeContainer.getMappedPort(80)}`,
        password: 'mock_password'
      });
      config = Config({
        primaryHost: {
          baseUrl: pihole.baseUrl,
          password: pihole.password
        },
        secondaryHosts: [
          {
            baseUrl: pihole.baseUrl,
            password: pihole.password
          }
        ]
      });
    }, 60000);

    afterAll(async () => {
      await piholeContainer.stop();
    });

    it('should connect, backup, and upload', async () => {
      const client = await ClientV5.create({
        host: pihole,
        options: config.sync.v5,
        log: new Log(true)
      });

      const backup = await client.downloadBackup();
      expect(backup).toBeInstanceOf(Blob);

      const upload = await client.uploadBackup(backup);
      expect(upload).toBe(true);
    });
  });
});
