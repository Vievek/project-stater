import { Todo } from '../../todo.types';

let _seq = 0;
const next = () => ++_seq;

/**
 * Builds a full Todo object with sensible defaults.
 *
 * Relation fields (none for the base Todo model) are NOT included —
 * they are only present when Prisma's `include` option is used in
 * the repository. If Todo gains relations, run `pnpm sync-factories`
 * to regenerate this file; a `buildTodoWithRelations` helper will be
 * added automatically.
 */
export function buildTodo(overrides: Partial<Todo> = {}): Todo {
  const seq = next();
  return {
    id: `todo-id-${seq}`,
    title: `Todo Title ${seq}`,
    completed: false,
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
 * FK scalar fields (none for the base Todo model) are included when
 * present — the API consumer must supply the parent id on create.
 */
export function buildCreateTodoPayload(
  overrides: Partial<Pick<Todo, 'title'>> = {},
): Pick<Todo, 'title'> {
  const seq = next();
  return {
    title: `Todo Title ${seq}`,
    ...overrides,
  };
}

/**
 * Builds an update-todo payload.
 * Returns ONLY the overrides — tests supply exactly the diff they need.
 */
export function buildUpdateTodoPayload(
  overrides: Partial<Pick<Todo, 'title' | 'completed'>> = {},
): Partial<Pick<Todo, 'title' | 'completed'>> {
  return { ...overrides };
}
