import { GenericContainer, Wait } from 'testcontainers';

export function pihole({ password }: { password: string }): GenericContainer {
  return new GenericContainer('pihole/pihole:latest')
    .withEnvironment({
      WEBPASSWORD: password
    })
    .withExposedPorts(80)
    .withHealthCheck({
      test: ['CMD', 'curl', '-f', 'http://localhost/admin/'],
      interval: 10000,
      timeout: 10000,
      retries: 5
    })
    .withWaitStrategy(Wait.forHealthCheck());
}

export function orbitalSync(): Promise<GenericContainer> {
  return GenericContainer.fromDockerfile('./', 'Dockerfile').build();
}
