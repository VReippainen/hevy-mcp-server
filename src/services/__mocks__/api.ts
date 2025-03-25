/**
 * Manual mock for the API service module
 */
import { vi } from 'vitest';

// Create the mock get function
const mockGet = vi.fn();

/**
 * Mocked implementation of the get function
 */
export const get = async <T = Record<string, unknown>>(
  url: string,
  queryParams: Record<string, unknown> = {}
): Promise<T> => {
  try {
    // Filter out undefined values from the query parameters
    const filteredParams: Record<string, string> = {};
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined) {
        filteredParams[key] = String(value);
      }
    });

    // Call the mock function and return its value
    const response = await mockGet(url, { params: filteredParams });
    return response.data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Mock axiosInstance
const mockAxiosInstance = {
  get: mockGet,
};

// Default export
export default {
  get,
  axiosInstance: mockAxiosInstance,
};

// Export the mockGet function so tests can access it
export const __mockGet = mockGet;
