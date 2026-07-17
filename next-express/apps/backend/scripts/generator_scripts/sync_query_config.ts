/**
 * sync_query_config.ts
 *
 * Regenerates the `<model>.query-config.ts` file for every module whose directory
 * already exists on disk (i.e. after `generate_module` has run).
 */

import * as fs from 'fs';
import * as path from 'path';
import { PrismaSchemaProvider, FieldInfo, ModelInfo } from './schema_parser';

const PRISMA_SCHEMA_PATH = path.join(__dirname, '../../prisma/schema.prisma');
const MODULES_DIR        = path.join(__dirname, '../../src/modules');

function camelCase(s: string) {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function generateQueryConfig(model: ModelInfo): string {
  const Name      = model.name;
  const nameLower = camelCase(Name);
  const NameUp    = Name.toUpperCase();

  const writable = model.fields.filter((f) => !f.isRelation && !f.isList);
  const stringFields = writable.filter((f) => f.type === 'String');

  const filterableFields = writable.map((f) => `'${f.name}'`);
  const sortableFields = writable.map((f) => `'${f.name}'`);
  const searchableFields = stringFields.map((f) => `'${f.name}'`);

  const lines: string[] = [
    `import { z } from 'zod';`,
    `import { QueryFieldConfig } from '../../utils/query-builder';`,
    ``,
    `// ─── ${NameUp} QUERY CONFIG ───────────────────────────────────────────────────`,
    `//`,
    `// This file is automatically synced by sync_query_config.ts — do not edit manually.`,
    `// To add custom query config that survives regeneration, create:`,
    `//   ${nameLower}.query-config.extended.ts`,
    ``,
  ];

  lines.push(`export const ${nameLower}QueryConfig: QueryFieldConfig = {`);
  lines.push(`  sortableFields: [${sortableFields.join(', ')}],`);
  lines.push(`  filterableFields: [${filterableFields.join(', ')}],`);
  lines.push(`  searchableFields: [${searchableFields.join(', ')}],`);
  lines.push(`};`);
  lines.push(``);

  if (filterableFields.length > 0) {
    lines.push(`export const ${Name}FilterableFieldsEnum = z.enum([${filterableFields.join(', ')}]);`);
  } else {
    lines.push(`export const ${Name}FilterableFieldsEnum = z.never();`);
  }

  if (sortableFields.length > 0) {
    lines.push(`export const ${Name}SortableFieldsEnum = z.enum([${sortableFields.join(', ')}]);`);
  } else {
    lines.push(`export const ${Name}SortableFieldsEnum = z.never();`);
  }

  lines.push(``);
  lines.push(`export const ${nameLower}QuerySchema = z.object({`);
  lines.push(`  search: z.string().optional(),`);
  lines.push(`  sort: z.array(`);
  lines.push(`    z.object({`);
  lines.push(`      field: ${Name}SortableFieldsEnum,`);
  lines.push(`      direction: z.enum(['asc', 'desc']),`);
  lines.push(`    })`);
  lines.push(`  ).optional(),`);
  lines.push(`  filters: z.array(`);
  lines.push(`    z.object({`);
  lines.push(`      field: ${Name}FilterableFieldsEnum,`);
  lines.push(`      operator: z.enum(['eq', 'contains', 'gt', 'lt', 'gte', 'lte', 'in']),`);
  lines.push(`      value: z.unknown(),`);
  lines.push(`    })`);
  lines.push(`  ).optional(),`);
  lines.push(`  pagination: z.object({`);
  lines.push(`    page: z.number().int().positive().default(1),`);
  lines.push(`    pageSize: z.number().int().positive().default(10),`);
  lines.push(`  }).optional(),`);
  lines.push(`});`);
  lines.push(``);
  lines.push(`export type ${Name}QueryInput = z.infer<typeof ${nameLower}QuerySchema>;`);
  lines.push(``);

  return lines.join('\n');
}

async function main() {
  const provider = new PrismaSchemaProvider(PRISMA_SCHEMA_PATH);
  const models   = await provider.getModels();

  for (const model of models) {
    const modelNameLower = camelCase(model.name);
    const schemasPath    = path.join(MODULES_DIR, modelNameLower, `${modelNameLower}.query-config.ts`);

    if (!fs.existsSync(path.dirname(schemasPath))) {
      console.log(`Skipping ${model.name} — module not generated yet`);
      continue;
    }

    console.log(`Syncing query config for ${model.name}...`);
    const content = generateQueryConfig(model);
    fs.writeFileSync(schemasPath, content, 'utf8');
    console.log(`  ✓ Written → ${schemasPath}`);
  }

  console.log('Query config synchronization complete.');
}

main().catch(console.error);
