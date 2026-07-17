import { TodoRepository } from '../../todo.repository';
import { IDbClient, ICacheService } from '../../../../base-classes/base.repository';
import { buildTodo, buildTodoList } from '../factories/todo.factory';

/**
 * TodoRepository Unit Tests
 *
 * NOTE: When this module has relation fields, `generate_module` patches the
 * repository to pass `include: { … }` into `findUnique` and `findMany` calls.
 * The assertions below use `expect.objectContaining` so they remain valid
 * both for plain models and for models with relations.
 */
describe('TodoRepository (Unit)', () => {
  let mockDbClient: IDbClient<any>;
  let mockCacheService: ICacheService;
  let repository: TodoRepository;

  beforeEach(() => {
    mockDbClient = {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    mockCacheService = {
      getOrSet: jest.fn().mockImplementation((key, fetcher) => fetcher()),
      delPattern: jest.fn(),
    };

    repository = new TodoRepository(mockDbClient, mockCacheService);
  });

  describe('findById', () => {
    it('should fetch from db and cache with custom 30s TTL', async () => {
      const mockTodo = buildTodo({ id: '1' });
      (mockDbClient.findUnique as jest.Mock).mockResolvedValue(mockTodo);

      const result = await repository.findById('1');
      
      expect(result).toEqual(mockTodo);
      expect(mockCacheService.getOrSet).toHaveBeenCalledWith(
        'todo:repo:findById:1',
        expect.any(Function),
        30,
      );
      // Use objectContaining so the assertion is valid both for plain models
      // (no include) and for models with relations (include: { … } injected
      // by generate_module at scaffold time).
      expect(mockDbClient.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: '1' } }),
      );
    });
  });

  describe('findAllLatest', () => {
    test.each([
      { page: undefined, pageSize: undefined, expectedSkip: undefined, expectedTake: undefined },
      { page: 2, pageSize: 10, expectedSkip: 10, expectedTake: 10 },
      { page: 3, pageSize: 5, expectedSkip: 10, expectedTake: 5 },
    ])('should fetch all latest with pagination options %j', async ({ page, pageSize, expectedSkip, expectedTake }) => {
      const mockTodos = buildTodoList(3);
      (mockDbClient.findMany as jest.Mock).mockResolvedValue(mockTodos);

      await repository.findAllLatest(page ? { pagination: { page, pageSize } } : undefined);
      
      const expectedCacheKey = page
        ? `todo:repo:findAllLatest:${JSON.stringify({ pagination: { page, pageSize } })}`
        : 'todo:repo:findAllLatest';
      expect(mockCacheService.getOrSet).toHaveBeenCalledWith(
        expectedCacheKey,
        expect.any(Function),
        60,
      );

      // Use objectContaining so skip/take assertions pass whether or not
      // the generated repo also includes an `include` clause.
      if (expectedSkip !== undefined) {
        expect(mockDbClient.findMany).toHaveBeenCalledWith(
          expect.objectContaining({ skip: expectedSkip, take: expectedTake }),
        );
      } else {
        // No pagination — called with only an include clause (if any) or nothing.
        // We just verify it was called.
        expect(mockDbClient.findMany).toHaveBeenCalled();
      }
    });
  });
});
