import { TodoRepository } from './todo.repository';
import { Todo } from './todo.types';
import { BaseService } from '../../base-classes/base.service';
import { QueryOptions } from '../../utils/query-builder';
import { CacheManager, ICacheService } from '../../utils/cache-manager';
import { ITransactionManager } from '../../utils/transaction-manager';
import { logger } from '../../utils/logger';
import { UserRepository } from "../user/user.repository";

export class TodoService extends BaseService<Todo, TodoRepository> {
  private cacheManager: CacheManager;

  constructor(
    repository: TodoRepository, private readonly userRepository: UserRepository, cacheService?: ICacheService,
    private transactionManager?: ITransactionManager
  ) {
    super(repository);
    // Example of using CacheManager in the service layer
    // By using 'todo' as the prefix (same as the repository), 
    // it will be automatically invalidated when DB mutations happen!
    this.cacheManager = new CacheManager('todo', { needCache: true, ttlSeconds: 120 }, cacheService);
  }
  // Overriding getAll to use the custom repository method
  async getAll(options?: QueryOptions): Promise<Todo[]> {
    logger.info(`[${this.constructor.name}.getAll] Fetching all latest`, { options });
    return this.repository.findAllLatest(options);
  }

  /*
   * EXAMPLE: Using the Transaction Manager
   * 
   * This demonstrates how to adhere to the Open-Closed Principle (OCP).
   * By using `this.transactionManager`, the service layer remains unaware
   * that it's using Prisma under the hood. 
   * 
   * async executeComplexBusinessLogic(data: CreateTodoInput): Promise<void> {
   *   if (!this.transactionManager) throw new AppError('Transaction manager not available', 500);
   * 
   *   await this.transactionManager.runInTransaction(async (txDb) => {
   *     // Inside the transaction, instantiate repositories with the transactional db client `txDb`
   *     const txRepo = new TodoRepository(txDb.todo, this.cacheManager.getCacheService());
   *     
   *     // Perform multiple coordinated operations atomically
   *     const todo = await txRepo.create(data);
   *     await txRepo.update(todo.id, { completed: true });
   *   });
   * }
   */

  // Example of caching a complex computation or aggregation in the service layer
  async getTodoSummary(): Promise<{ total: number }> {
    logger.info(`[${this.constructor.name}.getTodoSummary] Fetching summary`);
    return this.cacheManager.withCache('svc:summary', undefined, async () => {
      const all = await this.getAll();
      return {
        total: all.length,
      };
    });
  }

    async create(data: any): Promise<Todo> {

            if (data.userId) {
                const relatedRecord = await this.userRepository.findById(data.userId);
                if (!relatedRecord) {
                    throw new Error("User not found");
                }
            }
            return super.create(data);
    }

    async update(id: string, data: any, notFoundMessage?: string): Promise<Todo> {

            if (data.userId) {
                const relatedRecord = await this.userRepository.findById(data.userId);
                if (!relatedRecord) {
                    throw new Error("User not found");
                }
            }
            return super.update(id, data, notFoundMessage);
    }
}
