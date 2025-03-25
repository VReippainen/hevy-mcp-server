import { getDateRangeFromTimeframe } from '../dateUtils';

describe('dateUtils', () => {
  describe('getDateRangeFromTimeframe', () => {
    // Save original Date implementation
    const RealDate = global.Date;

    // Mock fixed date for consistent testing
    const FIXED_DATE = new Date('2023-06-15T12:00:00Z');

    beforeEach(() => {
      // Mock Date to return fixed date for 'new Date()'
      global.Date = class extends RealDate {
        constructor() {
          super();
          return FIXED_DATE;
        }
      } as DateConstructor;

      // Maintain original static methods
      global.Date.now = jest.fn(() => FIXED_DATE.getTime());
    });

    afterEach(() => {
      // Restore original Date
      global.Date = RealDate;
    });

    test('should return date from 7 days ago for week timeframe', () => {
      const result = getDateRangeFromTimeframe('week');
      const expected = new Date('2023-06-08T12:00:00Z');

      expect(result.getTime()).toBe(expected.getTime());
    });

    test('should return date from 1 month ago for month timeframe', () => {
      const result = getDateRangeFromTimeframe('month');
      const expected = new Date('2023-05-15T12:00:00Z');

      expect(result.getTime()).toBe(expected.getTime());
    });

    test('should return date from 3 months ago for quarter timeframe', () => {
      const result = getDateRangeFromTimeframe('quarter');
      const expected = new Date('2023-03-15T12:00:00Z');

      expect(result.getTime()).toBe(expected.getTime());
    });

    test('should return date from 1 year ago for year timeframe', () => {
      const result = getDateRangeFromTimeframe('year');
      const expected = new Date('2022-06-15T12:00:00Z');

      expect(result.getTime()).toBe(expected.getTime());
    });

    test('should return epoch date (Jan 1, 1970) for all timeframe', () => {
      const result = getDateRangeFromTimeframe('all');
      const expected = new Date(0);

      expect(result.getTime()).toBe(expected.getTime());
    });
  });
});
