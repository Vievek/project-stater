import { z } from 'zod';
import { idParamSchema } from '../../shared/schemas';

// ─── Request Schemas ───────────────────────────────────────────────────────────

export const createTodoSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  }),
});

export const updateTodoSchema = z.object({
  params: idParamSchema,
  body: z.object({
    title: z.string().min(1).max(255).optional(),
    completed: z.boolean().optional(),
  }).refine(data => data.title !== undefined || data.completed !== undefined, {
    message: 'At least one field (title or completed) must be provided',
  }),
});

export const getTodoSchema = z.object({
  params: idParamSchema,
});

export const deleteTodoSchema = z.object({
  params: idParamSchema,
});

// ─── Inferred Types ─────────────────────────────────────────────────────────────

export type CreateTodoInput = z.infer<typeof createTodoSchema>['body'];
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>['body'];
