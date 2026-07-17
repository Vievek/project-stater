import { Todo } from '../todo/todo.types';

/**
 * Domain-owned Tag type.
 * This file is automatically synced by sync_types.ts — do not edit manually.
 *
 * Relation fields (marked ?) are only populated when Prisma's `include` option
 * is used in the repository. They are absent (undefined) in plain queries.
 */
export interface Tag {
  id: string;
  name: string;
  /** Hydrated via `include: { todos: true }` in the repository. */
  todos?: Todo[];
  createdAt: Date;
  updatedAt: Date;
}
