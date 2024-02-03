import { ContainerInspectInfo } from 'dockerode';
import TestContainers from 'testcontainers';

export async function inspectById(id: string): Promise<ContainerInspectInfo> {
  return await (await TestContainers.getContainerRuntimeClient()).container
    .getById(id)
    .inspect();
}
