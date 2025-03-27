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

### Release Channels

#### Beta Releases
- Automatically triggered when code is merged to the `main` branch
- Version format: `x.x.x-beta.x`
- Published to npm with the `beta` tag

#### Alpha Releases
- Can be manually triggered from pull requests
- Version format: `x.x.x-alpha.prXX.Y` (where XX is PR number and Y is incremental)
- Published to npm with the `alpha` tag
- Useful for testing changes before merging to main

#### Production Releases
- Manually triggered via GitHub Actions
- Version format: `x.x.x`
- Published to npm with the `latest` tag

### Commit Message Convention

Follow the Conventional Commits specification:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

Example:
```
feat(api): add new workout endpoint
fix(auth): resolve token validation issue
docs: update API documentation
```

### Manual Release Process

1. **Alpha Release (from PR)**
   - Go to Actions → Alpha Release
   - Enter the PR number
   - Click "Run workflow"

2. **Production Release**
   - Go to Actions → Production Release
   - Enter the version to promote
   - Click "Run workflow"

### Required Secrets

The following secrets need to be configured in GitHub:

- `NPM_TOKEN`: NPM authentication token with publish permissions
- `GITHUB_TOKEN`: Automatically provided by GitHub Actions 