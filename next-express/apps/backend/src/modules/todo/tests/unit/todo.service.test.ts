import { TodoService } from '../../todo.service';
import { TodoRepository } from '../../todo.repository';
import { ICacheService } from '../../../../utils/cache-manager';
import { ITransactionManager } from '../../../../utils/transaction-manager';
import { buildTodoList } from '../factories/todo.factory';

describe('TodoService (Unit)', () => {
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

  describe('getAll', () => {
    test.each([
      { page: 1, pageSize: 10, todosCount: 2 },
      { page: 2, pageSize: 5, todosCount: 5 },
      { page: 1, pageSize: 0, todosCount: 0 },
    ])('should delegate to repository.findAllLatest with %j', async ({ page, pageSize, todosCount }) => {
      const mockTodos = buildTodoList(todosCount);
      (mockRepository.findAllLatest as jest.Mock).mockResolvedValue(mockTodos);

      const result = await service.getAll({ pagination: { page, pageSize } });
      
      expect(result).toHaveLength(todosCount);
      expect(mockRepository.findAllLatest).toHaveBeenCalledWith({ pagination: { page, pageSize } });
    });
  });
});
