import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tagService } from '../../services/tag.service';
import { tagApi } from '../../services/tag.api';
import { buildCreateTagInput, buildTag } from '../factories/tag.factory';

vi.mock('../../services/tag.api', () => ({
  tagApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('TagService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should return data on successful creation', async () => {
      const input = buildCreateTagInput();
      const mockResponse = buildTag();
      vi.mocked(tagApi.create).mockResolvedValue({ success: true, data: mockResponse });

      const result = await tagService.create(input);

      expect(tagApi.create).toHaveBeenCalledWith(input);
      expect(result).toEqual(mockResponse);
    });

    it.each([
      ['Validation Error', { message: 'Invalid payload' }],
      ['Server Error', undefined],
    ])('should throw error when api create fails (%s)', async (_, errorData) => {
      const input = buildCreateTagInput();
      vi.mocked(tagApi.create).mockResolvedValue({ 
        success: false, 
        error: errorData as any 
      } as any);

      await expect(tagService.create(input)).rejects.toThrow(
        errorData?.message || 'Failed to create Tag'
      );
    });
  });

  describe('getAll', () => {
    it('should return list of Tags', async () => {
      const mockResponse = [buildTag()];
      vi.mocked(tagApi.getAll).mockResolvedValue({ success: true, data: mockResponse });

      const result = await tagService.getAll();

      expect(tagApi.getAll).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });
  });
});

//Fgen : need to generate tests for all endpoints in this file and actions file