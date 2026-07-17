import { AppDb } from './db';
import { ITransactionManager } from '../utils/transaction-manager';

/**
 * Prisma implementation of the Transaction Manager.
 * Keeps Prisma-specific transaction logic isolated in the infrastructure layer.
 */
export class PrismaTransactionManager implements ITransactionManager<AppDb> {
  constructor(private db: AppDb) {}

  async runInTransaction<T>(fn: (txClient: AppDb) => Promise<T>): Promise<T> {
    return this.db.$transaction(async (tx) => {
      // Cast the Prisma transaction client back to AppDb for compatibility
      // with repositories that expect AppDb (the full client shape).
      return fn(tx as AppDb);
    });
  }
}
