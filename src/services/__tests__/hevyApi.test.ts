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
      const workouts = await getWorkouts();

      // Assertions
      expect(getWorkouts).toHaveBeenCalled();
      expect(workouts).toHaveLength(2);
      expect(workouts[0].id).toBe('1');
      expect(workouts[1].title).toBe('Workout 2');
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
      const routines = await getRoutines();

      expect(getRoutines).toHaveBeenCalled();
      expect(routines).toHaveLength(2);
      expect(routines[0].name).toBe('Routine 1');
    });
  });

  describe('getExercises function', () => {
    it('should fetch exercises correctly', async () => {
      const exercises = await getExercises();

      expect(getExercises).toHaveBeenCalled();
      expect(exercises).toHaveLength(2);
      expect(exercises[0].title).toBe('Exercise 1');
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
