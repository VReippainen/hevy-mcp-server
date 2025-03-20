/**
 * Interface for an exercise template returned from the Hevy API
 */
export interface ExerciseTemplate {
  id: string;
  title: string;
  type:
    | 'weight_reps'
    | 'reps_only'
    | 'distance'
    | 'duration'
    | 'weight_distance'
    | 'weight_duration'
    | string;
  primary_muscle_group: string;
  secondary_muscle_groups: string[];
  equipment: string;
  is_custom: boolean;
}

/**
 * Interface for the exercise templates response from API
 */
export interface ExerciseTemplateResponse {
  page: number;
  page_count: number;
  exercise_templates: ExerciseTemplate[];
}
