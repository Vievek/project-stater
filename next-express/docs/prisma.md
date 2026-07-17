# Prisma Setup and Usage Guide

This document outlines the setup and standard operating procedures for using Prisma in our backend.

## 1. Schema Definition
The Prisma schema is located at `apps/backend/prisma/schema.prisma`. 
All models should be defined here. 
Ensure `DATABASE_URL` is used from the environment.

```prisma
datasource db {
  provider = "postgresql" // or your specific provider
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

## 2. Generating the Prisma Client
After making changes to the schema, you must generate the client:
```bash
npx prisma generate
# or
pnpm prisma generate
```

## 3. Migrations
When you modify the schema and want to persist it to the database, create a migration:
```bash
npx prisma migrate dev --name your_migration_name
```
For production deployments, apply migrations using:
```bash
npx prisma migrate deploy
```

## 4. Seeding Data
Seed scripts are located at `apps/backend/prisma/seed.ts`. 
To run the seed script, ensure your `package.json` has a prisma seed configuration or run it directly:
```bash
npx prisma db seed
```

## 5. Abstraction Rules
- **Do NOT** use `prisma` directly in Controllers or Services.
- **Do NOT** expose Prisma types (like `Prisma.TodoCreateInput`) to the domain. Use custom domain types inside `[name].types.ts` to keep the application decoupled from the ORM.
- Repositories are the only layer allowed to directly interface with Prisma delegates. All repositories MUST extend the `BaseRepository` class which encapsulates standard Prisma queries.
