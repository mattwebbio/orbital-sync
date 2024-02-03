import { Network } from 'testcontainers';
import { orbitalSync, pihole } from '../containers';
import { inspectById } from '../docker';
import sleep from 'sleep-promise';

describe('Orbital', () => {
  it('should sync two targets and exit with "zero" exit code', async () => {
    const network = await new Network().start();
    const [pihole1, pihole2, pihole3, orbitalImage] = await Promise.all([
      pihole({ password: 'primary' }).withNetwork(network).start(),
      pihole({ password: 'secondary' }).withNetwork(network).start(),
      pihole({ password: 'tertiary' }).withNetwork(network).start(),
      orbitalSync()
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
