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
import { calculateEstimated1RM } from '../utils/oneRepMaxCalculator.js';

/**
 * Calculate statistics for a workout
 */
function calculateWorkoutStats(workout: Workout): WorkoutStats {
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
function analyzeProgressForExercise(
  exerciseId: string,
  workouts: Workout[]
): ExerciseProgressData[] {
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
async function fetchAllWorkouts(): Promise<Workout[]> {
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
async function fetchAllExerciseTemplates(): Promise<ExerciseTemplate[]> {
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
async function fetchAllRoutines(): Promise<Routine[]> {
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
 * Get workouts within a specific timeframe
 */
async function getWorkouts(startDate?: Date, endDate?: Date): Promise<Workout[]> {
  try {
    // Get all workouts
    const allWorkouts = await fetchAllWorkouts();

    // Filter workouts by both dates in a single pass
    const filteredWorkouts = allWorkouts.filter((workout) => {
      const workoutDate = new Date(workout.start_time);
      const afterStartDate = !startDate || workoutDate >= startDate;
      const beforeEndDate = !endDate || workoutDate <= endDate;
      return afterStartDate && beforeEndDate;
    });

    // Sort by date descending (most recent first)
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
 * Get comprehensive exercise data sorted by frequency of use
 * @param {string} [searchTerm] - Optional search term to filter exercises by name
 * @param {boolean} [excludeUnused=false] - If true, exclude exercises with 0 frequency (never used)
 * @param {string} [startDate] - Optional ISO date string to filter workouts after this date
 * @param {string} [endDate] - Optional ISO date string to filter workouts before this date
 * @returns Array of objects containing exercise data, sorted by frequency
 */
async function getExercises(
  searchTerm?: string,
  excludeUnused: boolean = false,
  startDate?: string,
  endDate?: string
) {
  try {
    // Get all exercise templates and workouts (filtered by date if provided)
    const [allExerciseTemplates, allWorkouts] = await Promise.all([
      fetchAllExerciseTemplates(),
      getWorkouts(
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      ),
    ]);

    // If either API call returned empty arrays, return empty result
    if (!allWorkouts.length || !allExerciseTemplates.length) {
      return [];
    }

    // Filter exercise templates by search term if provided (early filtering)
    const filteredExerciseTemplates = searchTerm
      ? allExerciseTemplates.filter((template) =>
          template.title.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : allExerciseTemplates;

    // If no matches found, return early
    if (!filteredExerciseTemplates.length) {
      return [];
    }

    // Create a map of exercise IDs for quick lookup of filtered exercises
    const filteredExerciseIds = new Set(filteredExerciseTemplates.map((template) => template.id));

    // Create a map to count exercise frequencies and track max weights by rep
    const exerciseFrequency = new Map<string, number>();
    const exerciseRecords = new Map<string, Map<number, { weight: number; date: string }>>();

    // Count exercises across filtered workouts and track records
    for (const workout of allWorkouts) {
      // Use a set to count each exercise only once per workout for frequency
      const exercisesInWorkout = new Set<string>();

      for (const exercise of workout.exercises) {
        const exerciseId = exercise.exercise_template_id;

        // Skip if not in our filtered set
        if (!filteredExerciseIds.has(exerciseId)) continue;

        exercisesInWorkout.add(exerciseId);

        // Initialize records map for this exercise if it doesn't exist
        if (!exerciseRecords.has(exerciseId)) {
          exerciseRecords.set(exerciseId, new Map<number, { weight: number; date: string }>());
        }

        // Track max weights by rep count
        for (const set of exercise.sets) {
          if (set.type === 'warmup' || !set.weight_kg || !set.reps) continue;

          const repCount = set.reps;
          const weight = set.weight_kg;
          const recordsMap = exerciseRecords.get(exerciseId)!;

          // Update if no record exists for this rep count or if weight is higher
          if (!recordsMap.has(repCount) || weight > recordsMap.get(repCount)!.weight) {
            recordsMap.set(repCount, {
              weight,
              date: workout.start_time,
            });
          }
        }
      }

      // Increment the frequency for each unique exercise in this workout
      for (const exerciseId of exercisesInWorkout) {
        exerciseFrequency.set(exerciseId, (exerciseFrequency.get(exerciseId) || 0) + 1);
      }
    }

    // Calculate estimated 1RM for each exercise using the utility function
    const exerciseOneRepMax = new Map<string, { weightKg: number; date: string }>();

    exerciseRecords.forEach((records, exerciseId) => {
      let highestEstimatedOneRM: number | null = null;
      let highestEstimatedDate: string | null = null;

      // Calculate 1RM for each rep/weight record and keep the highest valid estimate
      records.forEach(({ weight, date }, reps) => {
        // Use the utility function with default Brzycki formula
        const oneRM = calculateEstimated1RM(weight, reps);

        if (oneRM !== null && (highestEstimatedOneRM === null || oneRM > highestEstimatedOneRM)) {
          highestEstimatedOneRM = oneRM;
          highestEstimatedDate = date;
        }
      });

      if (highestEstimatedOneRM !== null && highestEstimatedDate !== null) {
        // Round to 1 decimal place
        exerciseOneRepMax.set(exerciseId, {
          weightKg: Math.round(highestEstimatedOneRM * 10) / 10,
          date: highestEstimatedDate,
        });
      }
    });

    // Get actual 1RM (max weight lifted for 1 rep)
    const exerciseActualOneRM = new Map<string, { weightKg: number; date: string }>();

    exerciseRecords.forEach((records, exerciseId) => {
      // Find the maximum weight lifted across all rep counts
      let maxWeight = 0;
      let maxWeightDate = '';

      records.forEach(({ weight, date }) => {
        if (weight > maxWeight) {
          maxWeight = weight;
          maxWeightDate = date;
        }
      });

      if (maxWeight > 0) {
        exerciseActualOneRM.set(exerciseId, {
          weightKg: maxWeight,
          date: maxWeightDate,
        });
      }
    });

    // Create result array with exercise details, frequency and 1RM data
    let exerciseData = filteredExerciseTemplates.map((template) => {
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

    // Filter out exercises with zero frequency if requested
    if (excludeUnused) {
      exerciseData = exerciseData.filter((exercise) => exercise.frequency > 0);
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
async function populateCache(): Promise<void> {
  await Promise.all([fetchAllExerciseTemplates(), fetchAllRoutines(), fetchAllWorkouts()]);
}

/**
 * Calculate records by reps from progress data
 * @param progressData Array of exercise progress data
 * @returns Records for each rep count
 */
function calculateRecordsByReps(progressData: ExerciseProgressData[]): {
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

/**
 * Process progress data for a single exercise
 * @param exerciseId Exercise ID to analyze
 * @param allExercises List of all exercise templates
 * @param workouts List of all workouts
 * @param limit Number of latest sessions to return
 * @returns Progress data and records for the exercise
 */
function processExerciseProgress(exercise: ExerciseTemplate, workouts: Workout[], limit: number) {
  // Get progress data for this exercise
  const progress = analyzeProgressForExercise(exercise.id, workouts);
  const personalRecords = calculateRecordsByReps(progress);

  return {
    exercise,
    personalRecords,
    sessions: progress.slice(0, limit),
  };
}

export default {
  calculateWorkoutStats,
  analyzeProgressForExercise,
  fetchAllExerciseTemplates,
  fetchAllRoutines,
  getWorkouts,
  fetchAllWorkouts,
  populateCache,
  calculateRecordsByReps,
  getExercises,
  processExerciseProgress,
};
