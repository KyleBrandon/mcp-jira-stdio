# MCP Jira Server

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Node](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP Server](https://img.shields.io/badge/MCP-Server-blue)](https://modelcontextprotocol.io)

A Model Context Protocol (MCP) server for Jira API integration. Enables reading, writing, and managing Jira issues and projects directly from your MCP client (e.g., Claude Code, Claude Desktop).

> **Note:** This is a fork of [freema/mcp-jira-stdio](https://github.com/freema/mcp-jira-stdio) and is **not published to npm**. Install by cloning, building, and registering the local build with your MCP client.

## 🚀 Quick Start

### 1. Prerequisites

- Node.js v20 or higher
- Jira instance (Cloud or Data Center/Server)
- Jira API token (Cloud) or Personal Access Token (Data Center/Server)

### 2. Clone and Build

```bash
# Clone the repository
git clone https://github.com/KyleBrandon/mcp-jira-stdio.git
cd mcp-jira-stdio

# Install dependencies
npm install

# Build the project
npm run build
```

This produces `dist/index.js`, which your MCP client will run via Node.

### 3. Jira API Setup

1. Note your Jira base URL (e.g., `https://yourcompany.atlassian.net` or `https://jira.yourcompany.com`).
2. Create a token:
   - **Jira Cloud:** Account Settings → Security → [Create and manage API tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
   - **Jira Data Center / Server:** Profile → Personal Access Tokens

### 4. Configure Credentials

Create a `.env` file from the provided example:

```bash
cp .env.example .env
# Edit .env with your actual Jira credentials
```

**Atlassian Cloud:**

```env
JIRA_BASE_URL=https://your-instance.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-api-token
JIRA_READ_ONLY=true
```

**Jira Data Center / Server:**

```env
JIRA_BASE_URL=https://jira.yourcompany.com
JIRA_API_TOKEN=your-personal-access-token
JIRA_READ_ONLY=true
```

### 5. Test Connection

```bash
# Test Jira connection
npm run test:connection
```

### 6. Register with Your MCP Client

#### For Claude Code (recommended: install script)

The provided `install.sh` reads credentials from your `.env`, builds the project, and registers the MCP server with Claude Code in one step:

```bash
./install.sh
```

The script:

- Reads `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `JIRA_READ_ONLY`, and `LOG_LEVEL` from `.env`
- Runs `npm run build`
- Registers (or re-registers) the `jira` MCP server at user scope via `claude mcp add`

Restart Claude Code to pick up the changes.

#### For Claude Code (manual)

If you prefer to register manually, point Claude Code at the built `dist/index.js`:

**Atlassian Cloud:**

```bash
claude mcp add jira --scope user node /absolute/path/to/mcp-jira-stdio/dist/index.js \
  --env JIRA_BASE_URL=https://yourcompany.atlassian.net \
  --env JIRA_EMAIL=your-email@example.com \
  --env JIRA_API_TOKEN=your-api-token \
  --env JIRA_READ_ONLY=true
```

**Jira Data Center / Server:**

```bash
claude mcp add jira --scope user node /absolute/path/to/mcp-jira-stdio/dist/index.js \
  --env JIRA_BASE_URL=https://jira.yourcompany.com \
  --env JIRA_API_TOKEN=your-personal-access-token \
  --env JIRA_READ_ONLY=true
```

#### For Claude Desktop

Add the server to your Claude Desktop config:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "jira": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-jira-stdio/dist/index.js"],
      "env": {
        "JIRA_BASE_URL": "https://your-instance.atlassian.net",
        "JIRA_EMAIL": "your-email@example.com",
        "JIRA_API_TOKEN": "your-api-token",
        "JIRA_READ_ONLY": "true"
      }
    }
  }
}
```

For Data Center/Server, omit `JIRA_EMAIL` and use a Personal Access Token for `JIRA_API_TOKEN`.

Restart Claude Desktop after editing the config.

#### Interactive Claude Desktop setup

A helper script can prompt for values and write the Claude Desktop config:

```bash
npm run setup:mcp
```

The script will:

- Build the project if needed and detect your Node path
- Prompt for `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`
- Save a `jira` entry into your Claude Desktop config or print the JSON
- Optionally generate a local `.env` for development

## 📦 Available Tools

### Projects

- `jira_get_visible_projects`: Retrieves all projects visible to the user.
- `jira_get_project_info`: Retrieves detailed information about a project (components, versions, roles, insights).

### Issues

- `jira_get_issue`: Retrieve issue details by key (supports optional fields/expand).
- `jira_search_issues`: Search for Jira issues using JQL with pagination and fields.
- `jira_create_issue`: Create a new issue in a project (type, priority, assignee, labels, components).
- `jira_update_issue`: Update an existing issue (summary, description, priority, assignee, labels, components).
- `jira_create_subtask`: Create a subtask under a parent issue (auto-detects subtask type).

### Comments

- `jira_add_comment`: Add a comment to an issue (optional visibility by group/role).

### Metadata & Users

- `jira_get_create_meta`: Get create metadata for a project showing all available fields (including custom fields) with their allowed values. Essential for discovering required fields before creating issues.
- `jira_get_issue_types`: List issue types (optionally per project).
- `jira_get_users`: Search for users (by query, username, or accountId).
- `jira_get_priorities`: List available priorities.
- `jira_get_statuses`: List available statuses (global or project-specific).
- `jira_get_custom_fields`: List all custom fields in Jira with their types and schemas.

### My Work

- `jira_get_my_issues`: Retrieve issues assigned to the current user (sorted by updated).

## 🛠️ Development

### Development Commands

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Type checking
npm run typecheck

# Linting
npm run lint

# Format code
npm run format

# Run all checks
npm run check
```

### MCP Inspector

Debug your MCP server using the inspector:

```bash
# Run inspector (production build)
npm run inspector

# Run inspector (development mode)
npm run inspector:dev
```

Notes:

- Startup no longer blocks on Jira connectivity. If Jira env vars are missing, the server still starts and lists tools; tool calls will fail with a clear auth error until you set `JIRA_BASE_URL`, `JIRA_API_TOKEN` (and `JIRA_EMAIL` for Cloud).
- Connection testing runs only in development/test (`NODE_ENV=development` or `test`). Failures are logged but do not terminate the server, so the inspector can still display tools.

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## 📋 Project Structure

```
src/
├── index.ts              # Entry point & MCP server setup
├── config/
│   └── constants.ts      # API configuration & constants
├── tools/
│   ├── index.ts          # Tool exports
│   └── get-visible-projects.ts  # Get visible projects tool
├── types/
│   ├── common.ts         # Common types & interfaces
│   ├── jira.ts           # Jira API types
│   └── tools.ts          # Tool input/output schemas
└── utils/
    ├── jira-auth.ts      # Jira authentication & client
    ├── validators.ts     # Input validation with Zod
    ├── formatters.ts     # Response formatting
    ├── error-handler.ts  # Error handling
    └── api-helpers.ts    # Jira API helpers
```

## 🔧 Tool Usage Examples

### Get Visible Projects

```javascript
// List all projects
jira_get_visible_projects({});

// List projects with additional details
jira_get_visible_projects({
  expand: ['description', 'lead', 'issueTypes'],
});

// List recent projects only
jira_get_visible_projects({
  recent: 10,
});
```

## ❗ Troubleshooting

### Common Issues

**"Authentication failed"**

- Verify your API token is correct
- For Cloud, check that your email matches your Jira account
- Ensure your Jira base URL is correct (no trailing slash)

**"Connection failed"**

- Verify your Jira instance is accessible
- Check network connectivity
- Ensure Jira REST API is enabled

**"Permission denied"**

- Verify your account has the necessary permissions
- Check project permissions in Jira
- Ensure you're using the correct Jira instance

**MCP Connection Issues**

- Ensure you've run `npm run build` and the MCP client is pointed at `dist/index.js`
- Check that the absolute path to `dist/index.js` is correct in your client config
- Look for errors in the MCP client logs
- Use `npm run inspector` to debug

### Debug Commands

```bash
# Test Jira connection
npm run test:connection

# Run MCP inspector for debugging
npm run inspector:dev

# Check all configuration
npm run check
```

If the inspector shows an SSE error and the server exits immediately, ensure you are not forcing an early exit with invalid credentials. With the current behavior, the server should not exit on missing credentials; export your Jira vars to exercise the tools:

```bash
export JIRA_BASE_URL="https://your-instance.atlassian.net"
export JIRA_EMAIL="your-email@example.com"
export JIRA_API_TOKEN="your-api-token"
npm run inspector
```

## 🔍 Environment Variables

| Variable         | Required   | Default      | Description                                                                                                             | Example                         |
| ---------------- | ---------- | ------------ | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `JIRA_BASE_URL`  | Yes        | —            | Jira instance URL (no trailing slash)                                                                                   | `https://company.atlassian.net` |
| `JIRA_EMAIL`     | Cloud only | —            | Jira account email. When set, enables Basic Auth (Cloud). Omit for Data Center/Server (Bearer token).                   | `user@example.com`              |
| `JIRA_API_TOKEN` | Yes        | —            | API token ([Cloud](https://id.atlassian.com/manage-profile/security/api-tokens)) or Personal Access Token (Data Center) | `ATxxx...`                      |
| `JIRA_READ_ONLY` | No         | `true`       | When `true`, write tools (create, update, delete, comment, transition) are hidden from the MCP tool list                | `true` or `false`               |
| `NODE_ENV`       | No         | `production` | Set to `development` to enable connection testing and debug messages                                                    | `development` or `production`   |
| `LOG_LEVEL`      | No         | `info`       | Log verbosity (`debug` in development mode)                                                                             | `debug`, `info`, `warn`         |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests and linting (`npm run check`)
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
