/**
 * Integration tests for hevyApi.ts
 * Tests the actual implementation with mocked fetch
 */

// Create a manual mock of the config module
jest.mock('../../config', () => {
  return {
    __esModule: true,
    default: {
      api: {
        hevyBaseUrl: 'https://test-api.hevyapp.com',
        hevyApiKey: 'test-api-key',
      },
      server: {
        port: 3000,
      },
    },
    config: {
      api: {
        hevyBaseUrl: 'https://test-api.hevyapp.com',
        hevyApiKey: 'test-api-key',
      },
      server: {
        port: 3000,
      },
    },
  };
});

// Mock global fetch
global.fetch = jest.fn();

// Import the module after mocks are set up
import hevyApi, { getWorkouts, getRoutines, getExercises } from '../hevyApi';

describe('HevyApi Service (Integration)', () => {
  // Common mock data
  const mockWorkouts = [
    {
      id: '1',
      title: 'Workout 1',
      description: '',
      start_time: '',
      end_time: '',
      created_at: '',
      updated_at: '',
      exercises: [],
    },
    {
      id: '2',
      title: 'Workout 2',
      description: '',
      start_time: '',
      end_time: '',
      created_at: '',
      updated_at: '',
      exercises: [],
    },
  ];

  const mockRoutines = [
    { id: '1', name: 'Routine 1', description: '', exercises: [], createdAt: '', updatedAt: '' },
    { id: '2', name: 'Routine 2', description: '', exercises: [], createdAt: '', updatedAt: '' },
  ];

  const mockExercises = [
    {
      id: '1',
      title: 'Exercise 1',
      type: 'weight_reps',
      primary_muscle_group: 'chest',
      secondary_muscle_groups: [],
      equipment: '',
      is_custom: false,
    },
    {
      id: '2',
      title: 'Exercise 2',
      type: 'reps_only',
      primary_muscle_group: 'back',
      secondary_muscle_groups: [],
      equipment: '',
      is_custom: false,
    },
  ];

  beforeEach(() => {
    // Clear mock data
    jest.clearAllMocks();
    console.error = jest.fn(); // Suppress error console logs in tests
  });

  describe('getWorkouts', () => {
    it('should fetch workouts with default parameters', async () => {
      // Mock successful response
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ workouts: mockWorkouts }),
      });

      // Call the function
      const result = await getWorkouts();

      // Verify fetch was called with expected URL and headers
      expect(fetch).toHaveBeenCalledWith(
        'https://test-api.hevyapp.com/workouts?page=1&pageSize=10',
        {
          method: 'GET',
          headers: {
            'api-key': 'test-api-key',
            'Content-Type': 'application/json',
          },
        }
      );

      // Verify result matches mock data
      expect(result).toEqual(mockWorkouts);
    });

    it('should handle custom pagination parameters', async () => {
      // Mock successful response
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ workouts: mockWorkouts }),
      });

      // Call with custom parameters (only page and pageSize are allowed)
      await getWorkouts({ page: 2, pageSize: 10 });

      // Verify URL includes all parameters
      expect(fetch).toHaveBeenCalledWith(
        'https://test-api.hevyapp.com/workouts?page=2&pageSize=10',
        expect.any(Object)
      );
    });

    it('should handle API error responses', async () => {
      // Mock error response
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      // Verify function throws error
      await expect(getWorkouts()).rejects.toThrow('API request failed with status 401');
    });

    it('should handle network errors', async () => {
      // Mock network error
      const networkError = new Error('Network error');
      (fetch as jest.Mock).mockRejectedValueOnce(networkError);

      // Verify function throws error - the original error should be propagated
      await expect(getWorkouts()).rejects.toThrow(networkError);
    });
  });

  describe('getRoutines', () => {
    it('should fetch routines correctly', async () => {
      // Mock successful response
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ routines: mockRoutines }),
      });

      // Call the function
      const result = await getRoutines();

      // Verify fetch was called with correct URL
      expect(fetch).toHaveBeenCalledWith(
        'https://test-api.hevyapp.com/routines?page=1&pageSize=10',
        expect.any(Object)
      );

      // Verify result
      expect(result).toEqual(mockRoutines);
    });

    it('should handle empty response', async () => {
      // Mock response with no routines
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({}), // No routines property
      });

      // Call function
      const result = await getRoutines();

      // Should return empty array
      expect(result).toEqual([]);
    });
  });

  describe('getExercises', () => {
    it('should fetch exercise templates correctly', async () => {
      // Mock successful response
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ exercise_templates: mockExercises }),
      });

      // Call the function
      const result = await getExercises();

      // Verify fetch was called with correct URL
      expect(fetch).toHaveBeenCalledWith(
        'https://test-api.hevyapp.com/exercise_templates?page=1&pageSize=10',
        expect.any(Object)
      );

      // Verify result
      expect(result).toEqual(mockExercises);
    });
  });

  describe('Module default export', () => {
    it('should export all API functions', () => {
      expect(hevyApi.getWorkouts).toBe(getWorkouts);
      expect(hevyApi.getRoutines).toBe(getRoutines);
      expect(hevyApi.getExercises).toBe(getExercises);
    });
  });
});
