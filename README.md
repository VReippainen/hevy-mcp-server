# MCP Server

A TypeScript Node.js server that fetches data from external REST APIs, with a focus on the Hevy API.

## Installation

```bash
pn install
```

## Configuration

Copy the example environment file and update with your API keys:

```bash
cp .env.example .env
```

Then edit the `.env` file with your API credentials:

```
# Server Configuration
PORT=3000

# Hevy API Configuration
HEVY_API_BASE_URL=https://api.hevyapp.com/v1
HEVY_API_KEY=your_api_key_here
```

## Running the server

Start the compiled server:

```bash
pn start
```

Start with auto-restart during development:

```bash
pn dev
```

Build the TypeScript files:

```bash
pn build
```

The server will be available at http://localhost:3000

## API Endpoints

### Hello World

```
GET /
```

Returns a simple "Hello World!" message.

### Hevy API Endpoints

#### Get Workouts

```
GET /api/workouts?page=<number>&pageSize=<number>
```

Returns a list of workouts from the Hevy API.

Parameters:
- `page` (optional): Page number for pagination (default: 1)
- `pageSize` (optional): Number of items per page (default: 10)

Example response structure:
```json
[
  {
    "id": "22b519d3-bc3c-40b9-87ae-c2b938841875",
    "title": "PHUL Hypertrophy lower body",
    "description": "",
    "start_time": "2025-03-18T13:57:48+00:00",
    "end_time": "2025-03-18T15:18:29+00:00",
    "updated_at": "2025-03-18T15:18:30.464Z",
    "created_at": "2025-03-18T15:18:30.464Z",
    "exercises": [
      {
        "index": 0,
        "title": "Romanian Deadlift (Barbell)",
        "notes": "",
        "exercise_template_id": "2B4B7310",
        "superset_id": null,
        "sets": [
          {
            "index": 0,
            "type": "warmup",
            "weight_kg": 20,
            "reps": 8,
            "distance_meters": null,
            "duration_seconds": null,
            "rpe": null,
            "custom_metric": null
          }
        ]
      }
    ]
  }
]
```

#### Get Routines

```
GET /api/routines?page=<number>&pageSize=<number>
```

Returns a list of routines from the Hevy API.

Parameters:
- `page` (optional): Page number for pagination (default: 1)
- `pageSize` (optional): Number of items per page (default: 10)

#### Get Exercise Templates

```
GET /api/exercises?page=<number>&pageSize=<number>
```

Returns a list of exercise templates from the Hevy API.

Parameters:
- `page` (optional): Page number for pagination (default: 1)
- `pageSize` (optional): Number of items per page (default: 10)

Example response structure:
```json
[
  {
    "id": "3BC06AD3",
    "title": "21s Bicep Curl",
    "type": "weight_reps",
    "primary_muscle_group": "biceps",
    "secondary_muscle_groups": [],
    "equipment": "barbell",
    "is_custom": false
  },
  {
    "id": "B4F2FF72",
    "title": "Ab Scissors",
    "type": "reps_only",
    "primary_muscle_group": "abdominals",
    "secondary_muscle_groups": [],
    "equipment": "none",
    "is_custom": false
  }
]
```

## Services

### API Service

Located in `/src/services/api.ts`, this service provides methods for making HTTP requests:

- `get<T>(url, queryParams)`: Makes a GET request to the specified URL with optional query parameters

### Hevy API Service

Located in `/src/services/hevyApi.ts`, this service provides methods for interacting with the Hevy API:

- `getWorkouts(params)`: Gets workouts with optional filter parameters
- `getRoutines(params)`: Gets routines with optional filter parameters
- `getExercises(params)`: Gets exercise templates with optional filter parameters

Example usage:
```typescript
import hevyApi from './services/hevyApi';
import { Workout, ExerciseTemplate } from './types';

// Get all workouts
const workouts = await hevyApi.getWorkouts();

// Get workouts with filters
const filteredWorkouts = await hevyApi.getWorkouts({
  page: 2,
  pageSize: 5
});

// Get exercise templates
const exercises = await hevyApi.getExercises({
  page: 1,
  pageSize: 10
});
```

## Project Structure

```
/
├── src/                # TypeScript source files
│   ├── index.ts        # Main server entrypoint
│   ├── config.ts       # Configuration file
│   ├── services/       # API services
│   │   ├── api.ts      # API fetch service
│   │   ├── hevyApi.ts  # Hevy API service
│   │   └── apiTest.ts  # Test for API service
│   └── types/          # Type definitions
│       ├── index.ts    # Types barrel file
│       ├── Post.ts     # Post interface
│       ├── QueryParams.ts # QueryParams type
│       ├── User.ts     # User interface
│       ├── Workout.ts  # Workout interface
│       ├── Routine.ts  # Routine interface
│       └── Exercise.ts # Exercise interface with ExerciseTemplate
├── dist/               # Compiled JavaScript (generated)
├── .env                # Environment variables (not in version control)
├── .env.example        # Example environment variables
├── package.json        # Dependencies and scripts
└── tsconfig.json       # TypeScript configuration
``` 