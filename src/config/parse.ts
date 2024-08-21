// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import mustache from 'mustache';
import { FromSchema } from 'json-schema-to-ts';
import type { JSONSchema } from 'json-schema-to-ts';
import { readFileSync } from 'fs';
import { camelToSnakeCase } from '../util/string-case.js';

/*
  While the return type of this function should be accurate, the internal type checking
  of the values being returned are not (particularly, there are a few `unknown`s and
  `any`s in here). TypeScript seems to be unable to properly infer the types of the values
  encased in the JSONSchema, and any attempts to correct this seem to cause the classic
  `type instantiation is excessively deep and possibly infinite`:
  https://github.com/ThomasAribart/json-schema-to-ts/blob/cf1aaf03266ec02286e0320ee6141f22ef0bb348/documentation/FAQs/i-get-a-type-instantiation-is-excessively-deep-and-potentially-infinite-error-what-should-i-do.md

  I'll try to compensate for this with thorough testing, but if anyone out there in the
  big internet world has a solution, please submit a PR!
  - @mattwebbio
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export function parseSchema<T extends SchemaType>(
  schema: T,
  {
    path,
    overrides
  }: {
    path?: string[];
    overrides?: RecursivePartial<FromSchema<T>>;
  } = {}
): FromSchema<T> {
  path ??= [];
  const pathDescriptor = path.length === 0 ? 'root' : `"${path.join('.')}"`;
  if (typeof schema !== 'object') throw new Error(`Invalid schema for ${pathDescriptor}`);

  if (schema.type === 'array') {
    if (schema.items === undefined)
      throw new Error(`Undefined array items for ${pathDescriptor}`);

    const template = JSON.stringify(schema.items);
    const templateRequiresInterpolation = template.includes('{{i}}');

    // TODO: Perform loop _minimum_ the number of elements present in array of `config.json`
    const results: unknown[] = [];
    // eslint-disable-next-line for-direction
    for (let i = 1; i >= 0; i++) {
      const element: JSONSchema = templateRequiresInterpolation
        ? JSON.parse(mustache.render(template, { i }))
        : schema.items;

      try {
        const result = parseSchema(element, {
          path: [...path, i.toString()],
          overrides: overrides?.[i - 1]
        });
        if (!result || Object.values(result).every((v) => !v)) break;
        else results.push(result);
      } catch (e) {
        if (i > (schema.minItems ?? 0) && e instanceof MissingRequiredPropertiesError)
          break;
        else throw e;
      }
    }

    return results as any;
  } else if (schema.type === 'object') {
    if (schema.properties === undefined)
      throw new Error(`Undefined object properties for ${pathDescriptor}`);

    const properties = Object.entries(schema.properties).map(([key, value]) => {
      return [
        key,
        parseSchema(value, { path: [...path, key], overrides: overrides?.[key] })
      ];
    });
    const object = Object.fromEntries(properties);

    if (schema.required && schema.required.length > 0) {
      const missingRequired = schema.required.filter((key) => object[key] === undefined);
      if (missingRequired.length > 0)
        throw new MissingRequiredPropertiesError(path, missingRequired);
    }

    return object;
  } else {
    let value: any;
    const secretFile = process.env[`${pathToEnvVar(path)}_FILE`];

    if (secretFile)
      value ??= readFileSync(process.env[`${pathToEnvVar(path)}_FILE`], 'utf8').trim();
    value ??= overrides;
    value ??= process.env[pathToEnvVar(path)];
    if (schema.envVar) value ??= process.env[schema.envVar];
    value ??= schema.default;

    if (typeof value === 'string') {
      if (schema.type === 'boolean') {
        const lowercase = value.toLowerCase();
        if (!['true', 'false'].includes(lowercase))
          throw new Error(
            `Invalid boolean for ${pathDescriptor}: expected 'true' or 'false'`
          );

        value = lowercase === 'true';
      }

      if (schema.type === 'number') {
        const number = parseFloat(value);
        if (isNaN(number))
          throw new Error(`Invalid number for ${pathDescriptor}: expected a number`);

        value = number;
      }
    }

    return value;
  }
}

class MissingRequiredPropertiesError extends Error {
  constructor(path: string[], missing: string[]) {
    const pathDescriptor = path.length === 0 ? 'root' : `"${path.join('.')}"`;

    super(`Missing required properties for ${pathDescriptor}: ${missing.join(', ')}`);
    this.name = 'MissingRequiredPropertiesError';
  }
}

export function pathToEnvVar(path: string[]): string {
  return path.map((p) => camelToSnakeCase(p).toUpperCase()).join('_');
}

export type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? RecursivePartial<U>[]
    : T[P] extends object | undefined
      ? RecursivePartial<T[P]>
      : T[P];
};

export type SchemaType = Exclude<JSONSchema, boolean> & {
  envVar?: string;
  example?: string;
};
