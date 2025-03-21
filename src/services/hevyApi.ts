/**
 * Service for interacting with the Hevy API
 */
import {
  ExerciseTemplate,
  ExerciseTemplateResponse,
  Routine,
  Workout,
  WorkoutResponse,
  PaginationParams,
} from '../types/index';
import { validatePagination } from '../utils/validation';
import config from '../config';

/**
 * Headers required for Hevy API requests
 */
const getHeaders = () => {
  return {
    'api-key': config.api.hevyApiKey,
    'Content-Type': 'application/json',
  };
};

/**
 * Generic fetch function for Hevy API
 * @param {string} endpoint - API endpoint path
 * @param {PaginationParams} params - Pagination parameters
 * @returns {Promise<T>} - Promise resolving to the parsed response
 */
async function fetchFromHevy<T>(endpoint: string, params: PaginationParams = {}): Promise<T> {
  try {
    // Validate pagination parameters
    const validatedParams = validatePagination(params);

    // Ensure common params are included with defaults
    const queryParams = {
      page: 1,
      pageSize: 10,
      ...validatedParams,
    };

    // Build query string from parameters
    const queryString = Object.keys(queryParams).length
      ? '?' +
        new URLSearchParams(
          Object.entries(queryParams).map(([key, value]) => [key, String(value)])
        ).toString()
      : '';

    const response = await fetch(`${config.api.hevyBaseUrl}/${endpoint}${queryString}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error(`Error fetching from ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Get workouts from the Hevy API
 * @param {PaginationParams} [params={}] - Pagination parameters
 * @param {number} [params.page] - Page number (must be greater than 0)
 * @param {number} [params.pageSize] - Page size (must be between 1 and 10)
 * @returns {Promise<Workout[]>} - Promise resolving to an array of workouts
 * @throws {Error} - If page or pageSize validation fails
 */
export const getWorkouts = async (params: PaginationParams = {}): Promise<Workout[]> => {
  const data = await fetchFromHevy<WorkoutResponse>('workouts', params);
  return data.workouts;
};

/**
 * Get routines from the Hevy API
 * @param {PaginationParams} [params={}] - Pagination parameters
 * @param {number} [params.page] - Page number (must be greater than 0)
 * @param {number} [params.pageSize] - Page size (must be between 1 and 10)
 * @returns {Promise<Routine[]>} - Promise resolving to an array of routines
 * @throws {Error} - If page or pageSize validation fails
 */
export const getRoutines = async (params: PaginationParams = {}): Promise<Routine[]> => {
  const data = await fetchFromHevy<{ routines: Routine[] }>('routines', params);
  return data.routines || [];
};

/**
 * Get exercise templates from the Hevy API
 * @param {PaginationParams} [params={}] - Pagination parameters
 * @param {number} [params.page] - Page number (must be greater than 0)
 * @param {number} [params.pageSize] - Page size (must be between 1 and 10)
 * @returns {Promise<ExerciseTemplate[]>} - Promise resolving to an array of exercise templates
 * @throws {Error} - If page or pageSize validation fails
 */
export const getExercises = async (params: PaginationParams = {}): Promise<ExerciseTemplate[]> => {
  const data = await fetchFromHevy<ExerciseTemplateResponse>('exercise_templates', params);
  return data.exercise_templates;
};

export default {
  getWorkouts,
  getRoutines,
  getExercises,
};
