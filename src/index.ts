import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import hevyService from './services/hevyService.js';
import { getDateRangeFromTimeframe } from './utils/dateUtils.js';
import {
  GetRecentWorkoutsParams,
  GetWorkoutDetailsParams,
  GetExerciseIdByNameParams,
  GetExerciseProgressParams,
  AnalyzeWorkoutVolumeParams,
} from './types/ParamTypes.js';
import { createErrorResponse, createSuccessResponse } from './utils/responseUtils.js';

// Create server instance
const server = new McpServer({
  name: 'hevy-trainer',
  version: '1.0.0',
});

// Register workout tools
server.tool(
  'get-recent-workouts',
  "Get user's recent workouts",
  {
    limit: z.number().min(1).max(10).default(10).describe('Number of workouts to retrieve'),
  },
  async ({ limit }: GetRecentWorkoutsParams) => {
    const workouts = await hevyService.getRecentWorkouts(limit);

    if (!workouts) {
      return createErrorResponse('Failed to retrieve workouts');
    }

    if (workouts.length === 0) {
      return createSuccessResponse({ workouts: [] });
    }

    // Format workout data with stats
    const formattedWorkouts = workouts.map((workout) => {
      const stats = hevyService.calculateWorkoutStats(workout);
      return {
        id: workout.id,
        title: workout.title,
        date: new Date(workout.start_time).toISOString(),
        durationMinutes: stats.durationMinutes,
        totalVolume: stats.totalVolume,
        exercises: workout.exercises.map((exercise) => ({
          id: exercise.exercise_template_id,
          name: exercise.title,
          sets: exercise.sets.map((set) => ({
            weight: set.weight_kg,
            reps: set.reps,
          })),
        })),
      };
    });

    const response = {
      workouts: formattedWorkouts,
    };

    return createSuccessResponse(response);
  }
);

server.tool(
  'get-workout-details',
  'Get detailed information about a specific workout',
  {
    workoutId: z.string().describe('ID of the workout to retrieve'),
  },
  async ({ workoutId }: GetWorkoutDetailsParams) => {
    const workout = await hevyService.getWorkoutDetails(workoutId);

    if (!workout) {
      return createErrorResponse(`Failed to retrieve workout with ID: ${workoutId}`);
    }

    const stats = hevyService.calculateWorkoutStats(workout);

    const workoutDetails = {
      id: workout.id,
      title: workout.title,
      date: new Date(workout.start_time).toISOString(),
      durationMinutes: stats.durationMinutes,
      totalVolume: stats.totalVolume,
      exercises: workout.exercises,
    };
    return createSuccessResponse({ workout: workoutDetails });
  }
);

server.tool(
  'get-exercise-progress-by-id',
  'Get progress tracking for a specific exercise over time and all-time records. Use get-exercise-id-by-name to get the exercise ID.',
  {
    exerciseId: z.string().describe('ID of the exercise to retrieve progress for'),
    startDate: z
      .string()
      .describe('ISO date string for the start date of the progress tracking')
      .default(new Date(0).toISOString()),
  },
  async ({ exerciseId, startDate }: GetExerciseProgressParams) => {
    // Get exercise details first
    const exercise = await hevyService.getExerciseDetailsById(exerciseId);

    if (!exercise) {
      return createErrorResponse(`Failed to retrieve exercise with ID: ${exerciseId}`);
    }

    // Get all workouts since the start date
    const workouts = await hevyService.getWorkoutsInTimeframe(new Date(startDate));

    if (!workouts) {
      return createErrorResponse('Failed to retrieve workout data');
    }

    const progress = hevyService.analyzeProgressForExercise(workouts, exerciseId);

    const latestProgress = progress[progress.length - 1];

    // Sort records by rep count for consistency
    const sortedRecords = latestProgress.recordsByReps.sort((a, b) => a.reps - b.reps);

    const response = {
      startDate,
      exercise,
      personalRecords: sortedRecords,
      sessions: progress,
    };

    return createSuccessResponse(response);
  }
);

server.tool(
  'get-exercise-id-by-name',
  'Get exercise ID by name',
  {
    searchTerm: z.string().describe('Search exercises, which name contains the search term'),
  },
  async ({ searchTerm }: GetExerciseIdByNameParams) => {
    // Get exercise details first
    const exercises = await hevyService.searchExerciseTemplatesByName(searchTerm);

    if (exercises.length === 0) {
      return createErrorResponse(`No exercises found matching: ${searchTerm}`);
    }

    const response = exercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.title,
    }));

    return createSuccessResponse(response);
  }
);

server.tool('get-exercise-ids-and-names', 'Get all exercise IDs and names', {}, async () => {
  // Get exercise details first
  const exercises = await hevyService.fetchAllExerciseTemplates();

  if (!exercises) {
    return createErrorResponse(`Failed to retrieve exercises`);
  }

  const response = exercises.map((exercise) => ({
    id: exercise.id,
    name: exercise.title,
  }));

  return createSuccessResponse(response);
});

server.tool('get-routines', "Get user's workout routines", {}, async () => {
  const routines = await hevyService.fetchAllRoutines();

  if (routines.length === 0) {
    return createErrorResponse('Failed to retrieve routines');
  }

  const response = {
    routines,
  };

  return createSuccessResponse(response);
});

server.tool(
  'analyze-workout-volume',
  'Analyze workout volume by muscle group',
  {
    timeframe: z
      .enum(['week', 'month', 'quarter', 'year'])
      .default('week')
      .describe('Timeframe for analysis'),
  },
  async ({ timeframe }: AnalyzeWorkoutVolumeParams) => {
    // Determine date range based on timeframe
    const startDate = getDateRangeFromTimeframe(timeframe);

    // Get workouts in the timeframe
    const workouts = await hevyService.getWorkoutsInTimeframe(startDate);

    if (!workouts) {
      return createErrorResponse('Failed to retrieve workout data');
    }

    if (workouts.length === 0) {
      return createSuccessResponse({
        timeframe,
        message: `No workouts found in the last ${timeframe}`,
        volumeData: [],
      });
    }

    // Get exercise templates to map IDs to muscle groups
    const exerciseData = await hevyService.fetchAllExerciseTemplates();

    if (!exerciseData) {
      return createErrorResponse('Failed to retrieve exercise data');
    }

    // Calculate volume by muscle group
    const volumeData = hevyService.calculateVolumeByMuscleGroup(workouts, exerciseData);
    const response = {
      timeframe,
      totalWorkouts: workouts.length,
      volumeByMuscle: volumeData,
    };

    return createSuccessResponse(response);
  }
);

async function populateCache() {
  await Promise.all([
    hevyService.fetchAllExerciseTemplates(),
    hevyService.fetchAllRoutines(),
    hevyService.fetchAllWorkouts(),
  ]);
}

// Start the server
async function main() {
  await populateCache();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Hevy Trainer MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
