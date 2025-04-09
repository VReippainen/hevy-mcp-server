/**
 * Tool functions for Hevy MCP Server
 * These functions implement the business logic for all the MCP tools
 */

import hevyService from './services/hevyService.js';
import {
  GetExercisesParams,
  GetWorkoutsParams,
  GetExerciseProgressParams,
} from './types/ParamTypes.js';
import { Response, createErrorResponse, createSuccessResponse } from './utils/responseUtils.js';

/**
 * Get workouts between start and end dates
 * Returns workouts in descending order of date and limits the number returned
 */
export async function getWorkouts({
  limit,
  startDate,
  endDate,
}: GetWorkoutsParams): Promise<Response> {
  const workouts = await hevyService.getWorkouts(
    startDate ? new Date(startDate) : undefined,
    endDate ? new Date(endDate) : undefined
  );

  if (!workouts) {
    return createErrorResponse('Failed to retrieve workouts');
  }

  // Format workout data with stats and limit the results
  const formattedWorkouts = workouts.slice(0, limit).map((workout) => {
    const stats = hevyService.calculateWorkoutStats(workout);
    return {
      id: workout.id,
      title: workout.title,
      date: new Date(workout.start_time).toISOString(),
      durationMinutes: stats.durationMinutes,
      totalVolume: stats.totalVolume,
      exercises: workout.exercises.map((exercise) => ({
        id: exercise.exercise_template_id,
        name: exercise.title,
        sets: exercise.sets.map((set) => ({
          weight: set.weight_kg,
          reps: set.reps,
        })),
      })),
    };
  });

  const response = {
    workouts: formattedWorkouts,
    totalWorkouts: workouts.length,
    returnedWorkouts: formattedWorkouts.length,
  };

  return createSuccessResponse(response);
}

/**
 * Get progress for specific exercises between start and end dates
 * Returns progress data in descending order of date and limits the number returned
 */
export async function getExerciseProgressByIds({
  exerciseIds,
  limit,
  startDate,
  endDate,
}: GetExerciseProgressParams): Promise<Response> {
  try {
    const [workouts, allExercises] = await Promise.all([
      hevyService.getWorkouts(
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      ),
      hevyService.fetchAllExerciseTemplates(),
    ]);

    // Get only relevant exercises
    const exercises = allExercises.filter((exercise) => exerciseIds.includes(exercise.id));

    if (!exercises?.length) {
      return createErrorResponse('No exercises found matching the provided IDs');
    }

    // Get progress for each exercise
    const exerciseProgress = exercises.map((exercise) =>
      hevyService.processExerciseProgress(exercise, workouts, limit)
    );

    return createSuccessResponse({ exerciseProgress });
  } catch (error) {
    console.error('Error processing exercise progress:', error);
    return createErrorResponse('Failed to process exercise progress data');
  }
}

/**
 * Get comprehensive exercise data sorted by frequency of use
 * Returns exercises in descending order of frequency and can filter by name
 */
export async function getExercises({
  searchTerm,
  excludeUnused,
  startDate,
  endDate,
}: GetExercisesParams): Promise<Response> {
  try {
    const exercises = await hevyService.getExercises(searchTerm, excludeUnused, startDate, endDate);

    if (!exercises?.length) {
      return createErrorResponse(
        searchTerm ? `No exercises found matching: ${searchTerm}` : 'No exercise data found'
      );
    }

    return createSuccessResponse({ exercises });
  } catch (error) {
    console.error('Error in get-exercises:', error);
    return createErrorResponse('Failed to retrieve exercises');
  }
}

/**
 * Get user's workout routines
 */
export async function getRoutines(): Promise<Response> {
  const routines = await hevyService.fetchAllRoutines();

  if (routines.length === 0) {
    return createErrorResponse('Failed to retrieve routines');
  }

  return createSuccessResponse({ routines });
}
