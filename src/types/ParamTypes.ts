export interface GetRecentWorkoutsParams {
  limit: number;
}

export interface GetWorkoutDetailsParams {
  workoutId: string;
}

export interface GetExerciseIdByNameParams {
  searchTerm: string;
}

export interface GetExerciseProgressParams {
  exerciseId: string;
  limit: number;
}

export interface AnalyzeWorkoutVolumeParams {
  timeframe: 'week' | 'month' | 'quarter' | 'year';
}

export interface GetExercisesParams {
  searchTerm?: string;
}
