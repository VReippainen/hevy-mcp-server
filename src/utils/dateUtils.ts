/**
 * Utility functions for date operations
 */

/**
 * Get a start date based on the specified timeframe
 * @param timeframe The timeframe to calculate the start date for
 * @returns The calculated start date
 */
export function getDateRangeFromTimeframe(
  timeframe: 'week' | 'month' | 'quarter' | 'year' | 'all'
): Date {
  const now = new Date();
  let startDate = new Date();

  switch (timeframe) {
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      startDate.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    case 'all':
      startDate = new Date(0); // Beginning of time
      break;
  }

  return startDate;
}
