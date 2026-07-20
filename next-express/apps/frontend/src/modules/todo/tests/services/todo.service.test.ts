import { describe, it, expect, vi, beforeEach } from 'vitest';
import { todoService } from '../../services/todo.service';
import { todoApi } from '../../services/todo.api';
import { buildCreateTodoInput, buildTodo } from '../factories/todo.factory';

vi.mock('../../services/todo.api', () => ({
  todoApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('TodoService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should return data on successful creation', async () => {
      const input = buildCreateTodoInput();
      const mockResponse = buildTodo();
      vi.mocked(todoApi.create).mockResolvedValue({ success: true, data: mockResponse });

      const result = await todoService.create(input);

      expect(todoApi.create).toHaveBeenCalledWith(input);
      expect(result).toEqual(mockResponse);
    });

    it.each([
      ['Validation Error', { message: 'Invalid payload' }],
      ['Server Error', undefined],
    ])('should throw error when api create fails (%s)', async (_, errorData) => {
      const input = buildCreateTodoInput();
      vi.mocked(todoApi.create).mockResolvedValue({ 
        success: false, 
        error: errorData as any 
      } as any);

      await expect(todoService.create(input)).rejects.toThrow(
        errorData?.message || 'Failed to create Todo'
      );
    });
  });

  describe('getAll', () => {
    it('should return list of Todos', async () => {
      const mockResponse = [buildTodo()];
      vi.mocked(todoApi.getAll).mockResolvedValue({ success: true, data: mockResponse });

      const result = await todoService.getAll();

      expect(todoApi.getAll).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });
  });
});