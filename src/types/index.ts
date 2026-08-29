export interface PaginationQuery {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface JwtPayload {
  name: string;
  iat?: number;
  exp?: number;
}
