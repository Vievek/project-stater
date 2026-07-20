import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['USER', 'ADMIN']).optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
});

export type CreateUserSchemaType = z.infer<typeof createUserSchema>;
export type UpdateUserSchemaType = z.infer<typeof updateUserSchema>;