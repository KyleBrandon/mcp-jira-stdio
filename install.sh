#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

# Load credentials from .env if it exists
if [ -f "$ENV_FILE" ]; then
  JIRA_BASE_URL="$(grep -E '^JIRA_BASE_URL=' "$ENV_FILE" | cut -d= -f2-)"
  JIRA_EMAIL="$(grep -E '^JIRA_EMAIL=' "$ENV_FILE" | cut -d= -f2- || echo "")"
  JIRA_API_TOKEN="$(grep -E '^JIRA_API_TOKEN=' "$ENV_FILE" | cut -d= -f2-)"
  JIRA_READ_ONLY="$(grep -E '^JIRA_READ_ONLY=' "$ENV_FILE" | cut -d= -f2- || echo "true")"
  LOG_LEVEL="$(grep -E '^LOG_LEVEL=' "$ENV_FILE" | cut -d= -f2- || echo "debug")"
else
  echo "No .env file found. Copy .env.example to .env and fill in your credentials first."
  echo "  cp .env.example .env"
  exit 1
fi

# Validate required values
if [ -z "$JIRA_BASE_URL" ] || [ -z "$JIRA_API_TOKEN" ]; then
  echo "Missing required values in .env (JIRA_BASE_URL, JIRA_API_TOKEN)."
  exit 1
fi

JIRA_READ_ONLY="${JIRA_READ_ONLY:-true}"
LOG_LEVEL="${LOG_LEVEL:-debug}"

# Build
echo "Building..."
npm run build --prefix "$SCRIPT_DIR" --silent

# Remove existing registration if present
claude mcp remove jira 2>/dev/null || true

# Register with Claude Code
CMD_ARGS=(
  claude mcp add jira
  --scope user
  node "$SCRIPT_DIR/dist/index.js"
  --env JIRA_BASE_URL="$JIRA_BASE_URL"
  --env JIRA_API_TOKEN="$JIRA_API_TOKEN"
  --env JIRA_READ_ONLY="$JIRA_READ_ONLY"
  --env LOG_LEVEL="$LOG_LEVEL"
)

if [ -n "$JIRA_EMAIL" ]; then
  CMD_ARGS+=(--env JIRA_EMAIL="$JIRA_EMAIL")
fi

"${CMD_ARGS[@]}"

echo ""
if [ -n "$JIRA_EMAIL" ]; then
  echo "Auth mode: Atlassian Cloud (Basic Auth, email=$JIRA_EMAIL)"
else
  echo "Auth mode: Data Center/Server (Bearer token)"
fi
echo "Registered jira MCP server with Claude Code (JIRA_READ_ONLY=$JIRA_READ_ONLY)"
echo "Restart Claude Code to pick up the changes."
