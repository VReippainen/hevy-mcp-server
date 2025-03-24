/**
 * API service for making HTTP requests with caching
 */
import { QueryParams } from '../types/index.js';
import axios from 'axios';
import { setupCache, buildMemoryStorage } from 'axios-cache-interceptor';
import config from '../config.js';

// Create a cached axios instance
const axiosInstance = setupCache(
  axios.create({
    headers: {
      'api-key': config.api.hevyApiKey,
      'Content-Type': 'application/json',
    },
  }),
  {
    storage: buildMemoryStorage(),
    ttl: 1000 * 60 * 5, // 5 minutes cache
    methods: ['get'], // Only cache GET requests
  }
);

/**
 * Makes a GET request to the specified URL with optional query parameters
 * Results are cached for 5 minutes by default
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

    // Make the request using cached axios instance
    const response = await axiosInstance.get<T>(url, {
      params: filteredParams,
    });

    return response.data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

export default {
  get,
  axiosInstance, // Export the axios instance in case it's needed elsewhere
};
