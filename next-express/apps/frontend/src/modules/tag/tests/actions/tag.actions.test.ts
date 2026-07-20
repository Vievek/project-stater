import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as actions from '../../actions/tag.actions';
import { tagService } from '../../services/tag.service';
import { buildCreateTagInput, buildTag } from '../factories/tag.factory';
import { revalidatePath } from 'next/cache';

vi.mock('../../services/tag.service', () => ({
  tagService: {
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

describe('Tag Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTagAction', () => {
    it('should create Tag and revalidate tag', async () => {
      const input = buildCreateTagInput();
      const mockData = buildTag();
      vi.mocked(tagService.create).mockResolvedValue(mockData);

      const result = await actions.createTagAction(input);

      expect(tagService.create).toHaveBeenCalledWith(input);
      expect(revalidatePath).toHaveBeenCalledWith('/tag');
      expect(result).toEqual(mockData);
    });

    it('should throw error when service fails', async () => {
      const input = buildCreateTagInput();
      vi.mocked(tagService.create).mockRejectedValue(new Error('Service Error'));

      await expect(actions.createTagAction(input)).rejects.toThrow('Service Error');
    });
  });

  describe('getTagsAction', () => {
    it('should return list of Tags', async () => {
      const mockData = [buildTag()];
      vi.mocked(tagService.getAll).mockResolvedValue(mockData);

      const result = await actions.getTagsAction();

      expect(tagService.getAll).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });
  });

  describe('deleteAllTagsAction', () => {
    it('should delete all and revalidate', async () => {
      vi.mocked(tagService.deleteAll).mockResolvedValue();

      await actions.deleteAllTagsAction();

      expect(tagService.deleteAll).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith('/tag');
    });
  });

  describe('getTagsSummaryAction', () => {
    it('should return summary', async () => {
      const mockSummary = { total: 10 };
      vi.mocked(tagService.getSummary).mockResolvedValue(mockSummary);

      const result = await actions.getTagsSummaryAction();

      expect(tagService.getSummary).toHaveBeenCalled();
      expect(result).toEqual(mockSummary);
    });
  });
});