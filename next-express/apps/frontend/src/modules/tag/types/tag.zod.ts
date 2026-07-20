import { z } from 'zod';

export const createTagSchema = z.object({
  name: z.string().min(1),
});

export const updateTagSchema = z.object({
  name: z.string().min(1).optional(),
});

export type CreateTagSchemaType = z.infer<typeof createTagSchema>;
export type UpdateTagSchemaType = z.infer<typeof updateTagSchema>;