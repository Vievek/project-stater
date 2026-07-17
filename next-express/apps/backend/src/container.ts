/**
 * Composition root — wires infrastructure with the module registry.
 *
 * OCP: This file never changes when you add new modules or swap infrastructure.
 * - Adding modules  → edit `modules/registry.ts`
 * - Swapping Prisma → edit `infrastructure/db.ts`
 * - Swapping Redis  → edit `infrastructure/cache.ts`
 */
import { db }            from './infrastructure/db';
import { cacheService }  from './infrastructure/cache';
import { PrismaTransactionManager } from './infrastructure/transaction-manager';
import { moduleFactories } from './modules/registry';

const transactionManager = new PrismaTransactionManager(db);
const deps = { db, cacheService, transactionManager };

export const modules = moduleFactories.map(factory => factory(deps));
