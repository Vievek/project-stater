/**
 * OCP compliant Transaction Manager Interface.
 * The core application depends on this interface, not the specific ORM implementation (e.g., Prisma).
 */
export interface ITransactionManager<TDbClient = any> {
  /**
   * Executes a callback within a database transaction.
   * @param fn The callback to execute with the transaction-bound database client.
   */
  runInTransaction<T>(fn: (txClient: TDbClient) => Promise<T>): Promise<T>;
}
