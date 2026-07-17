/**
 * generate-route-docs.ts
 *
 * Introspects every module under src/modules/**\/\*.routes.ts and produces a
 * single Markdown file (docs/api-routes.md) documenting every route.
 *
 * ─── What this script does ────────────────────────────────────────────────────
 *
 * For each discovered routes file it:
 *   1. Reads the createBaseRouter(..., schemas) call to determine which of the
 *      six standard CRUD routes have Zod validators attached.
 *   2. Reads any additional routes registered on the local `finalRouter`
 *      variable (e.g. GET /summary, POST /custom).
 *   3. Reads the corresponding <model>.schemas.ts file to extract field names
 *      and their Zod types for the create / update schemas.
 *   4. Reads the corresponding <model>.types.ts file to infer the response type
 *      fields from the exported interface.
 *   5. Reads the corresponding <model>.module.ts file to get the API base path
 *      (e.g. '/api/todos').
 *
 * Re-running is fully idempotent — docs/api-routes.md is overwritten each run.
 *
 * ─── npm script ──────────────────────────────────────────────────────────────
 *
 *   pnpm --filter backend run docs:routes
 *
 * ─── Auth column ─────────────────────────────────────────────────────────────
 *
 * The "Auth" column is left as "-" for all rows. It will be populated once
 * authMiddleware / RBAC is applied per-route in Phase 2.
 */

import {
  Project,
  SyntaxKind,
  Node,
  ObjectLiteralExpression,
  CallExpression,
  PropertyAssignment,
  StringLiteral,
} from 'ts-morph';
import * as fs from 'fs';
import * as path from 'path';

// ─── Paths ────────────────────────────────────────────────────────────────────

const MODULES_DIR  = path.join(__dirname, '../../src/modules');
const DOCS_DIR     = path.join(__dirname, '../../../../docs');
const OUTPUT_FILE  = path.join(DOCS_DIR, 'api-routes.md');

// ─── Types ────────────────────────────────────────────────────────────────────

interface RouteEntry {
  method:     string;
  path:       string;
  auth:       string;
  bodySchema: string;
  response:   string;
}

interface ModuleDoc {
  moduleName: string;   // e.g. "Todo"
  basePath:   string;   // e.g. "/api/todos"
  routes:     RouteEntry[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Return all immediate child directories of a directory. */
function subdirs(dir: string): string[] {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
}

// ─── Base-path extraction ─────────────────────────────────────────────────────

/**
 * Attempt to extract the `prefix` string literal from <model>.module.ts
 * by looking for `return { prefix: '/api/...' }` patterns.
 * Falls back to `/api/${modelName}s` if not statically readable.
 */
function extractBasePath(moduleName: string): string {
  const moduleFile = path.join(
    MODULES_DIR,
    moduleName,
    `${moduleName}.module.ts`,
  );

  if (!fs.existsSync(moduleFile)) {
    return `/api/${moduleName}s`;
  }

  const src = fs.readFileSync(moduleFile, 'utf8');
  // Match:  prefix: '/api/todos'  or  prefix: "/api/todos"
  const m = src.match(/prefix\s*:\s*['"]([^'"]+)['"]/);
  return m ? m[1] : `/api/${moduleName}s`;
}

// ─── Schema field extraction ──────────────────────────────────────────────────

interface SchemaField {
  name:       string;
  zodExpr:    string;
  isOptional: boolean;
}

/**
 * Extract fields from a named Zod object schema variable (e.g. createTodoSchema)
 * by text-parsing the source file.  We look for the `.body: z.object({ ... })`
 * block inside the target variable declaration.
 *
 * This is intentionally a simple regex approach — the generated schemas are
 * machine-produced and have a stable, predictable format.
 */
function extractSchemaFields(
  schemasFilePath: string,
  schemaVarName: string,
): SchemaField[] {
  if (!fs.existsSync(schemasFilePath)) return [];

  const src = fs.readFileSync(schemasFilePath, 'utf8');

  // Locate the variable declaration for schemaVarName
  const varStart = src.indexOf(`export const ${schemaVarName}`);
  if (varStart === -1) return [];

  // Find the body: z.object({ ... }) block — count braces to find the end
  const bodyObjStart = src.indexOf('body: z.object({', varStart);
  if (bodyObjStart === -1) return [];

  // Walk forward counting braces to get the full body object text
  let depth = 0;
  let i = src.indexOf('{', bodyObjStart + 'body: z.object('.length);
  const start = i;
  while (i < src.length) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) break;
    }
    i++;
  }
  const bodyContent = src.slice(start + 1, i); // inside the { ... }

  // Parse individual field lines: "  fieldName: z.string().min(1).optional(),"
  const fields: SchemaField[] = [];
  const lines = bodyContent.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
    // Match: fieldName: <zodExpr>,
    const fieldMatch = trimmed.match(/^([A-Za-z0-9_]+)\s*:\s*(.+?),?\s*$/);
    if (!fieldMatch) continue;
    const name    = fieldMatch[1];
    const zodExpr = fieldMatch[2].trim().replace(/,$/, '');
    const isOptional = zodExpr.includes('.optional()');
    fields.push({ name, zodExpr, isOptional });
  }

  return fields;
}

