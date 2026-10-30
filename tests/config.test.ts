import { describe, it, expect, afterEach, vi } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { loadConfig } from "../src/config.js";
import { AppConfig } from "../src/config.js";

function writeConfig(dir: string, content: unknown): string {
  const configPath = path.join(dir, "config.json");
  fs.writeFileSync(configPath, JSON.stringify(content));
  return configPath;
}

describe("loadConfig", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns defaults when no config file exists", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cfg-default-"));
    try {
      const config = loadConfig(path.join(dir, "does-not-exist.json"));
      expect(config.watchPath).toBe(path.join(process.cwd(), "watched"));
      expect(config.maxChangeEvents).toBe(200);
      expect(config.maxReadBytes).toBe(1024 * 1024);
      expect(config.ignore).toEqual(["node_modules", ".git"]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("loads values from a JSON config file", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cfg-custom-"));
    try {
      writeConfig(dir, {
        watchPath: path.join(dir, "watched"),
        maxChangeEvents: 50,
        maxReadBytes: 5000,
        ignore: ["tmp"],
      });
      const config = loadConfig(path.join(dir, "config.json"));
      expect(config.watchPath).toBe(path.join(dir, "watched"));
      expect(config.maxChangeEvents).toBe(50);
      expect(config.maxReadBytes).toBe(5000);
      expect(config.ignore).toEqual(["tmp"]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("falls back to defaults on invalid JSON", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cfg-bad-"));
    try {
      writeConfig(dir, "{ not valid json");
      const config: AppConfig = loadConfig(path.join(dir, "config.json"));
      expect(config).toMatchObject({
        maxChangeEvents: 200,
        maxReadBytes: 1024 * 1024,
        ignore: ["node_modules", ".git"],
      });
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("ignores invalid field types and keeps defaults for them", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cfg-fields-"));
    try {
      writeConfig(dir, {
        maxChangeEvents: "fifty",
        maxReadBytes: null,
        ignore: 42,
      });
      const config: AppConfig = loadConfig(path.join(dir, "config.json"));
      expect(config.maxChangeEvents).toBe(200);
      expect(config.maxReadBytes).toBe(1024 * 1024);
      expect(config.ignore).toEqual(["node_modules", ".git"]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
