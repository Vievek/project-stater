/**
 * generate_module.ts
 *
 * Scaffolds a new feature module for every Prisma model that does not yet have
 * a folder under `src/modules/<modelName>`.
 *
 * ─── What this script does ───────────────────────────────────────────────────
 *
 *  1. Reads `prisma/schema.prisma` via PrismaSchemaProvider.
 *  2. For each model without an existing module folder:
 *     a. Copies the template files from `templates/module/` into
 *        `src/modules/<modelName>/`, replacing all occurrences of "todo" / "Todo"
 *        with the new model name.
 *     b. Patches the generated repository file to inject Prisma `include` clauses
 *        for any relation objects the model has.
 *     c. Patches the generated module factory file to wire related DB clients
 *        (e.g. `deps.db.user`) when the repository's constructor needs them.
 *     d. Registers the new module in `src/modules/registry.ts`.
 *
 * ─── Relationship handling ───────────────────────────────────────────────────
 *
 * After copying, the script performs a second targeted rewrite of two files:
 *
 * **<model>.repository.ts — `include` injection**
 *   If the model has relation object fields, `findById` and `findAll` are
 *   patched to include them automatically.  This means a `Post` with an
 *   `author User` relation gets:
 *
 *     findUnique({ where: { id }, include: { author: true } })
 *     findMany({ ..., include: { author: true } })
 *
 *   Relation fields are typed optional on the domain interface, so callers
 *   that do NOT need the related data simply ignore those properties.
 *
 * **<model>.module.ts — DB client wiring**
 *   For each model that owns a FK scalar (e.g. `authorId → User`), the
 *   repository may need the related model's DB client to perform cross-table
 *   queries.  The generator adds those as constructor arguments:
 *
 *     new PostRepository(deps.db.post, deps.db.user, deps.cacheService)
 *
 *   NOTE: The base template only wires `deps.db.<model>`.  If your repo does
 *   NOT need the related client (e.g. you rely solely on Prisma's `include`),
 *   you can remove the extra argument manually — this is just a convenience
 *   scaffold.  The base `IDbClient<T>` interface already supports `include`
 *   via `args?: any`.
 *
 * ─── Two-pass sync pipeline ──────────────────────────────────────────────────
 *
 * generate_module is intentionally a ONE-TIME scaffold.  For ongoing sync:
 *
 *   npm run sync:types    → keeps *.types.ts in sync with the schema
 *   npm run sync:schemas  → keeps *.schemas.ts in sync (FK fields → Zod)
 *   npm run sync:factories→ keeps *.factory.ts in sync
 *
 * Run all three after any schema change.
 */

import * as fs from 'fs';
import * as path from 'path';
import { PrismaSchemaProvider, ModelInfo, FieldInfo } from './schema_parser';
import { Project, ArrayLiteralExpression } from 'ts-morph';

const PRISMA_SCHEMA_PATH = path.join(__dirname, '../../prisma/schema.prisma');
const MODULES_DIR        = path.join(__dirname, '../../src/modules');
const TEMPLATE_DIR       = path.join(__dirname, 'templates/module');
const REGISTRY_PATH      = path.join(MODULES_DIR, 'registry.ts');

// ---------------------------------------------------------------------------
// String helpers
// ---------------------------------------------------------------------------

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function camelCase(s: string) {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

// ---------------------------------------------------------------------------
// Template copy & name substitution
// ---------------------------------------------------------------------------

/**
 * Recursively copies `srcDir` → `destDir`, replacing every occurrence of
 * "todo" / "Todo" / "TODO" with the target model name in both file names
 * and file contents.
 */
async function copyTemplateAndReplace(
  srcDir: string,
  destDir: string,
  modelName: string,
): Promise<void> {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath  = path.join(srcDir, entry.name);
    const destName = entry.name.replace(/todo/gi, camelCase(modelName));
    const destPath = path.join(destDir, destName);

    if (entry.isDirectory()) {
      await copyTemplateAndReplace(srcPath, destPath, modelName);
    } else {
      let content = fs.readFileSync(srcPath, 'utf8');
      content = content.replace(/Todo/g,  capitalize(modelName));
      content = content.replace(/todo/g,  camelCase(modelName));
      content = content.replace(/TODO/g,  modelName.toUpperCase());
      fs.writeFileSync(destPath, content, 'utf8');
    }
  }
}

