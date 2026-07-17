import { User } from '../../user.types';
import { Todo } from '../../../todo/todo.types';

let _seq = 0;
const next = () => ++_seq;

/**
 * Builds a full User object with sensible defaults.
 *
 * Relation fields (todos)
 * are NOT included — they are only present when Prisma's `include` option is used
 * in the repository. Use `buildUserWithRelations` when you need nested data.
 */
export function buildUser(overrides: Partial<User> = {}): User {
  const seq = next();
  return {
    id: `user-id-${seq}`,
    name: `User Name ${seq}`,
    email: `user-${seq}@example.com`,
    password: `hashed-password-${seq}`,
    role: 'USER',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-06-01T00:00:00.000Z'),
    ...overrides,
  };
}

/** Builds a list of User objects. */
export function buildUserList(count: number, overrides: Partial<User> = {}): User[] {
  return Array.from({ length: count }, () => buildUser(overrides));
}

/**
 * Builds a create-user payload (the body a client POSTs).
 *
 * FK scalar fields (e.g. none) are included
 * because the API consumer must supply the parent id on create.
 */
export function buildCreateUserPayload(
  overrides: Partial<Pick<User, 'name' | 'email' | 'password' | 'role'>> = {},
): Pick<User, 'name' | 'email' | 'password' | 'role'> {
  const seq = next();
  return {
    name: `User Name ${seq}`,
    email: `user-${seq}@example.com`,
    password: `hashed-password-${seq}`,
    role: 'USER',
    ...overrides,
  };
}

/**
 * Builds an update-user payload.
 * Returns ONLY the overrides — tests supply exactly the diff they need.
 */
export function buildUpdateUserPayload(
  overrides: Partial<Pick<User, 'name' | 'email' | 'password' | 'role'>> = {},
): Partial<Pick<User, 'name' | 'email' | 'password' | 'role'>> {
  return { ...overrides };
}

/**
 * Builds a User with related data attached.
 *
 * Use this in tests that need nested objects — e.g. to verify that the
 * controller/service correctly serialises or processes related records.
 *
 * Relationship patterns that produce relation fields on this model:
 *   todos (One-to-Many / Many-to-Many (list))
 *
 * @example
 *   import { buildUserWithRelations } from './user.factory';
 *   import { buildTodo } from '../../todo/tests/factories/todo.factory';
 *
 *   const record = buildUserWithRelations({}, {
 *     todos: buildTodoList(2),
 *   });
 */
export function buildUserWithRelations(
  overrides: Partial<User> = {},
  relations: {
    todos?: Todo[];
  } = {},
): User {
  return { ...buildUser(overrides), ...relations };
}
