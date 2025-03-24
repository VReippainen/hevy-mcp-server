/**
 * Unit tests for hevyService.ts
 */
import {
  calculateWorkoutStats,
  analyzeProgressForExercise,
  calculateVolumeByMuscleGroup,
  analyzeMuscleGroupFrequency,
  fetchAllWorkouts,
  fetchAllExerciseTemplates,
  fetchAllRoutines,
  getRecentWorkouts,
  getWorkoutsInTimeframe,
  getWorkoutDetails,
  getUserRoutines,
  getExerciseTemplates,
  getExerciseDetailsById,
  searchExerciseTemplatesByName,
} from '../services/hevyService';
import hevyApi from '../services/hevyApi';
import { Workout, ExerciseTemplate, Routine } from '../types';

// Mock the hevyApi module
jest.mock('../services/hevyApi');

describe('Hevy Service', () => {
  // Mock data for tests
  const mockWorkouts: Workout[] = [
    {
      id: 'workout1',
      title: 'Leg Day',
      description: 'Leg workout',
      start_time: '2023-01-01T10:00:00Z',
      end_time: '2023-01-01T11:30:00Z',
      updated_at: '2023-01-01T11:30:00Z',
      created_at: '2023-01-01T10:00:00Z',
      exercises: [
        {
          index: 0,
          title: 'Squat',
          notes: '',
          exercise_template_id: 'exercise1',
          superset_id: null,
          sets: [
            {
              index: 0,
              type: 'warmup',
              weight_kg: 60,
              reps: 10,
              distance_meters: null,
              duration_seconds: null,
              rpe: null,
              custom_metric: null,
            },
            {
              index: 1,
              type: 'normal',
              weight_kg: 100,
              reps: 8,
              distance_meters: null,
              duration_seconds: null,
              rpe: null,
              custom_metric: null,
            },
            {
              index: 2,
              type: 'normal',
              weight_kg: 110,
              reps: 5,
              distance_meters: null,
              duration_seconds: null,
              rpe: null,
              custom_metric: null,
            },
          ],
        },
        {
          index: 1,
          title: 'Leg Press',
          notes: '',
          exercise_template_id: 'exercise2',
          superset_id: null,
          sets: [
            {
              index: 0,
              type: 'normal',
              weight_kg: 150,
              reps: 10,
              distance_meters: null,
              duration_seconds: null,
              rpe: null,
              custom_metric: null,
            },
            {
              index: 1,
              type: 'normal',
              weight_kg: 160,
              reps: 8,
              distance_meters: null,
              duration_seconds: null,
              rpe: null,
              custom_metric: null,
            },
          ],
        },
      ],
    },
    {
      id: 'workout2',
      title: 'Push Day',
      description: 'Chest and shoulders',
      start_time: '2023-01-03T10:00:00Z',
      end_time: '2023-01-03T11:20:00Z',
      updated_at: '2023-01-03T11:20:00Z',
      created_at: '2023-01-03T10:00:00Z',
      exercises: [
        {
          index: 0,
          title: 'Bench Press',
          notes: '',
          exercise_template_id: 'exercise3',
          superset_id: null,
          sets: [
            {
              index: 0,
              type: 'warmup',
              weight_kg: 40,
              reps: 12,
              distance_meters: null,
              duration_seconds: null,
              rpe: null,
              custom_metric: null,
            },
            {
              index: 1,
              type: 'normal',
              weight_kg: 80,
              reps: 10,
              distance_meters: null,
              duration_seconds: null,
              rpe: null,
              custom_metric: null,
            },
            {
              index: 2,
              type: 'normal',
              weight_kg: 90,
              reps: 8,
              distance_meters: null,
              duration_seconds: null,
              rpe: null,
              custom_metric: null,
            },
          ],
        },
      ],
    },
  ];

  const mockExerciseTemplates: ExerciseTemplate[] = [
    {
      id: 'exercise1',
      title: 'Squat',
      type: 'weight_reps',
      primary_muscle_group: 'Legs',
      secondary_muscle_groups: ['Glutes', 'Core'],
      equipment: 'barbell',
      is_custom: false,
    },
    {
      id: 'exercise2',
      title: 'Leg Press',
      type: 'weight_reps',
      primary_muscle_group: 'Legs',
      secondary_muscle_groups: ['Glutes'],
      equipment: 'machine',
      is_custom: false,
    },
    {
      id: 'exercise3',
      title: 'Bench Press',
      type: 'weight_reps',
      primary_muscle_group: 'Chest',
      secondary_muscle_groups: ['Shoulders', 'Triceps'],
      equipment: 'barbell',
      is_custom: false,
    },
  ];

  const mockRoutines: Routine[] = [
    {
      id: 'routine1',
      name: 'Push Pull Legs',
      description: 'PPL split',
      exercises: ['exercise1', 'exercise2', 'exercise3'],
      createdAt: '2023-01-01T10:00:00Z',
      updatedAt: '2023-01-01T10:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateWorkoutStats', () => {
    it('should calculate workout statistics correctly', () => {
      const stats = calculateWorkoutStats(mockWorkouts[0]);

      expect(stats.durationMinutes).toBe(90);
      expect(stats.exerciseCount).toBe(2);
      expect(stats.totalSets).toBe(5);
      expect(stats.totalVolume).toBe(60 * 10 + 100 * 8 + 110 * 5 + 150 * 10 + 160 * 8);
    });

    it('should handle a workout with zero exercises', () => {
      const emptyWorkout: Workout = {
        id: 'emptyWorkout',
        title: 'Empty Workout',
        description: '',
        start_time: '2023-01-01T10:00:00Z',
        end_time: '2023-01-01T11:00:00Z',
        updated_at: '2023-01-01T11:00:00Z',
        created_at: '2023-01-01T10:00:00Z',
        exercises: [],
      };

      const stats = calculateWorkoutStats(emptyWorkout);

      expect(stats.durationMinutes).toBe(60);
      expect(stats.exerciseCount).toBe(0);
      expect(stats.totalSets).toBe(0);
      expect(stats.totalVolume).toBe(0);
    });
  });

  describe('analyzeProgressForExercise', () => {
    it('should analyze progress for an exercise correctly', () => {
      const exerciseId = 'exercise1';
      const progressData = analyzeProgressForExercise(mockWorkouts, exerciseId);

      expect(progressData).toHaveLength(1);
      expect(progressData[0].date).toBe(mockWorkouts[0].start_time);
      expect(progressData[0].maxVolume).toBe(100 * 8); // The highest volume set (weight × reps)
      expect(progressData[0].maxWeight).toBe(110); // The heaviest weight
      expect(progressData[0].maxReps).toBe(8); // The most reps in a non-warmup set
    });

    it('should return empty array if no workouts have the specified exercise', () => {
      const exerciseId = 'nonexistent';
      const progressData = analyzeProgressForExercise(mockWorkouts, exerciseId);

      expect(progressData).toHaveLength(0);
    });
  });

  describe('API integration functions', () => {
    beforeEach(() => {
      // Mock the hevyApi.getWorkouts function
      (hevyApi.getWorkouts as jest.MockedFunction<typeof hevyApi.getWorkouts>).mockResolvedValue({
        workouts: mockWorkouts,
        page: 1,
        pageCount: 1,
      });

      // Mock the hevyApi.getExercises function
      (hevyApi.getExercises as jest.MockedFunction<typeof hevyApi.getExercises>).mockResolvedValue({
        exercises: mockExerciseTemplates,
        page: 1,
        pageCount: 1,
      });

      // Mock the hevyApi.getRoutines function
      (hevyApi.getRoutines as jest.MockedFunction<typeof hevyApi.getRoutines>).mockResolvedValue({
        routines: mockRoutines,
        page: 1,
        pageCount: 1,
      });
    });

    describe('fetchAllWorkouts', () => {
      it('should fetch all workouts from the API', async () => {
        const workouts = await fetchAllWorkouts('dummy-token');

        expect(hevyApi.getWorkouts).toHaveBeenCalledWith({ page: 1, pageSize: 10 });
        expect(workouts).toEqual(mockWorkouts);
      });

      it('should handle pagination when there are multiple pages', async () => {
        // Mock first page response
        (
          hevyApi.getWorkouts as jest.MockedFunction<typeof hevyApi.getWorkouts>
        ).mockResolvedValueOnce({
          workouts: [mockWorkouts[0]],
          page: 1,
          pageCount: 2,
        });

        // Mock second page response
        (
          hevyApi.getWorkouts as jest.MockedFunction<typeof hevyApi.getWorkouts>
        ).mockResolvedValueOnce({
          workouts: [mockWorkouts[1]],
          page: 2,
          pageCount: 2,
        });

        const workouts = await fetchAllWorkouts('dummy-token');

        expect(hevyApi.getWorkouts).toHaveBeenCalledTimes(2);
        expect(hevyApi.getWorkouts).toHaveBeenCalledWith({ page: 1, pageSize: 10 });
        expect(hevyApi.getWorkouts).toHaveBeenCalledWith({ page: 2, pageSize: 10 });
        expect(workouts).toHaveLength(2);
        expect(workouts).toEqual(mockWorkouts);
      });

      it('should return empty array when API call fails', async () => {
        (
          hevyApi.getWorkouts as jest.MockedFunction<typeof hevyApi.getWorkouts>
        ).mockRejectedValueOnce(new Error('API error'));

        const workouts = await fetchAllWorkouts('dummy-token');

        expect(workouts).toEqual([]);
      });
    });

    describe('fetchAllExerciseTemplates', () => {
      it('should fetch all exercise templates from the API', async () => {
        const exercises = await fetchAllExerciseTemplates('dummy-token');

        expect(hevyApi.getExercises).toHaveBeenCalledWith({ page: 1, pageSize: 10 });
        expect(exercises).toEqual(mockExerciseTemplates);
      });

      it('should handle pagination when there are multiple pages', async () => {
        // Mock first page response
        (
          hevyApi.getExercises as jest.MockedFunction<typeof hevyApi.getExercises>
        ).mockResolvedValueOnce({
          exercises: [mockExerciseTemplates[0]],
          page: 1,
          pageCount: 2,
        });

        // Mock second page response
        (
          hevyApi.getExercises as jest.MockedFunction<typeof hevyApi.getExercises>
        ).mockResolvedValueOnce({
          exercises: [mockExerciseTemplates[1], mockExerciseTemplates[2]],
          page: 2,
          pageCount: 2,
        });

        const exercises = await fetchAllExerciseTemplates('dummy-token');

        expect(hevyApi.getExercises).toHaveBeenCalledTimes(2);
        expect(exercises).toHaveLength(3);
        expect(exercises).toEqual(mockExerciseTemplates);
      });

      it('should return empty array when API call fails', async () => {
        (
          hevyApi.getExercises as jest.MockedFunction<typeof hevyApi.getExercises>
        ).mockRejectedValueOnce(new Error('API error'));

        const exercises = await fetchAllExerciseTemplates('dummy-token');

        expect(exercises).toEqual([]);
      });
    });

    describe('fetchAllRoutines', () => {
      it('should fetch all routines from the API', async () => {
        const routines = await fetchAllRoutines('dummy-token');

        expect(hevyApi.getRoutines).toHaveBeenCalledWith({ page: 1, pageSize: 10 });
        expect(routines).toEqual(mockRoutines);
      });

      it('should handle pagination when there are multiple pages', async () => {
        // Mock first page response with pageCount = 2
        (
          hevyApi.getRoutines as jest.MockedFunction<typeof hevyApi.getRoutines>
        ).mockResolvedValueOnce({
          routines: [mockRoutines[0]],
          page: 1,
          pageCount: 2,
        });

        // Mock second page response
        (
          hevyApi.getRoutines as jest.MockedFunction<typeof hevyApi.getRoutines>
        ).mockResolvedValueOnce({
          routines: [],
          page: 2,
          pageCount: 2,
        });

        const routines = await fetchAllRoutines('dummy-token');

        expect(hevyApi.getRoutines).toHaveBeenCalledTimes(2);
        expect(routines).toEqual(mockRoutines);
      });

      it('should return empty array when API call fails', async () => {
        (
          hevyApi.getRoutines as jest.MockedFunction<typeof hevyApi.getRoutines>
        ).mockRejectedValueOnce(new Error('API error'));

        const routines = await fetchAllRoutines('dummy-token');

        expect(routines).toEqual([]);
      });
    });

    describe('getRecentWorkouts', () => {
      it('should return the most recent workouts', async () => {
        // Mock sorted workouts response (newest first)
        const sortedMockWorkouts = [...mockWorkouts].sort(
          (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
        );

        const recentWorkouts = await getRecentWorkouts('dummy-token', 1);

        expect(Array.isArray(recentWorkouts)).toBe(false);
        expect(recentWorkouts).not.toBeNull();
        if (recentWorkouts && !Array.isArray(recentWorkouts)) {
          expect(recentWorkouts.workouts).toHaveLength(1);
          // Expect the newest workout (workout2) to be first
          expect(recentWorkouts.workouts[0]).toEqual(sortedMockWorkouts[0]);
        }
      });

      it('should handle limit parameter', async () => {
        const recentWorkouts = await getRecentWorkouts('dummy-token', 2);

        expect(Array.isArray(recentWorkouts)).toBe(false);
        if (recentWorkouts && !Array.isArray(recentWorkouts)) {
          expect(recentWorkouts.workouts).toHaveLength(2);
        }
      });

      it('should return empty response object when API call fails', async () => {
        (
          hevyApi.getWorkouts as jest.MockedFunction<typeof hevyApi.getWorkouts>
        ).mockRejectedValueOnce(new Error('API error'));

        const recentWorkouts = await getRecentWorkouts('dummy-token');

        expect(recentWorkouts).toEqual({ workouts: [], page: 1, page_count: 0 });
      });
    });

    describe('getWorkoutDetails', () => {
      it('should return details for a specific workout', async () => {
        const workoutDetails = await getWorkoutDetails('dummy-token', 'workout1');

        expect(workoutDetails).not.toBeNull();
        if (workoutDetails) {
          expect(workoutDetails).toEqual(mockWorkouts[0]);
        }
      });

      it('should return null if workout not found', async () => {
        const workoutDetails = await getWorkoutDetails('dummy-token', 'nonexistent');

        expect(workoutDetails).toBeNull();
      });

      it('should return null when API call fails', async () => {
        (
          hevyApi.getWorkouts as jest.MockedFunction<typeof hevyApi.getWorkouts>
        ).mockRejectedValueOnce(new Error('API error'));

        const workoutDetails = await getWorkoutDetails('dummy-token', 'workout1');

        expect(workoutDetails).toBeNull();
      });
    });

    describe('getExerciseDetailsById', () => {
      it('should return details for a specific exercise', async () => {
        const exerciseDetails = await getExerciseDetailsById('dummy-token', 'exercise1');

        expect(exerciseDetails).not.toBeNull();
        if (exerciseDetails) {
          expect(exerciseDetails).toEqual(mockExerciseTemplates[0]);
        }
      });

      it('should return null if exercise not found', async () => {
        const exerciseDetails = await getExerciseDetailsById('dummy-token', 'nonexistent');

        expect(exerciseDetails).toBeNull();
      });

      it('should return null when API call fails', async () => {
        (
          hevyApi.getExercises as jest.MockedFunction<typeof hevyApi.getExercises>
        ).mockRejectedValueOnce(new Error('API error'));

        const exerciseDetails = await getExerciseDetailsById('dummy-token', 'exercise1');

        expect(exerciseDetails).toBeNull();
      });
    });

    describe('getWorkoutsInTimeframe', () => {
      it('should return workouts after a specific date', async () => {
        const startDate = new Date('2023-01-02T00:00:00Z');
        const result = await getWorkoutsInTimeframe('dummy-token', startDate);

        expect(Array.isArray(result)).toBe(false);
        if (result && !Array.isArray(result)) {
          expect(result.workouts).toHaveLength(1);
          expect(result.workouts[0]).toEqual(mockWorkouts[1]); // Only workout2 is after Jan 2
        }
      });

      it('should handle limit parameter', async () => {
        const startDate = new Date('2023-01-01T00:00:00Z');
        const result = await getWorkoutsInTimeframe('dummy-token', startDate, 1);

        expect(Array.isArray(result)).toBe(false);
        if (result && !Array.isArray(result)) {
          expect(result.workouts).toHaveLength(1);
        }
      });

      it('should return empty response object when API call fails', async () => {
        (
          hevyApi.getWorkouts as jest.MockedFunction<typeof hevyApi.getWorkouts>
        ).mockRejectedValueOnce(new Error('API error'));

        const startDate = new Date('2023-01-01T00:00:00Z');
        const result = await getWorkoutsInTimeframe('dummy-token', startDate);

        expect(result).toEqual({ workouts: [], page: 1, page_count: 0 });
      });
    });

    describe('getUserRoutines', () => {
      it('should return user routines', async () => {
        const result = await getUserRoutines('dummy-token');

        expect(Array.isArray(result)).toBe(false);
        if (result && !Array.isArray(result)) {
          expect(result.routines).toEqual(mockRoutines);
        }
      });

      it('should return empty response object when API call fails', async () => {
        (
          hevyApi.getRoutines as jest.MockedFunction<typeof hevyApi.getRoutines>
        ).mockRejectedValueOnce(new Error('API error'));

        const result = await getUserRoutines('dummy-token');

        expect(result).toEqual({ routines: [], page: 1, page_count: 0 });
      });
    });

    describe('getExerciseTemplates', () => {
      it('should return exercise templates', async () => {
        const result = await getExerciseTemplates('dummy-token');

        expect(Array.isArray(result)).toBe(false);
        if (result && !Array.isArray(result)) {
          expect(result.exercise_templates).toEqual(mockExerciseTemplates);
        }
      });

      it('should handle limit parameter', async () => {
        const result = await getExerciseTemplates('dummy-token', 2);

        expect(Array.isArray(result)).toBe(false);
        if (result && !Array.isArray(result)) {
          expect(result.exercise_templates).toHaveLength(2);
        }
      });

      it('should return empty response object when API call fails', async () => {
        (
          hevyApi.getExercises as jest.MockedFunction<typeof hevyApi.getExercises>
        ).mockRejectedValueOnce(new Error('API error'));

        const result = await getExerciseTemplates('dummy-token');

        expect(result).toEqual({ exercise_templates: [], page: 1, page_count: 0 });
      });
    });

    describe('searchExerciseTemplatesByName', () => {
      it('should return matching exercise templates', async () => {
        const searchResults = await searchExerciseTemplatesByName('dummy-token', 'Squat');

        expect(searchResults).toHaveLength(1);
        expect(searchResults[0]).toEqual(mockExerciseTemplates[0]);
      });

      it('should return multiple matching templates', async () => {
        const searchResults = await searchExerciseTemplatesByName('dummy-token', 'Press');

        expect(searchResults).toHaveLength(2);
        expect(searchResults).toEqual([mockExerciseTemplates[1], mockExerciseTemplates[2]]);
      });

      it('should be case insensitive', async () => {
        const searchResults = await searchExerciseTemplatesByName('dummy-token', 'squat');

        expect(searchResults).toHaveLength(1);
        expect(searchResults[0]).toEqual(mockExerciseTemplates[0]);
      });

      it('should return empty array when no matches found', async () => {
        const searchResults = await searchExerciseTemplatesByName(
          'dummy-token',
          'NonexistentExercise'
        );

        expect(searchResults).toHaveLength(0);
      });

      it('should return empty array when API call fails', async () => {
        (
          hevyApi.getExercises as jest.MockedFunction<typeof hevyApi.getExercises>
        ).mockRejectedValueOnce(new Error('API error'));

        const searchResults = await searchExerciseTemplatesByName('dummy-token', 'Squat');

        expect(searchResults).toHaveLength(0);
      });
    });

    describe('calculateVolumeByMuscleGroup', () => {
      it('should calculate volume by muscle group correctly', () => {
        const result = calculateVolumeByMuscleGroup(mockWorkouts, mockExerciseTemplates);

        // Find the Legs and Chest entries in the result array
        const legsEntry = result.find((item) => item.muscleGroup === 'Legs');
        const chestEntry = result.find((item) => item.muscleGroup === 'Chest');

        expect(legsEntry).toBeDefined();
        expect(chestEntry).toBeDefined();

        if (legsEntry) {
          expect(legsEntry.volume).toBe(60 * 10 + 100 * 8 + 110 * 5 + 150 * 10 + 160 * 8);
          expect(legsEntry.sets).toBe(5);
        }

        if (chestEntry) {
          expect(chestEntry.volume).toBe(40 * 12 + 80 * 10 + 90 * 8);
          expect(chestEntry.sets).toBe(3);
        }
      });

      it('should handle unknown exercise templates gracefully', () => {
        const workoutWithUnknownExercise: Workout = {
          ...mockWorkouts[0],
          exercises: [
            {
              ...mockWorkouts[0].exercises[0],
              exercise_template_id: 'unknown',
            },
          ],
        };

        const result = calculateVolumeByMuscleGroup(
          [workoutWithUnknownExercise],
          mockExerciseTemplates
        );

        // Should return an empty array or at least not throw an error
        expect(Array.isArray(result)).toBe(true);
      });
    });

    describe('analyzeMuscleGroupFrequency', () => {
      it('should analyze muscle group frequency correctly', () => {
        // Create exercise template map
        const exerciseMap: Record<string, ExerciseTemplate> = {};
        mockExerciseTemplates.forEach((template) => {
          exerciseMap[template.id] = template;
        });

        const result = analyzeMuscleGroupFrequency(mockWorkouts, exerciseMap);

        // Find the Legs and Chest entries in the result array
        const legsEntry = result.find((item) => item.muscleGroup === 'Legs');
        const chestEntry = result.find((item) => item.muscleGroup === 'Chest');

        expect(legsEntry).toBeDefined();
        expect(chestEntry).toBeDefined();

        if (legsEntry && chestEntry) {
          expect(legsEntry.frequency).toBe(2); // Legs exercises in workout1
          expect(chestEntry.frequency).toBe(1); // Chest exercises in workout2

          expect(legsEntry.lastWorkedOut.toISOString()).toBe(
            new Date(mockWorkouts[0].start_time).toISOString()
          );
          expect(chestEntry.lastWorkedOut.toISOString()).toBe(
            new Date(mockWorkouts[1].start_time).toISOString()
          );
        }
      });
    });
  });
});
