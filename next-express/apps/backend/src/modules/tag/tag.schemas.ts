import { z } from 'zod';
import { idParamSchema } from '../../shared/schemas';

// ─── TAG SCHEMAS ─────────────────────────────────────────────────────
//
// This file is automatically synced by sync_schemas.ts — do not edit manually.
// To add custom schemas that survive regeneration, create:
//   tag.schemas.extended.ts

/**
 * Validates the request body for POST /api/tags.
 *
 * Included fields:
 *   name [required]
 */
export const createTagSchema = z.object({
  body: z.object({
    name: z.string().min(1),
  }),
});

/**
 * Validates the request body for PATCH /api/tags/:id.
 * All fields are optional, but at least one must be provided.
 */
export const updateTagSchema = z.object({
  params: idParamSchema,
  body: z.object({
    name: z.string().min(1).optional(),
  }).refine((data) => data.name !== undefined, {
    message: 'At least one field (name) must be provided',
  }),
});

export const getTagSchema = z.object({
  params: idParamSchema,
});

export const deleteTagSchema = z.object({
  params: idParamSchema,
});

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type CreateTagInput = z.infer<typeof createTagSchema>['body'];
export type UpdateTagInput = z.infer<typeof updateTagSchema>['body'];
