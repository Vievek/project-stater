import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as actions from '../../actions/category.actions';
import { categoryService } from '../../services/category.service';
import { buildCreateCategoryInput, buildCategory } from '../factories/category.factory';
import { revalidatePath } from 'next/cache';

vi.mock('../../services/category.service', () => ({
  categoryService: {
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

describe('Category Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCategoryAction', () => {
    it('should create Category and revalidate tag', async () => {
      const input = buildCreateCategoryInput();
      const mockData = buildCategory();
      vi.mocked(categoryService.create).mockResolvedValue(mockData);

      const result = await actions.createCategoryAction(input);

      expect(categoryService.create).toHaveBeenCalledWith(input);
      expect(revalidatePath).toHaveBeenCalledWith('/category');
      expect(result).toEqual(mockData);
    });

    it('should throw error when service fails', async () => {
      const input = buildCreateCategoryInput();
      vi.mocked(categoryService.create).mockRejectedValue(new Error('Service Error'));

      await expect(actions.createCategoryAction(input)).rejects.toThrow('Service Error');
    });
  });

  describe('getCategorysAction', () => {
    it('should return list of Categorys', async () => {
      const mockData = [buildCategory()];
      vi.mocked(categoryService.getAll).mockResolvedValue(mockData);

      const result = await actions.getCategorysAction();

      expect(categoryService.getAll).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });
  });

  describe('deleteAllCategorysAction', () => {
    it('should delete all and revalidate', async () => {
      vi.mocked(categoryService.deleteAll).mockResolvedValue();

      await actions.deleteAllCategorysAction();

      expect(categoryService.deleteAll).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith('/category');
    });
  });

  describe('getCategorysSummaryAction', () => {
    it('should return summary', async () => {
      const mockSummary = { total: 10 };
      vi.mocked(categoryService.getSummary).mockResolvedValue(mockSummary);

      const result = await actions.getCategorysSummaryAction();

      expect(categoryService.getSummary).toHaveBeenCalled();
      expect(result).toEqual(mockSummary);
    });
  });
});