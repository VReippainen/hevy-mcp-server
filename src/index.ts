import express from 'express';
import type { Request, Response } from 'express';
import hevyApi from './services/hevyApi';
import { QueryParams } from './types/index';
import config from './config';

/**
 * Create and configure the Express application
 */
export function createApp() {
  const app = express();

  app.get('/', (_req: Request, res: Response) => {
    res.send('Hello World!');
  });

  // Hevy API endpoints
  app.get('/api/workouts', async (req: Request, res: Response) => {
    await handleApiRequest(req, res, hevyApi.getWorkouts, 'Failed to fetch workouts');
  });

  app.get('/api/routines', async (req: Request, res: Response) => {
    await handleApiRequest(req, res, hevyApi.getRoutines, 'Failed to fetch routines');
  });

  app.get('/api/exercises', async (req: Request, res: Response) => {
    await handleApiRequest(req, res, hevyApi.getExercises, 'Failed to fetch exercise templates');
  });

  return app;
}

/**
 * Process query parameters from request
 * @param {Request} req - Express request object
 * @returns {QueryParams} - Processed query parameters
 */
export function processQueryParams(req: Request): QueryParams {
  const queryParams: QueryParams = {};

  Object.entries(req.query).forEach(([key, value]) => {
    if (typeof value === 'string') {
      // Convert numeric strings to numbers
      const numValue = Number(value);
      if (!isNaN(numValue) && /^\d+$/.test(value)) {
        queryParams[key] = numValue;
      } else if (value === 'true' || value === 'false') {
        // Convert boolean strings to actual booleans
        queryParams[key] = value === 'true';
      } else {
        queryParams[key] = value;
      }
    }
  });

  return queryParams;
}

/**
 * Generic API handler to fetch data from Hevy API
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} fetchFn - Function to fetch data from Hevy API
 * @param {string} errorMessage - Error message to display if request fails
 */
export async function handleApiRequest<T>(
  req: Request,
  res: Response,
  fetchFn: (params: QueryParams) => Promise<T>,
  errorMessage: string
): Promise<void> {
  try {
    const queryParams = processQueryParams(req);
    const data = await fetchFn(queryParams);
    res.json(data);
  } catch (error) {
    console.error(errorMessage, error);
    res.status(500).json({ error: errorMessage });
  }
}

// Only start the server in non-test environments
if (process.env.NODE_ENV !== 'test') {
  const app = createApp();
  const port = config.server.port;

  app.listen(port, () => {
    // We want to keep this log as it's useful for server startup info
    console.warn(`Server running at http://localhost:${port}`);
  });
}
