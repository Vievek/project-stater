import { z } from 'zod';
import { QueryFieldConfig } from '../../utils/query-builder';

// ─── TODO QUERY CONFIG ───────────────────────────────────────────────────
//
// This file is automatically synced by sync_query_config.ts — do not edit manually.
// To add custom query config that survives regeneration, create:
//   todo.query-config.extended.ts

export const todoQueryConfig: QueryFieldConfig = {
  sortableFields: ['id', 'title', 'completed', 'userId', 'createdAt', 'updatedAt'],
  filterableFields: ['id', 'title', 'completed', 'userId', 'createdAt', 'updatedAt'],
  searchableFields: ['id', 'title', 'userId'],
};

export const TodoFilterableFieldsEnum = z.enum(['id', 'title', 'completed', 'userId', 'createdAt', 'updatedAt']);
export const TodoSortableFieldsEnum = z.enum(['id', 'title', 'completed', 'userId', 'createdAt', 'updatedAt']);

export const todoQuerySchema = z.object({
  search: z.string().optional(),
  sort: z.array(
    z.object({
      field: TodoSortableFieldsEnum,
      direction: z.enum(['asc', 'desc']),
    })
  ).optional(),
  filters: z.array(
    z.object({
      field: TodoFilterableFieldsEnum,
      operator: z.enum(['eq', 'contains', 'gt', 'lt', 'gte', 'lte', 'in']),
      value: z.unknown(),
    })
  ).optional(),
  pagination: z.object({
    page: z.number().int().positive().default(1),
    pageSize: z.number().int().positive().default(10),
  }).optional(),
});

export type TodoQueryInput = z.infer<typeof todoQuerySchema>;