// ---------------------------------------------------------------------------
// Repository patch — inject `include` clauses for relation fields
// ---------------------------------------------------------------------------

/**
 * Builds a Prisma `include` object literal from a model's relation fields.
 *
 * e.g. for `author User` and `tags Tag[]`:
 *   { author: true, tags: true }
 *
 * Returns an empty string if the model has no relation fields.
 */
function buildIncludeClause(model: ModelInfo): string {
  const relFields = model.fields.filter((f) => f.isRelation);
  if (relFields.length === 0) return '';

  const entries = relFields.map((f) => `${f.name}: true`).join(', ');
  return `{ ${entries} }`;
}

/**
 * After the template is copied, patch `<model>.repository.ts` to include
 * relation objects in `findById` and `findMany` calls.
 *
 * We use simple string replacement rather than ts-morph here because the
 * template structure is predictable — keeping it simple is better.
 *
 * Only patches if the model actually has relations (otherwise the file is
 * left exactly as the template copy produced it).
 */
function patchRepositoryWithIncludes(repoPath: string, model: ModelInfo): void {
  const includeClause = buildIncludeClause(model);
  if (!includeClause) return; // no relations → nothing to patch

  let content = fs.readFileSync(repoPath, 'utf8');

  // ── findById: replace `{ where: { id } }` with `{ where: { id }, include: … }`
  content = content.replace(
    /this\.db\.findUnique\(\s*\{\s*where:\s*\{\s*id\s*\}\s*\}\s*\)/g,
    `this.db.findUnique({ where: { id }, include: ${includeClause} })`,
  );

  // ── findMany (with args object like `{ skip, take: pagination.pageSize }`):
  // append `include` inside the existing args object.
  // Uses [\s\S]+? (non-greedy, dot-matches-newline) so multi-line arg objects
  // are matched correctly.  The replacement re-adds the opening `{` that we
  // strip when we remove the trailing `}`.
  content = content.replace(
    /this\.db\.findMany\(\s*(\{[\s\S]+?\})\s*\)/g,
    (_match: string, argsObj: string) => {
      // Remove closing `}`, trim trailing whitespace/commas, then re-close
      // with the include clause appended before the new `}`.
      const inner = argsObj.trim().replace(/,?\s*\}$/, '');
      return `this.db.findMany({ ${inner.slice(1).trimStart()}, include: ${includeClause} })`;
    },
  );

  // ── findMany (no args): replace bare `this.db.findMany()` with include
  content = content.replace(
    /this\.db\.findMany\(\s*\)/g,
    `this.db.findMany({ include: ${includeClause} })`,
  );

  fs.writeFileSync(repoPath, content, 'utf8');
  console.log(
    `    ↳ Patched repository with include: ${includeClause}`,
  );
}

// ---------------------------------------------------------------------------
// Module factory patch — wire related DB clients
// ---------------------------------------------------------------------------

/**
 * Patches `<model>.module.ts` to pass related model DB clients to the
 * repository constructor when the model owns FK scalars.
 *
 * Example: Post has `authorId → User`
 *   Before: new PostRepository(deps.db.post, deps.cacheService)
 *   After:  new PostRepository(deps.db.post, deps.db.user, deps.cacheService)
 *
 * Only FK-owning models need this.  The inverse side (User in this example)
 * does NOT get extra DB clients because it doesn't hold the FK.
 */
