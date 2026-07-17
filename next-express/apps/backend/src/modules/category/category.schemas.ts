import { z } from 'zod';
import { idParamSchema } from '../../shared/schemas';

// ─── CATEGORY SCHEMAS ─────────────────────────────────────────────────────
//
// This file is automatically synced by sync_schemas.ts — do not edit manually.
// To add custom schemas that survive regeneration, create:
//   category.schemas.extended.ts

/**
 * Validates the request body for POST /api/categorys.
 *
 * Included fields:
 *   name [required]
 */
export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1),
  }),
});

/**
 * Validates the request body for PATCH /api/categorys/:id.
 * All fields are optional, but at least one must be provided.
 */
export const updateCategorySchema = z.object({
  params: idParamSchema,
  body: z.object({
    name: z.string().min(1).optional(),
  }).refine((data) => data.name !== undefined, {
    message: 'At least one field (name) must be provided',
  }),
});

export const getCategorySchema = z.object({
  params: idParamSchema,
});

export const deleteCategorySchema = z.object({
  params: idParamSchema,
});

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type CreateCategoryInput = z.infer<typeof createCategorySchema>['body'];
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>['body'];
