import { z } from 'zod';

// ─── Register ────────────────────────────────────────────────────────────────

/**
 * Validates the request body for POST /api/auth/register.
 */
export const registerSchema = z.object({
  body: z.object({
    name:     z.string().min(1),
    email:    z.string().email().transform(v => v.toLowerCase().trim()),
    password: z.string()
      .min(6, 'Password must be at least 6 characters')
      .max(12, 'Password must be at most 12 characters')
      .regex(/(?=.*[a-z])/, 'Must contain at least one lowercase letter')
      .regex(/(?=.*[A-Z])/, 'Must contain at least one uppercase letter')
      .regex(/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/, 'Must contain at least one special character'),
  }),
});

// ─── Login ────────────────────────────────────────────────────────────────────

/**
 * Validates the request body for POST /api/auth/login.
 */
export const loginSchema = z.object({
  body: z.object({
    email:    z.string().email().transform(v => v.toLowerCase().trim()),
    password: z.string().min(1),
  }),
});

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput    = z.infer<typeof loginSchema>['body'];
