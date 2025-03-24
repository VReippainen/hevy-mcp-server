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
  startDate: string;
}

export interface AnalyzeWorkoutVolumeParams {
  timeframe: 'week' | 'month' | 'quarter' | 'year';
}
