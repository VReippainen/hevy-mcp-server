/**
 * Utility functions for API responses
 */

export interface ResponseContent {
  [key: string]: unknown;
  type: 'text';
  text: string;
}

export interface Response {
  [key: string]: unknown;
  content: ResponseContent[];
}

/**
 * Creates a standardized error response object
 * @param message The error message to include in the response
 */
export function createErrorResponse(message: string): Response {
  return {
    isError: true,
    content: [{ type: 'text' as const, text: message }],
  };
}

/**
 * Creates a standardized success response object
 * @param data The data to include in the response
 */
export function createSuccessResponse<T>(data: T): Response {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data) }],
  };
}
