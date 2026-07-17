import { Todo } from '../todo/todo.types';

/**
 * Domain-owned User type.
 * This file is automatically synced by sync_types.ts — do not edit manually.
 *
 * Relation fields (marked ?) are only populated when Prisma's `include` option
 * is used in the repository. They are absent (undefined) in plain queries.
 */
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  /** Hydrated via `include: { todos: true }` in the repository. */
  todos?: Todo[];
  createdAt: Date;
  updatedAt: Date;
}
