import { describe, it, expect, afterEach, beforeEach } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { FolderWatcher } from "../src/watcher.js";
import { sleep, waitFor } from "./helpers.js";

describe("FolderWatcher", () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "watch-test-"));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("records create events for new files", async () => {
    const watcher = new FolderWatcher(dir);
    watcher.start();
    try {
      const filePath = path.join(dir, "hello.txt");
      fs.writeFileSync(filePath, "hello");
      await waitFor(() => watcher.getEvents().some((e) => e.relativePath === "hello.txt" && e.type === "create"));
      const events = watcher.getEvents();
      expect(events.some((e) => e.relativePath === "hello.txt" && e.type === "create")).toBe(true);
      expect(events[0].timestamp).toBeGreaterThan(0);
    } finally {
      watcher.stop();
    }
  });

  it("records modify events when a file changes", async () => {
    const watcher = new FolderWatcher(dir);
    watcher.start();
    try {
      const filePath = path.join(dir, "notes.txt");
      fs.writeFileSync(filePath, "v1");
      await waitFor(() => watcher.getEvents().length > 0);
      const before = watcher.getEvents().length;
      fs.writeFileSync(filePath, "v2");
      await waitFor(() => watcher.getEvents().length > before);
      const events = watcher.getEvents();
      expect(events.some((e) => e.relativePath === "notes.txt" && e.type === "modify")).toBe(true);
    } finally {
      watcher.stop();
    }
  });

  it("records delete events when a file is removed", async () => {
    const watcher = new FolderWatcher(dir);
    watcher.start();
    try {
      const filePath = path.join(dir, "bye.txt");
      fs.writeFileSync(filePath, "bye");
      await waitFor(() => watcher.getEvents().length > 0);
      fs.unlinkSync(filePath);
      await waitFor(() => watcher.getEvents().some((e) => e.relativePath === "bye.txt" && e.type === "delete"));
      expect(watcher.getEvents().some((e) => e.relativePath === "bye.txt" && e.type === "delete")).toBe(true);
    } finally {
      watcher.stop();
    }
  });

  it("watches nested directories recursively", async () => {
    const watcher = new FolderWatcher(dir);
    watcher.start();
    try {
      fs.mkdirSync(path.join(dir, "sub"), { recursive: true });
      fs.writeFileSync(path.join(dir, "sub", "deep.txt"), "deep");
      await waitFor(() =>
        watcher.getEvents().some((e) => e.relativePath === path.join("sub", "deep.txt"))
      );
      expect(watcher.getEvents().some((e) => e.relativePath === path.join("sub", "deep.txt"))).toBe(true);
    } finally {
      watcher.stop();
    }
  });

  it("respects maxChangeEvents by trimming old events", async () => {
    const watcher = new FolderWatcher(dir, 3);
    watcher.start();
    try {
      for (let i = 0; i < 5; i++) {
        fs.writeFileSync(path.join(dir, `file${i}.txt`), String(i));
        await sleep(30);
      }
      await sleep(100);
      const events = watcher.getEvents();
      expect(events.length).toBeLessThanOrEqual(3);
    } finally {
      watcher.stop();
    }
  });

  it("filters events by since and limit", async () => {
    const watcher = new FolderWatcher(dir);
    watcher.start();
    try {
      const since = Date.now();
      await sleep(30);
      fs.writeFileSync(path.join(dir, "a.txt"), "a");
      fs.writeFileSync(path.join(dir, "b.txt"), "b");
      fs.writeFileSync(path.join(dir, "c.txt"), "c");
      await waitFor(() => watcher.getEvents().length >= 3);
      const recent = watcher.getEvents(since, 2);
      expect(recent.length).toBeLessThanOrEqual(2);
      expect(recent.every((e) => e.timestamp >= since)).toBe(true);
    } finally {
      watcher.stop();
    }
  });

  it("is idempotent when start is called twice and stop works", () => {
    const watcher = new FolderWatcher(dir);
    watcher.start();
    watcher.start();
    expect(watcher.isRunning()).toBe(true);
    watcher.stop();
    expect(watcher.isRunning()).toBe(false);
    watcher.stop();
    expect(watcher.isRunning()).toBe(false);
  });
});
