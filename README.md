# MCP Directory Watcher Server

A local-first Model Context Protocol (MCP) server that watches a folder on your machine and exposes file changes, directory listings, and file reads to MCP clients. Built and maintained by [Asdale Dynamics, LLC](https://dylanasdale.github.io).

## What it does

This server runs on your computer (local-only, never phones home) and exposes three MCP tools:

- `list_files` — list files and folders inside the watched directory
- `read_file` — read a file's text contents
- `get_changes` — get recent file-change events (create, modify, delete) recorded by the folder watcher

A JSON config file controls which folder is watched, how many change events to keep, the maximum read size, and which names to ignore.

## Who this is for

Asdale Dynamics, LLC (Indiana, formed October 2026) is Dylan Asdale's LLC — a registered nurse turned AI author and founder focused on beginner-friendly AI education, practical open-source tools, and small-business / author helpers. This MCP server is one of those open-source tools: a plain, tested, local-first building block for AI agents and assistants that need to look at files on your machine.

Dylan's book *The Massive AI Manual* and hub site dylanasdale.github.io explain AI "like a friend would": plain English, step by step, never condescending.

## Quick start

```bash
# Clone or open this folder
cd mcp-directory-watcher-server

# Install dependencies
npm install

# Build
npm run build

# Run the server (stdio transport)
npm run start
```

The server watches a folder named `watched` next to this project by default. Create or drop files into it, then call `list_files`, `read_file`, or `get_changes` from any MCP client.

### Configure

Create a `config.json` (or point `MCP_CONFIG_PATH` at another JSON file):

```json
{
  "watchPath": "/Users/dylan/Documents/ai-drafts",
  "maxChangeEvents": 200,
  "maxReadBytes": 1048576,
  "ignore": ["node_modules", ".git", "*.tmp"]
}
```

If no config file exists, the server uses defaults: watches `./watched`, keeps 200 change events, allows reads up to 1 MB, and ignores `node_modules` and `.git`.

### Example config file

A `config.json.example` is included. Copy it to `config.json` and edit the `watchPath` to the folder you want watched.

## MCP client setup

Add this server to your MCP client (e.g. Claude Desktop, Continue, or any MCP-compatible host):

```json
{
  "mcpServers": {
    "directory-watcher": {
      "command": "node",
      "args": ["/path/to/mcp-directory-watcher-server/dist/index.js"]
    }
  }
}
```

Or run with tsx during development:

```json
{
  "command": "npx",
  "args": ["tsx", "/path/to/mcp-directory-watcher-server/src/index.ts"]
}
```

## Project structure

- `src/config.ts` — JSON config loading with safe defaults
- `src/watcher.ts` — recursive folder watcher with a bounded change-event buffer
- `src/files.ts` — path-safe directory listing and file reading
- `src/server.ts` — MCP server (stdio transport) exposing `list_files`, `read_file`, `get_changes`
- `src/index.ts` — entry point
- `tests/` — vitest tests for config, watcher, and file logic
- `LICENSE` — MIT, Copyright (c) 2026 Asdale Dynamics, LLC

## Design principles

- **Local-first:** everything runs on your machine. No network calls, no API keys, no telemetry.
- **JSON config:** simple, human-editable configuration file.
- **Tested:** unit tests cover config loading, file watching (create/modify/delete), listing, reading, and path-traversal guards.
- **Safe:** all file paths are confined to the watch root; reads are size-capped.

## Credit

Built by Asdale Dynamics, LLC (Indiana, formed October 2026). Find more beginner-friendly AI guides and tools at dylanasdale.github.io.

## License

MIT License. Copyright (c) 2026 Asdale Dynamics, LLC. See LICENSE.
