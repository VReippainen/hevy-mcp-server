#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import hevyService from './services/hevyService.js';
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
  'get-workouts',
  'Get workouts between start and end dates. Returns all workouts if no dates are provided. Returns workouts in descending order of date and limits the number of workouts returned. Max 10 workouts.',
  getWorkoutsSchema,
  async (params: GetWorkoutsParams) => getWorkouts(params)
);

server.tool(
  'get-exercise-progress-by-ids',
  'Get progress for a specific exercises between start and end dates. Returns all workouts if no dates are provided. Returns workouts in descending order of date and limits the number of workouts returned. Max 10 workouts. Give exercise IDs as an array of strings.',
  getExerciseProgressSchema,
  async (params: GetExerciseProgressParams) => getExerciseProgressByIds(params)
);

server.tool(
  'get-exercises',
  'Get comprehensive exercise data sorted by frequency of use between start and end dates. Returns all exercises if no dates are provided. Returns exercises in descending order of frequency of use and limits the number of exercises returned. Give search term to filter exercises by name. Exclude unused exercises by default.',
  getExercisesSchema,
  async (params: GetExercisesParams) => getExercises(params)
);

server.tool('get-routines', "Get user's workout routines", getRoutinesSchema, async () =>
  getRoutines()
);

// Start the server
async function main() {
  hevyService.populateCache();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Hevy Trainer MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
