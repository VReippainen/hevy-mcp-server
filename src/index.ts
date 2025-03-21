import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import hevyService from './services/hevyService';
import { ExerciseTemplate } from './types';

// Define parameter types for tool handlers
interface GetRecentWorkoutsParams {
  token: string;
  limit: number;
}

interface GetWorkoutDetailsParams {
  token: string;
  workoutId: string;
}

interface GetExerciseProgressParams {
  token: string;
  exerciseId: string;
  timeframe: 'month' | 'quarter' | 'year' | 'all';
}

interface GetRoutinesParams {
  token: string;
}

interface AnalyzeWorkoutVolumeParams {
  token: string;
  timeframe: 'week' | 'month' | 'quarter';
}

interface GenerateWorkoutRecommendationParams {
  token: string;
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
    limit: z.number().min(1).max(50).default(10).describe('Number of workouts to retrieve'),
  },
  async ({ token, limit }: GetRecentWorkoutsParams) => {
    const workoutData = await hevyService.getRecentWorkouts(token, limit);

    if (!workoutData) {
      return {
        content: [
          {
            type: 'text',
            text: 'Failed to retrieve workout data',
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
            text: 'No workouts found',
          },
        ],
      };
    }

    // Format workout data with stats
    const formattedWorkouts = workouts.map((workout) => {
      const stats = hevyService.calculateWorkoutStats(workout);
      const exerciseSummary = workout.exercises
        .map((ex) => {
          return `• ${ex.title} (${ex.sets.length} sets)`;
        })
        .join('\n');

      return `
Workout: ${workout.title}
Date: ${new Date(workout.start_time).toLocaleDateString()}
Duration: ${stats.durationMinutes} minutes
Total Volume: ${stats.totalVolume}kg
Exercises (${workout.exercises.length}):
${exerciseSummary}
---
`;
    });

    return {
      content: [
        {
          type: 'text',
          text: `Recent Workouts:\n\n${formattedWorkouts.join('\n')}`,
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
    const workoutData = await hevyService.getWorkoutDetails(token, workoutId);

    if (!workoutData || !workoutData.workout) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to retrieve workout with ID: ${workoutId}`,
          },
        ],
      };
    }

    const workout = workoutData.workout;
    const stats = hevyService.calculateWorkoutStats(workout);

    let workoutDetails = `
# ${workout.title}
Date: ${new Date(workout.start_time).toLocaleDateString()}
Time: ${new Date(workout.start_time).toLocaleTimeString()} - ${new Date(workout.end_time).toLocaleTimeString()}
Duration: ${stats.durationMinutes} minutes
Total Volume: ${stats.totalVolume}kg

## Exercises
`;

    for (const exercise of workout.exercises) {
      workoutDetails += `\n### ${exercise.title}\n`;

      if (exercise.notes) {
        workoutDetails += `Notes: ${exercise.notes}\n`;
      }

      workoutDetails +=
        '\n| Set | Type | Weight | Reps | RPE |\n| --- | ---- | ------ | ---- | --- |\n';

      for (const set of exercise.sets) {
        const setType = set.type.charAt(0).toUpperCase() + set.type.slice(1);
        workoutDetails += `| ${set.index + 1} | ${setType} | ${set.weight_kg}kg | ${set.reps} | ${set.rpe || '-'} |\n`;
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: workoutDetails,
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
    exerciseId: z.string().describe('ID of the exercise to track'),
    timeframe: z
      .enum(['month', 'quarter', 'year', 'all'])
      .default('month')
      .describe('Timeframe for progress tracking'),
  },
  async ({ token, exerciseId, timeframe }: GetExerciseProgressParams) => {
    // Get exercise details first
    const exerciseData = await hevyService.getExerciseDetails(token, exerciseId);

    if (!exerciseData || !exerciseData.exercise_template) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to retrieve exercise with ID: ${exerciseId}`,
          },
        ],
      };
    }

    // Determine date range based on timeframe
    const now = new Date();
    let startDate = new Date();

    switch (timeframe) {
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
        startDate = new Date(0); // Beginning of time
        break;
    }

    // Get all workouts in the timeframe
    const workoutData = await hevyService.getWorkoutsInTimeframe(token, startDate, 100);

    if (!workoutData) {
      return {
        content: [
          {
            type: 'text',
            text: 'Failed to retrieve workout data',
          },
        ],
      };
    }

    const workouts = workoutData.workouts || [];
    const exercise = exerciseData.exercise_template;
    const progressData = hevyService.analyzeProgressForExercise(workouts, exerciseId);

    if (progressData.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No data found for ${exercise.title} in the selected timeframe`,
          },
        ],
      };
    }

    // Find personal records
    const maxWeight = Math.max(...progressData.map((d) => d.maxWeight));
    const maxReps = Math.max(...progressData.map((d) => d.maxReps));
    const maxVolume = Math.max(...progressData.map((d) => d.maxVolume));

    // Calculate improvements
    const firstEntry = progressData[0];
    const lastEntry = progressData[progressData.length - 1];
    const weightImprovement = (
      ((lastEntry.maxWeight - firstEntry.maxWeight) / firstEntry.maxWeight) *
      100
    ).toFixed(1);
    const volumeImprovement = (
      ((lastEntry.maxVolume - firstEntry.maxVolume) / firstEntry.maxVolume) *
      100
    ).toFixed(1);

    let progressText = `
# Progress for ${exercise.title}
Timeframe: ${timeframe}
Muscle Group: ${exercise.primary_muscle_group}
Equipment: ${exercise.equipment}

## Personal Records
- Max Weight: ${maxWeight}kg
- Max Reps: ${maxReps}
- Max Volume: ${maxVolume}kg

## Progress Overview
- First recorded: ${new Date(firstEntry.date).toLocaleDateString()} - ${firstEntry.maxWeight}kg × ${firstEntry.maxReps} reps
- Most recent: ${new Date(lastEntry.date).toLocaleDateString()} - ${lastEntry.maxWeight}kg × ${lastEntry.maxReps} reps
- Weight improvement: ${weightImprovement}%
- Volume improvement: ${volumeImprovement}%

## Session History
`;

    // Add session history
    progressData.forEach((session) => {
      progressText += `- ${new Date(session.date).toLocaleDateString()}: ${session.maxWeight}kg × ${session.maxReps} reps (Volume: ${session.maxVolume}kg)\n`;
    });

    return {
      content: [
        {
          type: 'text',
          text: progressText,
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
  async ({ token }: GetRoutinesParams) => {
    const routineData = await hevyService.getUserRoutines(token);

    if (!routineData) {
      return {
        content: [
          {
            type: 'text',
            text: 'Failed to retrieve routines',
          },
        ],
      };
    }

    const routines = routineData.routines || [];
    if (routines.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No routines found',
          },
        ],
      };
    }

    // Get exercise templates to map IDs to names
    const exerciseData = await hevyService.getExerciseTemplates(token, 100);

    let exerciseMap: { [key: string]: string } = {};
    if (exerciseData && exerciseData.exercise_templates) {
      exerciseData.exercise_templates.forEach((template) => {
        exerciseMap[template.id] = template.title;
      });
    }

    // Format routine data
    const formattedRoutines = routines.map((routine) => {
      const exerciseList = routine.exercises
        .map((exId) => {
          return `• ${exerciseMap[exId] || 'Unknown exercise'}`;
        })
        .join('\n');

      return `
# ${routine.name}
${routine.description ? `Description: ${routine.description}\n` : ''}
Last Updated: ${new Date(routine.updatedAt).toLocaleDateString()}

## Exercises:
${exerciseList}
---
`;
    });

    return {
      content: [
        {
          type: 'text',
          text: `User Routines:\n\n${formattedRoutines.join('\n')}`,
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
    const now = new Date();
    let startDate = new Date();

    switch (timeframe) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
    }

    // Get workouts in the timeframe
    const workoutData = await hevyService.getWorkoutsInTimeframe(token, startDate, 100);

    if (!workoutData) {
      return {
        content: [
          {
            type: 'text',
            text: 'Failed to retrieve workout data',
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
            text: `No workouts found in the last ${timeframe}`,
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
            text: 'Failed to retrieve exercise data',
          },
        ],
      };
    }

    let exerciseMap: { [key: string]: ExerciseTemplate } = {};
    exerciseData.exercise_templates.forEach((template) => {
      exerciseMap[template.id] = template;
    });

    // Calculate volume by muscle group
    const { volumeByMuscle, setsByMuscle, totalVolume, totalWorkouts } =
      hevyService.calculateVolumeByMuscleGroup(workouts, exerciseMap);

    // Sort muscle groups by volume
    const sortedMuscles = Object.keys(volumeByMuscle).sort(
      (a, b) => volumeByMuscle[b] - volumeByMuscle[a]
    );

    let analysisText = `
# Workout Volume Analysis (Last ${timeframe})
Total Workouts: ${totalWorkouts}
Total Volume: ${Math.round(totalVolume)}kg

## Volume by Muscle Group:
`;

    sortedMuscles.forEach((muscle) => {
      const percentage = ((volumeByMuscle[muscle] / totalVolume) * 100).toFixed(1);
      analysisText += `- ${muscle}: ${Math.round(volumeByMuscle[muscle])}kg (${percentage}% of total) - ${setsByMuscle[muscle]} sets\n`;
    });

    // Identify potential imbalances
    if (sortedMuscles.length > 1) {
      analysisText += `\n## Balance Analysis:\n`;

      // Compare push vs pull (if applicable)
      const pushGroups = ['Chest', 'Shoulders', 'Triceps'];
      const pullGroups = ['Back', 'Biceps'];

      let pushVolume = 0;
      let pullVolume = 0;

      sortedMuscles.forEach((muscle) => {
        if (pushGroups.some((group) => muscle.includes(group))) {
          pushVolume += volumeByMuscle[muscle];
        } else if (pullGroups.some((group) => muscle.includes(group))) {
          pullVolume += volumeByMuscle[muscle];
        }
      });

      if (pushVolume > 0 && pullVolume > 0) {
        const ratio = (pushVolume / pullVolume).toFixed(2);
        analysisText += `- Push to Pull Ratio: ${ratio} (Push: ${Math.round(pushVolume)}kg, Pull: ${Math.round(pullVolume)}kg)\n`;

        if (pushVolume / pullVolume > 1.5) {
          analysisText += `  • Your push volume is significantly higher than pull volume\n`;
        } else if (pullVolume / pushVolume > 1.5) {
          analysisText += `  • Your pull volume is significantly higher than push volume\n`;
        } else {
          analysisText += `  • Your push-pull balance looks good\n`;
        }
      }

      // Check for neglected muscle groups
      const commonGroups = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];
      const neglected = commonGroups.filter(
        (group) => !sortedMuscles.some((muscle) => muscle.includes(group))
      );

      if (neglected.length > 0) {
        analysisText += `- Potentially neglected areas: ${neglected.join(', ')}\n`;
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: analysisText,
        },
      ],
    };
  }
);

