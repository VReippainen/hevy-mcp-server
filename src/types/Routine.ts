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

/**
 * Interface for the response containing a list of routines from the Hevy API
 */
export interface RoutineResponse {
  routines: Routine[];
  page: number;
  page_count: number;
}
