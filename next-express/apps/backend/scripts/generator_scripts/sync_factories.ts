import * as fs from "fs";
import * as path from "path";
import { PrismaSchemaProvider, FieldInfo, ModelInfo } from "./schema_parser";

const PRISMA_SCHEMA_PATH = path.join(__dirname, "../../prisma/schema.prisma");
const MODULES_DIR = path.join(__dirname, "../../src/modules");

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
// Default value heuristics
// ---------------------------------------------------------------------------

/**
 * Returns a sensible TypeScript default-value literal for a scalar Prisma field.
 *
 * Relation fields (isRelation: true) must not reach this function — the caller
 * is responsible for filtering them out.
 *
 * FK scalar fields (isForeignKey: true) DO get defaults here — they are plain
 * strings/ints at the database level and must be supplied when creating records.
 *
 * Return `null` signals "skip this field" (e.g. optional scalars).
 */
function defaultValueFor(field: FieldInfo, modelNameLower: string): string | null {
  const { name, type, isOptional, isRelation, isList } = field;

  // Relation objects are never stored directly — factory must NOT include them.
  if (isRelation) return null;

  // Optional scalars: emit null so the factory compiles but stays obvious.
  if (isOptional) return "null";

  // Lists of scalars (rare outside many-to-many implicit tables)
  if (isList) return "[]";

  switch (type) {
    case "String": {
      if (name === "id")       return `\`${modelNameLower}-id-\${seq}\``;
      if (name === "email")    return `\`user-\${seq}@example.com\``;
      if (name === "password") return `\`hashed-password-\${seq}\``;
      if (name === "role")     return `'USER'`;
      // FK scalar (e.g. authorId) — produce a deterministic placeholder
      if (field.isForeignKey && field.relatedModel) {
        return `\`${camelCase(field.relatedModel)}-id-\${seq}\``;
      }
      return `\`${capitalize(modelNameLower)} ${capitalize(name)} \${seq}\``;
    }
    case "Boolean": return "false";
    case "Int":
    case "Float":
    case "Decimal":  return "seq";
    case "DateTime":
      return name.toLowerCase().includes("updated")
        ? "new Date('2024-06-01T00:00:00.000Z')"
        : "new Date('2024-01-01T00:00:00.000Z')";
    case "Json":  return "{}";
    case "Bytes": return "Buffer.from('')";
    default:
      // Unknown scalar — emit null and let TypeScript surface type errors
      return "null";
  }
}

// ---------------------------------------------------------------------------
// Writable field detection
// ---------------------------------------------------------------------------

/**
 * "Writable" fields are the ones a caller supplies on create/update:
 * - Not auto-generated (id, createdAt, updatedAt)
 * - Not a relation object (isRelation)
 * - Not a scalar list (rare)
 *
 * FK scalars (e.g. authorId) ARE included — the caller must supply the
 * parent's id when creating a child record.
 */
function writableFields(model: ModelInfo): FieldInfo[] {
  const autoNames = new Set(["id", "createdAt", "updatedAt"]);
  return model.fields.filter(
    (f) => !f.isRelation && !autoNames.has(f.name) && !f.isList,
  );
}

// ---------------------------------------------------------------------------
// Code generation
// ---------------------------------------------------------------------------

/**
 * Generates the full content of a `<model>.factory.ts` file.
 *
 * What gets generated:
 *
 * 1. `buildXxx(overrides?)` — a full domain object with sensible defaults.
 *    Relation objects are intentionally OMITTED (they are only present when
 *    Prisma's `include` is used).
 *
 * 2. `buildXxxList(count, overrides?)` — convenience wrapper.
 *
 * 3. `buildCreateXxxPayload(overrides?)` — the subset of fields a client
 *    would POST to create a new record.  FK scalars (e.g. authorId) are
 *    included here because the API consumer must supply them.
 *
 * 4. `buildUpdateXxxPayload(overrides?)` — a Partial of the same set;
 *    returns only the overrides so tests can supply exactly the diff they need.
 *
 * 5. `buildXxxWithRelations(overrides?, relations?)` — only generated when
 *    the model has at least one relation object.  Allows tests to compose a
 *    full object with nested data without fighting TypeScript:
 *
 *      const post = buildPostWithRelations({}, { author: buildUser() });
 *
 *    This keeps `buildPost()` clean and relation-free while still supporting
 *    scenarios that need eager-loaded data (e.g. testing serialisation, or
 *    verifying that the controller returns nested objects correctly).
 */