/**
 * Build a human-readable body schema string from the create/update Zod fields.
 * e.g. "{ title: string; completed?: boolean; userId: uuid }"
 */
function describeSchemaFields(fields: SchemaField[]): string {
  if (fields.length === 0) return '-';
  const parts = fields.map((f) => {
    const opt  = f.isOptional ? '?' : '';
    // Simplify zod expression to a TS-like type label
    let type = f.zodExpr
      .replace(/z\.string\(\)\.email\(\).*/, 'email')
      .replace(/z\.string\(\)\.uuid\(\).*/, 'uuid')
      .replace(/z\.string\(\)\.min\(\d+\).*/, 'string')
      .replace(/z\.string\(\).*/, 'string')
      .replace(/z\.boolean\(\).*/, 'boolean')
      .replace(/z\.number\(\)\.int\(\).*/, 'number')
      .replace(/z\.number\(\).*/, 'number')
      .replace(/z\.coerce\.date\(\).*/, 'Date')
      .replace(/z\.enum\(\[([^\]]+)\]\).*/, 'enum($1)')
      .replace(/z\.record\(z\.unknown\(\)\).*/, 'Record<string,unknown>')
      .replace(/z\.array\(.*?\).*/, 'array');
    return `${f.name}${opt}: ${type}`;
  });
  return `{ ${parts.join('; ')} }`;
}

// ─── Type interface extraction ────────────────────────────────────────────────

/**
 * Extract scalar field names from the primary exported interface in <model>.types.ts.
 * Relation fields (optional arrays / optional objects that start with uppercase)
 * are filtered out so the response column stays clean.
 */
function extractTypeFields(typesFilePath: string, typeName: string): string[] {
  if (!fs.existsSync(typesFilePath)) return [];

  const src = fs.readFileSync(typesFilePath, 'utf8');

  // Find the interface block
  const ifaceStart = src.indexOf(`export interface ${typeName}`);
  if (ifaceStart === -1) return [];

  let depth = 0;
  let i = src.indexOf('{', ifaceStart);
  const start = i;
  while (i < src.length) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) break;
    }
    i++;
  }
  const body = src.slice(start + 1, i);

  const fields: string[] = [];
  for (const line of body.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/**') || trimmed.startsWith('*/')) continue;
    // Match: fieldName?: Type  or  fieldName: Type
    const m = trimmed.match(/^([A-Za-z0-9_]+)(\?)?\s*:\s*(.+?);?\s*$/);
    if (!m) continue;

    const name     = m[1];
    const optional = !!m[2];
    const typeStr  = m[3].trim().replace(/;$/, '');

    // Skip relation fields: optional and type starts with uppercase (another model)
    // or is an array of uppercase types
    if (optional) {
      const baseType = typeStr.replace(/\[\]$/, '').trim();
      if (/^[A-Z]/.test(baseType)) continue; // relation object or array
    }

    fields.push(name);
  }
  return fields;
}

// ─── Routes file analysis ─────────────────────────────────────────────────────

/** Keys that appear in the BaseRouteSchemas object passed to createBaseRouter */
type BaseSchemaKey = 'get' | 'create' | 'update' | 'delete';

/**
 * Find the ObjectLiteralExpression passed as the second argument to
 * `createBaseRouter(controller, { ... })` and return the keys present.
 */
