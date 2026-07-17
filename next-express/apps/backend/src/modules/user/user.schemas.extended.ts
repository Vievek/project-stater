import { z } from 'zod';

/**
 * user.schemas.extended.ts
 *
 * Custom schemas that SURVIVE sync_schemas.ts regeneration.
 * Place any auth-specific or manually-crafted schemas here.
 */

// ─── Register ────────────────────────────────────────────────────────────────

/**
 * Validates the request body for POST /api/auth/register.
 */
export const registerSchema = z.object({
  body: z.object({
    name:     z.string().min(1),
    email:    z.string().email(),
    password: z.string().min(8),
    role:     z.enum(['USER', 'ADMIN']).optional(),
  }),
});

// ─── Login ────────────────────────────────────────────────────────────────────

/**
 * Validates the request body for POST /api/auth/login.
 */
export const loginSchema = z.object({
  body: z.object({
    email:    z.string().email(),
    password: z.string().min(1),
  }),
});

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput    = z.infer<typeof loginSchema>['body'];
