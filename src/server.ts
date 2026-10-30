import * as fs from "node:fs";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { loadConfig } from "./config.js";
import { FolderWatcher } from "./watcher.js";
import { listFiles, readFile } from "./files.js";

export function createServer(config: ReturnType<typeof loadConfig>) {
  const server = new Server(
    { name: "mcp-directory-watcher-server", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  const watcher = new FolderWatcher(config.watchPath, config.maxChangeEvents, config.ignore);
  watcher.start();

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "list_files",
        description: "List entries (files and directories) inside the watched folder. Path is relative to the watch root.",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "Relative directory path within the watch root (defaults to the watch root)" },
          },
          additionalProperties: false,
        },
      },
      {
        name: "read_file",
        description: "Read a file inside the watched folder as UTF-8 text. Path is relative to the watch root.",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "Relative file path within the watch root" },
          },
          required: ["path"],
          additionalProperties: false,
        },
      },
      {
        name: "get_changes",
        description: "Return recent file-change events recorded by the folder watcher.",
        inputSchema: {
          type: "object",
          properties: {
            since: { type: "number", description: "Only return events at or after this epoch timestamp (ms)" },
            limit: { type: "number", description: "Maximum number of most recent events to return" },
          },
          additionalProperties: false,
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
      switch (name) {
        case "list_files": {
          const entries = listFiles(config.watchPath, args?.path as string | undefined, config.ignore);
          return { content: [{ type: "text", text: JSON.stringify(entries, null, 2) }] };
        }
        case "read_file": {
          if (typeof args?.path !== "string") {
            throw new Error("read_file requires a 'path' argument");
          }
          const text = readFile(config.watchPath, args.path, config.maxReadBytes);
          return { content: [{ type: "text", text }] };
        }
        case "get_changes": {
          const events = watcher.getEvents(
            typeof args?.since === "number" ? args.since : undefined,
            typeof args?.limit === "number" ? args.limit : undefined
          );
          return { content: [{ type: "text", text: JSON.stringify(events, null, 2) }] };
        }
        default:
          throw new Error(`unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: (error as Error).message }],
      };
    }
  });

  return { server, watcher };
}

export async function main(): Promise<void> {
  const config = loadConfig(process.env.MCP_CONFIG_PATH);
  fs.mkdirSync(config.watchPath, { recursive: true });
  const { server } = createServer(config);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`[mcp-directory-watcher] watching ${config.watchPath}`);
}
