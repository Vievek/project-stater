import { Tag, CreateTagInput } from '../../types/tag.types';

export function buildCreateTagInput(overrides?: Partial<CreateTagInput>): CreateTagInput {
  return {
    name: 'test-string',
    todos: [],
    ...overrides,
  };
}

export function buildTag(overrides?: Partial<Tag>): Tag {
  return {
    id: 'test-string',
    name: 'test-string',
    todos: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}