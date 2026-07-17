import { z } from 'zod';
import { idParamSchema } from '../../shared/schemas';

// ─── USER SCHEMAS ─────────────────────────────────────────────────────
//
// This file is automatically synced by sync_schemas.ts — do not edit manually.
// To add custom schemas that survive regeneration, create:
//   user.schemas.extended.ts

/**
 * Validates the request body for POST /api/users.
 *
 * Included fields:
 *   name [required]
 *   email [required]
 *   password [required]
 *   role [required]
 */
export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(['USER', 'ADMIN']).optional(),
  }),
});

/**
 * Validates the request body for PATCH /api/users/:id.
 * All fields are optional, but at least one must be provided.
 */
export const updateUserSchema = z.object({
  params: idParamSchema,
  body: z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    password: z.string().min(8).optional(),
    role: z.enum(['USER', 'ADMIN']).optional(),
  }).refine((data) => data.name !== undefined || data.email !== undefined || data.password !== undefined || data.role !== undefined, {
    message: 'At least one field (name, email, password, role) must be provided',
  }),
});

export const getUserSchema = z.object({
  params: idParamSchema,
});

export const deleteUserSchema = z.object({
  params: idParamSchema,
});

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];
