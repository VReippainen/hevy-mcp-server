// Directly tell Vitest to use the mock module
import { describe, it, expect, beforeEach, vi } from 'vitest';

// The issue is that we're not properly mocking the get function from api.ts
// Let's fix that by correctly mocking the module with a get function
vi.mock('../api', () => ({
  get: vi.fn(),
  default: {
    get: vi.fn(),
  },
}));

// Import the real hevyApi module to test
import hevyApi, { getWorkouts, getRoutines, getExercises } from '../hevyApi';
// Import the mocked api module
import { get } from '../api';

describe('HevyAPI Service', () => {
  beforeEach(() => {
    // Clear all mock calls
    vi.clearAllMocks();
  });

  describe('getWorkouts function', () => {
    it('should fetch workouts correctly', async () => {
      // Setup mock response for the get function
      (get as any).mockResolvedValueOnce({
        workouts: [
          { id: '1', title: 'Workout 1' },
          { id: '2', title: 'Workout 2' },
        ],
        page: 1,
        page_count: 1,
      });

      // Call the actual function
      const result = await getWorkouts();

      // Verify get was called with correct parameters
      expect(get).toHaveBeenCalledWith(expect.stringContaining('/workouts'), {
        page: 1,
        pageSize: 10,
      });

      // Assertions on the result
      expect(result.workouts).toHaveLength(2);
      expect(result.workouts[0].id).toBe('1');
      expect(result.workouts[1].title).toBe('Workout 2');
      expect(result.page).toBe(1);
      expect(result.pageCount).toBe(1);
    });

    it('should handle pagination parameters correctly', async () => {
      // Setup mock
      (get as any).mockResolvedValueOnce({
        workouts: [],
        page: 2,
        page_count: 3,
      });

      // Call with parameters
      await getWorkouts({ page: 2, pageSize: 5 });

      // Check get was called with correct parameters
      expect(get).toHaveBeenCalledWith(expect.stringContaining('/workouts'), {
        page: 2,
        pageSize: 5,
      });
    });
  });

  describe('getRoutines function', () => {
    it('should fetch routines correctly', async () => {
      // Setup mock
      (get as any).mockResolvedValueOnce({
        routines: [
          { id: '1', name: 'Routine 1' },
          { id: '2', name: 'Routine 2' },
        ],
        page: 1,
        page_count: 1,
      });

      const result = await getRoutines();

      expect(get).toHaveBeenCalledWith(expect.stringContaining('/routines'), {
        page: 1,
        pageSize: 10,
      });
      expect(result.routines).toHaveLength(2);
      expect(result.routines[0].name).toBe('Routine 1');
      expect(result.page).toBe(1);
      expect(result.pageCount).toBe(1);
    });
  });

  describe('getExercises function', () => {
    it('should fetch exercises correctly', async () => {
      // Setup mock
      (get as any).mockResolvedValueOnce({
        exercise_templates: [
          { id: '1', title: 'Exercise 1' },
          { id: '2', title: 'Exercise 2' },
        ],
        page: 1,
        page_count: 1,
      });

      const result = await getExercises();

      expect(get).toHaveBeenCalledWith(expect.stringContaining('/exercise_templates'), {
        page: 1,
        pageSize: 10,
      });
      expect(result.exercises).toHaveLength(2);
      expect(result.exercises[0].title).toBe('Exercise 1');
      expect(result.page).toBe(1);
      expect(result.pageCount).toBe(1);
    });
  });

  describe('Default export object', () => {
    it('should have all API functions', () => {
      expect(hevyApi.getWorkouts).toBe(getWorkouts);
      expect(hevyApi.getRoutines).toBe(getRoutines);
      expect(hevyApi.getExercises).toBe(getExercises);
    });
  });
});
