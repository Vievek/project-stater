# Relationship Handling Guide

A reference for adding models and handling relationships in the Express/Prisma/DI starter. Covers what's automated, what's manual, and why.

---

## 1. Core Concept: How Relationships Are Detected

Everything flows from `schema_parser.ts` (`PrismaSchemaProvider`), which classifies every field in `schema.prisma` into one of three categories:

| Category | Example | Flags |
|---|---|---|
| Plain scalar | `title String` | `isRelation: false, isForeignKey: false` |
| FK scalar | `userId String` | `isForeignKey: true, relatedModel: 'User'` |
| Relation object | `user User` / `todos Todo[]` | `isRelation: true, isList: bool, relatedModel: 'User'` |

**The one rule everything depends on:** name your FK scalar `<relationFieldName>Id` exactly matching the relation object's field name (e.g. `userId` ↔ `user`). Pass 2 of the parser uses this naming convention to link FK scalars to their relation object. Break this convention and detection silently fails.

---

## 2. Standard Workflow for Adding Any New Model

```bash
# 1. Edit prisma/schema.prisma
# 2. Migrate
npx prisma migrate dev --name add_<model>

# 3. Scaffold (only runs for models with no existing folder)
npx ts-node scripts/generator_scripts/generate_module.ts

# 4. Sync (safe to always run all, re-run after every schema change)
npx ts-node scripts/generator_scripts/sync_types.ts
npx ts-node scripts/generator_scripts/sync_schemas.ts
npx ts-node scripts/generator_scripts/sync_factories.ts
npx ts-node scripts/generator_scripts/sync_query_config.ts
npx ts-node scripts/generator_scripts/sync_m2m_methods.ts   # once built — see §6

# 5. Regenerate Prisma client
npx prisma generate
```

---

## 3. Per-Relationship-Type Checklist

### 3.1 No relationship (standalone model)

```prisma
model Category {
  id    String @id @default(uuid())
  name  String
  color String @default("#000000")
}
```

- Nothing relation-specific happens anywhere in the pipeline.
- `generate_module` copies the template as-is (no `include`, no adapter).
- **To-do:** nothing beyond the standard workflow. Confirm it's registered in `registry.ts` (automatic).

---

### 3.2 One-to-One

```prisma
model Profile {
  id     String @id @default(uuid())
  bio    String?
  userId String @unique                                  // FK — @unique makes it 1:1
  user   User   @relation(fields: [userId], references: [id])
}
model User {
  profile Profile?                                        // inverse side, virtual
}
```

**Auto-generated:**
- `Profile.userId` → FK; `Profile.user` → relation; `User.profile` → relation (not list)
- Types: `Profile.user?: User` (optional), `User.profile?: Profile` (optional)
- Schema: `createProfileSchema` requires `userId`
- Factory: `buildProfileWithRelations({}, { user: buildUser() })`
- Repository: reads go through the relation adapter (`findUniqueWithRelations`)

**To-do (manual):**
- [ ] Re-run `sync_types`/`sync_schemas`/`sync_factories` — this updates `User`'s type too, not just `Profile`'s (sync scripts iterate all models, so just remember to run them, not skip because "only Profile changed").
- [ ] Decide if `user.repository.ts` should also eager-load `profile` on reads — generator doesn't retrofit existing modules automatically.
- [ ] **Transaction check:** if any single API request creates both `User` and `Profile` together (e.g. sign-up flow), wrap it in `ITransactionManager.runInTransaction` — see §5.
- [ ] **Cascade decision:** what happens to `Profile` if its `User` is deleted? See §4.

---

### 3.3 One-to-Many

```prisma
model Comment {
  id     String @id @default(uuid())
  body   String
  todoId String                                           // FK, no @unique — many per todo
  todo   Todo   @relation(fields: [todoId], references: [id])
}
model Todo {
  comments Comment[]                                      // inverse, list
}
```

**Auto-generated:**
- `Comment.todoId` → FK; `Comment.todo` → relation; `Todo.comments` → relation, `isList: true`
- Types: `Comment.todo?: Todo`, `Todo.comments?: Comment[]`
- Schema: `createCommentSchema` requires `todoId`
- Factory: `buildTodoWithRelations({}, { comments: buildCommentList(3) })` — note **list** builder used automatically because `isList` is true
- Repository reads go through the adapter

**To-do (manual):**
- [ ] Re-sync the "one" side (`Todo`) too.
- [ ] **Watch for over-fetching:** the generator eagerly includes relations on every `findMany`/`findUnique` by default. On the "one" side (`Todo` listing `comments`), consider trimming the include on list views if comments aren't needed there — see §7 (N+1 / over-fetching).
- [ ] **Transaction check:** if creating a `Todo` also creates initial `Comments` in one request, wrap in a transaction — see §5.
- [ ] **Cascade decision:** delete a `Todo` → cascade-delete its `Comments`? See §4.

---

### 3.4 Many-to-Many

```prisma
model Tag {
  id    String @id @default(uuid())
  name  String @unique
  todos Todo[]                                            // no FK scalar either side
}
model Todo {
  tags  Tag[]
}
```

No FK scalar on either side — Prisma manages a hidden join table. `schema_parser` flags both fields `isRelation: true, isList: true, isForeignKey: false`.

**Auto-generated:**
- Types: `Tag.todos?: Todo[]`, `Todo.tags?: Tag[]`
- Factory: `buildTagWithRelations({}, { todos: buildTodoList(2) })`
- Repository reads (`include`) via the adapter
- **(Once `sync_m2m_methods.ts` exists — see §6):** `setTags`/`connectTags`/`disconnectTags` methods auto-generated on the repository

**NOT auto-generated — always manual, by design:**
- `todoIds` / `tagIds` field on the create/update Zod schema — add via `<model>.schemas.extended.ts`
- Controller endpoints and routes for attach/detach — depends on your chosen UI pattern (see the 3 cases below)

**The 3 usage patterns (pick based on UI, not schema):**

| Case | Prisma op | User story | Endpoint shape |
|---|---|---|---|
| **A — Attach on create** | `connect` | "I create a new tag and pick a few existing todos to apply it to, all in one modal." | `POST /tags { name, todoIds }` |
| **B — Replace full set** | `set` | "I open a todo, see a checklist of tags, check/uncheck some, hit Save — final state replaces old state." | `PUT /todos/:id/tags { tagIds }` |
| **C — Incremental attach/detach** | `connect` / `disconnect` (single) | "I click the × on one tag chip, or + Add tag on one dropdown item — each click is its own instant action." | `POST /todos/:id/tags/:tagId` + `DELETE /todos/:id/tags/:tagId` |

**To-do (manual):**
- [ ] Decide which of case A/B/C fits your UI (can be more than one).
- [ ] Add `todoIds`/`tagIds` to a `*.schemas.extended.ts` file for whichever endpoints need it.
- [ ] Write the repository method (or rely on `sync_m2m_methods.ts`-generated `set/connect/disconnect` methods once built).
- [ ] Write the service method calling the repository method.
- [ ] Write the controller + route for the chosen case.
- [ ] **Transaction check:** if create + connect happens in one request and could partially fail, still generally safe as a single Prisma `update`/`create` call (Prisma wraps nested writes in one query) — explicit `runInTransaction` only needed if you're composing multiple separate repository calls (e.g. create Tag via one repo, then connect via another).

---

## 4. Cascade Behavior

**Not scripted — written directly in `schema.prisma` at model-creation time, as a conscious decision.**

```prisma
model Comment {
  todoId String
  todo   Todo   @relation(fields: [todoId], references: [id], onDelete: Cascade)
}
```

This is a **database-level constraint** compiled into the migration SQL. No application code changes needed — `BaseRepository.delete()` stays exactly as-is; Postgres handles cascading deletes itself as part of the same DB transaction.

**Options:**
- `Cascade` — deleting the parent deletes the children too (e.g. delete `Todo` → delete its `Comments`)
- `Restrict` (default if unset) — delete fails with a DB error if children exist
- `SetNull` — children's FK becomes null (requires the FK field to be optional: `todoId String?`)

**Why not automated:** two structurally identical relations can need opposite cascade behavior depending on product rules (e.g. `Comment→Todo` probably wants `Cascade`, but `Todo→User` probably wants `Restrict` so you don't accidentally wipe a user's todos). A generator can't infer intent from shape alone, and guessing wrong on a destructive operation is dangerous.

**To-do per relation:**
- [ ] Decide cascade behavior explicitly when writing the schema — don't leave it to the default without thinking about it.
- [ ] If `SetNull`, remember to make the FK field optional (`String?`), which also makes the TS type optional automatically after `sync_types`.
- [ ] *(Optional tooling, not built yet)*: a checker script (like `analytics_scripts/check-srp.ts` etc.) that flags every FK relation with no explicit `onDelete` set, so you're forced to notice and confirm rather than silently accept the default. Worth building only as a linter/reporter — never as something that auto-writes cascade rules.