server.tool(
  'generate-workout-recommendation',
  'Generate a workout recommendation based on recent history',
  {
    token: z.string().describe('User API token'),
  },
  async ({ token }: GenerateWorkoutRecommendationParams) => {
    // Get recent workouts (last 10)
    const workoutData = await hevyService.getRecentWorkouts(token, 10);

    if (!workoutData) {
      return {
        content: [
          {
            type: 'text',
            text: 'Failed to retrieve workout data',
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
            text: 'No workout history found. Unable to generate recommendation.',
          },
        ],
      };
    }

    // Get exercise templates
    const exerciseData = await hevyService.getExerciseTemplates(token, 200);

    if (!exerciseData || !exerciseData.exercise_templates) {
      return {
        content: [
          {
            type: 'text',
            text: 'Failed to retrieve exercise data',
          },
        ],
      };
    }

    const exerciseMap: { [key: string]: ExerciseTemplate } = {};
    exerciseData.exercise_templates.forEach((template) => {
      exerciseMap[template.id] = template;
    });

    // Analyze recent workout patterns
    const { muscleGroupFrequency, lastWorkedOut } = hevyService.analyzeMuscleGroupFrequency(
      workouts,
      exerciseMap
    );

    // Determine which muscle groups need attention
    const needsAttention = hevyService.determineMuscleGroupsNeedingAttention(
      muscleGroupFrequency,
      lastWorkedOut
    );

    // Get routines to suggest
    const routineData = await hevyService.getUserRoutines(token);

    let recommendedRoutine = null;
    if (routineData && routineData.routines) {
      for (const routine of routineData.routines) {
        // Check if this routine works the needed muscle groups
        let matchesPriority = false;

        for (const exId of routine.exercises) {
          const template = exerciseMap[exId];
          if (template && needsAttention.includes(template.primary_muscle_group)) {
            matchesPriority = true;
            break;
          }
        }

        if (matchesPriority) {
          recommendedRoutine = routine;
          break;
        }
      }
    }

    // Generate recommendation
    let recommendationText = `
# Workout Recommendation

## Analysis of Recent Training
`;

    if (needsAttention.length > 0) {
      recommendationText += `Muscle groups needing attention: ${needsAttention.join(', ')}\n\n`;
    }

    const lastWorkout = workouts[0];
    const now = new Date();
    const daysSinceLastWorkout = Math.floor(
      (now.getTime() - new Date(lastWorkout.start_time).getTime()) / (1000 * 60 * 60 * 24)
    );

    recommendationText += `Last workout: ${daysSinceLastWorkout} days ago - ${lastWorkout.title}\n\n`;

    // Recommend workout
    recommendationText += `## Recommended Focus\n`;

    if (recommendedRoutine) {
      recommendationText += `Based on your training history, I recommend following your "${recommendedRoutine.name}" routine.\n\n`;

      const routineExercises = recommendedRoutine.exercises.map((exId) => {
        const template = exerciseMap[exId];
        return template ? template.title : 'Unknown exercise';
      });

      recommendationText += `This routine includes: ${routineExercises.join(', ')}\n`;
    } else {
      // Suggest focus if no routine matches
      recommendationText += `Based on your training history, focus on: ${needsAttention.slice(0, 2).join(' and ')}\n\n`;

      // Suggest some exercises for those muscle groups
      const suggestedExercises = exerciseData.exercise_templates
        .filter((ex) => needsAttention.includes(ex.primary_muscle_group))
        .slice(0, 5);

      if (suggestedExercises.length > 0) {
        recommendationText += `Suggested exercises:\n`;
        suggestedExercises.forEach((ex) => {
          recommendationText += `- ${ex.title} (${ex.primary_muscle_group})\n`;
        });
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: recommendationText,
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
