import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
});

export type CreateCategorySchemaType = z.infer<typeof createCategorySchema>;
export type UpdateCategorySchemaType = z.infer<typeof updateCategorySchema>;