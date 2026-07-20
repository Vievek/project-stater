import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userService } from '../../services/user.service';
import { userApi } from '../../services/user.api';
import { buildCreateUserInput, buildUser } from '../factories/user.factory';

vi.mock('../../services/user.api', () => ({
  userApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should return data on successful creation', async () => {
      const input = buildCreateUserInput();
      const mockResponse = buildUser();
      vi.mocked(userApi.create).mockResolvedValue({ success: true, data: mockResponse });

      const result = await userService.create(input);

      expect(userApi.create).toHaveBeenCalledWith(input);
      expect(result).toEqual(mockResponse);
    });

    it.each([
      ['Validation Error', { message: 'Invalid payload' }],
      ['Server Error', undefined],
    ])('should throw error when api create fails (%s)', async (_, errorData) => {
      const input = buildCreateUserInput();
      vi.mocked(userApi.create).mockResolvedValue({ 
        success: false, 
        error: errorData as any 
      } as any);

      await expect(userService.create(input)).rejects.toThrow(
        errorData?.message || 'Failed to create User'
      );
    });
  });

  describe('getAll', () => {
    it('should return list of Users', async () => {
      const mockResponse = [buildUser()];
      vi.mocked(userApi.getAll).mockResolvedValue({ success: true, data: mockResponse });

      const result = await userService.getAll();

      expect(userApi.getAll).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });
  });
});