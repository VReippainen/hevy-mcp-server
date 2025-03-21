// Mock the dependencies before importing
jest.mock('../services/hevyApi', () => ({
  default: {
    getWorkouts: jest.fn(),
    getRoutines: jest.fn(),
    getExercises: jest.fn(),
  },
  getWorkouts: jest.fn(),
  getRoutines: jest.fn(),
  getExercises: jest.fn(),
}));

jest.mock('../config', () => ({
  default: {
    api: {
      hevyBaseUrl: 'https://test-api.hevyapp.com',
      hevyApiKey: 'test-api-key',
    },
    server: {
      port: 3000,
    },
  },
}));

// Import dependencies after mocking them
import { Request, Response } from 'express';
import hevyApi from '../services/hevyApi';
import { handleApiRequest } from '../index';

// Since we don't want to actually start the server in tests,
// we'll test the route handlers directly rather than importing the entire app
// This approach tests the route handler functions in isolation

describe('Route Handlers', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();
    req = {
      query: {},
    };
    res = {
      json: jsonMock,
      status: statusMock,
      send: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('GET /api/workouts', () => {
    it('should return workouts', async () => {
      // Setup mock response data
      const mockWorkouts = [{ id: '1', name: 'Workout 1' }];
      (hevyApi.getWorkouts as jest.Mock).mockResolvedValue(mockWorkouts);

      // Call the route handler
      await handleApiRequest(
        req as Request,
        res as Response,
        hevyApi.getWorkouts,
        'Failed to fetch workouts'
      );

      // Verify response
      expect(hevyApi.getWorkouts).toHaveBeenCalledWith({});
      expect(jsonMock).toHaveBeenCalledWith(mockWorkouts);
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should convert query parameters correctly', async () => {
      // Setup request with query parameters
      req.query = {
        page: '2',
        limit: '10',
        active: 'true',
        name: 'workout',
      };

      // Setup mock response data
      const mockWorkouts = [{ id: '1', name: 'Workout 1' }];
      (hevyApi.getWorkouts as jest.Mock).mockResolvedValue(mockWorkouts);

      // Call the route handler
      await handleApiRequest(
        req as Request,
        res as Response,
        hevyApi.getWorkouts,
        'Failed to fetch workouts'
      );

      // Verify parameters were processed correctly
      expect(hevyApi.getWorkouts).toHaveBeenCalledWith({
        page: 2, // Converted to number
        limit: 10, // Converted to number
        active: true, // Converted to boolean
        name: 'workout', // Left as string
      });
      expect(jsonMock).toHaveBeenCalledWith(mockWorkouts);
    });

    it('should handle errors', async () => {
      // Setup mock error
      const mockError = new Error('API error');
      (hevyApi.getWorkouts as jest.Mock).mockRejectedValue(mockError);

      // Call the route handler
      await handleApiRequest(
        req as Request,
        res as Response,
        hevyApi.getWorkouts,
        'Failed to fetch workouts'
      );

      // Verify error handling
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to fetch workouts' });
    });
  });

  // You could add similar tests for the other API endpoints (routines, exercises)
  // but the pattern would be the same, so this is a good starting point
});
