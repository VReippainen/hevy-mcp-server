/**
 * Type definition for query parameters used in API requests
 * Represents a record of key-value pairs with various possible value types
 */
export type QueryParams = Record<string, string | number | boolean | undefined> & {
  page?: number;
  pageSize?: number;
};

/**
 * Type definition for pagination parameters
 * Contains only page and pageSize properties
 */
export type PaginationParams = {
  page?: number;
  pageSize?: number;
};
