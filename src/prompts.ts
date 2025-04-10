import hevyService from './services/hevyService.js';

export async function createWorkoutPrompt() {
  try {
    // Get user's existing routines and exercises
    const exercises = await hevyService.getExercises('', true);
    const routines = await hevyService.fetchAllRoutines();

    if (!exercises || !routines) {
      throw new Error('Failed to fetch required data');
    }

    // Format exercise data into a string
    const exerciseList = exercises
      .slice(0, 10) // Get top 10 most frequent exercises
      .map((ex) => {
        const estimatedMax = ex.estimated1RM?.weightKg ?? 0;
        return `${ex.name}\n• Estimated 1RM: ${estimatedMax} kg\n`;
      })
      .join('\n');

    // Format routine data - just show the exercises in each routine
    const routineList = routines
      .map((routine) => {
        const exerciseDetails = routine.exercises
          .map((exercise) => {
            return `  • ${exercise.title} (${exercise.sets
              .filter((set) => set.type !== 'warmup')
              .map((set) => `${set.weight_kg} kg x ${set.reps} reps`)
              .join(', ')})`;
          })
          .join('\n');

        return `${routine.title}:\n${exerciseDetails}\n`;
      })
      .join('\n');

    return {
      messages: [
        {
          role: 'assistant' as const,
          content: {
            type: 'text' as const,
            text:
              `Here are your saved routines and their exercises:\n\n` +
              routineList +
              `\nAnd here are your most frequently used exercises and their estimated one-rep maxes:\n\n` +
              exerciseList +
              `\nWould you like me to create a new routine based on these exercises?`,
          },
        },
      ],
    };
  } catch (error) {
    console.error('Error in routine builder prompt:', error);
    return {
      messages: [
        {
          role: 'assistant' as const,
          content: {
            type: 'text' as const,
            text: 'I encountered an error while trying to analyze your workouts. Please try again later.',
          },
        },
      ],
    };
  }
}
