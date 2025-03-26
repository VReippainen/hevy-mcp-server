export interface GetWorkoutsParams {
  limit: number;
  startDate?: string;
  endDate?: string;
}

export interface GetExerciseProgressParams {
  exerciseIds: string[];
  limit: number;
  startDate?: string;
  endDate?: string;
}

export interface GetExercisesParams {
  searchTerm?: string;
  excludeUnused?: boolean;
  startDate?: string;
  endDate?: string;
}
