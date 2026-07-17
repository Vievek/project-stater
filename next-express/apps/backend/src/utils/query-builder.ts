import { PaginationOptions } from '../shared/schemas';

export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterCondition {
  field: string;
  operator: 'eq' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'in';
  value: unknown;
}

export interface QueryOptions {
  pagination?: PaginationOptions;
  sort?: SortOption[];
  filters?: FilterCondition[];
  search?: string;
}

export interface QueryFieldConfig {
  sortableFields: string[];
  filterableFields: string[];
  searchableFields: string[]; // string-type fields only
}

export class QueryBuilder {
  constructor(private config: QueryFieldConfig) {}

  build(options: QueryOptions) {
    const where: Record<string, any> = {};

    for (const f of options.filters ?? []) {
      if (!this.config.filterableFields.includes(f.field)) continue; // whitelist — never trust raw field names from clients
      where[f.field] = this.toPrismaOperator(f.operator, f.value);
    }

    if (options.search && this.config.searchableFields.length) {
      where.OR = this.config.searchableFields.map((field) => ({
        [field]: { contains: options.search, mode: 'insensitive' },
      }));
    }

    const orderBy = (options.sort ?? [])
      .filter((s) => this.config.sortableFields.includes(s.field))
      .map((s) => ({ [s.field]: s.direction }));

    const page = options.pagination
      ? {
          skip: (options.pagination.page - 1) * options.pagination.pageSize,
          take: options.pagination.pageSize,
        }
      : {};

    return {
      ...(Object.keys(where).length ? { where } : {}),
      ...(orderBy.length ? { orderBy } : {}),
      ...page,
    };
  }

  private toPrismaOperator(op: FilterCondition['operator'], value: unknown) {
    switch (op) {
      case 'eq':
        return value;
      case 'contains':
        return { contains: value, mode: 'insensitive' };
      case 'gt':
        return { gt: value };
      case 'lt':
        return { lt: value };
      case 'gte':
        return { gte: value };
      case 'lte':
        return { lte: value };
      case 'in':
        return { in: value };
    }
  }
}
