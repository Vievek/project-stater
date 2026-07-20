import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as actions from '../../actions/todo.actions';
import { todoService } from '../../services/todo.service';
import { buildCreateTodoInput, buildTodo } from '../factories/todo.factory';
import { revalidatePath } from 'next/cache';

vi.mock('../../services/todo.service', () => ({
  todoService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteAll: vi.fn(),
    getSummary: vi.fn(),
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Todo Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTodoAction', () => {
    it('should create Todo and revalidate tag', async () => {
      const input = buildCreateTodoInput();
      const mockData = buildTodo();
      vi.mocked(todoService.create).mockResolvedValue(mockData);

      const result = await actions.createTodoAction(input);

      expect(todoService.create).toHaveBeenCalledWith(input);
      expect(revalidatePath).toHaveBeenCalledWith('/todo');
      expect(result).toEqual(mockData);
    });

    it('should throw error when service fails', async () => {
      const input = buildCreateTodoInput();
      vi.mocked(todoService.create).mockRejectedValue(new Error('Service Error'));

      await expect(actions.createTodoAction(input)).rejects.toThrow('Service Error');
    });
  });

  describe('getTodosAction', () => {
    it('should return list of Todos', async () => {
      const mockData = [buildTodo()];
      vi.mocked(todoService.getAll).mockResolvedValue(mockData);

      const result = await actions.getTodosAction();

      expect(todoService.getAll).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });
  });

  describe('deleteAllTodosAction', () => {
    it('should delete all and revalidate', async () => {
      vi.mocked(todoService.deleteAll).mockResolvedValue();

      await actions.deleteAllTodosAction();

      expect(todoService.deleteAll).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith('/todo');
    });
  });

  describe('getTodosSummaryAction', () => {
    it('should return summary', async () => {
      const mockSummary = { total: 10 };
      vi.mocked(todoService.getSummary).mockResolvedValue(mockSummary);

      const result = await actions.getTodosSummaryAction();

      expect(todoService.getSummary).toHaveBeenCalled();
      expect(result).toEqual(mockSummary);
    });
  });
});