/**
 * sync_schemas.ts
 *
 * Regenerates the `<model>.schemas.ts` file for every module whose directory
 * already exists on disk (i.e. after `generate_module` has run).
 *
 * Run this whenever you add, remove, or change fields in `schema.prisma` so
 * that Zod validation schemas stay in sync with your data model.
 *
 *   npx ts-node scripts/generator_scripts/sync_schemas.ts
 *
 * ─── What gets generated ────────────────────────────────────────────────────
 *
 * For each model the script produces:
 *
 *   createXxxSchema  — validates the POST body.
 *                      Includes all writable scalar fields AND FK scalars
 *                      (e.g. `authorId`). Auto-generated fields (id,
 *                      createdAt, updatedAt) are excluded.
 *
 *   updateXxxSchema  — validates the PATCH / PUT body.
 *                      Same field set but every field is `.optional()`.
 *                      A `.refine()` guard ensures at least one field is sent.
 *
 *   getXxxSchema     — validates `params.id` (GET /:id)
 *
 *   deleteXxxSchema  — validates `params.id` (DELETE /:id)
 *
 *   CreateXxxInput   — inferred type from createXxxSchema['body']
 *   UpdateXxxInput   — inferred type from updateXxxSchema['body']
 *
 * ─── Relationship handling ───────────────────────────────────────────────────
 *
 * One-to-One / One-to-Many (owning "many" side):
 *   The FK scalar (e.g. `authorId String`) IS included in createXxxSchema.
 *   Callers must supply the parent id when creating a child record.
 *   The relation object field (`author User`) is excluded — it is read-only
 *   and only populated via Prisma `include`.
 *
 * One-to-Many (inverse "one" side):
 *   The list relation field (`posts Post[]`) is excluded.
 *   No FK is present on this side.
 *
 * Many-to-Many:
 *   Both sides have list relations but no explicit FK scalar.
 *   The related-ids array can be added manually to the schema if needed —
 *   this generator intentionally does NOT auto-generate that because Prisma
 *   requires a `connect` payload rather than a raw id array.
 *
 * ─── Extending the generated schema ─────────────────────────────────────────
 *
 * The generated file is FULLY OVERWRITTEN on each run.  To add custom
 * validation that survives regeneration, extend the schema in a separate file:
 *
 *   // post.schemas.extended.ts  (never touched by the generator)
 *   import { createPostSchema } from './post.schemas';
 *   export const createPostWithTagsSchema = createPostSchema.extend({
 *     tagIds: z.array(z.string()).optional(),
 *   });
 */

import * as fs from 'fs';
import * as path from 'path';
import { PrismaSchemaProvider, FieldInfo, ModelInfo } from './schema_parser';

