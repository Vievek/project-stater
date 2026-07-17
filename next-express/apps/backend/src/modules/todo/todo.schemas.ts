import { z } from 'zod';
import { idParamSchema } from '../../shared/schemas';

// ─── TODO SCHEMAS ─────────────────────────────────────────────────────
//
// This file is automatically synced by sync_schemas.ts — do not edit manually.
// To add custom schemas that survive regeneration, create:
//   todo.schemas.extended.ts

/**
 * Validates the request body for POST /api/todos.
 *
 * Included fields:
 *   title [required]
 *   completed [required]
 *   userId (FK → User) [required]
 */
export const createTodoSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    completed: z.boolean().optional(),
    userId: z.string().uuid(),
  }),
});

/**
 * Validates the request body for PATCH /api/todos/:id.
 * All fields are optional, but at least one must be provided.
 */
export const updateTodoSchema = z.object({
  params: idParamSchema,
  body: z.object({
    title: z.string().min(1).optional(),
    completed: z.boolean().optional(),
    userId: z.string().uuid().optional(),
  }).refine((data) => data.title !== undefined || data.completed !== undefined || data.userId !== undefined, {
    message: 'At least one field (title, completed, userId) must be provided',
  }),
});

export const getTodoSchema = z.object({
  params: idParamSchema,
});

export const deleteTodoSchema = z.object({
  params: idParamSchema,
});

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type CreateTodoInput = z.infer<typeof createTodoSchema>['body'];
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>['body'];
