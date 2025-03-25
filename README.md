# Hevy MCP Server

A TypeScript Node.js server that connects your Hevy workout data to Language Models via Model Context Protocol (MCP). The server fetches data from the Hevy API and provides tools for accessing your workout history, exercise progress, and personal records.

## What is MCP?

Model Context Protocol (MCP) is a standard that allows LLMs like Claude to integrate with external data sources and tools. This MCP server enables AI assistants to access and analyze your Hevy workout data.

## Available Tools

This MCP server provides the following tools:

- **get-recent-workouts**: Retrieve your most recent workouts with duration and volume stats
- **get-exercise-progress-by-id**: Track progress for a specific exercise over time and view all-time records
- **get-exercise-id-by-name**: Search for exercise IDs by name
- **get-exercise-ids-and-names**: Get a list of all exercise IDs and names
- **get-routines**: Retrieve your saved workout routines
- **get-favorite-exercises**: Get your most frequently performed exercises

### Obtaining Your Hevy API Key

To get your Hevy API key, visit the [Hevy API Documentation](https://api.hevyapp.com/docs/#/) and follow the authentication instructions. You'll need to sign up for API access through the Hevy developer portal.

## Adding to Cursor

To add this MCP server to Cursor, update your `~/.cursor/mcp.json` file with the following configuration:

```json
"hevy-mcp-server": {
  "command": "npx",
  "args": ["-y", "@vreippainen/hevy-mcp-server", "--stdio"],
  "env": {
    "HEVY_API_KEY": "your-api-key-here"
  }
}
```

Replace `your-api-key-here` with your actual Hevy API key.

## Technical Documentation

For detailed technical information about installation, configuration, running the server, API endpoints, service methods, and project structure, see [TECHNICAL.md](TECHNICAL.md). 