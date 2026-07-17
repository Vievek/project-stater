import { z } from 'zod';
import { QueryFieldConfig } from '../../utils/query-builder';

// ─── USER QUERY CONFIG ───────────────────────────────────────────────────
//
// This file is automatically synced by sync_query_config.ts — do not edit manually.
// To add custom query config that survives regeneration, create:
//   user.query-config.extended.ts

export const userQueryConfig: QueryFieldConfig = {
  sortableFields: ['id', 'name', 'email', 'password', 'role', 'createdAt', 'updatedAt'],
  filterableFields: ['id', 'name', 'email', 'password', 'role', 'createdAt', 'updatedAt'],
  searchableFields: ['id', 'name', 'email', 'password', 'role'],
};

export const UserFilterableFieldsEnum = z.enum(['id', 'name', 'email', 'password', 'role', 'createdAt', 'updatedAt']);
export const UserSortableFieldsEnum = z.enum(['id', 'name', 'email', 'password', 'role', 'createdAt', 'updatedAt']);

export const userQuerySchema = z.object({
  search: z.string().optional(),
  sort: z.array(
    z.object({
      field: UserSortableFieldsEnum,
      direction: z.enum(['asc', 'desc']),
    })
  ).optional(),
  filters: z.array(
    z.object({
      field: UserFilterableFieldsEnum,
      operator: z.enum(['eq', 'contains', 'gt', 'lt', 'gte', 'lte', 'in']),
      value: z.unknown(),
    })
  ).optional(),
  pagination: z.object({
    page: z.number().int().positive().default(1),
    pageSize: z.number().int().positive().default(10),
  }).optional(),
});

export type UserQueryInput = z.infer<typeof userQuerySchema>;
