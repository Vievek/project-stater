import { describe, it, expect, vi, beforeEach } from 'vitest';
import { categoryService } from '../../services/category.service';
import { categoryApi } from '../../services/category.api';
import { buildCreateCategoryInput, buildCategory } from '../factories/category.factory';

vi.mock('../../services/category.api', () => ({
  categoryApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('CategoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should return data on successful creation', async () => {
      const input = buildCreateCategoryInput();
      const mockResponse = buildCategory();
      vi.mocked(categoryApi.create).mockResolvedValue({ success: true, data: mockResponse });

      const result = await categoryService.create(input);

      expect(categoryApi.create).toHaveBeenCalledWith(input);
      expect(result).toEqual(mockResponse);
    });

    it.each([
      ['Validation Error', { message: 'Invalid payload' }],
      ['Server Error', undefined],
    ])('should throw error when api create fails (%s)', async (_, errorData) => {
      const input = buildCreateCategoryInput();
      vi.mocked(categoryApi.create).mockResolvedValue({ 
        success: false, 
        error: errorData as any 
      } as any);

      await expect(categoryService.create(input)).rejects.toThrow(
        errorData?.message || 'Failed to create Category'
      );
    });
  });

  describe('getAll', () => {
    it('should return list of Categorys', async () => {
      const mockResponse = [buildCategory()];
      vi.mocked(categoryApi.getAll).mockResolvedValue({ success: true, data: mockResponse });

      const result = await categoryService.getAll();

      expect(categoryApi.getAll).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });
  });
});