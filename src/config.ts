/**
 * Configuration file for environment variables and app settings
 */
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const config = {
  // API settings
  api: {
    hevyBaseUrl: process.env.HEVY_API_BASE_URL || 'https://api.hevyapp.com/v1',
    hevyApiKey: process.env.HEVY_API_KEY || 'YOUR_API_KEY_HERE',
  },

  // Server settings
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  },
};
