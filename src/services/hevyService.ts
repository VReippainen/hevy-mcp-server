/**
 * Hevy Service - Contains functions for processing and analyzing workout data
 */
import { Workout, ExerciseTemplate, Routine } from '../types/index.js';
import hevyApi from './hevyApi.js';

/**
 * Interface for exercise progress data
 */
export interface ExerciseProgressData {
  date: string;
  maxVolume: number;
  maxWeight: number;
  maxReps: number;
  recordsByReps: {
    reps: number;
    weight_kg: number;
    date: string;
  }[];
}

/**
 * Interface for workout statistics
 */
export interface WorkoutStats {
  durationMinutes: number;
  exerciseCount: number;
  totalSets: number;
  totalVolume: number;
}

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
export function analyzeProgressForExercise(
  workouts: Workout[],
  exerciseId: string
): ExerciseProgressData[] {
  const exerciseData: ExerciseProgressData[] = [];

  // Track all-time best records for each rep count
  const allTimeRepRecords = new Map<number, { weight_kg: number; date: string }>();

  // First pass: collect all-time records
  for (const workout of workouts) {
    const exercise = workout.exercises.find((ex) => ex.exercise_template_id === exerciseId);
    if (!exercise) continue;

    for (const set of exercise.sets) {
      // Skip warmup sets for PR calculations
      if (set.type === 'warmup') continue;

      // Update all-time records if this weight is heavier for this rep count
      if (
        !allTimeRepRecords.has(set.reps) ||
        set.weight_kg > allTimeRepRecords.get(set.reps)!.weight_kg
      ) {
        allTimeRepRecords.set(set.reps, {
          weight_kg: set.weight_kg,
          date: workout.start_time,
        });
      }
    }
  }

  // Second pass: collect per-workout data
  for (const workout of workouts) {
    const exercise = workout.exercises.find((ex) => ex.exercise_template_id === exerciseId);
    if (!exercise) continue;

    // Find the heaviest weight × reps for this exercise in this workout
    let maxVolume = 0;
    let maxWeight = 0;
    let maxReps = 0;

    for (const set of exercise.sets) {
      // Skip warmup sets for PR calculations
      if (set.type === 'warmup') continue;

      const volume = set.weight_kg * set.reps;
      if (volume > maxVolume) maxVolume = volume;
      if (set.weight_kg > maxWeight) maxWeight = set.weight_kg;
      if (set.reps > maxReps) maxReps = set.reps;
    }

    // Convert all-time records to array format
    const recordsByReps = Array.from(allTimeRepRecords.entries())
      .map(([reps, record]) => ({
        reps,
        weight_kg: record.weight_kg,
        date: record.date,
      }))
      .sort((a, b) => a.reps - b.reps); // Sort by rep count for consistency

    exerciseData.push({
      date: workout.start_time,
      maxVolume,
      maxWeight,
      maxReps,
      recordsByReps,
    });
  }

  // Sort by date
  exerciseData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return exerciseData;
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
export async function getExerciseDetailsById(exerciseId: string): Promise<ExerciseTemplate | null> {
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
export async function searchExerciseTemplatesByName(
  searchTerm: string
): Promise<ExerciseTemplate[]> {
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
 * Calculate volume by muscle group
 */
export function calculateVolumeByMuscleGroup(
  workouts: Workout[],
  exercises: ExerciseTemplate[]
): {
  muscleGroup: string;
  volume: number;
  sets: number;
}[] {
  const volumeByMuscle: Record<string, number> = {};
  const setsByMuscle: Record<string, number> = {};

  for (const workout of workouts) {
    for (const exercise of workout.exercises) {
      const template = exercises.find((e) => e.id === exercise.exercise_template_id);
      if (!template) continue;

      const muscleGroup = template.primary_muscle_group;
      if (!volumeByMuscle[muscleGroup]) {
        volumeByMuscle[muscleGroup] = 0;
        setsByMuscle[muscleGroup] = 0;
      }

      // Calculate and add volume for this exercise
      for (const set of exercise.sets) {
        if (set.weight_kg && set.reps) {
          const setVolume = set.weight_kg * set.reps;
          volumeByMuscle[muscleGroup] += setVolume;
          setsByMuscle[muscleGroup]++;
        } else {
          // Count the set even if it doesn't have weight/reps
          setsByMuscle[muscleGroup]++;
        }
      }
    }
  }

  const sortedMuscles = Object.keys(volumeByMuscle).sort(
    (a, b) => volumeByMuscle[b] - volumeByMuscle[a]
  );

  // Prepare volume data
  const volumeData = sortedMuscles.map((muscle) => {
    const volume = Math.round(volumeByMuscle[muscle]);
    return {
      muscleGroup: muscle,
      volume,
      sets: setsByMuscle[muscle],
    };
  });
  return volumeData;
}

/**
 * Analyze muscle group frequency and last workout dates
 */
export function analyzeMuscleGroupFrequency(
  workouts: Workout[],
  exerciseMap: Record<string, ExerciseTemplate>
): {
  muscleGroup: string;
  frequency: number;
  lastWorkedOut: Date;
}[] {
  const muscleGroupFrequency: Record<string, number> = {};
  const lastWorkedOut: Record<string, Date> = {};

  workouts.forEach((workout) => {
    const workoutDate = new Date(workout.start_time);

    workout.exercises.forEach((exercise) => {
      const template = exerciseMap[exercise.exercise_template_id];
      if (!template) return;

      const muscleGroup = template.primary_muscle_group;

      // Count frequency
      if (!muscleGroupFrequency[muscleGroup]) {
        muscleGroupFrequency[muscleGroup] = 0;
      }
      muscleGroupFrequency[muscleGroup]++;

      // Track last workout date
      if (!lastWorkedOut[muscleGroup] || workoutDate > lastWorkedOut[muscleGroup]) {
        lastWorkedOut[muscleGroup] = workoutDate;
      }
    });
  });

  // Convert to array of objects
  const muscleGroups = Object.keys(muscleGroupFrequency).map((muscleGroup) => ({
    muscleGroup,
    frequency: muscleGroupFrequency[muscleGroup],
    lastWorkedOut: lastWorkedOut[muscleGroup],
  }));

  return muscleGroups;
}

export default {
  calculateWorkoutStats,
  analyzeProgressForExercise,
  fetchAllWorkouts,
  fetchAllExerciseTemplates,
  fetchAllRoutines,
  getRecentWorkouts,
  getWorkoutDetails,
  searchExerciseTemplatesByName,
  getWorkoutsInTimeframe,
  calculateVolumeByMuscleGroup,
  analyzeMuscleGroupFrequency,
  getExerciseDetailsById,
};
