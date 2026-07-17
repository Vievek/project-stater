# Next Express Modular Monolith

This is a modern full-stack application leveraging the power of Next.js and Express in a modular monolithic architecture, conforming to SOLID principles across the stack.

## Tech Stack

### Backend
- **Framework**: Express.js (TypeScript)
- **Database ORM**: Prisma (PostgreSQL)
- **Validation**: Zod
- **Logging**: Winston with Request UUID tracking via `AsyncLocalStorage`
- **Testing**: Jest + Supertest

### Frontend
- **Framework**: Next.js (App Router, TypeScript)
- **Styling**: Tailwind CSS + shadcn/ui
- **Architecture**: Adapter Pattern for API calls

### Infrastructure
- Docker (PostgreSQL, Redis)
- `pnpm` Workspaces

## Setup Instructions

1. Ensure Docker is running.
2. Run `docker-compose up -d` at the root to start PostgreSQL and Redis.
3. In `apps/backend/.env`, set `DATABASE_URL="postgresql://user:password@localhost:5432/nextexpress?schema=public"`
4. Run `pnpm install` from the root directory to install all dependencies.
5. In `apps/backend`, run `npx prisma db push` (or `migrate dev`) to sync the database schema.
6. Start the development server by running `pnpm run dev` in the root.

## Documentation
Please refer to the `docs/rules/` directory for strict development guidelines, styling rules, and architectural patterns.
