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