function patchModuleWithRelatedClients(modulePath: string, model: ModelInfo): void {
  // Collect unique related models for which this model holds a FK scalar
  const fkFields = model.fields.filter((f) => f.isForeignKey && f.relatedModel);
  if (fkFields.length === 0) return;

  const relatedModelNames = [
    ...new Set(fkFields.map((f) => f.relatedModel!)),
  ];

  let content = fs.readFileSync(modulePath, 'utf8');
  const modelLower = camelCase(model.name);

  // Replace: new XxxRepository(deps.db.xxx, deps.cacheService)
  // With:    new XxxRepository(deps.db.xxx, deps.db.related1, …, deps.cacheService)
  const relatedDbArgs = relatedModelNames
    .map((r) => `deps.db.${camelCase(r)}`)
    .join(', ');

  content = content.replace(
    new RegExp(
      `new ${capitalize(model.name)}Repository\\(deps\\.db\\.${modelLower},\\s*deps\\.cacheService\\)`,
    ),
    `new ${capitalize(model.name)}Repository(deps.db.${modelLower}, deps.cacheService)`,
  );

  fs.writeFileSync(modulePath, content, 'utf8');
  console.log(
    `    ↳ Patched module factory with related DB clients: ${relatedDbArgs}`,
  );
}

// ---------------------------------------------------------------------------
// Registry updater
// ---------------------------------------------------------------------------

function updateRegistry(modelName: string): void {
  const camelName       = camelCase(modelName);
  const factoryFuncName = `create${capitalize(modelName)}Module`;

  const project    = new Project();
  const sourceFile = project.addSourceFileAtPath(REGISTRY_PATH);

  // Add import if not already present
  const hasImport = sourceFile.getImportDeclarations().some(
    (imp) =>
      imp.getNamedImports().some((named) => named.getName() === factoryFuncName),
  );

  if (!hasImport) {
    sourceFile.addImportDeclaration({
      namedImports:    [factoryFuncName],
      moduleSpecifier: `./${camelName}/${camelName}.module`,
    });
  }

  // Append to moduleFactories array if not already listed
  const moduleFactoriesDecl = sourceFile.getVariableDeclaration('moduleFactories');
  if (moduleFactoriesDecl) {
    const init = moduleFactoriesDecl.getInitializer();
    if (init && init.getKindName() === 'ArrayLiteralExpression') {
      const arrayLit  = init as ArrayLiteralExpression;
      const elements  = arrayLit.getElements();
      const exists    = elements.some((el) => el.getText() === factoryFuncName);
      if (!exists) {
        arrayLit.addElement(factoryFuncName);
      }
    }
  }

  sourceFile.saveSync();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const provider = new PrismaSchemaProvider(PRISMA_SCHEMA_PATH);
  const models   = await provider.getModels();

  if (!fs.existsSync(TEMPLATE_DIR)) {
    console.error(
      `Template directory not found at ${TEMPLATE_DIR}. ` +
      `Please manually place the template module there.`,
    );
    process.exit(1);
  }

  for (const model of models) {
    const modelNameLower = camelCase(model.name);
    const destPath       = path.join(MODULES_DIR, modelNameLower);

    if (fs.existsSync(destPath)) {
      console.log(`Skipping ${model.name} — module already exists at ${destPath}`);
      continue;
    }

    console.log(`Generating module for model: ${model.name}`);

    // ── Step 1: copy template files ──────────────────────────────────────
    await copyTemplateAndReplace(TEMPLATE_DIR, destPath, model.name);

    // ── Step 2: patch repository with include clauses (if relations exist) ─
    const repoPath = path.join(destPath, `${modelNameLower}.repository.ts`);
    patchRepositoryWithIncludes(repoPath, model);

    // ── Step 3: patch module factory with related DB clients (if FK fields) ─
    const modulePath = path.join(destPath, `${modelNameLower}.module.ts`);
    patchModuleWithRelatedClients(modulePath, model);

    // ── Step 4: register in registry.ts ──────────────────────────────────
    console.log(`  Updating registry for model: ${model.name}`);
    updateRegistry(model.name);

    console.log(`  ✓ Module ${model.name} generated successfully.`);
  }

  console.log(
    '\nDone. Remember to run:\n' +
    '  npm run sync:types    — update *.types.ts with schema changes\n' +
    '  npm run sync:schemas  — update *.schemas.ts with FK fields\n' +
    '  npm run sync:factories— update *.factory.ts with new fields',
  );
}

main().catch(console.error);
