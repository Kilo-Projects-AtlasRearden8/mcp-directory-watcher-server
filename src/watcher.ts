import * as fs from "node:fs";
import * as path from "node:path";

export interface ChangeEvent {
  type: "create" | "modify" | "delete" | "rename";
  path: string;
  relativePath: string;
  timestamp: number;
}

export class FolderWatcher {
  private readonly root: string;
  private readonly maxEvents: number;
  private readonly ignore: string[];
  private readonly events: ChangeEvent[] = [];
  private watcher: fs.FSWatcher | null = null;
  private running = false;

  constructor(root: string, maxEvents = 200, ignore: string[] = []) {
    this.root = path.resolve(root);
    this.maxEvents = maxEvents;
    this.ignore = ignore;
  }

  start(): void {
    if (this.running) {
      return;
    }
    this.running = true;
    this.watcher = fs.watch(
      this.root,
      { recursive: true },
      (eventType: string, rawName: string | Buffer | null) => {
      const name = rawName ? String(rawName) : "";
      const fullPath = path.join(this.root, name);
      const relativePath = name ? path.relative(this.root, fullPath) : "";
      if (this.shouldIgnore(relativePath)) {
        return;
      }
      const type: ChangeEvent["type"] =
        eventType === "change" ? "modify" : fs.existsSync(fullPath) ? "create" : "delete";
      this.addEvent({ type, path: fullPath, relativePath, timestamp: Date.now() });
    });
    this.watcher.on("error", (error: Error) => {
      console.error(`[mcp-directory-watcher] watcher error: ${error.message}`);
    });
  }

  stop(): void {
    if (!this.running || !this.watcher) {
      return;
    }
    this.watcher.close();
    this.watcher = null;
    this.running = false;
  }

  isRunning(): boolean {
    return this.running;
  }

  getEvents(since?: number, limit?: number): ChangeEvent[] {
    let result = this.events;
    if (typeof since === "number") {
      result = result.filter((event) => event.timestamp >= since);
    }
    result = result.slice(-(limit ?? this.maxEvents));
    return result;
  }

  private shouldIgnore(relativePath: string): boolean {
    const parts = relativePath.split(path.sep).filter(Boolean);
    return parts.some((part) => this.ignore.includes(part));
  }

  private addEvent(event: ChangeEvent): void {
    this.events.push(event);
    while (this.events.length > this.maxEvents) {
      this.events.shift();
    }
  }
}
