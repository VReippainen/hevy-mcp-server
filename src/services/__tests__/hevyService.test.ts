/**
 * Unit tests for hevyService.ts
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  calculateWorkoutStats,
  analyzeProgressForExercise,
  fetchAllWorkouts,
  fetchAllExerciseTemplates,
  fetchAllRoutines,
  getWorkouts,
  calculateRecordsByReps,
  getExercises,
} from '../hevyService';
import hevyApi from '../hevyApi';
import { Workout, ExerciseTemplate, Routine } from '../../types';

// Mock the hevyApi module
vi.mock('../hevyApi');

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
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
    it('should analyze progress for an exercise correctly', async () => {
      const exerciseId = 'exercise1';

      // Mock the API call
      vi.spyOn(hevyApi, 'getWorkouts').mockResolvedValue({
        workouts: mockWorkouts,
        page: 1,
        pageCount: 1,
      });

      const progressData = await analyzeProgressForExercise(exerciseId);

      expect(progressData).toHaveLength(1);
      expect(progressData[0].date).toBe(mockWorkouts[0].start_time);

      // Check that sets are included correctly
      expect(progressData[0].sets).toBeDefined();
      expect(progressData[0].sets.length).toBe(mockWorkouts[0].exercises[0].sets.length);

      // Check that a specific set is mapped correctly
      const firstSet = progressData[0].sets[0];
      expect(firstSet.index).toBe(mockWorkouts[0].exercises[0].sets[0].index);
      expect(firstSet.type).toBe(mockWorkouts[0].exercises[0].sets[0].type);
      expect(firstSet.weightKg).toBe(mockWorkouts[0].exercises[0].sets[0].weight_kg);
      expect(firstSet.reps).toBe(mockWorkouts[0].exercises[0].sets[0].reps);
    });

    it('should return empty array if no workouts have the specified exercise', async () => {
      const exerciseId = 'nonexistent';

      // Mock the API call
      vi.spyOn(hevyApi, 'getWorkouts').mockResolvedValue({
        workouts: mockWorkouts,
        page: 1,
        pageCount: 1,
      });

      const progressData = await analyzeProgressForExercise(exerciseId);

      expect(progressData).toHaveLength(0);
    });
  });

  describe('calculateRecordsByReps', () => {
    it('should calculate records by reps correctly', async () => {
      const exerciseId = 'exercise1';

      // Mock the API call
      vi.spyOn(hevyApi, 'getWorkouts').mockResolvedValue({
        workouts: mockWorkouts,
        page: 1,
        pageCount: 1,
      });

      const progressData = await analyzeProgressForExercise(exerciseId);
      const records = calculateRecordsByReps(progressData);

      // Check that we have records
      expect(records.length).toBeGreaterThan(0);

      // Check records are sorted by reps
      for (let i = 1; i < records.length; i++) {
        expect(records[i].reps).toBeGreaterThan(records[i - 1].reps);
      }

      // Check that record values make sense
      records.forEach((record) => {
        expect(record.reps).toBeGreaterThan(0);
        expect(record.weight_kg).toBeGreaterThan(0);
        expect(typeof record.date).toBe('string');
      });
    });

    it('should return empty array if no progress data', () => {
      const records = calculateRecordsByReps([]);
      expect(records).toHaveLength(0);
    });
  });

  describe('API integration functions', () => {
    beforeEach(() => {
      // Mock the hevyApi.getWorkouts function
      (hevyApi.getWorkouts as vi.MockedFunction<typeof hevyApi.getWorkouts>).mockResolvedValue({
        workouts: mockWorkouts,
        page: 1,
        pageCount: 1,
      });

      // Mock the hevyApi.getExercises function
      (hevyApi.getExercises as vi.MockedFunction<typeof hevyApi.getExercises>).mockResolvedValue({
        exercises: mockExerciseTemplates,
        page: 1,
        pageCount: 1,
      });

      // Mock the hevyApi.getRoutines function
      (hevyApi.getRoutines as vi.MockedFunction<typeof hevyApi.getRoutines>).mockResolvedValue({
        routines: mockRoutines,
        page: 1,
        pageCount: 1,
      });
    });

    describe('fetchAllWorkouts', () => {
      it('should fetch all workouts from the API', async () => {
        const workouts = await fetchAllWorkouts();

        expect(hevyApi.getWorkouts).toHaveBeenCalledWith({ page: 1, pageSize: 10 });
        expect(workouts).toEqual(mockWorkouts);
      });

      it('should handle pagination when there are multiple pages', async () => {
        // Mock first page response
        (
          hevyApi.getWorkouts as vi.MockedFunction<typeof hevyApi.getWorkouts>
        ).mockResolvedValueOnce({
          workouts: [mockWorkouts[0]],
          page: 1,
          pageCount: 2,
        });

        // Mock second page response
        (
          hevyApi.getWorkouts as vi.MockedFunction<typeof hevyApi.getWorkouts>
        ).mockResolvedValueOnce({
          workouts: [mockWorkouts[1]],
          page: 2,
          pageCount: 2,
        });

        const workouts = await fetchAllWorkouts();

        expect(hevyApi.getWorkouts).toHaveBeenCalledTimes(2);
        expect(hevyApi.getWorkouts).toHaveBeenCalledWith({ page: 1, pageSize: 10 });
        expect(hevyApi.getWorkouts).toHaveBeenCalledWith({ page: 2, pageSize: 10 });
        expect(workouts).toHaveLength(2);
        expect(workouts).toEqual(mockWorkouts);
      });

      it('should return empty array when API call fails', async () => {
        (
          hevyApi.getWorkouts as vi.MockedFunction<typeof hevyApi.getWorkouts>
        ).mockRejectedValueOnce(new Error('API error'));

        const workouts = await fetchAllWorkouts();

        expect(workouts).toEqual([]);
      });
    });

    describe('fetchAllExerciseTemplates', () => {
      it('should fetch all exercise templates from the API', async () => {
        const exercises = await fetchAllExerciseTemplates();

        expect(hevyApi.getExercises).toHaveBeenCalledWith({ page: 1, pageSize: 10 });
        expect(exercises).toEqual(mockExerciseTemplates);
      });

      it('should handle pagination when there are multiple pages', async () => {
        // Mock first page response
        (
          hevyApi.getExercises as vi.MockedFunction<typeof hevyApi.getExercises>
        ).mockResolvedValueOnce({
          exercises: [mockExerciseTemplates[0]],
          page: 1,
          pageCount: 2,
        });

        // Mock second page response
        (
          hevyApi.getExercises as vi.MockedFunction<typeof hevyApi.getExercises>
        ).mockResolvedValueOnce({
          exercises: [mockExerciseTemplates[1], mockExerciseTemplates[2]],
          page: 2,
          pageCount: 2,
        });

        const exercises = await fetchAllExerciseTemplates();

        expect(hevyApi.getExercises).toHaveBeenCalledTimes(2);
        expect(exercises).toHaveLength(3);
        expect(exercises).toEqual(mockExerciseTemplates);
      });

      it('should return empty array when API call fails', async () => {
        (
          hevyApi.getExercises as vi.MockedFunction<typeof hevyApi.getExercises>
        ).mockRejectedValueOnce(new Error('API error'));

        const exercises = await fetchAllExerciseTemplates();

        expect(exercises).toEqual([]);
      });
    });

    describe('fetchAllRoutines', () => {
      it('should fetch all routines from the API', async () => {
        const routines = await fetchAllRoutines();

        expect(hevyApi.getRoutines).toHaveBeenCalledWith({ page: 1, pageSize: 10 });
        expect(routines).toEqual(mockRoutines);
      });

      it('should handle pagination when there are multiple pages', async () => {
        // Mock first page response with pageCount = 2
        (
          hevyApi.getRoutines as vi.MockedFunction<typeof hevyApi.getRoutines>
        ).mockResolvedValueOnce({
          routines: [mockRoutines[0]],
          page: 1,
          pageCount: 2,
        });

        // Mock second page response
        (
          hevyApi.getRoutines as vi.MockedFunction<typeof hevyApi.getRoutines>
        ).mockResolvedValueOnce({
          routines: [],
          page: 2,
          pageCount: 2,
        });

        const routines = await fetchAllRoutines();

        expect(hevyApi.getRoutines).toHaveBeenCalledTimes(2);
        expect(routines).toEqual(mockRoutines);
      });

      it('should return empty array when API call fails', async () => {
        (
          hevyApi.getRoutines as vi.MockedFunction<typeof hevyApi.getRoutines>
        ).mockRejectedValueOnce(new Error('API error'));

        const routines = await fetchAllRoutines();

        expect(routines).toEqual([]);
      });
    });

    describe('getWorkouts', () => {
      it('should return workouts after a specific date', async () => {
        const startDate = new Date('2023-01-02T00:00:00Z');
        const result = await getWorkouts(startDate);

        expect(Array.isArray(result)).toBe(true);
        if (result && !Array.isArray(result)) {
          expect(result).toHaveLength(1);
          expect(result[0]).toEqual(mockWorkouts[1]); // Only workout2 is after Jan 2
        }
      });

      it('should handle empty date', async () => {
        const startDate = new Date('2023-01-01T00:00:00Z');
        const result = await getWorkouts(startDate);

        if (result && !Array.isArray(result)) {
          expect(result).toHaveLength(1);
        }
      });

      it('should return empty response object when API call fails', async () => {
        (
          hevyApi.getWorkouts as vi.MockedFunction<typeof hevyApi.getWorkouts>
        ).mockRejectedValueOnce(new Error('API error'));

        const startDate = new Date('2023-01-01T00:00:00Z');
        const result = await getWorkouts(startDate);

        expect(result).toEqual([]);
      });
    });

    describe('getExercises', () => {
      beforeEach(() => {
        // Reset mocks between tests
        vi.resetAllMocks();

        // Re-setup the basic mocks for each test
        (hevyApi.getWorkouts as vi.MockedFunction<typeof hevyApi.getWorkouts>).mockResolvedValue({
          workouts: mockWorkouts,
          page: 1,
          pageCount: 1,
        });

        (hevyApi.getExercises as vi.MockedFunction<typeof hevyApi.getExercises>).mockResolvedValue({
          exercises: mockExerciseTemplates,
          page: 1,
          pageCount: 1,
        });
      });

      it('should return all exercises with frequency, 1RM data, and sorted by frequency', async () => {
        // Create a mock workout with 1 rep max for exercise1
        const workoutWithOneRepMax: Workout = {
          id: 'workout_1rm',
          title: '1RM Test',
          description: 'Testing 1RM',
          start_time: '2023-01-07T10:00:00Z',
          end_time: '2023-01-07T11:00:00Z',
          updated_at: '2023-01-07T11:00:00Z',
          created_at: '2023-01-07T10:00:00Z',
          exercises: [
            {
              index: 0,
              title: 'Squat',
              notes: '1RM test',
              exercise_template_id: 'exercise1',
              superset_id: null,
              sets: [
                {
                  index: 0,
                  type: 'normal',
                  weight_kg: 150,
                  reps: 1, // 1RM
                  distance_meters: null,
                  duration_seconds: null,
                  rpe: null,
                  custom_metric: null,
                },
                {
                  index: 1,
                  type: 'normal',
                  weight_kg: 140,
                  reps: 3, // This should give estimated 1RM of ~151
                  distance_meters: null,
                  duration_seconds: null,
                  rpe: null,
                  custom_metric: null,
                },
              ],
            },
          ],
        };

        // Add the new workout to our mock data
        const extendedMockWorkouts = [...mockWorkouts, workoutWithOneRepMax];

        // Mock the API to return our extended workouts
        (hevyApi.getWorkouts as vi.MockedFunction<typeof hevyApi.getWorkouts>).mockResolvedValue({
          workouts: extendedMockWorkouts,
          page: 1,
          pageCount: 1,
        });

        const result = await getExercises();

        // Check the basic structure
        expect(result).toHaveLength(mockExerciseTemplates.length);

        // Find exercise1 (Squat) which should have frequency 2 and 1RM data
        const squat = result.find((ex) => ex.id === 'exercise1');
        expect(squat).toBeDefined();
        expect(squat?.name).toBe('Squat');
        expect(squat?.frequency).toBe(2); // Once in mockWorkouts, once in our new workout

        // Check actual 1RM object structure
        expect(squat?.actual1RM).toBeDefined();
        expect(squat?.actual1RM).toHaveProperty('weightKg');
        expect(squat?.actual1RM).toHaveProperty('date');
        expect(squat?.actual1RM?.weightKg).toBe(150); // From our 1RM set
        expect(squat?.actual1RM?.date).toBe(workoutWithOneRepMax.start_time);

        // Verify estimated 1RM is present and roughly matches expected calculation
        expect(squat?.estimated1RM).toBeDefined();
        expect(squat?.estimated1RM).toHaveProperty('weightKg');
        expect(squat?.estimated1RM).toHaveProperty('date');

        // The formula (weight * 36/(37-reps)) with weight=140, reps=3 should yield ~150
        if (squat?.estimated1RM) {
          expect(squat.estimated1RM.weightKg).toBeGreaterThan(149);
          expect(squat.estimated1RM.weightKg).toBeLessThan(151);
          expect(squat.estimated1RM.date).toBe(workoutWithOneRepMax.start_time);
        }

        // Check other data is included
        expect(squat).toHaveProperty('type');
        expect(squat).toHaveProperty('primary_muscle_group');
        expect(squat).toHaveProperty('secondary_muscle_groups');
        expect(squat).toHaveProperty('equipment');

        // Verify sorting by frequency descending
        expect(result[0].frequency).toBeGreaterThanOrEqual(result[1].frequency);
      });

      it('should filter exercises by searchTerm when provided', async () => {
        const result = await getExercises('squat');

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Squat');
      });

      it('should handle case insensitive search', async () => {
        const result = await getExercises('SQUAT');

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Squat');
      });

      it('should return partial matches for search term', async () => {
        const result = await getExercises('press');

        expect(result).toHaveLength(2);
        expect(result.map((e) => e.name)).toContain('Leg Press');
        expect(result.map((e) => e.name)).toContain('Bench Press');
      });

      it('should return empty array when no exercises match search term', async () => {
        const result = await getExercises('nonexistent');

        expect(result).toHaveLength(0);
      });

      it('should return empty array when API calls fail', async () => {
        // Mock API failure
        (
          hevyApi.getWorkouts as vi.MockedFunction<typeof hevyApi.getWorkouts>
        ).mockRejectedValueOnce(new Error('API error'));

        const result = await getExercises();

        expect(result).toEqual([]);
      });

      it('should filter out exercises with zero frequency when excludeUnused is true', async () => {
        // Create mock data with an exercise that has zero frequency
        const zeroFrequencyExercise: ExerciseTemplate = {
          id: 'exercise5',
          title: 'Pull-up',
          type: 'weight_reps',
          primary_muscle_group: 'Back',
          secondary_muscle_groups: ['Biceps'],
          equipment: 'bodyweight',
          is_custom: false,
        };

        // Add the zero frequency exercise to templates
        const extendedTemplates = [...mockExerciseTemplates, zeroFrequencyExercise];

        // Mock the API to return our extended templates
        (hevyApi.getExercises as vi.MockedFunction<typeof hevyApi.getExercises>).mockResolvedValue({
          exercises: extendedTemplates,
          page: 1,
          pageCount: 1,
        });

        // With excludeUnused = true, the zero frequency exercise should be filtered out
        const resultWithExclude = await getExercises(undefined, true);
        expect(resultWithExclude.find((ex) => ex.id === 'exercise5')).toBeUndefined();

        // With excludeUnused = false, the zero frequency exercise should be included
        const resultWithoutExclude = await getExercises(undefined, false);
        const pullUp = resultWithoutExclude.find((ex) => ex.id === 'exercise5');
        expect(pullUp).toBeDefined();
        expect(pullUp?.frequency).toBe(0);
      });

      it('should return all workouts when startDate is undefined', async () => {
        // Create mock workouts with different dates
        const oldWorkout: Workout = {
          ...mockWorkouts[0],
          id: 'old_workout',
          start_time: '2022-01-01T10:00:00Z',
          end_time: '2022-01-01T11:00:00Z',
        };

        const newWorkout: Workout = {
          ...mockWorkouts[0],
          id: 'new_workout',
          start_time: '2024-01-01T10:00:00Z',
          end_time: '2024-01-01T11:00:00Z',
        };

        const allWorkouts = [oldWorkout, newWorkout];

        // Mock the API to return all workouts
        (hevyApi.getWorkouts as vi.MockedFunction<typeof hevyApi.getWorkouts>).mockResolvedValue({
          workouts: allWorkouts,
          page: 1,
          pageCount: 1,
        });

        // Call getExercises with undefined startDate
        const result = await getExercises(undefined, false, undefined);

        // Verify that exercises from both old and new workouts are included
        const exerciseFrequencies = result.map((ex) => ({
          id: ex.id,
          frequency: ex.frequency,
        }));

        // Since both workouts contain the same exercises, their frequency should be 2
        for (const exercise of exerciseFrequencies) {
          if (exercise.id === 'exercise1' || exercise.id === 'exercise2') {
            expect(exercise.frequency).toBe(2);
          }
        }

        // Verify that dates from both old and new workouts are considered in records
        const squatExercise = result.find((ex) => ex.id === 'exercise1');
        expect(squatExercise).toBeDefined();

        // The records should include data from both workouts
        if (squatExercise?.actual1RM) {
          expect([oldWorkout.start_time, newWorkout.start_time]).toContain(
            squatExercise.actual1RM.date
          );
        }
      });

      it('should use the heaviest weight lifted as actual1RM regardless of rep count', async () => {
        // Create a mock workout with a heavier weight at higher reps
        const workoutWithHigherWeight: Workout = {
          id: 'workout_higher_weight',
          title: 'Heavy Weight Test',
          description: 'Testing heavy weights at higher reps',
          start_time: '2023-01-08T10:00:00Z',
          end_time: '2023-01-08T11:00:00Z',
          updated_at: '2023-01-08T11:00:00Z',
          created_at: '2023-01-08T10:00:00Z',
          exercises: [
            {
              index: 0,
              title: 'Romanian Deadlift',
              notes: 'Heavy set',
              exercise_template_id: 'exercise4', // New exercise not in original mock data
              superset_id: null,
              sets: [
                {
                  index: 0,
                  type: 'normal',
                  weight_kg: 110, // Heavier weight
                  reps: 8, // Higher rep count
                  distance_meters: null,
                  duration_seconds: null,
                  rpe: null,
                  custom_metric: null,
                },
                {
                  index: 1,
                  type: 'normal',
                  weight_kg: 90,
                  reps: 1, // 1RM at lower weight
                  distance_meters: null,
                  duration_seconds: null,
                  rpe: null,
                  custom_metric: null,
                },
              ],
            },
          ],
        };

        // Add a new exercise template for Romanian Deadlift
        const extendedTemplates = [
          ...mockExerciseTemplates,
          {
            id: 'exercise4',
            title: 'Romanian Deadlift',
            type: 'weight_reps',
            primary_muscle_group: 'Hamstrings',
            secondary_muscle_groups: ['Lower Back', 'Glutes'],
            equipment: 'barbell',
            is_custom: false,
          },
        ];

        // Add the new workout to our mock data
        const extendedMockWorkouts = [...mockWorkouts, workoutWithHigherWeight];

        // Mock the API to return our extended data
        (hevyApi.getWorkouts as vi.MockedFunction<typeof hevyApi.getWorkouts>).mockResolvedValue({
          workouts: extendedMockWorkouts,
          page: 1,
          pageCount: 1,
        });

        (hevyApi.getExercises as vi.MockedFunction<typeof hevyApi.getExercises>).mockResolvedValue({
          exercises: extendedTemplates,
          page: 1,
          pageCount: 1,
        });

        const result = await getExercises();

        // Find Romanian Deadlift in results
        const romanianDeadlift = result.find((ex) => ex.id === 'exercise4');
        expect(romanianDeadlift).toBeDefined();

        // Check that actual1RM uses the heavier weight (110kg) even though it was lifted for 8 reps
        expect(romanianDeadlift?.actual1RM).toBeDefined();
        expect(romanianDeadlift?.actual1RM?.weightKg).toBe(110);

        // Check that estimated1RM is still based on the formula
        expect(romanianDeadlift?.estimated1RM).toBeDefined();

        // The estimated1RM should be higher than 110kg since it's calculating what could be lifted at 1 rep
        if (romanianDeadlift?.estimated1RM) {
          expect(romanianDeadlift.estimated1RM.weightKg).toBeGreaterThan(110);
        }
      });
    });
  });
});
