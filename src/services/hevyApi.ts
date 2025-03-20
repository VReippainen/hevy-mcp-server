/**
 * Service for interacting with the Hevy API
 */
import {
  ExerciseTemplate,
  ExerciseTemplateResponse,
  Routine,
  Workout,
  WorkoutResponse,
  QueryParams,
} from '../types/index';
import config from '../config';

// Base URL for the Hevy API from config
const HEVY_API_BASE_URL = config.api.hevyBaseUrl;

// API key for authentication from config
const API_KEY = config.api.hevyApiKey;

/**
 * Headers required for Hevy API requests
 */
const getHeaders = () => {
  return {
    'api-key': API_KEY,
    'Content-Type': 'application/json',
  };
};

/**
 * Generic fetch function for Hevy API
 * @param {string} endpoint - API endpoint path
 * @param {QueryParams} params - Query parameters
 * @returns {Promise<T>} - Promise resolving to the parsed response
 */
async function fetchFromHevy<T>(endpoint: string, params: QueryParams = {}): Promise<T> {
  try {
    // Ensure common params are included with defaults
    const queryParams = {
      page: 1,
      pageSize: 10,
      ...params,
    };

    // Build query string from parameters
    const queryString = Object.keys(queryParams).length
      ? '?' +
        new URLSearchParams(
          Object.entries(queryParams).map(([key, value]) => [key, String(value)])
        ).toString()
      : '';

    const response = await fetch(`${HEVY_API_BASE_URL}/${endpoint}${queryString}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    return await response.json() as T;
  } catch (error) {
    console.error(`Error fetching from ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Get workouts from the Hevy API
 * @param {QueryParams} [params={}] - Optional parameters to filter workouts
 * @returns {Promise<Workout[]>} - Promise resolving to an array of workouts
 */
export const getWorkouts = async (params: QueryParams = {}): Promise<Workout[]> => {
  const data = await fetchFromHevy<WorkoutResponse>('workouts', params);
  return data.workouts;
};

/**
 * Get routines from the Hevy API
 * @param {QueryParams} [params={}] - Optional parameters to filter routines
 * @returns {Promise<Routine[]>} - Promise resolving to an array of routines
 */
export const getRoutines = async (params: QueryParams = {}): Promise<Routine[]> => {
  const data = await fetchFromHevy<{ routines: Routine[] }>('routines', params);
  return data.routines || [];
};

/**
 * Get exercise templates from the Hevy API
 * @param {QueryParams} [params={}] - Optional parameters to filter exercise templates
 * @returns {Promise<ExerciseTemplate[]>} - Promise resolving to an array of exercise templates
 */
export const getExercises = async (params: QueryParams = {}): Promise<ExerciseTemplate[]> => {
  const data = await fetchFromHevy<ExerciseTemplateResponse>('exercise_templates', params);
  return data.exercise_templates;
};

export default {
  getWorkouts,
  getRoutines,
  getExercises,
};
