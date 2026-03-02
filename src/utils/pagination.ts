export interface PaginationOptions {
  page: number;
  limit: number;
  total: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function paginate<T>(
  items: T[],
  options: PaginationOptions
): PaginatedResult<T> {
  const { page, limit, total } = options;
  const totalPages = Math.ceil(total / limit);

  return {
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

export function buildPaginationQuery(page: number, limit: number) {
  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));
  const offset = (safePage - 1) * safeLimit;

  return { offset, limit: safeLimit, page: safePage };
}

export function buildCountQuery(baseQuery: string): string {
  return `SELECT COUNT(*) as total FROM (${baseQuery}) as subquery`;
}