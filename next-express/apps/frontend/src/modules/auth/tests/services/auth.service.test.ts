import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../../services/auth.service';
import { authApi } from '../../services/auth.api';
import { buildLoginCredentials, buildRegisterCredentials, buildAuthResponse } from '../factories/auth.factory';

// Completely mock the API layer
vi.mock('../../services/auth.api', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
  },
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should return auth data on successful login', async () => {
      // Arrange
      const credentials = buildLoginCredentials();
      const mockResponseData = buildAuthResponse();
      vi.mocked(authApi.login).mockResolvedValue({ success: true, data: mockResponseData });

      // Act
      const result = await authService.login(credentials);

      // Assert
      expect(authApi.login).toHaveBeenCalledWith(credentials);
      expect(result).toEqual(mockResponseData);
    });

    it.each([
      ['Invalid credentials', { message: 'Invalid email or password' }],
      ['Server Error', undefined],
    ])('should throw error when api login fails (%s)', async (scenario, errorData) => {
      // Arrange
      const credentials = buildLoginCredentials();
      vi.mocked(authApi.login).mockResolvedValue({ 
        success: false, 
        error: errorData as any 
      } as any);

      // Act & Assert
      await expect(authService.login(credentials)).rejects.toThrow(
        errorData?.message || 'Login failed'
      );
    });
  });

  describe('register', () => {
    it('should return auth data on successful registration', async () => {
      // Arrange
      const credentials = buildRegisterCredentials();
      const mockResponseData = buildAuthResponse();
      vi.mocked(authApi.register).mockResolvedValue({ success: true, data: mockResponseData });

      // Act
      const result = await authService.register(credentials);

      // Assert
      expect(authApi.register).toHaveBeenCalledWith(credentials);
      expect(result).toEqual(mockResponseData);
    });

    it.each([
      ['Email exists', { message: 'Email already exists' }],
      ['Validation Error', { message: 'Invalid payload' }],
      ['Default Error', undefined],
    ])('should throw error when api register fails (%s)', async (scenario, errorData) => {
      // Arrange
      const credentials = buildRegisterCredentials();
      vi.mocked(authApi.register).mockResolvedValue({ 
        success: false, 
        error: errorData as any 
      } as any);

      // Act & Assert
      await expect(authService.register(credentials)).rejects.toThrow(
        errorData?.message || 'Registration failed'
      );
    });
  });
});
