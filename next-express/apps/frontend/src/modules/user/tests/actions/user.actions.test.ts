import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as actions from '../../actions/user.actions';
import { userService } from '../../services/user.service';
import { buildCreateUserInput, buildUser } from '../factories/user.factory';
import { revalidatePath } from 'next/cache';

vi.mock('../../services/user.service', () => ({
  userService: {
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

describe('User Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createUserAction', () => {
    it('should create User and revalidate tag', async () => {
      const input = buildCreateUserInput();
      const mockData = buildUser();
      vi.mocked(userService.create).mockResolvedValue(mockData);

      const result = await actions.createUserAction(input);

      expect(userService.create).toHaveBeenCalledWith(input);
      expect(revalidatePath).toHaveBeenCalledWith('/user');
      expect(result).toEqual(mockData);
    });

    it('should throw error when service fails', async () => {
      const input = buildCreateUserInput();
      vi.mocked(userService.create).mockRejectedValue(new Error('Service Error'));

      await expect(actions.createUserAction(input)).rejects.toThrow('Service Error');
    });
  });

  describe('getUsersAction', () => {
    it('should return list of Users', async () => {
      const mockData = [buildUser()];
      vi.mocked(userService.getAll).mockResolvedValue(mockData);

      const result = await actions.getUsersAction();

      expect(userService.getAll).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });
  });

  describe('deleteAllUsersAction', () => {
    it('should delete all and revalidate', async () => {
      vi.mocked(userService.deleteAll).mockResolvedValue();

      await actions.deleteAllUsersAction();

      expect(userService.deleteAll).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith('/user');
    });
  });

  describe('getUsersSummaryAction', () => {
    it('should return summary', async () => {
      const mockSummary = { total: 10 };
      vi.mocked(userService.getSummary).mockResolvedValue(mockSummary);

      const result = await actions.getUsersSummaryAction();

      expect(userService.getSummary).toHaveBeenCalled();
      expect(result).toEqual(mockSummary);
    });
  });
});