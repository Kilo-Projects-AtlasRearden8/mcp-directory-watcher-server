# MCP Directory Watcher Server

A friendly, local-first MCP server that watches a folder on your computer and lets AI assistants see what's in it: list files, read files, and get notified when files change. Built by [Asdale Dynamics, LLC](https://dylanasdale.github.io).

## Who this is for

This tool is for anyone who wants an AI assistant to look at files on their own machine — without sending those files anywhere. It's part of Asdale Dynamics, LLC's focus on beginner-friendly, practical, local-first AI tools.

Dylan Asdale — a registered nurse turned AI author and founder of Asdale Dynamics, LLC (Indiana, formed October 2026) — writes *The Massive AI Manual* and runs dylanasdale.github.io, where AI is explained "like a friend would": plain English, step by step, never condescending. This server follows that same spirit.

## What it does

This server runs entirely on your computer. It never phones home, never uploads your files, and needs no API keys. It exposes three tools to any MCP client:

| Tool | What it does |
|------|--------------|
| `list_files` | Lists the files and folders inside your watched folder |
| `read_file` | Reads the text contents of a file in your watched folder |
| `get_changes` | Shows recent file changes (created, modified, or deleted) |

A simple JSON config file (`config.json`) tells the server which folder to watch, how many changes to remember, how big a file can be read, and which names to ignore.

## Quick start

Open this folder in your terminal:

```bash
cd /path/to/mcp-directory-watcher-server
```

Install the dependencies:

```bash
npm install
```

Build the server:

```bash
npm run build
```

Start it:

```bash
npm run start
```

By default, the server watches a folder named `watched` right next to this project. Drop some files into `watched/`, then ask your MCP client to `list_files`, `read_file`, or `get_changes`.

## Configure it

Create a `config.json` file (you can copy `config.json.example`):

```json
{
  "watchPath": "/Users/dylan/Documents/ai-drafts",
  "maxChangeEvents": 200,
  "maxReadBytes": 1048576,
  "ignore": ["node_modules", ".git"]
}
```

| Setting | What it means | Default |
|---------|---------------|---------|
| `watchPath` | The folder to watch | `./watched` |
| `maxChangeEvents` | How many recent changes to remember | 200 |
| `maxReadBytes` | Largest file (in bytes) the server will read | 1,048,576 (1 MB) |
| `ignore` | Folder/file names to skip | `["node_modules", ".git"] |

If you don't create a `config.json`, the server uses the defaults above. You can also point the server at a different config file with the `MCP_CONFIG_PATH` environment variable.

## Connect it to your MCP client

Add the server to your MCP client (for example, Claude Desktop or any MCP-compatible host):

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

Replace `/path/to/mcp-directory-watcher-server` with the real path to this folder on your machine.

While developing, you can run the server directly with tsx instead:

```json
{
  "mcpServers": {
    "directory-watcher": {
      "command": "npx",
      "args": ["tsx", "/path/to/mcp-directory-watcher-server/src/index.ts"]
    }
  }
}
```

## Project structure

- `src/config.ts` — loads the JSON config with safe defaults
- `src/watcher.ts` — watches the folder and records changes
- `src/files.ts` — lists folders and reads files, safely
- `src/server.ts` — the MCP server itself (stdio transport)
- `src/index.ts` — entry point
- `tests/` — tests for config, watching, listing, and reading
- `LICENSE` — MIT, Copyright (c) 2026 Asdale Dynamics, LLC
- `config.json.example` — a starter config file to copy
- `STATUS.md` — what was built, how to run it, and verification results

## Design principles

- **Local-first:** everything runs on your machine. No network calls, no API keys, no telemetry.
- **JSON config:** simple, human-editable configuration file.
- **Tested:** unit tests cover config loading, file watching, listing, reading, and path safety.
- **Safe:** all file paths are confined to the watch folder, and reads are size-capped.

## Credit

Built by Asdale Dynamics, LLC (Indiana, formed October 2026). Find more beginner-friendly AI guides and tools at dylanasdale.github.io.

## License

MIT License. Copyright (c) 2026 Asdale Dynamics, LLC. See LICENSE.
