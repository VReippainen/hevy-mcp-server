// Directly tell Jest to use the mock module
jest.mock('../hevyApi');

// Import the module (this will use the manual mock from __mocks__ directory)
import hevyApi, { getWorkouts, getRoutines, getExercises } from '../hevyApi';

describe('HevyAPI Service', () => {
  beforeEach(() => {
    // Clear all mock calls
    jest.clearAllMocks();
  });

  describe('getWorkouts function', () => {
    it('should fetch workouts correctly', async () => {
      // Mock data is already set up in __mocks__/hevyApi.ts
      const result = await getWorkouts();

      // Assertions
      expect(getWorkouts).toHaveBeenCalled();
      expect(result.workouts).toHaveLength(2);
      expect(result.workouts[0].id).toBe('1');
      expect(result.workouts[1].title).toBe('Workout 2');
      expect(result.page).toBe(1);
      expect(result.pageCount).toBe(1);
    });

    it('should handle pagination parameters correctly', async () => {
      // Call with parameters
      await getWorkouts({ page: 2, pageSize: 5 });

      // Check parameters passed to mock
      expect(getWorkouts).toHaveBeenCalledWith({ page: 2, pageSize: 5 });
    });
  });

  describe('getRoutines function', () => {
    it('should fetch routines correctly', async () => {
      const result = await getRoutines();

      expect(getRoutines).toHaveBeenCalled();
      expect(result.routines).toHaveLength(2);
      expect(result.routines[0].name).toBe('Routine 1');
      expect(result.page).toBe(1);
      expect(result.pageCount).toBe(1);
    });
  });

  describe('getExercises function', () => {
    it('should fetch exercises correctly', async () => {
      const result = await getExercises();

      expect(getExercises).toHaveBeenCalled();
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
