import { Tag } from '../../tag.types';
import { Todo } from '../../../todo/todo.types';

let _seq = 0;
const next = () => ++_seq;

/**
 * Builds a full Tag object with sensible defaults.
 *
 * Relation fields (todos)
 * are NOT included — they are only present when Prisma's `include` option is used
 * in the repository. Use `buildTagWithRelations` when you need nested data.
 */
export function buildTag(overrides: Partial<Tag> = {}): Tag {
  const seq = next();
  return {
    id: `tag-id-${seq}`,
    name: `Tag Name ${seq}`,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-06-01T00:00:00.000Z'),
    ...overrides,
  };
}

/** Builds a list of Tag objects. */
export function buildTagList(count: number, overrides: Partial<Tag> = {}): Tag[] {
  return Array.from({ length: count }, () => buildTag(overrides));
}

/**
 * Builds a create-tag payload (the body a client POSTs).
 *
 * FK scalar fields (e.g. none) are included
 * because the API consumer must supply the parent id on create.
 */
export function buildCreateTagPayload(
  overrides: Partial<Pick<Tag, 'name'>> = {},
): Pick<Tag, 'name'> {
  const seq = next();
  return {
    name: `Tag Name ${seq}`,
    ...overrides,
  };
}

/**
 * Builds an update-tag payload.
 * Returns ONLY the overrides — tests supply exactly the diff they need.
 */
export function buildUpdateTagPayload(
  overrides: Partial<Pick<Tag, 'name'>> = {},
): Partial<Pick<Tag, 'name'>> {
  return { ...overrides };
}

/**
 * Builds a Tag with related data attached.
 *
 * Use this in tests that need nested objects — e.g. to verify that the
 * controller/service correctly serialises or processes related records.
 *
 * Relationship patterns that produce relation fields on this model:
 *   todos (One-to-Many / Many-to-Many (list))
 *
 * @example
 *   import { buildTagWithRelations } from './tag.factory';
 *   import { buildTodo } from '../../todo/tests/factories/todo.factory';
 *
 *   const record = buildTagWithRelations({}, {
 *     todos: buildTodoList(2),
 *   });
 */
export function buildTagWithRelations(
  overrides: Partial<Tag> = {},
  relations: {
    todos?: Todo[];
  } = {},
): Tag {
  return { ...buildTag(overrides), ...relations };
}
