import { markdownTable } from 'markdown-table';
import { Schema } from '../src/config/schema.js';
import { SchemaType, pathToEnvVar } from '../src/config/parse.js';
import { camelToTitleCase } from '../src/util/string-case.js';
import { readFile, writeFile } from 'node:fs/promises';

function generateDocs(schema: SchemaType, path: string[] = []): string {
  if (schema.type === 'object') {
    const doc: string[] = [];
    const withoutArray = path.filter((p) => p !== '(#)');
    const lastKey = withoutArray[withoutArray.length - 1];
    if (lastKey)
      doc.push(`#${'#'.repeat(withoutArray.length)} ${camelToTitleCase(lastKey)}`);

    if (schema.description) doc.push(schema.description);

    if (path[path.length - 1] === '(#)') {
      const example = pathToEnvVar([...path, Object.keys(schema.properties!)[0]]);

      doc.push(
        'Replace `(#)` with a number, starting at 1, to add multiple. Each must be sequential, (i.e. ' +
          `\`${example.replace('(#)', '1')}\`, \`${example.replace('(#)', '2')}\`, ` +
          `\`${example.replace('(#)', '3')}\`, and so on) and start at number 1. Any gaps (for ` +
          'example, 3 to 5 skipping 4) will result in configuration after the gap being skipped.'
      );
    }

    const values = Object.entries(schema.properties!).filter(
      ([, value]) =>
        typeof value === 'object' && value.type !== 'object' && value.type !== 'array'
    ) as [string, SchemaType][];
    if (values.length > 0)
      doc.push(
        markdownTable([
          [
            // "Title",
            'Environment Variable',
            'Required',
            'Default',
            'Example',
            'Description'
          ],
          ...values.map(([key, value]) => {
            const envVar = pathToEnvVar([...path, key]);
            const isRequired =
              schema.required?.includes(key) && value.default === undefined
                ? 'Yes'
                : 'No';
            const dflt =
              value.default === undefined || value.default === null
                ? 'N/A'
                : `\`${value.default.toString()}\``;
            const example = value.example ?? 'N/A';
            const description = value.description ?? 'N/A';

            return [
              // camelToTitleCase(key),
              `\`${envVar}\``,
              isRequired,
              dflt,
              example,
              description
            ];
          })
        ])
      );

    const objects = Object.entries(schema.properties!).filter(
      ([, value]) =>
        typeof value === 'object' && (value.type === 'object' || value.type === 'array')
    ) as [string, SchemaType][];
    if (objects.length > 0)
      doc.push(
        ...objects.map(([key, value]) => {
          if (value.type === 'object') return generateDocs(value, [...path, key]);
          else if (value.type === 'array')
            return generateDocs(value.items as SchemaType, [...path, key, '(#)']);

          throw new Error(
            `Invalid schema type: ${value.type}. Nested schema must be an object or array.`
          );
        })
      );

    return doc.join('\n\n');
  } else
    throw new Error(
      `Invalid schema type: ${schema.type}. Root schema must be an object.`
    );
}

async function writeDocs(content: string): Promise<void> {
  const doc = await readFile('CONFIG.md', 'utf-8');
  const startAnchor = '<!-- START CONFIG DOCS -->';
  const endAnchor = '<!-- END CONFIG DOCS -->';

  const start = doc.indexOf(startAnchor);
  const end = doc.indexOf(endAnchor);

  if (start === -1 || end === -1)
    throw new Error('Could not find start or end of config docs.');

  const newDoc = [doc.slice(0, start + startAnchor.length), content, doc.slice(end)].join(
    '\n\n'
  );

  await writeFile('CONFIG.md', newDoc);
}

await writeDocs(generateDocs(Schema));
