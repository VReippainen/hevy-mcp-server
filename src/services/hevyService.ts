/**
 * Hevy Service - Contains functions for processing and analyzing workout data
 */
import {
  Workout,
  ExerciseTemplate,
  Routine,
  ExerciseProgressData,
  WorkoutStats,
} from '../types/index.js';
import hevyApi from './hevyApi.js';

/**
 * Calculate statistics for a workout
 */
export function calculateWorkoutStats(workout: Workout): WorkoutStats {
  // Calculate duration in minutes
  const startTime = new Date(workout.start_time).getTime();
  const endTime = new Date(workout.end_time).getTime();
  const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));

  // Calculate total volume (weight × reps)
  let totalVolume = 0;
  let totalSets = 0;
  let exerciseCount = workout.exercises.length;

  for (const exercise of workout.exercises) {
    for (const set of exercise.sets) {
      totalSets++;
      if (set.weight_kg && set.reps) {
        totalVolume += set.weight_kg * set.reps;
      }
    }
  }

  return {
    durationMinutes,
    exerciseCount,
    totalSets,
    totalVolume,
  };
}

/**
 * Analyze progress for a specific exercise across multiple workouts
 */
export async function analyzeProgressForExercise(
  exerciseId: string
): Promise<ExerciseProgressData[]> {
  const workouts = await fetchAllWorkouts();
  // Use filter to get only workouts containing the exercise, then map to transform them
  const exerciseDataFromWorkouts = workouts
    .filter((workout) => workout.exercises.some((ex) => ex.exercise_template_id === exerciseId))
    .map((workout) => {
      const exercise = workout.exercises.find((ex) => ex.exercise_template_id === exerciseId)!;

      return {
        date: workout.start_time,
        sets: exercise.sets.map((set) => ({
          index: set.index,
          type: set.type,
          weightKg: set.weight_kg,
          reps: set.reps,
        })),
      };
    });

  // Sort by date
  exerciseDataFromWorkouts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return exerciseDataFromWorkouts;
}

/**
 * Fetch all workouts by handling pagination
 * @returns Promise with array of all workouts
 */
export async function fetchAllWorkouts(): Promise<Workout[]> {
  try {
    const startTime = new Date();
    const MAX_PAGE_SIZE = 10;

    // Get the first page to determine total page count
    const firstPageResponse = await hevyApi.getWorkouts({ page: 1, pageSize: MAX_PAGE_SIZE });
    const totalPages = firstPageResponse.pageCount;

    // If there's only one page, return it directly
    if (totalPages <= 1) {
      return firstPageResponse.workouts;
    }

    // Create an array of promises for pages 2 through totalPages
    const pagePromises = Array.from({ length: totalPages - 1 }, (_, i) => {
      return hevyApi.getWorkouts({ page: i + 2, pageSize: MAX_PAGE_SIZE });
    });

    // Fetch all pages concurrently
    const pageResponses = await Promise.all(pagePromises);

    // Combine all workouts
    const allWorkouts = [
      ...firstPageResponse.workouts,
      ...pageResponses.flatMap((response) => response.workouts),
    ];

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    console.warn(`Fetched ${allWorkouts.length} workouts in ${duration}ms`);

    return allWorkouts;
  } catch (error) {
    console.error('Error fetching all workouts:', error);
    return [];
  }
}

/**
 * Fetch all exercise templates by handling pagination
 * @returns Promise with array of all exercise templates
 */
export async function fetchAllExerciseTemplates(): Promise<ExerciseTemplate[]> {
  try {
    const startTime = new Date();
    const MAX_PAGE_SIZE = 10;

    // Get the first page to determine total page count
    const firstPageResponse = await hevyApi.getExercises({ page: 1, pageSize: MAX_PAGE_SIZE });
    const totalPages = firstPageResponse.pageCount;

    // If there's only one page, return it directly
    if (totalPages <= 1) {
      return firstPageResponse.exercises;
    }

    // Create an array of promises for pages 2 through totalPages
    const pagePromises = Array.from({ length: totalPages - 1 }, (_, i) => {
      return hevyApi.getExercises({ page: i + 2, pageSize: MAX_PAGE_SIZE });
    });

    // Fetch all pages concurrently
    const pageResponses = await Promise.all(pagePromises);

    // Combine all exercises
    const allExercises = [
      ...firstPageResponse.exercises,
      ...pageResponses.flatMap((response) => response.exercises),
    ];

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    console.warn(`Fetched ${allExercises.length} exercise templates in ${duration}ms`);

    return allExercises;
  } catch (error) {
    console.error('Error fetching all exercise templates:', error);
    return [];
  }
}

