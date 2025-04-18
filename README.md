# Hevy MCP Server

A TypeScript Node.js server that connects your Hevy workout data to Language Models via Model Context Protocol (MCP). The server fetches data from the Hevy API and provides tools for accessing your workout history, exercise progress, and personal records.

## What is MCP?

Model Context Protocol (MCP) is a standard that allows LLMs like Claude to integrate with external data sources and tools. This MCP server enables AI assistants to access and analyze your Hevy workout data.

## Available Tools

This MCP server provides the following tools:

- **get-workouts**: Get workouts between start and end dates. Returns workouts in descending order of date with duration and volume stats. Max 10 workouts.
- **get-exercise-progress-by-ids**: Track progress for specific exercises over time, filtered by date range. Returns also records per reps.
- **get-exercises**: Get comprehensive exercise data sorted by frequency of use, with optional filtering by name and date range. Returns also actual and estimated 1RM.
- **get-routines**: Retrieve your saved workout routines

## Workout Prompt Builder

The server includes a smart workout prompt builder that:
- Analyzes your most frequently used exercises and their estimated 1RMs
- Lists your saved workout routines with detailed exercise information
- Helps AI assistants create personalized workout recommendations based on your history

## Resource Documentation

The server provides comprehensive documentation of all available tools and their parameters through a dedicated resource endpoint. This documentation includes:
- Detailed parameter descriptions
- Valid parameter ranges and defaults
- Example usage scenarios

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

## Release Process

This project uses [semantic-release](https://github.com/semantic-release/semantic-release) for automated versioning and package publishing. We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages.