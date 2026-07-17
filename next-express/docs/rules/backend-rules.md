# Backend Rules

## Architecture: Modular Monolith
All backend code is organized into feature modules under `src/modules`. Each module contains its controller, service, repository, routes, and schemas.

## DRY Foundations & Base Classes
To avoid boilerplate, all generic CRUD operations are implemented in `src/base-classes/`.

- **BaseController**: Provides `getAll`, `getById`, `create`, `update`, `delete` wrapped in `asyncHandler`. Concrete controllers extend this and only override methods when they need non-standard behaviour.
- **BaseService**: Provides business logic for the CRUD operations. Concrete services extend this and override methods.
- **BaseRepository**: Provides standard DB operations. Concrete repositories add custom query methods (e.g., `findAllLatest`).
- **BaseRoutes**: Use `createBaseRouter(controller, schemas)` to automatically wire the standard CRUD endpoints with their respective validation schemas.
- **Shared Schemas**: Use `idParamSchema` and `paginationSchema` from `src/shared/schemas.ts` instead of redefining them in every module.

## Dependency Injection / Layer Boundaries

- **Controller**: Handles HTTP request parsing and response formatting ONLY. NEVER contains business logic. Injects and calls the **Service** layer. MUST use the central `winston` logger for incoming requests (if custom logging beyond HTTP logger is needed).
- **Service**: Contains all business logic (e.g., "if todo not found, throw 404"). NEVER interacts directly with the database. Injects and calls the **Repository** layer. MUST use the central `winston` logger for all major business events and errors.
- **Repository**: Contains all database queries. MUST extend `BaseRepository<T>`.

### Repository Rules
- All repositories MUST extend `BaseRepository<T>`.
- All repositories MUST inject their DB client (e.g., Prisma model delegate) via constructor. NEVER import `prisma` directly inside a repository.
- All repositories MUST inject a `ICacheService` when `needCache: true`.
- Cache key prefix defaults to the model name; set in the constructor via `super(db, modelName, cacheOpts, cacheService)`.
- Use `updateOrThrow` and `deleteOrThrow` provided by `BaseRepository` instead of writing custom existence checks.
- Custom queries (e.g., different sorting, filtering) are added as explicitly named methods on the concrete repository. Each custom method that needs caching MUST call `this.cacheManager.withCache('uniqueKey', ...)`.
- To bypass caching for a specific custom method, call `this.db` directly instead of using `this.cacheManager.withCache`.

### Wiring (Module factory file)
Each module's factory file (`<name>.module.ts`) is responsible for:
1. Instantiating the repository: `new PostRepository(deps.db.post, deps.cacheService)`
2. Instantiating the service: `new PostService(repository, deps.cacheService, deps.transactionManager)`
3. Instantiating the controller: `new PostController(service)`
4. Creating the router: `createPostRouter(controller)`
5. Returning `{ prefix: '/api/posts', router }` so `registry.ts` can mount it.

---

## Generator Scripts & Code Generation

All generator scripts live in `scripts/generator_scripts/`. Run them with:

```
pnpm run generate       # scaffold a new module for every new Prisma model
pnpm run sync-types     # regenerate *.types.ts from schema
pnpm run sync-schemas   # regenerate *.schemas.ts (Zod) from schema
pnpm run sync-factories # regenerate *.factory.ts from schema
pnpm run sync           # all four in sequence (recommended after any schema change)
```

### Two-pass pipeline

| Script | Purpose | Run when |
|---|---|---|
| `generate_module` | One-time scaffold of all module files | New model added to schema |
| `sync_types` | Keeps `*.types.ts` in sync | Any field change |
| `sync_schemas` | Keeps `*.schemas.ts` (Zod) in sync | Any field change |
| `sync_factories` | Keeps `*.factory.ts` in sync | Any field change |

> **Rule**: `generate_module` runs once per model and never overwrites an existing folder.
> The three `sync_*` scripts are idempotent and safe to re-run at any time.

---

## Model Relationships

Prisma relationships require specific handling in every layer.  The sections
below describe the exact pattern for each relationship type.

### How the schema parser categorises fields

Every field in a Prisma model is classified into one of three categories:

| Category | `isRelation` | `isForeignKey` | Example |
|---|---|---|---|
| Plain scalar | `false` | `false` | `title String`, `completed Boolean` |
| FK scalar | `false` | `true` | `authorId String` (backs `author User`) |
| Relation object | `true` | `false` | `author User`, `posts Post[]` |

---

### One-to-One

**Prisma schema example** — `User` owns one `Profile`:

```prisma
model User {
  id        String   @id @default(uuid())
  profile   Profile?          // ← relation object (inverse side, no FK here)
}

model Profile {
  id        String   @id @default(uuid())
  userId    String   @unique   // ← FK scalar  (isForeignKey: true)
  user      User               // ← relation object (owning side)
  bio       String?
}
```

**Domain types** (`sync_types`):
- `Profile.userId: string` — FK scalar, always required (no `?`).
- `Profile.user?: User` — relation object, always optional (only present with `include`).
- `User.profile?: Profile` — relation object on the inverse side, always optional.
- Cross-module import added automatically: `import { User } from '../user/user.types'`.

**Zod schemas** (`sync_schemas`):
- `createProfileSchema` includes `userId: z.string().uuid()` (FK scalar is required on create).
- `createUserSchema` does NOT include `profile` (relation objects are excluded).

**Repository** (`generate_module` patch):
- `ProfileRepository.findById` → `findUnique({ where: { id }, include: { user: true } })`
- `ProfileRepository.findAll` → `findMany({ include: { user: true } })`
- `UserRepository` — no `include` patch unless `User` also has relations worth eager-loading.

**Module factory** (`generate_module` patch):
- Profile module gets `deps.db.user` wired in case the repository needs cross-table queries:
  `new ProfileRepository(deps.db.profile, deps.db.user, deps.cacheService)`

**Test factory** (`sync_factories`):
- `buildProfile()` — plain object, no nested `user`.
- `buildProfileWithRelations({}, { user: buildUser() })` — generated when relations exist.

---

### One-to-Many

**Prisma schema example** — `User` has many `Posts`:

```prisma
model User {
  id    String  @id @default(uuid())
  posts Post[]          // ← relation object (inverse/one side)
}

model Post {
  id       String  @id @default(uuid())
  authorId String          // ← FK scalar (isForeignKey: true, relatedModel: 'User')
  author   User            // ← relation object (owning/many side)
  title    String
}
```

**Domain types** (`sync_types`):
- `Post.authorId: string` — FK scalar, emitted with JSDoc `/** Foreign key referencing User.id */`.
- `Post.author?: User` — relation object, always optional.
- `User.posts?: Post[]` — list relation, always optional.

**Zod schemas** (`sync_schemas`):
- `createPostSchema` includes `authorId: z.string().uuid()` — the client must supply the parent id.
- `createUserSchema` does NOT include `posts` — the list relation is never sent in a request body.
- `updatePostSchema` also allows updating `authorId` (re-assigning to a different user).

**Repository** (`generate_module` patch):
- `PostRepository.findById` → `findUnique({ where: { id }, include: { author: true } })`
- `PostRepository.findAll` → `findMany({ include: { author: true } })`
- `UserRepository` gets `include: { posts: true }` if you want to eager-load posts.
  By default the generator only patches the owning side; add `include` to `UserRepository`
  manually if your use-case requires it.

**Module factory** (`generate_module` patch):
- `Post` module gets `deps.db.user` wired: `new PostRepository(deps.db.post, deps.db.user, deps.cacheService)`.

**Test factory** (`sync_factories`):
- `buildPost()` — plain object including `authorId: 'user-id-1'` (deterministic FK placeholder).
- `buildPostWithRelations({}, { author: buildUser() })` — nest a full `User` when needed.

---

### Many-to-Many

**Prisma schema example** — `Post` ↔ `Tag` (implicit join table):

```prisma
model Post {
  id   String  @id @default(uuid())
  tags Tag[]           // ← list relation (no FK scalar on this side)
  title String
}

model Tag {
  id    String  @id @default(uuid())
  posts Post[]          // ← list relation (no FK scalar on this side)
  name  String
}
```

**Domain types** (`sync_types`):
- `Post.tags?: Tag[]` — list relation, always optional.
- `Tag.posts?: Post[]` — list relation, always optional.
- Cross-module imports added on both sides.

**Zod schemas** (`sync_schemas`):
- `createPostSchema` does NOT include `tags` — Prisma requires a `connect` payload
  (`{ tags: { connect: [{ id: '…' }] } }`), not a raw id array.
- If you need to accept `tagIds: string[]` in the API, extend the generated schema:

  ```typescript
  // post.schemas.extended.ts  (never touched by the generator)
  import { createPostSchema } from './post.schemas';
  export const createPostWithTagsSchema = createPostSchema.extend({
    tagIds: z.array(z.string().uuid()).optional(),
  });
  ```

  The service layer is then responsible for converting `tagIds` to the Prisma
  `connect` format before calling the repository.

**Repository** (`generate_module` patch):
- `PostRepository.findById` → `findUnique({ where: { id }, include: { tags: true } })`
- `PostRepository.findAll` → `findMany({ include: { tags: true } })`
- `TagRepository` is patched symmetrically.

**Module factory** — no extra DB clients wired (neither side holds an explicit FK).

**Test factory** (`sync_factories`):
- `buildPost()` — plain object, no `tags`.
- `buildPostWithRelations({}, { tags: buildTagList(2) })` — list relation helper.

---

### Relationship Rules Summary

| Rule | Rationale |
|---|---|
| Relation objects are ALWAYS `?` on domain interfaces | Only present when Prisma `include` is used |
| FK scalars appear in create/update schemas | Caller must supply the parent id |
| Relation objects are EXCLUDED from schemas | Prisma does not accept nested objects in plain payloads |
| `buildXxx()` never includes relation fields | Keeps factories simple and predictable |
| Use `buildXxxWithRelations()` in tests needing nested data | Separation of plain vs. relational test scenarios |
| Many-to-many connect logic lives in the Service layer | Only the service knows about the `connect` format |
| NEVER put `connect`/`disconnect` logic in the Controller | Controller only passes request body to service |

---

## Logging and Request Tracking
- All logs MUST be written using the centralized `winston` logger (`src/utils/logger.ts`). This applies strictly across ALL layers (Controllers, Services, Repositories).
- NEVER use `console.log`.
- Every incoming request generates a UUID (in middleware).
- The UUID is passed through via `AsyncLocalStorage` and automatically appended to all Winston logs. Do NOT pass the `reqId` as a function parameter manually.
- HTTP Request Logging is handled globally via the `httpLogger` middleware (`src/middlewares/http-logger.ts`). It logs the method, path, status, and duration at the end of each request.
- Within Services, log important business domain events using `logger.info()` or `logger.warn()`.
- Within Repositories, do not log normal query successes, but you may log critical database-level exceptions or slow queries.

## Caching (Redis)
- Use `ioredis` for all caching operations via `RedisService` (`src/services/redis.service.ts`).
- Caching logic is managed via the reusable `CacheManager` (`src/utils/cache-manager.ts`).
- `BaseRepository` automatically instantiates a `CacheManager` for standard CRUD operations. Custom repository methods must use `this.cacheManager.withCache('uniqueKey', ...)` for caching.
- Caching can be utilized at higher levels (Services, Controllers) by instantiating `CacheManager`. Pass `cacheService` down from the module factory (`deps.cacheService`) to your service constructor.
- ALWAYS set a TTL when storing data in Redis to prevent memory leaks.
- `RedisService` implements `ICacheService` and is injected wherever caching is needed.

## Error Handling
- Do not handle errors with `try/catch` and manual `res.status(500)` in controllers.
- ALL controller methods must be wrapped in `asyncHandler` (`src/utils/asyncHandler.ts`) to automatically catch exceptions and forward them to `next(err)`.
- Pass errors using `next(err)` to the global error handler middleware.
- Throw custom `AppError` instances from the **Service** or **Repository** layer (e.g., `throw new AppError('Todo not found', 404)`).

## Centralized API Response Format
- ALL API responses MUST be formatted using the `ApiResponse` utility (`src/utils/ApiResponse.ts`).
- **Success**: `res.status(200).json(ApiResponse.success(data, 'Optional message'));`
- **Error**: `res.status(400).json(ApiResponse.error('Error message'));`

## Validation and Sanitization (Zod)
- Each module MUST contain a `[name].schemas.ts` file containing Zod schemas for all request payloads.
- Schemas are namespaced by operation: `createTodoSchema`, `updateTodoSchema`, `getTodoSchema`, `deleteTodoSchema`.
- For `id` parameter validation, use the shared `idParamSchema`.
- For pagination query validation, use the shared `paginationSchema`.
- Use the `validate` middleware (`src/middlewares/validate.ts`) in the router to automatically validate and sanitize incoming requests before they reach the controller.
- Inferred Zod types (e.g., `CreateTodoInput`) are exported from the schema file and used in the service method signatures.
- Zod handles stripping unknown fields, providing our primary layer of input sanitization.
- Schemas are regenerated by `sync_schemas.ts` — to add custom validators that survive regeneration, create a `[name].schemas.extended.ts` alongside and import from there.

## Pagination Conventions
- `findAll` and list operations accept a `PaginationOptions` argument (`{ page, pageSize }`).
- This translates to Prisma's `skip` and `take` (`skip = (page - 1) * pageSize`).
- Responses are typically encapsulated within standard API responses (`ApiResponse.success(items)`).

## Database
- Prisma schema (`prisma/schema.prisma`) must explicitly load the `DATABASE_URL` via `env("DATABASE_URL")` for the datasource.

## File Naming
- Controllers: `[name].controller.ts`
- Services: `[name].service.ts`
- Repositories: `[name].repository.ts`
- Routes: `[name].routes.ts`
- Schemas: `[name].schemas.ts`
- Schema extensions (custom, not overwritten): `[name].schemas.extended.ts`
- Module Factory: `[name].module.ts`
