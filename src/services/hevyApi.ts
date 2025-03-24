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
  RoutineResponse,
} from '../types/index.js';
import config from '../config.js';
import { validatePagination } from '../utils/index.js';
import { get } from './api.js';

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

    const url = `${config.api.hevyBaseUrl}/${endpoint}`;

    // Use the get function from api.ts which handles caching
    return await get<T>(url, queryParams);
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
 * @returns {Promise<{workouts: Workout[], page: number, pageCount: number}>} - Promise resolving to workouts and pagination info
 * @throws {Error} - If page or pageSize validation fails
 */
export const getWorkouts = async (
  params: PaginationParams = {}
): Promise<{ workouts: Workout[]; page: number; pageCount: number }> => {
  const data = await fetchFromHevy<WorkoutResponse>('workouts', params);
  return {
    workouts: data.workouts,
    page: data.page,
    pageCount: data.page_count,
  };
};

/**
 * Get routines from the Hevy API
 * @param {PaginationParams} [params={}] - Pagination parameters
 * @param {number} [params.page] - Page number (must be greater than 0)
 * @param {number} [params.pageSize] - Page size (must be between 1 and 10)
 * @returns {Promise<{routines: Routine[], page: number, pageCount: number}>} - Promise resolving to routines and pagination info
 * @throws {Error} - If page or pageSize validation fails
 */
export const getRoutines = async (
  params: PaginationParams = {}
): Promise<{ routines: Routine[]; page: number; pageCount: number }> => {
  const data = await fetchFromHevy<RoutineResponse>('routines', params);
  return {
    routines: data.routines || [],
    page: data.page,
    pageCount: data.page_count,
  };
};

/**
 * Get exercise templates from the Hevy API
 * @param {PaginationParams} [params={}] - Pagination parameters
 * @param {number} [params.page] - Page number (must be greater than 0)
 * @param {number} [params.pageSize] - Page size (must be between 1 and 10)
 * @returns {Promise<{exercises: ExerciseTemplate[], page: number, pageCount: number}>} - Promise resolving to exercise templates and pagination info
 * @throws {Error} - If page or pageSize validation fails
 */
export const getExercises = async (
  params: PaginationParams = {}
): Promise<{ exercises: ExerciseTemplate[]; page: number; pageCount: number }> => {
  const data = await fetchFromHevy<ExerciseTemplateResponse>('exercise_templates', params);
  return {
    exercises: data.exercise_templates,
    page: data.page,
    pageCount: data.page_count,
  };
};

export default {
  getWorkouts,
  getRoutines,
  getExercises,
};