function extractBaseRouterSchemaKeys(
  project: Project,
  routesFilePath: string,
): Set<BaseSchemaKey> {
  const keys = new Set<BaseSchemaKey>();

  const sf = project.addSourceFileAtPath(routesFilePath);

  sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
    const expr = call.getExpression();
    if (!Node.isIdentifier(expr) || expr.getText() !== 'createBaseRouter') return;

    const args = call.getArguments();
    if (args.length < 2) return;

    const schemasArg = args[1];
    if (!Node.isObjectLiteralExpression(schemasArg)) return;

    (schemasArg as ObjectLiteralExpression).getProperties().forEach((prop) => {
      if (Node.isPropertyAssignment(prop)) {
        const key = prop.getName() as BaseSchemaKey;
        if (['get', 'create', 'update', 'delete'].includes(key)) {
          keys.add(key);
        }
      }
    });
  });

  return keys;
}

interface CustomRoute {
  method:      string;
  path:        string;
  handlerName: string;
}

/**
 * Extract custom routes registered on `finalRouter` — i.e. any
 * `finalRouter.get(...)`, `finalRouter.post(...)`, etc. calls that are NOT
 * `finalRouter.use('/', router)`.
 */
function extractCustomRoutes(
  project: Project,
  routesFilePath: string,
): CustomRoute[] {
  const custom: CustomRoute[] = [];
  const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'];

  const sf = project.getSourceFile(routesFilePath)
    ?? project.addSourceFileAtPath(routesFilePath);

  sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
    const expr = call.getExpression();
    if (!Node.isPropertyAccessExpression(expr)) return;

    const obj    = expr.getExpression().getText();
    const method = expr.getName();

    // Only care about finalRouter.xxx(...)
    if (obj !== 'finalRouter' || !HTTP_METHODS.includes(method)) return;

    const args = call.getArguments();
    if (args.length < 2) return;

    // First arg must be a string literal path
    const firstArg = args[0];
    if (!Node.isStringLiteral(firstArg)) return;

    const routePath = (firstArg as StringLiteral).getLiteralValue();

    // Find the handler name — last arg that is a property access or identifier
    let handlerName = 'unknown';
    for (let i = args.length - 1; i >= 1; i--) {
      const arg = args[i];
      if (Node.isPropertyAccessExpression(arg)) {
        handlerName = arg.getName();
        break;
      }
      if (Node.isIdentifier(arg)) {
        handlerName = arg.getText();
        break;
      }
    }

    custom.push({ method: method.toUpperCase(), path: routePath, handlerName });
  });

  return custom;
}

// ─── Module doc builder ───────────────────────────────────────────────────────

