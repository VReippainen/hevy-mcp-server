import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import hevyService from './services/hevyService.js';
import { getDateRangeFromTimeframe } from './utils/dateUtils.js';

interface TokenParams {
  token: string;
}

// Define parameter types for tool handlers
interface GetRecentWorkoutsParams extends TokenParams {
  limit: number;
}

interface GetWorkoutDetailsParams extends TokenParams {
  workoutId: string;
}

interface GetExerciseProgressParams extends TokenParams {
  searchTerm: string;
  timeframe: 'month' | 'quarter' | 'year' | 'all';
}

interface AnalyzeWorkoutVolumeParams extends TokenParams {
  timeframe: 'week' | 'month' | 'quarter';
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
    token: z.string().describe('User API token'),
    limit: z.number().min(1).max(1000).default(1000).describe('Number of workouts to retrieve'),
  },
  async ({ token, limit }: GetRecentWorkoutsParams) => {
    const workoutData = await hevyService.getRecentWorkouts(token, limit);

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
        exercises: workout.exercises,
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
    token: z.string().describe('User API token'),
    workoutId: z.string().describe('ID of the workout to retrieve'),
  },
  async ({ token, workoutId }: GetWorkoutDetailsParams) => {
    const workout = await hevyService.getWorkoutDetails(token, workoutId);

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
  'get-exercise-progress',
  'Get progress tracking for a specific exercise over time',
  {
    token: z.string().describe('User API token'),
    searchTerm: z.string().describe('Search exercises, which name contains the search term'),
    timeframe: z
      .enum(['month', 'quarter', 'year', 'all'])
      .default('all')
      .describe('Timeframe for progress tracking'),
  },
  async ({ token, searchTerm, timeframe }: GetExerciseProgressParams) => {
    // Get exercise details first
    const exercises = await hevyService.searchExerciseTemplatesByName(token, searchTerm);

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

    // Determine date range based on timeframe
    const startDate = getDateRangeFromTimeframe(timeframe);

    // Get all workouts in the timeframe
    const workoutData = await hevyService.getWorkoutsInTimeframe(token, startDate);

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

    const progressByExercise = exercises.map((exercise) => {
      return {
        exercise,
        progress: hevyService.analyzeProgressForExercise(workouts, exercise.id),
      };
    });
    const response = progressByExercise
      .filter(({ progress }) => progress.length > 0)
      .map(({ exercise, progress }) => {
        const maxWeight = Math.max(...progress.map((d) => d.maxWeight));
        const maxReps = Math.max(...progress.map((d) => d.maxReps));
        const maxVolume = Math.max(...progress.map((d) => d.maxVolume));

        return {
          success: true,
          timeframe,
          exercise,
          personalRecords: {
            maxWeight,
            maxReps,
            maxVolume,
          },
          sessions: progress,
        };
      });

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
  'get-routines',
  "Get user's workout routines",
  {
    token: z.string().describe('User API token'),
  },
  async ({ token }: TokenParams) => {
    const routines = await hevyService.fetchAllRoutines(token);

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
  }
);

server.tool(
  'analyze-workout-volume',
  'Analyze workout volume by muscle group',
  {
    token: z.string().describe('User API token'),
    timeframe: z
      .enum(['week', 'month', 'quarter'])
      .default('week')
      .describe('Timeframe for analysis'),
  },
  async ({ token, timeframe }: AnalyzeWorkoutVolumeParams) => {
    // Determine date range based on timeframe
    const startDate = getDateRangeFromTimeframe(timeframe);

    // Get workouts in the timeframe
    const workoutData = await hevyService.getWorkoutsInTimeframe(token, startDate, 100);

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
    const exerciseData = await hevyService.getExerciseTemplates(token, 200);

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

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Hevy Trainer MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
