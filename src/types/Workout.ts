/**
 * Interface for a workout returned from the Hevy API
 */
export interface Workout {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  updated_at: string;
  created_at: string;
  exercises: WorkoutExercise[];
}

/**
 * Interface for an exercise within a workout
 */
export interface WorkoutExercise {
  index: number;
  title: string;
  notes: string;
  exercise_template_id: string;
  superset_id: number | null;
  sets: ExerciseSet[];
}

/**
 * Interface for a set within an exercise
 */
export interface ExerciseSet {
  index: number;
  type: 'normal' | 'warmup' | 'dropset' | 'failure';
  weight_kg: number;
  reps: number;
  distance_meters: number | null;
  duration_seconds: number | null;
  rpe: number | null;
  custom_metric: string | null;
}

/**
 * Interface for the workout response from API
 */
export interface WorkoutResponse {
  page: number;
  page_count: number;
  workouts: Workout[];
}