function buildModuleDoc(
  project:    Project,
  moduleName: string, // e.g. "todo"
): ModuleDoc | null {
  const modelName   = capitalize(moduleName);          // e.g. "Todo"
  const moduleDir   = path.join(MODULES_DIR, moduleName);
  const routesFile  = path.join(moduleDir, `${moduleName}.routes.ts`);
  const schemasFile = path.join(moduleDir, `${moduleName}.schemas.ts`);
  const typesFile   = path.join(moduleDir, `${moduleName}.types.ts`);

  if (!fs.existsSync(routesFile)) return null;

  // ── Health module: no BaseRouter/schemas, document its routes plainly ──────
  const isHealthModule = moduleName === 'health';
  const basePath = extractBasePath(moduleName);

  if (isHealthModule) {
    return {
      moduleName: 'Health',
      basePath,
      routes: [
        { method: 'GET',  path: `${basePath}`,        auth: '-', bodySchema: '-', response: '{ status: string; timestamp: string }' },
        { method: 'GET',  path: `${basePath}/error`,  auth: '-', bodySchema: '-', response: 'Error (test)' },
      ],
    };
  }

  // ── Standard module ───────────────────────────────────────────────────────

  const schemaKeys = extractBaseRouterSchemaKeys(project, routesFile);
  const customRoutes = extractCustomRoutes(project, routesFile);

  // Body schema fields
  const createFields = extractSchemaFields(
    schemasFile, `create${modelName}Schema`,
  );
  const updateFields = extractSchemaFields(
    schemasFile, `update${modelName}Schema`,
  );

  // Response type fields
  const typeFields = extractTypeFields(typesFile, modelName);
  const typeFieldStr = typeFields.length > 0
    ? typeFields.join(', ')
    : modelName;

  const createSchemaLabel  = createFields.length > 0 ? `Create${modelName}Input` : '-';
  const updateSchemaLabel  = updateFields.length > 0 ? `Update${modelName}Input` : '-';
  const createBodyDesc     = createFields.length > 0 ? describeSchemaFields(createFields) : '-';
  const updateBodyDesc     = updateFields.length > 0 ? describeSchemaFields(updateFields) : '-';

  const routes: RouteEntry[] = [];

  // ── Base CRUD routes ──────────────────────────────────────────────────────

  // GET /  — getAll
  routes.push({
    method:     'GET',
    path:       basePath,
    auth:       '-',
    bodySchema: '-',
    response:   `${modelName}[]`,
  });

  // GET /:id
  routes.push({
    method:     'GET',
    path:       `${basePath}/:id`,
    auth:       '-',
    bodySchema: '-',
    response:   modelName,
  });

  // POST /  — create
  routes.push({
    method:     'POST',
    path:       basePath,
    auth:       '-',
    bodySchema: schemaKeys.has('create') ? `${createSchemaLabel} ${createBodyDesc}` : '-',
    response:   `${modelName} (201)`,
  });

  // PUT /:id  — update
  routes.push({
    method:     'PUT',
    path:       `${basePath}/:id`,
    auth:       '-',
    bodySchema: schemaKeys.has('update') ? `${updateSchemaLabel} ${updateBodyDesc}` : '-',
    response:   modelName,
  });

  // DELETE /:id
  routes.push({
    method:     'DELETE',
    path:       `${basePath}/:id`,
    auth:       '-',
    bodySchema: '-',
    response:   '204',
  });

  // DELETE /  — deleteAll
  routes.push({
    method:     'DELETE',
    path:       basePath,
    auth:       '-',
    bodySchema: '-',
    response:   '204',
  });

  // ── Custom routes ─────────────────────────────────────────────────────────

  for (const cr of customRoutes) {
    // Resolve full path: cr.path is relative (e.g. '/summary')
    const fullPath = `${basePath}${cr.path}`;

    // Infer response shape from handler name heuristics
    let response = '-';
    const h = cr.handlerName.toLowerCase();
    if (h.includes('summary')) {
      response = '{ total: number }';
    } else if (h.includes('getall') || h.includes('list')) {
      response = `${modelName}[]`;
    } else if (h.includes('get') || h.includes('find') || h.includes('fetch')) {
      response = modelName;
    }

    routes.push({
      method:     cr.method,
      path:       fullPath,
      auth:       '-',
      bodySchema: '-',
      response,
    });
  }

  return { moduleName: modelName, basePath, routes };
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

function renderModuleSection(doc: ModuleDoc): string {
  const lines: string[] = [
    `## ${doc.moduleName}`,
    `Base path: \`${doc.basePath}\``,
    '',
    '| Method | Path | Auth | Body Schema | Response |',
    '|--------|------|------|-------------|----------|',
  ];

  for (const r of doc.routes) {
    lines.push(
      `| ${r.method} | \`${r.path}\` | ${r.auth} | ${r.bodySchema} | ${r.response} |`,
    );
  }

  lines.push('');
  return lines.join('\n');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // Create a ts-morph project; we add files on demand — no need for tsconfig
  // since we are only reading AST nodes (no type checking required).
  const project = new Project({ skipAddingFilesFromTsConfig: true });

  // Discover all module directories
  const moduleNames = subdirs(MODULES_DIR);
  console.log(`Found modules: ${moduleNames.join(', ')}`);

  const docs: ModuleDoc[] = [];

  for (const moduleName of moduleNames) {
    console.log(`  Processing module: ${moduleName}`);
    const doc = buildModuleDoc(project, moduleName);
    if (doc) {
      docs.push(doc);
    } else {
      console.log(`    ↳ Skipped (no routes file found)`);
    }
  }

  // Ensure docs dir exists
  if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
  }

  const header = [
    '# API Route Documentation',
    '',
    '> Auto-generated by `scripts/analytics_scripts/generate-route-docs.ts`.',
    '> Do **not** edit this file manually — re-run `pnpm --filter backend run docs:routes` to regenerate.',
    '>',
    '> **Auth column**: `-` means no auth middleware applied yet.',
    '> Once Phase 2 auth/RBAC middleware is wired per-route, this column will show',
    '> `JWT` (requires valid Bearer token) or `JWT+ADMIN` (requires ADMIN role).',
    '',
  ].join('\n');

  const body = docs.map(renderModuleSection).join('\n---\n\n');

  const output = header + body;
  fs.writeFileSync(OUTPUT_FILE, output, 'utf8');

  console.log(`\n✓ Route docs written to ${OUTPUT_FILE}`);
  console.log(`  Modules documented: ${docs.map((d) => d.moduleName).join(', ')}`);
}

main().catch((err) => {
  console.error('generate-route-docs failed:', err);
  process.exit(1);
});
