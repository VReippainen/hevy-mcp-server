/**
 * Interface for a routine returned from the Hevy API
 */
export interface Routine {
  id: string;
  title: string;
  description: string;
  exercises: RoutineExercise[];
  createdAt: string;
  updatedAt: string;
}

interface RoutineExercise {
  exercise_template_id: string;
  title: string;
  sets: Set[];
}

interface Set {
  weight_kg: number;
  reps: number;
  index: number;
  type: string;
}

/**
 * Interface for the response containing a list of routines from the Hevy API
 */
export interface RoutineResponse {
  routines: Routine[];
  page: number;
  page_count: number;
}
