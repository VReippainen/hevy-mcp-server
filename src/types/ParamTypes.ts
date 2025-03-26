export interface GetRecentWorkoutsParams {
  limit: number;
  startDate?: string;
  endDate?: string;
}

export interface GetExerciseProgressParams {
  exerciseId: string;
  limit: number;
}

export interface GetExercisesParams {
  searchTerm?: string;
  excludeUnused?: boolean;
  startDate?: string;
  endDate?: string;
}
