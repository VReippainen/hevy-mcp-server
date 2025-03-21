import { validatePagination } from '../validation';

describe('validation utilities', () => {
  describe('validatePagination', () => {
    it('should return valid pagination params', () => {
      const params = { page: 1, pageSize: 5 };
      expect(validatePagination(params)).toEqual(params);
    });

    it('should apply default values for page and pageSize when not provided', () => {
      const emptyParams = {};
      expect(validatePagination(emptyParams)).toEqual(emptyParams);
    });

    it('should convert string values to numbers', () => {
      const params = { page: '2', pageSize: '7' } as never;
      expect(validatePagination(params)).toEqual({ page: 2, pageSize: 7 });
    });

    it('should throw error when page is less than 1', () => {
      const params = { page: 0 };
      expect(() => validatePagination(params)).toThrow('Page must be a number greater than 0');
    });

    it('should throw error when page is not a number', () => {
      const params = { page: 'abc' } as never;
      expect(() => validatePagination(params)).toThrow('Page must be a number greater than 0');
    });

    it('should throw error when pageSize is less than 1', () => {
      const params = { pageSize: 0 };
      expect(() => validatePagination(params)).toThrow(
        'PageSize must be a number between 1 and 10'
      );
    });

    it('should throw error when pageSize is greater than 10', () => {
      const params = { pageSize: 11 };
      expect(() => validatePagination(params)).toThrow(
        'PageSize must be a number between 1 and 10'
      );
    });

    it('should throw error when pageSize is not a number', () => {
      const params = { pageSize: 'abc' } as never;
      expect(() => validatePagination(params)).toThrow(
        'PageSize must be a number between 1 and 10'
      );
    });

    it('should validate both page and pageSize together', () => {
      const params = { page: 2, pageSize: 8 };
      expect(validatePagination(params)).toEqual(params);
    });

    it('should throw error when both page and pageSize are invalid', () => {
      const params = { page: 0, pageSize: 11 };
      expect(() => validatePagination(params)).toThrow('Page must be a number greater than 0');
    });
  });
});