---

## 5. Transactions

**Applies to any relation type** — not just one-to-one. The real trigger condition:

> Does a single API request write to more than one table, where a partial failure would leave inconsistent data?

Examples across all relation types:
- 1:1 — `POST /users` that also creates a `Profile`
- 1:many — `POST /todos` that also creates initial `Comments`
- M2M — creating a `Tag` and connecting it via a separate repository call (not needed if it's one Prisma nested-write call)

**Not scripted — written directly in the relevant service file, as a new method, following the pattern already commented in `todo.service.ts`.** No separate file, no separate test file — add methods/tests to the existing service and its existing test file.

```ts
// e.g. added to todo.service.ts
async createWithComments(data: CreateTodoInput, comments: string[]): Promise<Todo> {
  if (!this.transactionManager) throw new AppError('Transaction manager not available', 500);

  return this.transactionManager.runInTransaction(async (txDb) => {
    const todoRepo = new TodoRepository(txDb.todo, this.cacheManager.getCacheService());
    const commentRepo = new CommentRepository(txDb.comment, this.cacheManager.getCacheService());

    const todo = await todoRepo.create(data);
    await Promise.all(comments.map(body => commentRepo.create({ ...body, todoId: todo.id })));
    return todo;
  });
}
```

Tests: add to the existing `todo.service.test.ts` (unit — mock `transactionManager.runInTransaction` exactly as the existing `beforeEach` already does) and `todo.integration.test.ts` (integration — hit the real endpoint, verify both rows landed).

**Why not scripted:** requires knowing which specific API endpoints compose multi-table writes — that's product/API design, not derivable from schema shape.

**To-do per multi-table-write endpoint:**
- [ ] Identify if the endpoint writes to 2+ tables.
- [ ] If yes, wrap the composed calls in `this.transactionManager.runInTransaction(...)`.
- [ ] Add a unit test mocking `runInTransaction`.
- [ ] Add/extend an integration test verifying both records exist after the call.

---

## 6. Many-to-Many Method Generation (`sync_m2m_methods.ts`)

Automating M2M `connect`/`disconnect`/`set` boilerplate became viable **only after centralizing Prisma-specific syntax into an adapter** (see §7.2). Before that, connect/disconnect/set objects varied too much to template safely by string-regex.

**Plan:**
- New script `scripts/generator_scripts/sync_m2m_methods.ts`, same style/guard pattern as `sync_types.ts`/`sync_schemas.ts` (only touches modules whose folder already exists).
- Detects M2M fields: `isRelation && isList && !isForeignKey`.
- Generates `set<Field>` / `connect<Field>` / `disconnect<Field>` methods on the repository, delegating to the relation adapter — wrapped between idempotency marker comments so re-runs don't duplicate and stale methods (for removed relations) get cleaned up automatically.
- Does **not** generate schema fields, controller endpoints, or routes — those stay manual (see §3.4).

Run it as part of the standard sync step after every schema change (§2, step 4).

---

## 7. Performance & Coupling Considerations

### 7.1 N+1 vs. Over-fetching

These are opposite problems, both relevant here:

- **N+1** (bad, avoided by `include`): fetching a list of 50 `Todo`s, then issuing 50 more queries to hydrate each one's `.user` individually. Prisma's `include` collapses this into a single JOIN query — this is what the generator already does.
- **Over-fetching** (the actual risk in this codebase): the generator eagerly includes relations on **every** `findMany`/`findUnique` for a given repository, regardless of whether that endpoint needs it. E.g. `GET /api/users` pulling every user's full `todos` array even on a simple list view.

**To-do per repository method after scaffolding:**
- [ ] Review whether `findAllLatest` (list views) needs the same `include` as `findById` (detail views) — trim the list view's relations if not needed.
- [ ] Be extra cautious with nested relations (`Todo → Comment → User`) — a naive `include` chain can pull large portions of the database on a single request.

### 7.2 Full Layer-3 Centralization (Prisma syntax isolation)

**Problem:** `IDbClient<T>`'s methods (`findMany`, `findUnique`, `create`, `update`, `delete`) are Prisma-flavored *names*, but low risk — every ORM has equivalents. The real coupling risk is the **payload shapes**: `include: {...}`, `connect: [...]`, `set: [...]`, `disconnect: [...]` — these are Prisma-specific object structures, and previously they were hand-written directly inside each repository file.

**Solution — `src/infrastructure/relation-adapter.ts`:**
```ts
export interface IRelationAdapter<T> {
  findManyWithRelations(where, relations: string[]): Promise<T[]>;
  findUniqueWithRelations(id: string, relations: string[]): Promise<T | null>;
  connectRelation(id: string, relationField: string, relatedIds: string[]): Promise<T>;
  disconnectRelation(id: string, relationField: string, relatedIds: string[]): Promise<T>;
  setRelation(id: string, relationField: string, relatedIds: string[]): Promise<T>;
}
export class PrismaRelationAdapter<T> implements IRelationAdapter<T> { /* ... */ }
```
Repositories depend on `IRelationAdapter<T>` (injected via constructor), never on raw Prisma syntax. This mirrors the existing pattern in `db.ts`/`cache.ts` — "one file boundary, swap it, done."

**To swap ORMs (e.g. Drizzle):** only write a new `DrizzleRelationAdapter<T>` implementing the same interface. No repository, service, controller, or test changes needed — as long as the discipline holds that connect/disconnect/set logic is only ever constructed **inside the repository layer** (via the adapter), never inside the service or controller.

**Coupling rule to maintain going forward:** if you ever find yourself building a `{ connect: [...] }` or `{ set: [...] }` object outside of a Repository/Adapter file, stop — that logic belongs in the adapter or the repository method that calls it, never in a service.

---

## 8. Factory Functions Reference (per model)

Generated by `sync_factories.ts`. Four base functions + one relation-aware function when relations exist:

| Function | Shape returned | Used for |
|---|---|---|
| `build<Model>(overrides?)` | Full domain object, relation fields **omitted** | Mocking DB reads in unit tests (`mockDbClient.findUnique.mockResolvedValue(buildTodo())`) |
| `build<Model>List(count, overrides?)` | Array of the above | Mocking multi-row reads (`findMany`, pagination tests) |
| `buildCreate<Model>Payload(overrides?)` | Only writable/POST-body fields (FK scalars included, relation objects excluded) | Integration test request bodies (`POST` payloads) |
| `buildUpdate<Model>Payload(overrides?)` | Partial diff — only what you pass in, no defaults | Integration test `PUT`/`PATCH` payloads |
| `build<Model>WithRelations(overrides?, relations?)` | Full object **with** relation data attached (single object for 1:1/1:many-inverse-owning-side, or list for M2M/inverse-list side) | Tests verifying nested-data serialization/handling |

---

## 9. Quick Reference Table

| | No relation | One-to-One | One-to-Many | Many-to-Many |
|---|---|---|---|---|
| FK scalar? | none | yes, `@unique` | yes, no `@unique` | none |
| Repository reads via adapter `include`? | no | yes | yes | yes |
| Write methods (`connect`/`disconnect`/`set`) generated? | n/a | no (FK write handled by normal `create`/`update`) | no (same) | yes, via `sync_m2m_methods.ts` |
| Create schema includes FK/IDs automatically? | n/a | yes, required | yes, required | **no — manual, via `.schemas.extended.ts`** |
| Cascade behavior | n/a | decide in schema (`onDelete`) | decide in schema | decide in schema (rare, join table usually cascades by default) |
| Transaction needed? | no | only if create endpoint spans 2 tables | only if create endpoint spans 2 tables | only if composing multiple separate repo calls |
| Controller/routes for relation mutation | n/a | not needed (FK set via normal update) | not needed (FK set via normal update) | manual — depends on case A/B/C chosen |

---

## 10. Golden Rules Summary

1. **Always name FK scalars `<relationFieldName>Id`** — the single convention every generator script depends on.
2. **Generators automate what's derivable purely from schema shape** (types, base CRUD schemas, `include`/adapter wiring, factories). They deliberately do **not** automate things that require knowing intended API/UX behavior: cascade rules, transaction boundaries, and M2M endpoint shape (connect vs. set vs. incremental).
3. **All Prisma-specific payload construction lives in the repository layer** (via `IRelationAdapter<T>` or direct `IDbClient<T>` calls) — never in services or controllers. This is what keeps ORM swaps contained to `infrastructure/`.
4. **Re-run all `sync_*` scripts after every schema change**, not just for the model you touched — relations update types/schemas/factories on *both* sides of the relationship.
5. **Review generated `include`/adapter calls for over-fetching** before shipping — the generator defaults to eager-including everything, which is safe but not always performant.