/**
 * Fetch all routines by handling pagination
 * @returns Promise with array of all routines
 */
export async function fetchAllRoutines(): Promise<Routine[]> {
  try {
    const MAX_PAGE_SIZE = 10;

    // Get the first page to determine total page count
    const firstPageResponse = await hevyApi.getRoutines({ page: 1, pageSize: MAX_PAGE_SIZE });
    const totalPages = firstPageResponse.pageCount;

    // If there's only one page, return it directly
    if (totalPages <= 1) {
      return firstPageResponse.routines;
    }

    // Create an array of promises for pages 2 through totalPages
    const pagePromises = Array.from({ length: totalPages - 1 }, (_, i) => {
      return hevyApi.getRoutines({ page: i + 2, pageSize: MAX_PAGE_SIZE });
    });

    // Fetch all pages concurrently
    const pageResponses = await Promise.all(pagePromises);

    // Combine all routines
    const allRoutines = [
      ...firstPageResponse.routines,
      ...pageResponses.flatMap((response) => response.routines),
    ];

    return allRoutines;
  } catch (error) {
    console.error('Error fetching all routines:', error);
    return [];
  }
}

/**
 * Get recent workouts for a user
 */
export async function getRecentWorkouts(limit: number = 10): Promise<Workout[]> {
  try {
    // Use fetchAllWorkouts instead to get all workouts, then take the most recent ones
    const allWorkouts = await fetchAllWorkouts();

    // Sort by start_time descending (most recent first)
    const sortedWorkouts = [...allWorkouts].sort(
      (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
    );

    // Take only the number requested
    const recentWorkouts = sortedWorkouts.slice(0, limit);

    return recentWorkouts;
  } catch (error) {
    console.error('Error fetching recent workouts:', error);
    return [];
  }
}

/**
 * Get detailed information about a specific workout
 */
export async function getWorkoutDetails(workoutId: string): Promise<Workout | null> {
  try {
    // Get all workouts and find the one with the matching ID
    const allWorkouts = await fetchAllWorkouts();
    const workout = allWorkouts.find((w) => w.id === workoutId);
    return workout ?? null;
  } catch (error) {
    console.error(`Error fetching workout details for ID ${workoutId}:`, error);
    return null;
  }
}

/**
 * Get exercise details by ID
 */
export async function getExerciseById(exerciseId: string): Promise<ExerciseTemplate | null> {
  try {
    // Get all exercise templates and find the one with the matching ID
    const allExercises = await fetchAllExerciseTemplates();
    const exercise = allExercises.find((e) => e.id === exerciseId);
    return exercise ?? null;
  } catch (error) {
    console.error(`Error fetching exercise details for ID ${exerciseId}:`, error);
    return null;
  }
}

/**
 * Get exercise details by ID
 */
export async function searchExercisesByName(searchTerm: string): Promise<ExerciseTemplate[]> {
  try {
    // Get all exercise templates and find the one with the matching ID
    const allExercises = await fetchAllExerciseTemplates();
    const exercises = allExercises.filter((e) =>
      e.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return exercises ?? [];
  } catch (error) {
    console.error(`Error fetching exercise details for search term ${searchTerm}:`, error);
    return [];
  }
}

/**
 * Get workouts within a specific timeframe
 */
export async function getWorkoutsInTimeframe(startDate: Date): Promise<Workout[]> {
  try {
    // Get all workouts
    const allWorkouts = await fetchAllWorkouts();

    // Filter workouts by start date
    const filteredWorkouts = allWorkouts.filter(
      (workout) => new Date(workout.start_time) >= startDate
    );

    // Sort by date descending (most recent first) and limit the results
    const sortedWorkouts = [...filteredWorkouts].sort(
      (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
    );

    return sortedWorkouts;
  } catch (error) {
    console.error('Error fetching workouts in timeframe:', error);
    return [];
  }
}

/**
 * Get favorite exercises sorted by frequency of use
 * @returns Array of objects containing exercise id, name and frequency
 */
export async function getFavoriteExercises() {
  try {
    // Get all workouts and exercise templates
    const [allWorkouts, allExerciseTemplates] = await Promise.all([
      fetchAllWorkouts(),
      fetchAllExerciseTemplates(),
    ]);

    // Create a map to count exercise frequencies
    const exerciseFrequency = new Map<string, number>();

    // Count exercises across all workouts
    for (const workout of allWorkouts) {
      // Use a set to count each exercise only once per workout
      const exercisesInWorkout = new Set<string>();

      for (const exercise of workout.exercises) {
        exercisesInWorkout.add(exercise.exercise_template_id);
      }

      // Increment the frequency for each unique exercise in this workout
      for (const exerciseId of exercisesInWorkout) {
        exerciseFrequency.set(exerciseId, (exerciseFrequency.get(exerciseId) || 0) + 1);
      }
    }

    // Create result array with exercise details and frequency
    const favoriteExercises = Array.from(exerciseFrequency.entries())
      .map(([exerciseId, frequency]) => {
        // Find the exercise template to get the name
        const exerciseTemplate = allExerciseTemplates.find(
          (template) => template.id === exerciseId
        );
        return {
          id: exerciseId,
          name: exerciseTemplate?.title || 'Unknown Exercise',
          frequency,
        };
      })
      // Sort by frequency in descending order
      .sort((a, b) => b.frequency - a.frequency);

    return favoriteExercises;
  } catch (error) {
    console.error('Error getting favorite exercises:', error);
    return [];
  }
}

/**
 * Get all exercises with comprehensive data
 * @param {string} [searchTerm] - Optional search term to filter exercises by name
 * @returns Array of objects containing exercise data, sorted by frequency
 */
export async function getExercises(searchTerm?: string) {
  try {
    // Get all workouts and exercise templates
    const allWorkoutsPromise = fetchAllWorkouts();
    const allExerciseTemplatesPromise = fetchAllExerciseTemplates();

    // Wait for both promises to resolve or reject
    const [allWorkouts, allExerciseTemplates] = await Promise.all([
      allWorkoutsPromise,
      allExerciseTemplatesPromise,
    ]);

    // If either API call returned empty arrays, return empty result
    if (!allWorkouts.length || !allExerciseTemplates.length) {
      return [];
    }

    // Create a map to count exercise frequencies and track max weights by rep
    const exerciseFrequency = new Map<string, number>();
    const exerciseRecords = new Map<string, Map<number, number>>();

    // Count exercises across all workouts and track records
    for (const workout of allWorkouts) {
      // Use a set to count each exercise only once per workout for frequency
      const exercisesInWorkout = new Set<string>();

      for (const exercise of workout.exercises) {
        const exerciseId = exercise.exercise_template_id;
        exercisesInWorkout.add(exerciseId);

        // Initialize records map for this exercise if it doesn't exist
        if (!exerciseRecords.has(exerciseId)) {
          exerciseRecords.set(exerciseId, new Map<number, number>());
        }

        // Track max weights by rep count
        for (const set of exercise.sets) {
          if (set.type === 'warmup' || !set.weight_kg || !set.reps) continue;

          const repCount = set.reps;
          const weight = set.weight_kg;
          const recordsMap = exerciseRecords.get(exerciseId)!;

          if (!recordsMap.has(repCount) || weight > recordsMap.get(repCount)!) {
            recordsMap.set(repCount, weight);
          }
        }
      }

      // Increment the frequency for each unique exercise in this workout
      for (const exerciseId of exercisesInWorkout) {
        exerciseFrequency.set(exerciseId, (exerciseFrequency.get(exerciseId) || 0) + 1);
      }
    }

    // Calculate estimated 1RM for each exercise
    const exerciseOneRepMax = new Map<string, number>();

    exerciseRecords.forEach((records, exerciseId) => {
      let estimatedOneRM = 0;

      // Use Brzycki formula for each rep/weight record and keep the highest estimate
      records.forEach((weight, reps) => {
        if (reps <= 10) {
          // Brzycki formula is most accurate for reps ≤ 10
          const oneRM = weight * (36 / (37 - reps));
          if (oneRM > estimatedOneRM) {
            estimatedOneRM = oneRM;
          }
        }
      });

      if (estimatedOneRM > 0) {
        exerciseOneRepMax.set(exerciseId, Math.round(estimatedOneRM * 10) / 10); // Round to 1 decimal
      }
    });

    // Get actual 1RM (max weight lifted for 1 rep)
    const exerciseActualOneRM = new Map<string, number>();

    exerciseRecords.forEach((records, exerciseId) => {
      if (records.has(1)) {
        exerciseActualOneRM.set(exerciseId, records.get(1)!);
      }
    });

    // Create result array with exercise details, frequency and 1RM data
    let exerciseData = allExerciseTemplates.map((template) => {
      return {
        id: template.id,
        name: template.title,
        frequency: exerciseFrequency.get(template.id) || 0,
        estimated1RM: exerciseOneRepMax.get(template.id) || null,
        actual1RM: exerciseActualOneRM.get(template.id) || null,
        type: template.type,
        primary_muscle_group: template.primary_muscle_group,
        secondary_muscle_groups: template.secondary_muscle_groups,
        equipment: template.equipment,
      };
    });

    // Filter by search term if provided
    if (searchTerm) {
      exerciseData = exerciseData.filter((ex) =>
        ex.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by frequency in descending order
    exerciseData.sort((a, b) => b.frequency - a.frequency);

    return exerciseData;
  } catch (error) {
    console.error('Error getting exercises data:', error);
    return [];
  }
}

/**
 * Populate the cache with initial data
 * Pre-fetches all exercise templates, routines, and workouts
 */
export async function populateCache(): Promise<void> {
  await Promise.all([fetchAllExerciseTemplates(), fetchAllRoutines(), fetchAllWorkouts()]);
}

/**
 * Calculate records by reps from progress data
 * @param progressData Array of exercise progress data
 * @returns Records for each rep count
 */
export function calculateRecordsByReps(progressData: ExerciseProgressData[]): {
  reps: number;
  weight_kg: number;
  date: string;
}[] {
  // Create a map to track best weight for each rep count
  const recordsByReps = new Map<number, { weight_kg: number; date: string }>();

  // Process all workout data
  for (const workout of progressData) {
    // Process each set to find PRs
    for (const set of workout.sets) {
      // Skip warmup sets for PR calculations
      if (set.type === 'warmup') continue;

      const repCount = set.reps;
      const weight = set.weightKg;

      // Update record if this weight is heavier for this rep count
      if (!recordsByReps.has(repCount) || weight > recordsByReps.get(repCount)!.weight_kg) {
        recordsByReps.set(repCount, {
          weight_kg: weight,
          date: workout.date,
        });
      }
    }
  }

  // Convert to array format and sort by rep count
  return Array.from(recordsByReps.entries())
    .map(([reps, record]) => ({
      reps,
      weight_kg: record.weight_kg,
      date: record.date,
    }))
    .sort((a, b) => a.reps - b.reps);
}

export default {
  calculateWorkoutStats,
  analyzeProgressForExercise,
  fetchAllWorkouts,
  fetchAllExerciseTemplates,
  fetchAllRoutines,
  getRecentWorkouts,
  getWorkoutDetails,
  searchExercisesByName,
  getWorkoutsInTimeframe,
  getExerciseById,
  getFavoriteExercises,
  populateCache,
  calculateRecordsByReps,
  getExercises,
};