const PRISMA_SCHEMA_PATH = path.join(__dirname, '../../prisma/schema.prisma');
const MODULES_DIR        = path.join(__dirname, '../../src/modules');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function camelCase(s: string) {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

// ---------------------------------------------------------------------------
// Zod type mapping
// ---------------------------------------------------------------------------

/**
 * Maps a FieldInfo to its Zod validator expression (without .optional()).
 *
 * FK scalar fields (e.g. `authorId`) are treated as `z.string()` (Prisma
 * IDs are UUIDs by default) — adjust the heuristic if your project uses
 * integer PKs.
 */
function zodTypeFor(field: FieldInfo): string {
  // Relation objects are never in schemas — the caller must filter them.
  if (field.isRelation) return 'z.never()';

  switch (field.type) {
    case 'String':
      // Common field-name heuristics for more precise validators
      if (field.name === 'email')    return 'z.string().email()';
      if (field.name === 'password') return 'z.string().min(8)';
      if (field.name === 'role')     return `z.enum(['USER', 'ADMIN'])`;
      // FK scalars (e.g. authorId) are UUIDs
      if (field.isForeignKey)        return 'z.string().uuid()';
      return 'z.string().min(1)';
    case 'Boolean':  return 'z.boolean()';
    case 'Int':      return 'z.number().int()';
    case 'Float':
    case 'Decimal':  return 'z.number()';
    case 'DateTime': return 'z.coerce.date()';
    case 'Json':     return 'z.record(z.unknown())';
    case 'Bytes':    return 'z.instanceof(Buffer)';
    default:
      // Unknown type — safe fallback; TypeScript will surface any mismatch
      return 'z.string()';
  }
}

// ---------------------------------------------------------------------------
// Schema file generator
// ---------------------------------------------------------------------------

/**
 * Generates the full content of `<model>.schemas.ts`.
 *
 * Field inclusion rules:
 *   ✅  Plain scalar (non-auto)     → included in create & update
 *   ✅  FK scalar (isForeignKey)    → included in create & update
 *   ❌  Auto fields (id, timestamps)→ excluded
 *   ❌  Relation objects            → excluded
 *   ❌  Scalar lists                → excluded (edge case; add manually)
 */
function generateSchemas(model: ModelInfo): string {
  const Name      = model.name;          // e.g. Post
  const nameLower = camelCase(Name);     // e.g. post
  const NameUp    = Name.toUpperCase();  // e.g. POST (for section comments)

  // Fields excluded from create/update payloads
  const AUTO_FIELDS = new Set(['id', 'createdAt', 'updatedAt']);

  // Writable fields: scalars + FK scalars, excluding auto-generated ones
  const writable = model.fields.filter(
    (f) => !f.isRelation && !AUTO_FIELDS.has(f.name) && !f.isList,
  );

  const lines: string[] = [
    `import { z } from 'zod';`,
    `import { idParamSchema } from '../../shared/schemas';`,
    ``,
    `// ─── ${NameUp} SCHEMAS ─────────────────────────────────────────────────────`,
    `//`,
    `// This file is automatically synced by sync_schemas.ts — do not edit manually.`,
    `// To add custom schemas that survive regeneration, create:`,
    `//   ${nameLower}.schemas.extended.ts`,
    ``,
  ];

  // ── createXxxSchema ───────────────────────────────────────────────────────
  lines.push(
    `/**`,
    ` * Validates the request body for POST /api/${nameLower}s.`,
    ` *`,
    ` * Included fields:`,
    ...writable.map((f) => {
      const note = f.isForeignKey ? ` (FK → ${f.relatedModel})` : '';
      const opt  = f.isOptional   ? ' [optional]' : ' [required]';
      return ` *   ${f.name}${note}${opt}`;
    }),
    ` */`,
    `export const create${Name}Schema = z.object({`,
    `  body: z.object({`,
  );

  for (const field of writable) {
    const zodExpr = zodTypeFor(field);
    if (field.isOptional || field.hasDefault) {
      lines.push(`    ${field.name}: ${zodExpr}.optional(),`);
    } else {
      lines.push(`    ${field.name}: ${zodExpr},`);
    }
  }

  lines.push(`  }),`, `});`, ``);

  // ── updateXxxSchema ───────────────────────────────────────────────────────
  // Update schemas: all fields optional + at least one must be present
  const updateFieldNames = writable.map((f) => `'${f.name}'`).join(' | ');
  const updateRefineArgs = writable.map((f) => `data.${f.name} !== undefined`).join(' || ');

  lines.push(
    `/**`,
    ` * Validates the request body for PATCH /api/${nameLower}s/:id.`,
    ` * All fields are optional, but at least one must be provided.`,
    ` */`,
    `export const update${Name}Schema = z.object({`,
    `  params: idParamSchema,`,
    `  body: z.object({`,
  );

  for (const field of writable) {
    const zodExpr = zodTypeFor(field);
    lines.push(`    ${field.name}: ${zodExpr}.optional(),`);
  }

  if (writable.length > 0) {
    lines.push(
      `  }).refine((data) => ${updateRefineArgs}, {`,
      `    message: 'At least one field (${writable.map(f => f.name).join(', ')}) must be provided',`,
      `  }),`,
    );
  } else {
    lines.push(`  }),`);
  }

  lines.push(`});`, ``);

  // ── getXxxSchema & deleteXxxSchema ────────────────────────────────────────
  lines.push(
    `export const get${Name}Schema = z.object({`,
    `  params: idParamSchema,`,
    `});`,
    ``,
    `export const delete${Name}Schema = z.object({`,
    `  params: idParamSchema,`,
    `});`,
    ``,
    `// ─── Inferred Types ───────────────────────────────────────────────────────────`,
    ``,
    `export type Create${Name}Input = z.infer<typeof create${Name}Schema>['body'];`,
    `export type Update${Name}Input = z.infer<typeof update${Name}Schema>['body'];`,
    ``,
  );

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const provider = new PrismaSchemaProvider(PRISMA_SCHEMA_PATH);
  const models   = await provider.getModels();

  for (const model of models) {
    const modelNameLower = camelCase(model.name);
    const schemasPath    = path.join(MODULES_DIR, modelNameLower, `${modelNameLower}.schemas.ts`);

    // Only regenerate if the module folder already exists (generate_module ran first)
    if (!fs.existsSync(path.dirname(schemasPath))) {
      console.log(`Skipping ${model.name} — module not generated yet`);
      continue;
    }

    console.log(`Syncing schemas for ${model.name}...`);
    const content = generateSchemas(model);
    fs.writeFileSync(schemasPath, content, 'utf8');
    console.log(`  ✓ Written → ${schemasPath}`);
  }

  console.log('Schema synchronization complete.');
}

main().catch(console.error);
