#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  GetExercisesParams,
  GetWorkoutsParams,
  GetExerciseProgressParams,
} from './types/ParamTypes.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getWorkouts, getExerciseProgressByIds, getExercises, getRoutines } from './tools.js';
import {
  getWorkoutsSchema,
  getExerciseProgressSchema,
  getExercisesSchema,
  getRoutinesSchema,
} from './schemas/tools.js';
import { createWorkoutPrompt } from './prompts.js';
import { getToolsDocumentation } from './resources.js';

// Get package.json data
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));

// Create server instance with capabilities
const server = new McpServer({
  name: packageJson.name,
  version: packageJson.version,
});

server.resource(
  'tools-documentation',
  'file:///tools/documentation',
  {
    contentType: 'text/markdown',
    description: 'Documentation for all available tools in the Hevy MCP Server',
  },
  async () => getToolsDocumentation()
);

// Register workout tools
server.tool(
  'get-workouts',
  `Get workouts between start and end dates. Returns all workouts if no dates are provided. Returns workouts in descending order of date and limits the number of workouts returned. Max 10 workouts.

Example:
{
  "limit": 5,                           // Optional: Number of workouts (1-10, default: 10)
  "startDate": "2024-01-01T00:00:00Z", // Optional: Filter workouts after this date
  "endDate": "2024-03-20T23:59:59Z"    // Optional: Filter workouts before this date
}`,
  getWorkoutsSchema,
  async (params: GetWorkoutsParams) => getWorkouts(params)
);

server.tool(
  'get-exercise-progress-by-ids',
  `Get progress history for specific exercises between start and end dates. Returns exercise data including weights, reps, and sets for each workout. Results are ordered by date descending. Useful for tracking progress over time for particular exercises.

Example:
{
  "exerciseIds": ["bench-press-123", "squat-456"], // Required: Array of exercise IDs
  "limit": 5,                                      // Optional: Number of workouts (0-10, default: 10)
  "startDate": "2024-01-01T00:00:00Z",            // Optional: Filter after this date
  "endDate": "2024-03-20T23:59:59Z"               // Optional: Filter before this date
}`,
  getExerciseProgressSchema,
  async (params: GetExerciseProgressParams) => getExerciseProgressByIds(params)
);

server.tool(
  'get-exercises',
  `Get comprehensive exercise data including frequency of use, categorization, and metadata. Results are sorted by usage frequency. Supports filtering by name search and date range.

Example:
{
  "searchTerm": "bench press",          // Optional: Filter exercises by name
  "excludeUnused": true,               // Optional: Skip never-performed exercises (default: true)
  "startDate": "2024-01-01T00:00:00Z", // Optional: Consider usage after this date
  "endDate": "2024-03-20T23:59:59Z"    // Optional: Consider usage before this date
}`,
  getExercisesSchema,
  async (params: GetExercisesParams) => getExercises(params)
);

server.tool(
  'get-routines',
  `Get user's saved workout routines. Returns all custom and preset routines with their full exercise details, including sets, reps, and rest periods.

Example:
{} // No parameters required`,
  getRoutinesSchema,
  async () => getRoutines()
);

// Add smart routine builder prompt handler
server.prompt(
  'Build me a new workout routine',
  'I will analyze your existing routines and favorite exercises to suggest a new personalized routine.',
  async () => await createWorkoutPrompt()
);

// Start the server
async function main() {
  //await hevyService.populateCache();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Hevy Trainer MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
