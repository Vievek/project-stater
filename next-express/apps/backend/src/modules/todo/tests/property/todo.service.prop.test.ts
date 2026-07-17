import { TodoService } from '../../todo.service';
import { TodoRepository } from '../../todo.repository';
import { ICacheService } from '../../../../utils/cache-manager';
import { ITransactionManager } from '../../../../utils/transaction-manager';
import { buildTodoList } from '../factories/todo.factory';
import fc from 'fast-check';

describe('TodoService (Property Tests)', () => {
  let mockRepository: Partial<TodoRepository>;
  let mockCacheService: ICacheService;
  let mockTxManager: Partial<ITransactionManager>;
  let service: TodoService;

  beforeEach(() => {
    mockRepository = {
      findAllLatest: jest.fn(),
    };

    mockCacheService = {
      getOrSet: jest.fn().mockImplementation((key, fetcher) => fetcher()),
      delPattern: jest.fn(),
    };

    mockTxManager = {
      runInTransaction: jest.fn().mockImplementation((callback) => callback({})),
    };

    service = new TodoService(
      mockRepository as TodoRepository,
      mockCacheService,
      mockTxManager as ITransactionManager
    );
  });

  describe('getTodoSummary', () => {
    it('should calculate summary and cache the result (fast-check edge cases)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 100 }), 
          fc.integer({ min: 0, max: 100 }), 
          async (total, completed) => {
            const actualCompleted = Math.min(completed, total);
            const todos = buildTodoList(total).map((t, idx) => ({ ...t, completed: idx < actualCompleted }));
            
            (mockRepository.findAllLatest as jest.Mock).mockResolvedValue(todos);
            
            const result = await service.getTodoSummary();
            
            expect(result).toEqual({ total, completed: actualCompleted });
            expect(mockCacheService.getOrSet).toHaveBeenCalledWith('todo:svc:summary', expect.any(Function), 120);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
