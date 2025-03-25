import { createErrorResponse, createResponse, createSuccessResponse } from '../responseUtils';

describe('Response Utilities', () => {
  describe('createResponse', () => {
    it('should wrap data in a standardized response format', () => {
      const data = { foo: 'bar', baz: 123 };
      const result = createResponse(data);

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(data),
          },
        ],
      });
    });
  });

  describe('createErrorResponse', () => {
    it('should create an error response with the given message', () => {
      const errorMessage = 'Something went wrong';
      const result = createErrorResponse(errorMessage);

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: errorMessage,
            }),
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
              success: true,
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
            text: JSON.stringify({
              success: true,
            }),
          },
        ],
      });
    });
  });
});
