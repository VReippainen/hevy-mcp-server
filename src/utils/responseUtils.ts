/**
 * Utility functions for API responses
 */

/**
 * Creates a standardized error response object
 * @param {string} message - The error message to include in the response
 * @returns {ErrorResponse} - A formatted error response object
 */
export function createErrorResponse(message: string) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ success: false, message }),
        resource: 'error',
      },
    ],
  };
}
