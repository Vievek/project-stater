import { Todo, CreateTodoInput } from '../../types/todo.types';

export function buildCreateTodoInput(overrides?: Partial<CreateTodoInput>): CreateTodoInput {
  return {
    title: 'test-string',
    completed: true,
    userId: 'test-string',
    user: {} as any,
    tags: [],
    categories: [],
    ...overrides,
  };
}

export function buildTodo(overrides?: Partial<Todo>): Todo {
  return {
    id: 'test-string',
    title: 'test-string',
    completed: true,
    userId: 'test-string',
    user: {} as any,
    tags: [],
    categories: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}