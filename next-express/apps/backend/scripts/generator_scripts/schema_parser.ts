import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Field & Model descriptors
// ---------------------------------------------------------------------------

/**
 * Describes a single field inside a Prisma model.
 *
 * There are three categories of fields worth distinguishing:
 *
 * 1. **Scalar field** (`isRelation: false, isForeignKey: false`)
 *    Plain primitive: String, Int, Boolean, DateTime, Json, Bytes …
 *    These are always present on the domain type and accepted in create/update
 *    schemas (unless they are auto-generated, e.g. `id`, `createdAt`).
 *
 * 2. **Foreign-key scalar** (`isRelation: false, isForeignKey: true`)
 *    A scalar field whose name ends with `Id` and that backs a relation object
 *    on the same model (e.g. `authorId String` for `author User`).
 *    Must appear in create/update schemas so callers can supply the FK value.
 *    The `relatedModel` field names the Prisma model the FK points to.
 *
 * 3. **Relation object** (`isRelation: true, isForeignKey: false`)
 *    A non-scalar field whose type matches another Prisma model name
 *    (e.g. `author User`, `posts Post[]`).
 *    – Never stored directly; only hydrated via Prisma `include`.
 *    – Always optional on the domain interface (data is only present when
 *      the caller explicitly requests it via `include`).
 *    – Skipped by factory / schema generators.
 *    – The `relatedModel` field names the Prisma model being referenced.
 *
 * Relationship patterns and what they produce:
 *
 * **One-to-One** (e.g. User has one Profile)
 *   Profile model: `userId String @unique` → isForeignKey: true, relatedModel: 'User'
 *                  `user   User`           → isRelation: true,   relatedModel: 'User'
 *   User model:    `profile Profile?`      → isRelation: true,   relatedModel: 'Profile'
 *   – The owning side (Profile) holds the FK scalar.
 *   – The inverse side (User) has a virtual relation field only.
 *
 * **One-to-Many** (e.g. User has many Posts)
 *   Post model:  `authorId String` → isForeignKey: true, relatedModel: 'User'
 *                `author   User`   → isRelation: true,   relatedModel: 'User'
 *   User model:  `posts Post[]`    → isRelation: true, isList: true, relatedModel: 'Post'
 *   – The "many" side (Post) holds the FK scalar.
 *   – The "one" side (User) has a virtual list relation only.
 *
 * **Many-to-Many** (e.g. Post ↔ Tag via implicit join table)
 *   Post model:  `tags Tag[]`      → isRelation: true, isList: true, relatedModel: 'Tag'
 *   Tag model:   `posts Post[]`    → isRelation: true, isList: true, relatedModel: 'Post'
 *   – Neither side holds an explicit FK scalar (Prisma manages the join table).
 *   – Both sides get an optional list property on their domain interface.
 */
export interface FieldInfo {
  name: string;
  type: string;
  isOptional: boolean;
  isList: boolean;
  hasDefault: boolean;

  /**
   * `true` when the field type is another Prisma model (not a primitive).
   * These fields are only hydrated via `include` — never stored directly.
   */
  isRelation: boolean;

  /**
   * `true` when this scalar field is the backing FK for a relation object
   * on the same model (e.g. `authorId` backs the `author User` relation).
   * Always `false` when `isRelation` is `true`.
   */
  isForeignKey: boolean;

  /**
   * For relation objects and FK scalars: the name of the referenced Prisma
   * model (e.g. `'User'`, `'Post'`). `undefined` for plain scalars.
   */
  relatedModel?: string;
}

export interface ModelInfo {
  name: string;
  fields: FieldInfo[];
}

export interface ISchemaProvider {
  getModels(): Promise<ModelInfo[]>;
}

// ---------------------------------------------------------------------------
// Standard Prisma scalar types — anything else is treated as a relation type
// ---------------------------------------------------------------------------
const STANDARD_TYPES = new Set([
  'String', 'Boolean', 'Int', 'Float', 'DateTime', 'Json', 'Decimal', 'Bytes',
]);

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

export class PrismaSchemaProvider implements ISchemaProvider {
  constructor(private schemaPath: string) {}

  async getModels(): Promise<ModelInfo[]> {
    const content = fs.readFileSync(this.schemaPath, 'utf8');
    const models: ModelInfo[] = [];

    // ── Pass 1: parse each model block into raw FieldInfo objects ──────────
    // Relations are flagged by the type not being a standard scalar, but FK
    // detection requires knowing all model names, so we do a second pass.
    const modelRegex = /model\s+([A-Za-z0-9_]+)\s*{([^}]+)}/g;
    let match: RegExpExecArray | null;

    while ((match = modelRegex.exec(content)) !== null) {
      const modelName = match[1];
      const body = match[2];
      const fields: FieldInfo[] = [];

      for (const line of body.split('\n')) {
        const trimmed = line.trim();
        // Skip comments, blank lines, and block-level attributes (@@index, @@unique …)
        if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('@@')) continue;

        // Field pattern:  <name>  <Type>[[]?]  [?]  [...attributes]
        const fieldMatch = trimmed.match(
          /^([A-Za-z0-9_]+)\s+([A-Za-z0-9_]+)(\[\])?((\?)?)(.*)$/,
        );
        if (!fieldMatch) continue;

        const name       = fieldMatch[1];
        const type       = fieldMatch[2];
        const isList     = !!fieldMatch[3];
        const isOptional = !!fieldMatch[5];
        const attributes = fieldMatch[6] || '';
        const hasDefault = attributes.includes('@default(');

        // A field is a relation object if its type is not a standard scalar.
        // FK scalar detection happens in Pass 2.
        const isRelation = !STANDARD_TYPES.has(type);

        fields.push({
          name,
          type,
          isOptional,
          isList,
          hasDefault,
          isRelation,
          isForeignKey: false, // refined in Pass 2
          relatedModel: isRelation ? type : undefined,
        });
      }

      models.push({ name: modelName, fields });
    }

    // ── Pass 2: identify FK scalar fields ──────────────────────────────────
    // Strategy: a scalar field is a FK if —
    //   (a) it is NOT already marked as a relation object
    //   (b) its name ends with "Id"  (Prisma convention)
    //   (c) there exists a relation object field on the SAME model whose
    //       referenced type matches the base name (e.g. authorId → author User)
    //
    // We collect all known model names first so we can cross-reference.
    const modelNames = new Set(models.map(m => m.name));

    for (const model of models) {
      // Build a quick lookup: relation-object fields on this model, keyed by
      // the related model name (lowercased for fuzzy matching).
      const relFieldsByModel = new Map<string, FieldInfo>();
      for (const f of model.fields) {
        if (f.isRelation && f.relatedModel) {
          relFieldsByModel.set(f.relatedModel.toLowerCase(), f);
        }
      }

      for (const field of model.fields) {
        // Only consider non-relation scalars whose name ends with 'Id'
        if (field.isRelation || !field.name.endsWith('Id')) continue;

        // Derive candidate model name by stripping the trailing 'Id'
        const candidateModel = field.name.slice(0, -2); // e.g. 'author' from 'authorId'
        const candidateLower = candidateModel.toLowerCase();

        // Check if the related model name exists in the schema
        const matchedRelField = relFieldsByModel.get(candidateLower);
        if (matchedRelField && matchedRelField.relatedModel) {
          field.isForeignKey = true;
          field.relatedModel = matchedRelField.relatedModel;
        }
      }
    }

    return models;
  }
}
