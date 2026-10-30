import * as fs from "node:fs";
import * as path from "node:path";

export interface FileEntry {
  name: string;
  type: "file" | "directory";
  size: number;
  modifiedMs: number;
  relativePath: string;
}

function withinRoot(root: string, target: string): void {
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(resolvedRoot, target);
  if (resolvedTarget !== resolvedRoot && !resolvedTarget.startsWith(resolvedRoot + path.sep)) {
    throw new Error("requested path escapes watch root");
  }
}

export function listFiles(root: string, dirPath?: string, ignore: string[] = []): FileEntry[] {
  withinRoot(root, dirPath ?? "");
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = dirPath ? path.resolve(resolvedRoot, dirPath) : resolvedRoot;
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(resolvedTarget, { withFileTypes: true });
  } catch (error) {
    throw new Error(`cannot list directory: ${(error as NodeJS.ErrnoException).message}`);
  }
  return entries
    .filter((entry) => !ignore.includes(entry.name))
    .map((entry) => {
      const fullPath = path.join(resolvedTarget, entry.name);
      const stat = fs.statSync(fullPath);
      return {
        name: entry.name,
        type: entry.isDirectory() ? "directory" : "file",
        size: stat.size,
        modifiedMs: stat.mtimeMs,
        relativePath: path.relative(resolvedRoot, fullPath),
      };
    });
}

export function readFile(root: string, filePath: string, maxBytes: number): string {
  withinRoot(root, filePath);
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(resolvedRoot, filePath);
  let stat: fs.Stats;
  try {
    stat = fs.statSync(resolved);
  } catch (error) {
    throw new Error(`cannot read file: ${(error as NodeJS.ErrnoException).message}`);
  }
  if (!stat.isFile()) {
    throw new Error("path is not a file");
  }
  if (stat.size > maxBytes) {
    throw new Error(`file exceeds maximum read size (${stat.size} bytes > ${maxBytes} bytes)`);
  }
  return fs.readFileSync(resolved, "utf8");
}
