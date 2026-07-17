import { Todo } from '../../todo.types';
import { User } from '../../../user/user.types';

let _seq = 0;
const next = () => ++_seq;

/**
 * Builds a full Todo object with sensible defaults.
 *
 * Relation fields (user)
 * are NOT included — they are only present when Prisma's `include` option is used
 * in the repository. Use `buildTodoWithRelations` when you need nested data.
 */
export function buildTodo(overrides: Partial<Todo> = {}): Todo {
  const seq = next();
  return {
    id: `todo-id-${seq}`,
    title: `Todo Title ${seq}`,
    completed: false,
    userId: `user-id-${seq}`,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-06-01T00:00:00.000Z'),
    ...overrides,
  };
}

/** Builds a list of Todo objects. */
export function buildTodoList(count: number, overrides: Partial<Todo> = {}): Todo[] {
  return Array.from({ length: count }, () => buildTodo(overrides));
}

/**
 * Builds a create-todo payload (the body a client POSTs).
 *
 * FK scalar fields (e.g. userId) are included
 * because the API consumer must supply the parent id on create.
 */
export function buildCreateTodoPayload(
  overrides: Partial<Pick<Todo, 'title' | 'completed' | 'userId'>> = {},
): Pick<Todo, 'title' | 'completed' | 'userId'> {
  const seq = next();
  return {
    title: `Todo Title ${seq}`,
    completed: false,
    userId: `user-id-${seq}`,
    ...overrides,
  };
}

/**
 * Builds an update-todo payload.
 * Returns ONLY the overrides — tests supply exactly the diff they need.
 */
export function buildUpdateTodoPayload(
  overrides: Partial<Pick<Todo, 'title' | 'completed' | 'userId'>> = {},
): Partial<Pick<Todo, 'title' | 'completed' | 'userId'>> {
  return { ...overrides };
}

/**
 * Builds a Todo with related data attached.
 *
 * Use this in tests that need nested objects — e.g. to verify that the
 * controller/service correctly serialises or processes related records.
 *
 * Relationship patterns that produce relation fields on this model:
 *   user (One-to-One / Many-to-One (single))
 *
 * @example
 *   import { buildTodoWithRelations } from './todo.factory';
 *   import { buildUser } from '../../user/tests/factories/user.factory';
 *
 *   const record = buildTodoWithRelations({}, {
 *     user: buildUser(),
 *   });
 */
export function buildTodoWithRelations(
  overrides: Partial<Todo> = {},
  relations: {
    user?: User;
  } = {},
): Todo {
  return { ...buildTodo(overrides), ...relations };
}
