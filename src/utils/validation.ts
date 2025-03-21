/**
 * Utility functions for request validation
 */
import { PaginationParams } from '../types';

/**
 * Validates page and pageSize parameters
 * @param {PaginationParams} params - Pagination parameters to validate
 * @returns {PaginationParams} - Validated pagination parameters
 * @throws {Error} - If validation fails
 */
export function validatePagination(params: PaginationParams): PaginationParams {
  const validatedParams = { ...params };

  // Validate page
  if (validatedParams.page !== undefined) {
    const page = Number(validatedParams.page);
    if (isNaN(page) || page < 1) {
      throw new Error('Page must be a number greater than 0');
    }
    validatedParams.page = page;
  }

  // Validate pageSize
  if (validatedParams.pageSize !== undefined) {
    const pageSize = Number(validatedParams.pageSize);
    if (isNaN(pageSize) || pageSize < 1 || pageSize > 10) {
      throw new Error('PageSize must be a number between 1 and 10');
    }
    validatedParams.pageSize = pageSize;
  }

  return validatedParams;
}
