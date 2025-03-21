/**
 * Mock implementation of the HevyAPI module for testing
 */

// Create mock workout data
const mockWorkouts = [
  {
    id: '1',
    title: 'Workout 1',
    description: '',
    start_time: '',
    end_time: '',
    updated_at: '',
    created_at: '',
    exercises: [],
  },
  {
    id: '2',
    title: 'Workout 2',
    description: '',
    start_time: '',
    end_time: '',
    updated_at: '',
    created_at: '',
    exercises: [],
  },
];

// Create mock routine data
const mockRoutines = [
  { id: '1', name: 'Routine 1', description: '', exercises: [], createdAt: '', updatedAt: '' },
  { id: '2', name: 'Routine 2', description: '', exercises: [], createdAt: '', updatedAt: '' },
];

// Create mock exercise data
const mockExercises = [
  {
    id: '1',
    title: 'Exercise 1',
    type: 'weight_reps',
    primary_muscle_group: 'chest',
    secondary_muscle_groups: [],
    equipment: 'barbell',
    is_custom: false,
  },
  {
    id: '2',
    title: 'Exercise 2',
    type: 'weight_reps',
    primary_muscle_group: 'back',
    secondary_muscle_groups: [],
    equipment: 'dumbbell',
    is_custom: false,
  },
];

// Mock API functions
export const getWorkouts = jest.fn().mockResolvedValue({
  workouts: mockWorkouts,
  page: 1,
  pageCount: 1,
});

export const getRoutines = jest.fn().mockResolvedValue({
  routines: mockRoutines,
  page: 1,
  pageCount: 1,
});

export const getExercises = jest.fn().mockResolvedValue({
  exercises: mockExercises,
  page: 1,
  pageCount: 1,
});

// Mock pagination info function
export const getPaginationInfo = jest.fn().mockResolvedValue({
  page: 1,
  pageCount: 1,
});

// Default export with all API functions
export default {
  getWorkouts,
  getRoutines,
  getExercises,
  getPaginationInfo,
};
