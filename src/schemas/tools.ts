import { z } from 'zod';

export const getWorkoutsSchema = {
  limit: z.number().min(1).max(10).default(10).describe('Number of workouts to retrieve'),
  startDate: z
    .string()
    .optional()
    .describe('Optional: ISO date string to filter workouts after this date'),
  endDate: z
    .string()
    .optional()
    .describe('Optional: ISO date string to filter workouts before this date'),
};

export const getExerciseProgressSchema = {
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
};

export const getExercisesSchema = {
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
};

export const getRoutinesSchema = {}; 