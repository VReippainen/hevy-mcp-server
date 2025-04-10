import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getWorkouts, getExerciseProgressByIds, getExercises, getRoutines } from '../tools.js';
import hevyService from '../services/hevyService.js';
import { createErrorResponse, createSuccessResponse } from '../utils/responseUtils.js';

// Mock the modules
vi.mock('../services/hevyService.js');
vi.mock('../utils/responseUtils.js');

// Turn off TypeScript type checking for this test file
describe('Tool Functions', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('getWorkouts', () => {
    it('should return workouts with formatted data', async () => {
      // Arrange
      // Mock data doesn't need to be complete for tests
      const mockWorkout = {
        id: 'workout1',
        title: 'Test Workout',
        start_time: '2023-01-01T10:00:00Z',
        description: 'Test description',
        end_time: '2023-01-01T11:00:00Z',
        updated_at: '2023-01-01T11:01:00Z',
        created_at: '2023-01-01T09:59:00Z',
        exercises: [
          {
            exercise_template_id: 'ex1',
            title: 'Bench Press',
            sets: [
              { weight_kg: 100, reps: 10, index: 0, notes: '', superset_id: '' },
              { weight_kg: 110, reps: 8, index: 1, notes: '', superset_id: '' },
            ],
          },
        ],
      };

      const mockStats = {
        durationMinutes: 60,
        totalVolume: 1980,
        exerciseCount: 1,
        totalSets: 2,
      };

      // We're using vi.mocked to bypass TypeScript checking for test mocks
      vi.mocked(hevyService.getWorkouts).mockResolvedValue([mockWorkout]);
      vi.mocked(hevyService.calculateWorkoutStats).mockReturnValue(mockStats);

      // Act
      await getWorkouts({ limit: 10 });

      // Assert
      expect(hevyService.getWorkouts).toHaveBeenCalledWith(undefined, undefined);
      expect(hevyService.calculateWorkoutStats).toHaveBeenCalledWith(mockWorkout);
      expect(createSuccessResponse).toHaveBeenCalledWith({
        workouts: [
          {
            id: 'workout1',
            title: 'Test Workout',
            date: expect.any(String),
            durationMinutes: 60,
            totalVolume: 1980,
            exercises: [
              {
                id: 'ex1',
                name: 'Bench Press',
                sets: [
                  { weight: 100, reps: 10 },
                  { weight: 110, reps: 8 },
                ],
              },
            ],
          },
        ],
        totalWorkouts: 1,
        returnedWorkouts: 1,
      });
    });

    it('should return error when no workouts are found', async () => {
      // Arrange
      vi.mocked(hevyService.getWorkouts).mockResolvedValue(null as any);

      // Act
      await getWorkouts({ limit: 10 });

      // Assert
      expect(createErrorResponse).toHaveBeenCalledWith('Failed to retrieve workouts');
    });

    it('should use date filters when provided', async () => {
      // Arrange
      const startDate = '2023-01-01';
      const endDate = '2023-01-31';
      vi.mocked(hevyService.getWorkouts).mockResolvedValue([]);

      // Act
      await getWorkouts({ limit: 10, startDate, endDate });

      // Assert
      expect(hevyService.getWorkouts).toHaveBeenCalledWith(expect.any(Date), expect.any(Date));
    });
  });

  describe('getExerciseProgressByIds', () => {
    it('should return exercise progress data', async () => {
      // Arrange
      const mockWorkouts = [
        {
          id: 'workout1',
          title: 'Test Workout',
          description: 'Test description',
          start_time: '2023-01-01T10:00:00Z',
          end_time: '2023-01-01T11:00:00Z',
          updated_at: '2023-01-01T11:01:00Z',
          created_at: '2023-01-01T09:59:00Z',
          exercises: [],
        },
      ];

      const mockExercises = [
        {
          id: 'ex1',
          name: 'Bench Press',
          title: 'Bench Press',
          type: 'strength',
          primary_muscle_group: 'chest',
          secondary_muscle_groups: ['triceps'],
          equipment: 'barbell',
        },
        {
          id: 'ex2',
          name: 'Squat',
          title: 'Squat',
          type: 'strength',
          primary_muscle_group: 'quadriceps',
          secondary_muscle_groups: ['glutes'],
          equipment: 'barbell',
        },
      ];

      const mockProgress = {
        exercise: mockExercises[0],
        personalRecords: [
          {
            reps: 10,
            weight_kg: 100,
            date: '2023-01-01',
          },
        ],
        sessions: [],
      };

      vi.mocked(hevyService.getWorkouts).mockResolvedValue(mockWorkouts);
      vi.mocked(hevyService.fetchAllExerciseTemplates).mockResolvedValue(mockExercises);
      vi.mocked(hevyService.processExerciseProgress).mockReturnValue(mockProgress);

      // Act
      await getExerciseProgressByIds({
        exerciseIds: ['ex1'],
        limit: 10,
      });

      // Assert
      expect(hevyService.fetchAllExerciseTemplates).toHaveBeenCalled();
      expect(hevyService.processExerciseProgress).toHaveBeenCalledWith(
        mockExercises[0],
        mockWorkouts,
        10
      );
      expect(createSuccessResponse).toHaveBeenCalledWith({
        exerciseProgress: [mockProgress],
      });
    });

    it('should handle errors and return error response', async () => {
      // Arrange
      const error = new Error('Test error');
      vi.mocked(hevyService.getWorkouts).mockRejectedValue(error);

      // Act
      await getExerciseProgressByIds({
        exerciseIds: ['ex1'],
        limit: 10,
      });

      // Assert
      expect(createErrorResponse).toHaveBeenCalledWith('Failed to process exercise progress data');
    });
  });

  describe('getExercises', () => {
    it('should return exercises data when available', async () => {
      // Arrange
      const mockExercises = [
        {
          id: 'ex1',
          name: 'Bench Press',
          frequency: 10,
          estimated1RM: { weightKg: 100, date: '2023-01-01' },
          actual1RM: null,
          type: 'strength',
          primary_muscle_group: 'chest',
          secondary_muscle_groups: ['triceps'],
          equipment: 'barbell',
        },
        {
          id: 'ex2',
          name: 'Squat',
          frequency: 8,
          estimated1RM: { weightKg: 150, date: '2023-01-01' },
          actual1RM: null,
          type: 'strength',
          primary_muscle_group: 'quadriceps',
          secondary_muscle_groups: ['glutes'],
          equipment: 'barbell',
        },
      ];
      vi.mocked(hevyService.getExercises).mockResolvedValue(mockExercises);

      // Act
      await getExercises({
        searchTerm: 'bench',
        excludeUnused: true,
      });

      // Assert
      expect(hevyService.getExercises).toHaveBeenCalledWith('bench', true, undefined, undefined);
      expect(createSuccessResponse).toHaveBeenCalledWith({
        exercises: mockExercises,
      });
    });

    it('should return error when no exercises are found', async () => {
      // Arrange
      vi.mocked(hevyService.getExercises).mockResolvedValue([]);

      // Act
      await getExercises({
        searchTerm: 'nonexistent',
        excludeUnused: true,
      });

      // Assert
      expect(createErrorResponse).toHaveBeenCalledWith('No exercises found matching: nonexistent');
    });

    it('should return generic error when no exercises are found without search term', async () => {
      // Arrange
      vi.mocked(hevyService.getExercises).mockResolvedValue([]);

      // Act
      await getExercises({ excludeUnused: true });

      // Assert
      expect(createErrorResponse).toHaveBeenCalledWith('No exercise data found');
    });

    it('should handle errors and return error response', async () => {
      // Arrange
      const error = new Error('Test error');
      vi.mocked(hevyService.getExercises).mockRejectedValue(error);

      // Act
      await getExercises({ excludeUnused: true });

      // Assert
      expect(createErrorResponse).toHaveBeenCalledWith('Failed to retrieve exercises');
    });
  });

  describe('getRoutines', () => {
    it('should return routines data when available', async () => {
      // Arrange
      const mockRoutines = [
        {
          id: 'routine1',
          name: 'Upper Body',
          description: 'Upper body workout',
          exercises: [],
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
        },
        {
          id: 'routine2',
          name: 'Lower Body',
          description: 'Lower body workout',
          exercises: [],
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
        },
      ];
      vi.mocked(hevyService.fetchAllRoutines).mockResolvedValue(mockRoutines);

      // Act
      await getRoutines();

      // Assert
      expect(hevyService.fetchAllRoutines).toHaveBeenCalled();
      expect(createSuccessResponse).toHaveBeenCalledWith({
        routines: mockRoutines,
      });
    });

    it('should return error when no routines are found', async () => {
      // Arrange
      vi.mocked(hevyService.fetchAllRoutines).mockResolvedValue([]);

      // Act
      await getRoutines();

      // Assert
      expect(createErrorResponse).toHaveBeenCalledWith('Failed to retrieve routines');
    });
  });
});
