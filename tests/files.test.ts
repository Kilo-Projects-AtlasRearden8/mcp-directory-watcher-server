import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { listFiles, readFile } from "../src/files.js";

describe("listFiles", () => {
  it("lists files and directories in the watch root", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "list-root-"));
    try {
      fs.writeFileSync(path.join(dir, "a.txt"), "a");
      fs.mkdirSync(path.join(dir, "sub"));
      fs.writeFileSync(path.join(dir, "sub", "b.txt"), "b");
      const entries = listFiles(dir);
      const names = entries.map((e) => e.relativePath).sort();
      expect(names).toEqual(["a.txt", "sub"]);
      const sub = entries.find((e) => e.relativePath === "sub");
      expect(sub?.type).toBe("directory");
      const a = entries.find((e) => e.relativePath === "a.txt");
      expect(a?.type).toBe("file");
      expect(typeof a?.size).toBe("number");
      expect(typeof a?.modifiedMs).toBe("number");
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("lists a subdirectory when dirPath is given", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "list-sub-"));
    try {
      fs.mkdirSync(path.join(dir, "sub"));
      fs.writeFileSync(path.join(dir, "sub", "c.txt"), "c");
      const entries = listFiles(dir, "sub");
      expect(entries.map((e) => e.name)).toEqual(["c.txt"]);
      expect(entries.every((e) => e.relativePath.startsWith("sub" + path.sep))).toBe(true);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("respects ignore patterns", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "list-ignore-"));
    try {
      fs.writeFileSync(path.join(dir, "keep.txt"), "keep");
      fs.mkdirSync(path.join(dir, "node_modules"));
      fs.writeFileSync(path.join(dir, "node_modules", "skip.txt"), "skip");
      const entries = listFiles(dir, undefined, ["node_modules"]);
      expect(entries.map((e) => e.name)).toEqual(["keep.txt"]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("throws when path escapes watch root", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "list-escape-"));
    try {
      expect(() => listFiles(dir, "../outside")).toThrow(/escapes watch root/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("readFile", () => {
  it("reads a file as UTF-8 text", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "read-"));
    try {
      fs.writeFileSync(path.join(dir, "note.txt"), "hello watcher");
      expect(readFile(dir, "note.txt", 1024 * 1024)).toBe("hello watcher");
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("throws for missing files", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "read-missing-"));
    try {
      expect(() => readFile(dir, "missing.txt", 1024)).toThrow();
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("throws for directories", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "read-dir-"));
    try {
      fs.mkdirSync(path.join(dir, "sub"));
      expect(() => readFile(dir, "sub", 1024)).toThrow(/not a file/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("throws when file exceeds max bytes", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "read-big-"));
    try {
      fs.writeFileSync(path.join(dir, "big.txt"), "x".repeat(100));
      expect(() => readFile(dir, "big.txt", 10)).toThrow(/maximum read size/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("throws when path escapes watch root", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "read-escape-"));
    try {
      expect(() => readFile(dir, "../secret", 1024)).toThrow(/escapes watch root/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
