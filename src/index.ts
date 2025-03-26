#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import hevyService from './services/hevyService.js';
import {
  GetRecentWorkoutsParams,
  GetExerciseProgressParams,
  GetExercisesParams,
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

// Register workout tools
server.tool(
  'get-recent-workouts',
  "Get user's recent workouts",
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
  async ({ limit, startDate, endDate }: GetRecentWorkoutsParams) => {
    const workouts = await hevyService.getWorkouts(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    if (!workouts) {
      return createErrorResponse('Failed to retrieve workouts');
    }

    if (workouts.length === 0) {
      return createSuccessResponse({ workouts: [] });
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
  'get-exercise-progress-by-id',
  'Get progress tracking for a specific exercise over time and all-time records.',
  {
    exerciseId: z.string().describe('ID of the exercise to retrieve progress for'),
    limit: z.number().min(0).max(10).default(10).describe('Number of latest workouts to retrieve'),
  },
  async ({ exerciseId, limit }: GetExerciseProgressParams) => {
    // Get exercise details first
    const exercise = await hevyService.getExerciseById(exerciseId);

    if (!exercise) {
      return createErrorResponse(`Failed to retrieve exercise with ID: ${exerciseId}`);
    }

    // Step 1: Get exercise progress data across workouts
    const progress = await hevyService.analyzeProgressForExercise(exerciseId);

    const personalRecords = hevyService.calculateRecordsByReps(progress);

    const response = {
      exercise,
      personalRecords,
      sessions: progress.slice(0, limit),
    };

    return createSuccessResponse(response);
  }
);

server.tool(
  'get-exercises',
  'Get comprehensive exercise data sorted by frequency of use',
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

      if (!exercises || exercises.length === 0) {
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

  const response = {
    routines,
  };

  return createSuccessResponse(response);
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
