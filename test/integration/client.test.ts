import { describe, expect } from '@jest/globals';
import { StartedTestContainer } from 'testcontainers';
import { Blob } from 'node-fetch';
import { createPiholeContainer } from '../containers';
import { Client } from '../../src/client';
import { Host } from '../../src/config/environment';

describe('client', () => {
  let piholeContainer: StartedTestContainer;
  let pihole: Host;

  beforeAll(async () => {
    piholeContainer = await createPiholeContainer({ password: 'mock_password' }).start();
    pihole = new Host(
      `http://${piholeContainer.getHost()}:${piholeContainer.getMappedPort(80)}`,
      'mock_password'
    );
  }, 60000);

  afterAll(async () => {
    await piholeContainer.stop();
  });

  it('should connect, backup, and upload', async () => {
    const client = await Client.create(pihole);

    const backup = await client.downloadBackup();
    expect(backup).toBeInstanceOf(Blob);

    const upload = await client.uploadBackup(backup);
    expect(upload).toBe(true);
  });
});
