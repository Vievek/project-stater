import { LoginCredentials, RegisterCredentials, AuthResponse } from '../../types/auth.types';

export function buildLoginCredentials(overrides?: Partial<LoginCredentials>): LoginCredentials {
  return {
    email: 'test@example.com',
    password: 'Password123!',
    ...overrides,
  };
}

export function buildRegisterCredentials(overrides?: Partial<RegisterCredentials>): RegisterCredentials {
  return {
    name: 'Test User',
    email: 'test@example.com',
    password: 'Password123!',
    ...overrides,
  };
}

export function buildAuthResponse(overrides?: Partial<AuthResponse>): AuthResponse {
  return {
    user: {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
    },
    token: 'mock-jwt-token-12345',
    ...overrides,
  };
}
