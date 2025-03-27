#!/usr/bin/env node

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import hevyService from './services/hevyService.js';
import {
  GetExercisesParams,
  GetWorkoutsParams,
  GetExerciseProgressParams,
} from './types/ParamTypes.js';
import { createErrorResponse, createSuccessResponse } from './utils/responseUtils.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get package.json data
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));

// Create server instance
const server = new McpServer({
  name: packageJson.name,
  version: packageJson.version,
});

// Just a placeholder prompt to test out the prompt feature
server.prompt(
  'make-workout-prompt',
  'Get a prompt fow building user a workout using her favorite exercises.',
  {},
  async () => {
    const exercises = await hevyService.getExercises();
    if (!exercises?.length) {
      throw new Error('No exercises found. Cannot form prompt');
    }
    const favoriteWorkouts = exercises
      .slice(0, 20)
      .map((exercise) => exercise.name)
      .join(', ');
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Make me a workout using my following favorite workouts:\n\n${favoriteWorkouts}`,
          },
        },
      ],
    };
  }
);

// Just a placeholder resource to test out the resource feature
server.resource(
  'echo',
  new ResourceTemplate('echo://{message}', { list: undefined }),
  async (uri, { message }) => ({
    contents: [
      {
        uri: uri.href,
        text: `Resource echo: ${message}`,
      },
    ],
  })
);

// Register workout tools
server.tool(
  'get-workouts',
  'Get workouts between start and end dates. Returns all workouts if no dates are provided. Returns workouts in descending order of date and limits the number of workouts returned. Max 10 workouts.',
  {
    limit: z.number().min(1).max(10).default(10).describe('Number of workouts to retrieve'),
    startDate: z
      .string()
      .optional()
      .describe('Optional: ISO date string to filter workouts after this date'),
    endDate: z
      .string()
      .optional()
      .describe('Optional: ISO date string to filter workouts before this date'),
  },
  async ({ limit, startDate, endDate }: GetWorkoutsParams) => {
    const workouts = await hevyService.getWorkouts(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    if (!workouts) {
      return createErrorResponse('Failed to retrieve workouts');
    }

    // Format workout data with stats and limit the results
    const formattedWorkouts = workouts.slice(0, limit).map((workout) => {
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
      totalWorkouts: workouts.length,
      returnedWorkouts: formattedWorkouts.length,
    };

    return createSuccessResponse(response);
  }
);

server.tool(
  'get-exercise-progress-by-ids',
  'Get progress for a specific exercises between start and end dates. Returns all workouts if no dates are provided. Returns workouts in descending order of date and limits the number of workouts returned. Max 10 workouts. Give exercise IDs as an array of strings.',
  {
    exerciseIds: z.array(z.string()).describe('IDs of the exercises to retrieve progress for'),
    limit: z.number().min(0).max(10).default(10).describe('Number of latest workouts to retrieve'),
    startDate: z
      .string()
      .optional()
      .describe('Optional: ISO date string to filter workouts after this date'),
    endDate: z
      .string()
      .optional()
      .describe('Optional: ISO date string to filter workouts before this date'),
  },
  async ({ exerciseIds, limit, startDate, endDate }: GetExerciseProgressParams) => {
    try {
      const [workouts, allExercises] = await Promise.all([
        hevyService.getWorkouts(
          startDate ? new Date(startDate) : undefined,
          endDate ? new Date(endDate) : undefined
        ),
        hevyService.fetchAllExerciseTemplates(),
      ]);

      // Get only relevant exercises
      const exercises = allExercises.filter((exercise) => exerciseIds.includes(exercise.id));

      // Get progress for each exercise
      const exerciseProgress = exercises.map((exercise) =>
        hevyService.processExerciseProgress(exercise, workouts, limit)
      );

      return createSuccessResponse({ exerciseProgress });
    } catch (error) {
      console.error('Error processing exercise progress:', error);
      return createErrorResponse('Failed to process exercise progress data');
    }
  }
);

server.tool(
  'get-exercises',
  'Get comprehensive exercise data sorted by frequency of use between start and end dates. Returns all exercises if no dates are provided. Returns exercises in descending order of frequency of use and limits the number of exercises returned. Give search term to filter exercises by name. Exclude unused exercises by default.',
  {
    searchTerm: z.string().optional().describe('Optional: Search term to filter exercises by name'),
    excludeUnused: z
      .boolean()
      .optional()
      .default(true)
      .describe('If true, exclude exercises with zero frequency (never done)'),
    startDate: z
      .string()
      .optional()
      .describe('Optional: ISO date string to filter workouts after this date'),
    endDate: z
      .string()
      .optional()
      .describe('Optional: ISO date string to filter workouts before this date'),
  },
  async ({ searchTerm, excludeUnused, startDate, endDate }: GetExercisesParams) => {
    try {
      const exercises = await hevyService.getExercises(
        searchTerm,
        excludeUnused,
        startDate,
        endDate
      );

      if (!exercises?.length) {
        return createErrorResponse(
          searchTerm ? `No exercises found matching: ${searchTerm}` : 'No exercise data found'
        );
      }

      return createSuccessResponse({ exercises });
    } catch (error) {
      console.error('Error in get-exercises:', error);
      return createErrorResponse('Failed to retrieve exercises');
    }
  }
);

server.tool('get-routines', "Get user's workout routines", {}, async () => {
  const routines = await hevyService.fetchAllRoutines();

  if (routines.length === 0) {
    return createErrorResponse('Failed to retrieve routines');
  }

  return createSuccessResponse({ routines });
});

// Start the server
async function main() {
  await hevyService.populateCache();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Hevy Trainer MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
