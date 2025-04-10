import { createErrorResponse, createSuccessResponse } from '../responseUtils';
import { describe, it, expect } from 'vitest';

describe('Response Utilities', () => {
  describe('createErrorResponse', () => {
    it('should create an error response with the given message', () => {
      const errorMessage = 'Something went wrong';
      const result = createErrorResponse(errorMessage);

      expect(result).toEqual({
        isError: true,
        content: [
          {
            type: 'text',
            text: errorMessage,
          },
        ],
      });
    });
  });

  describe('createSuccessResponse', () => {
    it('should create a success response with the given data', () => {
      const data = { results: [1, 2, 3], count: 3 };
      const result = createSuccessResponse(data);

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              ...data,
            }),
          },
        ],
      });
    });

    it('should handle empty data object', () => {
      const result = createSuccessResponse({});

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify({}),
          },
        ],
      });
    });
  });
});
