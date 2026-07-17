/**
 * Composition root — wires infrastructure with the module registry.
 *
 * OCP: This file never changes when you add new modules or swap infrastructure.
 * - Adding modules      → edit `modules/registry.ts`
 * - Swapping Prisma     → edit `infrastructure/db.ts`
 * - Swapping Redis      → edit `infrastructure/cache.ts`
 * - Swapping JWT/tokens → edit `infrastructure/token-provider.ts` (new class)
 *                         and replace `JwtTokenProvider` on the line below.
 */
import { db }                  from './infrastructure/db';
import { cacheService }        from './infrastructure/cache';
import { PrismaTransactionManager } from './infrastructure/transaction-manager';
import { JwtTokenProvider }    from './infrastructure/token-provider';
import { moduleFactories }     from './modules/registry';

const transactionManager = new PrismaTransactionManager(db);
const tokenProvider      = new JwtTokenProvider();
const deps = { db, cacheService, transactionManager, tokenProvider };

export const modules = moduleFactories.map(factory => factory(deps));