function generateFactory(model: ModelInfo, allModelNames: Set<string>): string {
  const Name      = model.name;
  const nameLower = camelCase(model.name);

  // Scalar fields only (no relation objects)
  const scalarFields = model.fields.filter((f) => !f.isRelation);

  // Relation object fields (for the withRelations helper)
  const relationFields = model.fields.filter(
    (f) => f.isRelation && f.relatedModel && allModelNames.has(f.relatedModel),
  );

  // Build the body of buildXxx()
  const bodyLines: string[] = [];
  for (const field of scalarFields) {
    const val = defaultValueFor(field, nameLower);
    if (val === null) continue;
    bodyLines.push(`    ${field.name}: ${val},`);
  }

  // Writable fields for payload helpers
  const mutable      = writableFields(model);
  const createFields = mutable.map((f) => {
    const val = defaultValueFor(f, nameLower);
    return `    ${f.name}: ${val ?? "null"},`;
  });
  const createPickKeys  = mutable.map((f) => `'${f.name}'`).join(" | ");
  const updatePickKeys  = createPickKeys;

  // ── Cross-module imports for withRelations helper ──────────────────────
  const relatedImports: string[] = [];
  for (const rf of relationFields) {
    const relLower = camelCase(rf.relatedModel!);
    relatedImports.push(
      `import { ${rf.relatedModel} } from '../../${relLower}/${relLower}.types';`,
    );
  }

  const lines: string[] = [
    // Own type import
    `import { ${Name} } from '../../${nameLower}.types';`,
    // Related type imports (only if withRelations is generated)
    ...relatedImports,
    ``,
    `let _seq = 0;`,
    `const next = () => ++_seq;`,
    ``,
    `/**`,
    ` * Builds a full ${Name} object with sensible defaults.`,
    ` *`,
    ` * Relation fields (${relationFields.length > 0 ? relationFields.map(f => f.name).join(', ') : 'none'})`,
    ` * are NOT included — they are only present when Prisma's \`include\` option is used`,
    ` * in the repository. Use \`build${Name}WithRelations\` when you need nested data.`,
    ` */`,
    `export function build${Name}(overrides: Partial<${Name}> = {}): ${Name} {`,
    `  const seq = next();`,
    `  return {`,
    ...bodyLines,
    `    ...overrides,`,
    `  };`,
    `}`,
    ``,
    `/** Builds a list of ${Name} objects. */`,
    `export function build${Name}List(count: number, overrides: Partial<${Name}> = {}): ${Name}[] {`,
    `  return Array.from({ length: count }, () => build${Name}(overrides));`,
    `}`,
    ``,
  ];

  // Payload helpers (only when there are writable fields)
  if (mutable.length > 0) {
    lines.push(
      `/**`,
      ` * Builds a create-${nameLower} payload (the body a client POSTs).`,
      ` *`,
      ` * FK scalar fields (e.g. ${mutable.filter(f => f.isForeignKey).map(f => f.name).join(', ') || 'none'}) are included`,
      ` * because the API consumer must supply the parent id on create.`,
      ` */`,
      `export function buildCreate${Name}Payload(`,
      `  overrides: Partial<Pick<${Name}, ${createPickKeys}>> = {},`,
      `): Pick<${Name}, ${createPickKeys}> {`,
      `  const seq = next();`,
      `  return {`,
      ...createFields,
      `    ...overrides,`,
      `  };`,
      `}`,
      ``,
      `/**`,
      ` * Builds an update-${nameLower} payload.`,
      ` * Returns ONLY the overrides — tests supply exactly the diff they need.`,
      ` */`,
      `export function buildUpdate${Name}Payload(`,
      `  overrides: Partial<Pick<${Name}, ${updatePickKeys}>> = {},`,
      `): Partial<Pick<${Name}, ${updatePickKeys}>> {`,
      `  return { ...overrides };`,
      `}`,
      ``,
    );
  }

  // withRelations helper — only when the model has at least one relation object
  if (relationFields.length > 0) {
    // Build the relations parameter type: { author?: User; tags?: Tag[]; … }
    const relParamEntries = relationFields.map((rf) => {
      const listSuffix = rf.isList ? "[]" : "";
      return `    ${rf.name}?: ${rf.relatedModel}${listSuffix};`;
    });

    lines.push(
      `/**`,
      ` * Builds a ${Name} with related data attached.`,
      ` *`,
      ` * Use this in tests that need nested objects — e.g. to verify that the`,
      ` * controller/service correctly serialises or processes related records.`,
      ` *`,
      ` * Relationship patterns that produce relation fields on this model:`,
      ...relationFields.map((rf) => {
        const kind = rf.isList ? "One-to-Many / Many-to-Many (list)" : "One-to-One / Many-to-One (single)";
        return ` *   ${rf.name} (${kind})`;
      }),
      ` *`,
      ` * @example`,
      ` *   import { build${Name}WithRelations } from './${nameLower}.factory';`,
      ...relationFields.slice(0, 1).map((rf) => {
        const relLower = camelCase(rf.relatedModel!);
        return ` *   import { build${rf.relatedModel} } from '../../${relLower}/tests/factories/${relLower}.factory';`;
      }),
      ` *`,
      ` *   const record = build${Name}WithRelations({}, {`,
      ...relationFields.slice(0, 1).map((rf) => {
        const call = rf.isList
          ? `build${rf.relatedModel}List(2)`
          : `build${rf.relatedModel}()`;
        return ` *     ${rf.name}: ${call},`;
      }),
      ` *   });`,
      ` */`,
      `export function build${Name}WithRelations(`,
      `  overrides: Partial<${Name}> = {},`,
      `  relations: {`,
      ...relParamEntries,
      `  } = {},`,
      `): ${Name} {`,
      `  return { ...build${Name}(overrides), ...relations };`,
      `}`,
      ``,
    );
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const provider = new PrismaSchemaProvider(PRISMA_SCHEMA_PATH);
  const models   = await provider.getModels();
  const allModelNames = new Set(models.map(m => m.name));

  for (const model of models) {
    const modelNameLower = camelCase(model.name);
    const factoryDir  = path.join(MODULES_DIR, modelNameLower, "tests", "factories");
    const factoryFile = path.join(factoryDir, `${modelNameLower}.factory.ts`);

    // Only update modules that already exist on disk
    if (!fs.existsSync(factoryDir)) {
      console.log(
        `Skipping ${model.name} — factory directory not found at ${factoryDir}`,
      );
      continue;
    }

    console.log(`Syncing factory for ${model.name}...`);
    const content = generateFactory(model, allModelNames);
    fs.writeFileSync(factoryFile, content, "utf8");
    console.log(`  ✓ Written → ${factoryFile}`);
  }

  console.log("Factory synchronization complete.");
}

main().catch(console.error);
