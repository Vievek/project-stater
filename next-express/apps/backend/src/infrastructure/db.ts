/**
 * Database infrastructure adapter — Prisma swap point.
 *
 * This is the ONLY file that imports from @prisma/client or config/postgres.
 * To swap the ORM, replace the import and the exported `db` value here.
 * No other file outside `src/infrastructure/` or `src/config/` touches Prisma.
 */
import { prisma } from '../config/postgres';

export const db = prisma;

/** The shape of the database client passed to module factories. */
export type AppDb = typeof db;
