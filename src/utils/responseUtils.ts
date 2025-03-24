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

export interface ErrorResponseData {
  success: false;
  message: string;
}

export interface SuccessResponseData extends Record<string, unknown> {
  success: true;
}

/**
 * Creates a standardized error response object
 * @param message The error message to include in the response
 */
export function createErrorResponse(message: string): Response {
  return createResponse<ErrorResponseData>({ success: false, message });
}

/**
 * Creates a standardized response object
 * @param data The data to include in the response
 */
export function createResponse<T>(data: T): Response {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data) }],
  };
}

/**
 * Creates a standardized success response object
 * @param data The data to include in the response
 */
export function createSuccessResponse<T>(data: T): Response {
  return createResponse<SuccessResponseData & T>({ success: true, ...data });
}
