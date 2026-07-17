import { z } from 'zod';
import { QueryFieldConfig } from '../../utils/query-builder';

// ─── TAG QUERY CONFIG ───────────────────────────────────────────────────
//
// This file is automatically synced by sync_query_config.ts — do not edit manually.
// To add custom query config that survives regeneration, create:
//   tag.query-config.extended.ts

export const tagQueryConfig: QueryFieldConfig = {
  sortableFields: ['id', 'name', 'createdAt', 'updatedAt'],
  filterableFields: ['id', 'name', 'createdAt', 'updatedAt'],
  searchableFields: ['id', 'name'],
};

export const TagFilterableFieldsEnum = z.enum(['id', 'name', 'createdAt', 'updatedAt']);
export const TagSortableFieldsEnum = z.enum(['id', 'name', 'createdAt', 'updatedAt']);

export const tagQuerySchema = z.object({
  search: z.string().optional(),
  sort: z.array(
    z.object({
      field: TagSortableFieldsEnum,
      direction: z.enum(['asc', 'desc']),
    })
  ).optional(),
  filters: z.array(
    z.object({
      field: TagFilterableFieldsEnum,
      operator: z.enum(['eq', 'contains', 'gt', 'lt', 'gte', 'lte', 'in']),
      value: z.unknown(),
    })
  ).optional(),
  pagination: z.object({
    page: z.number().int().positive().default(1),
    pageSize: z.number().int().positive().default(10),
  }).optional(),
});

export type TagQueryInput = z.infer<typeof tagQuerySchema>;
