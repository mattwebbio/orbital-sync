import { Network } from 'testcontainers';
import {
  OrbitalBaseImage,
  createOrbitalSyncContainer,
  createPiholeContainer
} from '../containers';
import { inspectById } from '../docker';
import sleep from 'sleep-promise';

describe('Orbital', () => {
  describe('Alpine', () => {
    it('should sync two v6 targets and exit with "zero" exit code', async () => {
      const network = await new Network().start();
      const [pihole1, pihole2, pihole3, orbitalImage] = await Promise.all([
        createPiholeContainer({ password: 'primary', tag: 'latest' })
          .withNetwork(network)
          .start(),
        createPiholeContainer({ password: 'secondary', tag: 'latest' })
          .withNetwork(network)
          .start(),
        createPiholeContainer({ password: 'tertiary', tag: 'latest' })
          .withNetwork(network)
          .start(),
        createOrbitalSyncContainer(OrbitalBaseImage.Alpine)
      ]);

      const orbital = await orbitalImage
        .withEnvironment({
          PRIMARY_HOST_BASE_URL: `http://${pihole1.getIpAddress(network.getName())}`,
          PRIMARY_HOST_PASSWORD: 'primary',
          SECONDARY_HOST_1_BASE_URL: `http://${pihole2.getIpAddress(network.getName())}`,
          SECONDARY_HOST_1_PASSWORD: 'secondary',
          SECONDARY_HOST_2_BASE_URL: `http://${pihole3.getIpAddress(network.getName())}`,
          SECONDARY_HOST_2_PASSWORD: 'tertiary',
          RUN_ONCE: 'true',
          VERBOSE: 'true'
        })
        .withLogConsumer((stream) => stream.on('data', (chunk) => console.log(chunk)))
        .withNetwork(network)
        .start();

      let orbitalStatus = await inspectById(orbital.getId());
      while (orbitalStatus.State.Running) {
        await sleep(500);
        orbitalStatus = await inspectById(orbital.getId());
      }

      await Promise.all([pihole1.stop(), pihole2.stop(), pihole3.stop()]);
      await network.stop();
      expect(orbitalStatus.State.ExitCode).toBe(0);
    }, 300000);

    it('should sync two v5 targets and exit with "zero" exit code', async () => {
      const network = await new Network().start();
      const [pihole1, pihole2, pihole3, orbitalImage] = await Promise.all([
        createPiholeContainer({ password: 'primary', tag: '2024.07.0' })
          .withNetwork(network)
          .start(),
        createPiholeContainer({ password: 'secondary', tag: '2024.07.0' })
          .withNetwork(network)
          .start(),
        createPiholeContainer({ password: 'tertiary', tag: '2024.07.0' })
          .withNetwork(network)
          .start(),
        createOrbitalSyncContainer(OrbitalBaseImage.Alpine)
      ]);

      const orbital = await orbitalImage
        .withEnvironment({
          PRIMARY_HOST_BASE_URL: `http://${pihole1.getIpAddress(network.getName())}`,
          PRIMARY_HOST_PASSWORD: 'primary',
          SECONDARY_HOST_1_BASE_URL: `http://${pihole2.getIpAddress(network.getName())}`,
          SECONDARY_HOST_1_PASSWORD: 'secondary',
          SECONDARY_HOST_2_BASE_URL: `http://${pihole3.getIpAddress(network.getName())}`,
          SECONDARY_HOST_2_PASSWORD: 'tertiary',
          RUN_ONCE: 'true',
          VERBOSE: 'true'
        })
        .withLogConsumer((stream) => stream.on('data', (chunk) => console.log(chunk)))
        .withNetwork(network)
        .start();

      let orbitalStatus = await inspectById(orbital.getId());
      while (orbitalStatus.State.Running) {
        await sleep(500);
        orbitalStatus = await inspectById(orbital.getId());
      }

      await Promise.all([pihole1.stop(), pihole2.stop(), pihole3.stop()]);
      await network.stop();
      expect(orbitalStatus.State.ExitCode).toBe(0);
    }, 300000);
  });

  describe('Distroless', () => {
    it('should sync two v6 targets and exit with "zero" exit code', async () => {
      const network = await new Network().start();
      const [pihole1, pihole2, pihole3, orbitalImage] = await Promise.all([
        createPiholeContainer({ password: 'primary', tag: 'latest' })
          .withNetwork(network)
          .start(),
        createPiholeContainer({ password: 'secondary', tag: 'latest' })
          .withNetwork(network)
          .start(),
        createPiholeContainer({ password: 'tertiary', tag: 'latest' })
          .withNetwork(network)
          .start(),
        createOrbitalSyncContainer(OrbitalBaseImage.Distroless)
      ]);

      const orbital = await orbitalImage
        .withEnvironment({
          PRIMARY_HOST_BASE_URL: `http://${pihole1.getIpAddress(network.getName())}`,
          PRIMARY_HOST_PASSWORD: 'primary',
          SECONDARY_HOST_1_BASE_URL: `http://${pihole2.getIpAddress(network.getName())}`,
          SECONDARY_HOST_1_PASSWORD: 'secondary',
          SECONDARY_HOST_2_BASE_URL: `http://${pihole3.getIpAddress(network.getName())}`,
          SECONDARY_HOST_2_PASSWORD: 'tertiary',
          RUN_ONCE: 'true',
          VERBOSE: 'true'
        })
        .withLogConsumer((stream) => stream.on('data', (chunk) => console.log(chunk)))
        .withNetwork(network)
        .start();

      let orbitalStatus = await inspectById(orbital.getId());
      while (orbitalStatus.State.Running) {
        await sleep(500);
        orbitalStatus = await inspectById(orbital.getId());
      }

      await Promise.all([pihole1.stop(), pihole2.stop(), pihole3.stop()]);
      await network.stop();
      expect(orbitalStatus.State.ExitCode).toBe(0);
    }, 300000);

    it('should sync two v5 targets and exit with "zero" exit code', async () => {
      const network = await new Network().start();
      const [pihole1, pihole2, pihole3, orbitalImage] = await Promise.all([
        createPiholeContainer({ password: 'primary', tag: '2024.07.0' })
          .withNetwork(network)
          .start(),
        createPiholeContainer({ password: 'secondary', tag: '2024.07.0' })
          .withNetwork(network)
          .start(),
        createPiholeContainer({ password: 'tertiary', tag: '2024.07.0' })
          .withNetwork(network)
          .start(),
        createOrbitalSyncContainer(OrbitalBaseImage.Distroless)
      ]);

      const orbital = await orbitalImage
        .withEnvironment({
          PRIMARY_HOST_BASE_URL: `http://${pihole1.getIpAddress(network.getName())}`,
          PRIMARY_HOST_PASSWORD: 'primary',
          SECONDARY_HOST_1_BASE_URL: `http://${pihole2.getIpAddress(network.getName())}`,
          SECONDARY_HOST_1_PASSWORD: 'secondary',
          SECONDARY_HOST_2_BASE_URL: `http://${pihole3.getIpAddress(network.getName())}`,
          SECONDARY_HOST_2_PASSWORD: 'tertiary',
          RUN_ONCE: 'true',
          VERBOSE: 'true'
        })
        .withLogConsumer((stream) => stream.on('data', (chunk) => console.log(chunk)))
        .withNetwork(network)
        .start();

      let orbitalStatus = await inspectById(orbital.getId());
      while (orbitalStatus.State.Running) {
        await sleep(500);
        orbitalStatus = await inspectById(orbital.getId());
      }

      await Promise.all([pihole1.stop(), pihole2.stop(), pihole3.stop()]);
      await network.stop();
      expect(orbitalStatus.State.ExitCode).toBe(0);
    }, 300000);
  });
});
