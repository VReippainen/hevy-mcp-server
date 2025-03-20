/**
 * Interface for a routine returned from the Hevy API
 */
export interface Routine {
  id: string;
  name: string;
  description: string;
  exercises: string[];
  createdAt: string;
  updatedAt: string;
}
