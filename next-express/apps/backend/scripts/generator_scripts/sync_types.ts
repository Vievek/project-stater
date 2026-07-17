import * as fs from 'fs';
import * as path from 'path';
import { PrismaSchemaProvider, FieldInfo, ModelInfo } from './schema_parser';

const PRISMA_SCHEMA_PATH = path.join(__dirname, '../../prisma/schema.prisma');
const MODULES_DIR = path.join(__dirname, '../../src/modules');

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
// Type mapping: Prisma scalar → TypeScript type
// ---------------------------------------------------------------------------

/**
 * Maps a parsed FieldInfo to its TypeScript type string.
 *
 * Relation types are kept as the Prisma model name (e.g. `User`, `Post[]`).
 * The caller (generateInterface) is responsible for deciding whether those
 * types require cross-module imports.
 */
function mapType(field: FieldInfo): string {
  let tsType: string;

  switch (field.type) {
    case 'String':   tsType = 'string';  break;
    case 'Boolean':  tsType = 'boolean'; break;
    case 'Int':
    case 'Float':
    case 'Decimal':  tsType = 'number';  break;
    case 'DateTime': tsType = 'Date';    break;
    case 'Json':     tsType = 'any';     break;
    case 'Bytes':    tsType = 'Buffer';  break;
    default:
      // Non-standard type → another Prisma model (relation object).
      // Emit the model name directly; imports are handled by generateInterface.
      tsType = field.type;
      break;
  }

  if (field.isList) {
    tsType += '[]';
  }

  return tsType;
}

// ---------------------------------------------------------------------------
// Interface generator
// ---------------------------------------------------------------------------

/**
 * Generates a `*.types.ts` file for `model`.
 *
 * Rules per field category:
 *
 * 1. **Plain scalar** (isRelation: false, isForeignKey: false)
 *    Emitted as-is; respects the Prisma `?` marker.
 *
 * 2. **FK scalar** (isForeignKey: true)
 *    Also a plain scalar — emitted normally. The `Id` suffix in the field
 *    name already makes it clear it is a FK reference.
 *
 * 3. **Relation object** (isRelation: true)
 *    ALWAYS marked `?` regardless of the Prisma schema — because Prisma
 *    only hydrates relation fields when the caller passes `include: { … }`.
 *    Without `include`, the field is `undefined` at runtime.
 *    A cross-module import is added for the referenced type.
 *
 * Relationship cheat-sheet for domain types:
 *
 *   One-to-One  owner side  → FK scalar (`profileId`) + relation object (`profile?: Profile`)
 *   One-to-One  inverse     → relation object only (`user?: User`)
 *   One-to-Many "many" side → FK scalar (`authorId`)  + relation object (`author?: User`)
 *   One-to-Many "one"  side → list relation only (`posts?: Post[]`)
 *   Many-to-Many            → list relation on both sides (`tags?: Tag[]`, `posts?: Post[]`)
 */
function generateInterface(model: ModelInfo, allModelNames: Set<string>): string {
  const lines: string[] = [];

  // ── Collect cross-module imports needed for relation types ──────────────
  // We import from sibling module folders (../post/post.types) so that domain
  // types remain ORM-free and cross-module boundaries are explicit.
  const relatedModels = new Set<string>();
  for (const field of model.fields) {
    if (field.isRelation && field.relatedModel && allModelNames.has(field.relatedModel)) {
      relatedModels.add(field.relatedModel);
    }
  }

  if (relatedModels.size > 0) {
    for (const related of Array.from(relatedModels).sort()) {
      const relatedLower = camelCase(related);
      lines.push(`import { ${related} } from '../${relatedLower}/${relatedLower}.types';`);
    }
    lines.push('');
  }

  // ── JSDoc header ────────────────────────────────────────────────────────
  lines.push(
    `/**`,
    ` * Domain-owned ${model.name} type.`,
    ` * This file is automatically synced by sync_types.ts — do not edit manually.`,
    ` *`,
    ` * Relation fields (marked ?) are only populated when Prisma's \`include\` option`,
    ` * is used in the repository. They are absent (undefined) in plain queries.`,
    ` */`,
    `export interface ${model.name} {`,
  );

  // ── Fields ───────────────────────────────────────────────────────────────
  for (const field of model.fields) {
    const tsType = mapType(field);

    if (field.isRelation) {
      // Relation objects are ALWAYS optional — Prisma only hydrates them on
      // explicit `include`. Marking them required would be a lie.
      lines.push(
        `  /** Hydrated via \`include: { ${field.name}: true }\` in the repository. */`,
        `  ${field.name}?: ${tsType};`,
      );
    } else if (field.isForeignKey) {
      // FK scalar: treat same as a normal field but add a clarifying comment.
      const optMarker = field.isOptional ? '?' : '';
      lines.push(
        `  /** Foreign key referencing ${field.relatedModel}.id */`,
        `  ${field.name}${optMarker}: ${tsType};`,
      );
    } else {
      // Plain scalar
      const optMarker = field.isOptional ? '?' : '';
      lines.push(`  ${field.name}${optMarker}: ${tsType};`);
    }
  }

  lines.push(`}`, ``);
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const provider = new PrismaSchemaProvider(PRISMA_SCHEMA_PATH);
  const models = await provider.getModels();
  const allModelNames = new Set(models.map(m => m.name));

  for (const model of models) {
    const modelNameLower = camelCase(model.name);
    const typesFilePath = path.join(MODULES_DIR, modelNameLower, `${modelNameLower}.types.ts`);

    // Only update if the module already exists on disk (i.e. generate_module ran first)
    if (fs.existsSync(path.dirname(typesFilePath))) {
      console.log(`Syncing types for ${model.name}...`);
      const newContent = generateInterface(model, allModelNames);
      fs.writeFileSync(typesFilePath, newContent, 'utf8');
      console.log(`  ✓ Written → ${typesFilePath}`);
    } else {
      console.log(`  Skipping ${model.name} — module not generated yet`);
    }
  }

  console.log('Type synchronization complete.');
}

main().catch(console.error);
