/**
 * API service for making HTTP requests
 */
import { QueryParams } from '../types/index.js';

/**
 * Makes a GET request to the specified URL with optional query parameters
 * @param {string} url - The base URL to fetch from
 * @param {QueryParams} [queryParams={}] - Optional query parameters as key-value pairs
 * @returns {Promise<T>} - The parsed JSON response
 */
export const get = async <T = Record<string, unknown>>(
  url: string,
  queryParams: QueryParams = {}
): Promise<T> => {
  try {
    // Filter out undefined values from the query parameters
    const filteredParams: Record<string, string> = {};
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined) {
        filteredParams[key] = String(value);
      }
    });

    // Build query string from parameters
    const queryString = Object.keys(filteredParams).length
      ? '?' + new URLSearchParams(filteredParams).toString()
      : '';

    // Make the request
    const response = await fetch(`${url}${queryString}`);

    // Check if the request was successful
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    // Parse and return the JSON response
    return (await response.json()) as T;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

export default {
  get,
};
