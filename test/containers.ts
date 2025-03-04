import { GenericContainer, Wait } from 'testcontainers';

export function createPiholeContainer({
  password,
  tag
}: {
  password: string;
  tag: string;
}): GenericContainer {
  return new GenericContainer(`pihole/pihole:${tag}`)
    .withEnvironment(
      tag == 'latest'
        ? {
            FTLCONF_webserver_api_password: password,
            FTLCONF_debug_api: 'true'
          }
        : {
            WEBPASSWORD: password
          }
    )
    .withExposedPorts(80)
    .withHealthCheck({
      test: ['CMD', 'curl', '-f', 'http://localhost/admin/'],
      interval: 10000,
      timeout: 10000,
      retries: 5
    })
    .withWaitStrategy(Wait.forHealthCheck());
}

export function createOrbitalSyncContainer(
  baseImage: OrbitalBaseImage = OrbitalBaseImage.Alpine
): Promise<GenericContainer> {
  return GenericContainer.fromDockerfile('./', 'Dockerfile')
    .withBuildArgs({
      BASE_IMAGE: baseImage
    })
    .build();
}

export enum OrbitalBaseImage {
  Alpine = 'node:18-alpine',
  Distroless = 'gcr.io/distroless/nodejs18:latest'
}
