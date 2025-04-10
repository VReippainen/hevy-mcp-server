export function getToolsDocumentation() {
  const toolDocs = `# Hevy MCP Server Tools

This document describes all available tools in the Hevy MCP Server.

## Workout Tools

### get-workouts
Get workouts between start and end dates. Returns workouts in descending order of date and limits the number of workouts returned. Max 10 workouts.

**Parameters:**
- \`limit\`: Number of workouts to retrieve (1-10, default: 10)
- \`startDate\`: Optional ISO date string to filter workouts after this date
- \`endDate\`: Optional ISO date string to filter workouts before this date

### get-exercise-progress-by-ids
Get progress for specific exercises between start and end dates. Returns workouts in descending order of date and limits the number of workouts returned. Max 10 workouts.

**Parameters:**
- \`exerciseIds\`: Array of exercise IDs to retrieve progress for
- \`limit\`: Number of latest workouts to retrieve (0-10, default: 10)
- \`startDate\`: Optional ISO date string to filter workouts after this date
- \`endDate\`: Optional ISO date string to filter workouts before this date

### get-exercises
Get comprehensive exercise data sorted by frequency of use. Returns exercises in descending order of frequency of use and limits the number of exercises returned.

**Parameters:**
- \`searchTerm\`: Optional search term to filter exercises by name
- \`excludeUnused\`: If true, exclude exercises with zero frequency (default: true)
- \`startDate\`: Optional ISO date string to filter workouts after this date
- \`endDate\`: Optional ISO date string to filter workouts before this date

### get-routines
Get user's workout routines. No parameters required.`;

  return {
    contents: [
      {
        uri: 'file:///tools/documentation',
        text: toolDocs,
        mimeType: 'text/markdown',
      },
    ],
  };
}
