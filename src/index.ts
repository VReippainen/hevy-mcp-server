import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import hevyService from './services/hevyService.js';
import { getDateRangeFromTimeframe } from './utils/dateUtils.js';

// Define parameter types for tool handlers
interface GetRecentWorkoutsParams {
  limit: number;
}

interface GetWorkoutDetailsParams {
  workoutId: string;
}

interface GetExerciseIdByNameParams {
  searchTerm: string;
}

interface GetExerciseProgressParams {
  exerciseId: string;
  startDate: string;
}

interface AnalyzeWorkoutVolumeParams {
  timeframe: 'week' | 'month' | 'quarter' | 'year';
}

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
    const workoutData = await hevyService.getRecentWorkouts(limit);

    if (!workoutData) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: false, message: 'Failed to retrieve workout data' }),
          },
        ],
      };
    }

    const workouts = workoutData.workouts || [];
    if (workouts.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: true, workouts: [] }),
          },
        ],
      };
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

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ success: true, workouts: formattedWorkouts }),
        },
      ],
    };
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
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: `Failed to retrieve workout with ID: ${workoutId}`,
            }),
          },
        ],
      };
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

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ success: true, workout: workoutDetails }),
        },
      ],
    };
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
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: `Failed to retrieve exercise with ID: ${exerciseId}`,
            }),
          },
        ],
      };
    }

    // Get all workouts since the start date
    const workoutData = await hevyService.getWorkoutsInTimeframe(new Date(startDate));

    if (!workoutData) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: false, message: 'Failed to retrieve workout data' }),
          },
        ],
      };
    }

    const workouts = workoutData.workouts || [];
    const progress = hevyService.analyzeProgressForExercise(workouts, exerciseId);

    const latestProgress = progress[progress.length - 1];

    // Sort records by rep count for consistency
    const sortedRecords = latestProgress.recordsByReps.sort((a, b) => a.reps - b.reps);

    const response = {
      success: true,
      startDate,
      exercise,
      personalRecords: sortedRecords,
      sessions: progress,
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response),
        },
      ],
    };
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

    if (!exercises) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: `Failed to retrieve exercises with search term: ${searchTerm}`,
            }),
          },
        ],
      };
    }

    const response = exercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.title,
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response),
        },
      ],
    };
  }
);

server.tool('get-routines', "Get user's workout routines", {}, async () => {
  const routines = await hevyService.fetchAllRoutines();

  if (routines.length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ success: false, message: 'Failed to retrieve routines' }),
        },
      ],
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ success: true, routines }),
      },
    ],
  };
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
    const workoutData = await hevyService.getWorkoutsInTimeframe(startDate, 100);

    if (!workoutData) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: false, message: 'Failed to retrieve workout data' }),
          },
        ],
      };
    }

    const workouts = workoutData.workouts ?? [];

    if (workouts.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              timeframe,
              message: `No workouts found in the last ${timeframe}`,
              volumeData: [],
            }),
          },
        ],
      };
    }

    // Get exercise templates to map IDs to muscle groups
    const exerciseData = await hevyService.getExerciseTemplates(200);

    if (!exerciseData || !exerciseData.exercise_templates) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: false, message: 'Failed to retrieve exercise data' }),
          },
        ],
      };
    }

    // Calculate volume by muscle group
    const volumeData = hevyService.calculateVolumeByMuscleGroup(
      workouts,
      exerciseData.exercise_templates
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            timeframe,
            totalWorkouts: workoutData.workouts.length,
            volumeByMuscle: volumeData,
          }),
        },
      ],
    };
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
