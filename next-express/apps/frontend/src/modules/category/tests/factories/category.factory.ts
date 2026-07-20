import { Category, CreateCategoryInput } from '../../types/category.types';

export function buildCreateCategoryInput(overrides?: Partial<CreateCategoryInput>): CreateCategoryInput {
  return {
    name: 'test-string',
    todos: [],
    ...overrides,
  };
}

export function buildCategory(overrides?: Partial<Category>): Category {
  return {
    id: 'test-string',
    name: 'test-string',
    todos: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}