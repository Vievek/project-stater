import { z } from 'zod';

export const createTodoSchema = z.object({
  title: z.string().min(1),
  completed: z.boolean().optional(),
  userId: z.string().uuid(),
});

export const updateTodoSchema = z.object({
  title: z.string().min(1).optional(),
  completed: z.boolean().optional(),
  userId: z.string().uuid().optional(),
});

export type CreateTodoSchemaType = z.infer<typeof createTodoSchema>;
export type UpdateTodoSchemaType = z.infer<typeof updateTodoSchema>;