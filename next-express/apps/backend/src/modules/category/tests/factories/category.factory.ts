import { Category } from '../../category.types';
import { Todo } from '../../../todo/todo.types';

let _seq = 0;
const next = () => ++_seq;

/**
 * Builds a full Category object with sensible defaults.
 *
 * Relation fields (todos)
 * are NOT included — they are only present when Prisma's `include` option is used
 * in the repository. Use `buildCategoryWithRelations` when you need nested data.
 */
export function buildCategory(overrides: Partial<Category> = {}): Category {
  const seq = next();
  return {
    id: `category-id-${seq}`,
    name: `Category Name ${seq}`,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-06-01T00:00:00.000Z'),
    ...overrides,
  };
}

/** Builds a list of Category objects. */
export function buildCategoryList(count: number, overrides: Partial<Category> = {}): Category[] {
  return Array.from({ length: count }, () => buildCategory(overrides));
}

/**
 * Builds a create-category payload (the body a client POSTs).
 *
 * FK scalar fields (e.g. none) are included
 * because the API consumer must supply the parent id on create.
 */
export function buildCreateCategoryPayload(
  overrides: Partial<Pick<Category, 'name'>> = {},
): Pick<Category, 'name'> {
  const seq = next();
  return {
    name: `Category Name ${seq}`,
    ...overrides,
  };
}

/**
 * Builds an update-category payload.
 * Returns ONLY the overrides — tests supply exactly the diff they need.
 */
export function buildUpdateCategoryPayload(
  overrides: Partial<Pick<Category, 'name'>> = {},
): Partial<Pick<Category, 'name'>> {
  return { ...overrides };
}

/**
 * Builds a Category with related data attached.
 *
 * Use this in tests that need nested objects — e.g. to verify that the
 * controller/service correctly serialises or processes related records.
 *
 * Relationship patterns that produce relation fields on this model:
 *   todos (One-to-Many / Many-to-Many (list))
 *
 * @example
 *   import { buildCategoryWithRelations } from './category.factory';
 *   import { buildTodo } from '../../todo/tests/factories/todo.factory';
 *
 *   const record = buildCategoryWithRelations({}, {
 *     todos: buildTodoList(2),
 *   });
 */
export function buildCategoryWithRelations(
  overrides: Partial<Category> = {},
  relations: {
    todos?: Todo[];
  } = {},
): Category {
  return { ...buildCategory(overrides), ...relations };
}
