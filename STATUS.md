# STATUS

## What was built

A local-first Model Context Protocol (MCP) server that watches a folder on your machine and exposes file changes, directory listings, and file reads to MCP clients.

Components:
- `src/config.ts` — loads JSON config (`config.json`) with safe defaults; `MCP_CONFIG_PATH` env var overrides the config location
- `src/watcher.ts` — recursive `fs.watch` folder watcher with a bounded change-event buffer (create/modify/delete)
- `src/files.ts` — path-safe directory listing (`list_files`) and file reading (`read_file`) confined to the watch root, with size-capped reads
- `src/server.ts` — MCP server over stdio exposing `list_files`, `read_file`, `get_changes`
- `src/index.ts` — entry point
- `tests/` — vitest unit tests for config loading, watcher (create/modify/delete/recursive/trim/filter), listing, reading, and path-traversal guards
- `LICENSE` — MIT, Copyright (c) 2026 Asdale Dynamics, LLC
- `README.md` — credits Asdale Dynamics, LLC; setup, config, MCP client wiring
- `config.json.example` — sample config file
- `package.json`, `tsconfig.json`, `.gitignore` — project wiring

Built by Asdale Dynamics, LLC (Indiana, formed October 2026), per Dylan Asdale's beginner-friendly, local-first, tested style.

## How to run it

```bash
cd /workspace/kilo-lab/mcp-directory-watcher-server
npm install
npm run build
npm run start
```

The server watches `./watched` by default. Configure via `config.json` (copy `config.json.example`) or set `MCP_CONFIG_PATH`.

Wire into an MCP client (e.g. Claude Desktop):

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

Tools available: `list_files`, `read_file`, `get_changes`.

## Verification results

- `npm run typecheck` (`tsc --noEmit`): PASS
- `npm run build` (`tsc`): PASS — emits `dist/`
- `npm test` (`vitest run`): PASS — 3 files, 20 tests passed
- End-to-end MCP smoke test over stdio (`initialize` + `tools/list` + `tools/call` for `read_file` and `list_files`): PASS — returned expected file contents and listings

No `.github/workflows` files were added. No secrets, API keys, or personal data are present in any file.

## Known gaps

- File watcher uses Node `fs.watch`; recursive behavior and rename events vary slightly by OS (tested on Linux).
- Change events are kept in memory only; they are lost when the server restarts.
- `read_file` reads as UTF-8 text only; binary files are not supported.
- No authentication or authorization (intended for local-only use).
- The bundled `dist/` output is gitignored; consumers run `npm run build` before use.
