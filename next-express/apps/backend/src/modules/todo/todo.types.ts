import { User } from '../user/user.types';

/**
 * Domain-owned Todo type.
 * This file is automatically synced by sync_types.ts — do not edit manually.
 *
 * Relation fields (marked ?) are only populated when Prisma's `include` option
 * is used in the repository. They are absent (undefined) in plain queries.
 */
export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  /** Foreign key referencing User.id */
  userId: string;
  /** Hydrated via `include: { user: true }` in the repository. */
  user?: User;
  createdAt: Date;
  updatedAt: Date;
}
