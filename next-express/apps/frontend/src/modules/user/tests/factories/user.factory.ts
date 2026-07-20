import { User, CreateUserInput } from '../../types/user.types';

export function buildCreateUserInput(overrides?: Partial<CreateUserInput>): CreateUserInput {
  return {
    name: 'test-string',
    email: 'test-string',
    password: 'test-string',
    role: 'test-string',
    todos: [],
    ...overrides,
  };
}

export function buildUser(overrides?: Partial<User>): User {
  return {
    id: 'test-string',
    name: 'test-string',
    email: 'test-string',
    password: 'test-string',
    role: 'test-string',
    todos: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}