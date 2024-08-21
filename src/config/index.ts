import { parseSchema, RecursivePartial } from './parse.js';
import { FromSchema } from 'json-schema-to-ts';
import { Schemas } from './schema.js';
import { Version } from './version.js';

export type ConfigInterface = FromSchema<(typeof Schemas)[keyof typeof Schemas]>;
export type ConfigInterfaceV5 = FromSchema<(typeof Schemas)[Version.v5]>;

export function Config(
  version: Version = Version.v5,
  overrides: RecursivePartial<ConfigInterface> = {}
): ConfigInterface {
  // @ts-expect-error - Type instantiation is excessively deep and possibly infinite
  return parseSchema(Schemas[version], { overrides });
}
