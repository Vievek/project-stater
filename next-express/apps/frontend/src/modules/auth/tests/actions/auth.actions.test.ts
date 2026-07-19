import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import { loginAction, registerAction, logoutAction } from '../../actions/auth.actions';
import { authService } from '../../services/auth.service';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { buildAuthResponse, buildLoginCredentials, buildRegisterCredentials } from '../factories/auth.factory';

// Mock dependencies
vi.mock('../../services/auth.service', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
  },
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

function objectToFormData(obj: Record<string, any>): FormData {
  const formData = new FormData();
  Object.entries(obj).forEach(([key, value]) => {
    formData.append(key, String(value));
  });
  return formData;
}

describe('Auth Actions', () => {
  let mockSetCookie: any;
  let mockDeleteCookie: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSetCookie = vi.fn();
    mockDeleteCookie = vi.fn();
    (cookies as any).mockResolvedValue({
      set: mockSetCookie,
      delete: mockDeleteCookie,
    });
  });

  describe('loginAction', () => {
    it('should successfully login, set cookie and redirect', async () => {
      // Arrange
      const credentials = buildLoginCredentials();
      const formData = objectToFormData(credentials);
      const authResponse = buildAuthResponse();
      vi.mocked(authService.login).mockResolvedValue(authResponse);

      // Act
      await loginAction({}, formData);

      // Assert
      expect(authService.login).toHaveBeenCalledWith(credentials);
      expect(mockSetCookie).toHaveBeenCalledWith('token', authResponse.token, expect.any(Object));
      expect(redirect).toHaveBeenCalledWith('/todos');
    });

    it.each([
      ['Invalid credentials', new Error('Invalid credentials')],
      ['Network error', new Error('Network error')],
    ])('should return error if service throws (%s)', async (_, error) => {
      // Arrange
      const credentials = buildLoginCredentials();
      const formData = objectToFormData(credentials);
      vi.mocked(authService.login).mockRejectedValue(error);

      // Act
      const result = await loginAction({}, formData);

      // Assert
      expect(result).toEqual({ error: error.message });
      expect(mockSetCookie).not.toHaveBeenCalled();
      expect(redirect).not.toHaveBeenCalled();
    });

    it('property test: should always return validation error for invalid FormDatas without crashing', async () => {
      await fc.assert(
        fc.asyncProperty(fc.string(), fc.string(), async (emailStr, passwordStr) => {
          if (emailStr.includes('@') && passwordStr.length >= 8) return; 

          const formData = new FormData();
          formData.append('email', emailStr);
          formData.append('password', passwordStr);

          const result = await loginAction({}, formData);
          
          expect(result).toEqual({ error: 'Invalid form data' });
          expect(authService.login).not.toHaveBeenCalled();
        }),
        { numRuns: 20 }
      );
    });
  });

  describe('registerAction', () => {
    it('should successfully register, set cookie and redirect', async () => {
      // Arrange
      const credentials = buildRegisterCredentials();
      const formData = objectToFormData(credentials);
      const authResponse = buildAuthResponse();
      vi.mocked(authService.register).mockResolvedValue(authResponse);

      // Act
      await registerAction({}, formData);

      // Assert
      expect(authService.register).toHaveBeenCalledWith(credentials);
      expect(mockSetCookie).toHaveBeenCalledWith('token', authResponse.token, expect.any(Object));
      expect(redirect).toHaveBeenCalledWith('/todos');
    });

    it.each([
      ['Email exists', new Error('Email exists')],
      ['Server Error', new Error('Server Error')],
    ])('should return error if service throws (%s)', async (_, error) => {
      // Arrange
      const credentials = buildRegisterCredentials();
      const formData = objectToFormData(credentials);
      vi.mocked(authService.register).mockRejectedValue(error);

      // Act
      const result = await registerAction({}, formData);

      // Assert
      expect(result).toEqual({ error: error.message });
      expect(mockSetCookie).not.toHaveBeenCalled();
      expect(redirect).not.toHaveBeenCalled();
    });

    it('property test: should always return validation error for invalid FormDatas without crashing', async () => {
      await fc.assert(
        fc.asyncProperty(fc.string(), fc.string(), fc.string(), async (nameStr, emailStr, passwordStr) => {
          if (nameStr.length >= 2 && emailStr.includes('@') && passwordStr.length >= 8) return; 

          const formData = new FormData();
          formData.append('name', nameStr);
          formData.append('email', emailStr);
          formData.append('password', passwordStr);

          const result = await registerAction({}, formData);
          
          expect(result).toEqual({ error: 'Invalid form data' });
          expect(authService.register).not.toHaveBeenCalled();
        }),
        { numRuns: 20 }
      );
    });
  });

  describe('logoutAction', () => {
    it('should delete token cookie and redirect to login', async () => {
      // Act
      await logoutAction();

      // Assert
      expect(mockDeleteCookie).toHaveBeenCalledWith('token');
      expect(redirect).toHaveBeenCalledWith('/login');
    });
  });
});
