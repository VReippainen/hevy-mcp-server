/**
 * Interface for exercise progress data
 */
export interface ExerciseProgressData {
  date: string;
  sets: {
    index: number;
    type: 'normal' | 'warmup' | 'dropset' | 'failure';
    weightKg: number;
    reps: number;
  }[];
}
