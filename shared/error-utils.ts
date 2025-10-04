import type { ApiError as DatabaseApiError, PaginatedResponse } from './database-types';
import type { ApiError as EnhancedApiError } from './enhanced-api';

/**
 * Creates a properly formatted API error object for database-types
 */
export function createApiError(
  error: string,
  message: string,
  status: number,
  details?: any,
  code?: string
): DatabaseApiError {
  return {
    error,
    message,
    status,
    details,
    code,
    timestamp: new Date().toISOString()
  };
}

/**
 * Creates a properly formatted API error object for enhanced-api
 */
export function createEnhancedApiError(
  code: string,
  message: string,
  details?: any
): EnhancedApiError {
  return {
    code,
    message,
    details,
    timestamp: new Date().toISOString()
  };
}

/**
 * Creates a paginated response object
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> {
  return {
    data,
    success: true,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  };
}

/**
 * Creates a simple success response
 */
export function createSuccessResponse<T>(data: T): { data: T; success: boolean } {
  return {
    data,
    success: true
  };
}