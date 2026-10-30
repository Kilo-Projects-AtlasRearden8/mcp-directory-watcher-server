import * as fs from "node:fs";
import * as path from "node:path";

export interface AppConfig {
  watchPath: string;
  maxChangeEvents: number;
  maxReadBytes: number;
  ignore: string[];
}

const DEFAULT_CONFIG: AppConfig = {
  watchPath: path.join(process.cwd(), "watched"),
  maxChangeEvents: 200,
  maxReadBytes: 1024 * 1024,
  ignore: ["node_modules", ".git"],
};

export function loadConfig(configPath?: string): AppConfig {
  const resolved = configPath ?? path.join(process.cwd(), "config.json");
  if (!fs.existsSync(resolved)) {
    return { ...DEFAULT_CONFIG };
  }
  try {
    const raw = JSON.parse(fs.readFileSync(resolved, "utf8"));
    return {
      watchPath: typeof raw.watchPath === "string" ? raw.watchPath : DEFAULT_CONFIG.watchPath,
      maxChangeEvents:
        typeof raw.maxChangeEvents === "number" && Number.isFinite(raw.maxChangeEvents)
          ? raw.maxChangeEvents
          : DEFAULT_CONFIG.maxChangeEvents,
      maxReadBytes:
        typeof raw.maxReadBytes === "number" && Number.isFinite(raw.maxReadBytes)
          ? raw.maxReadBytes
          : DEFAULT_CONFIG.maxReadBytes,
      ignore:
        Array.isArray(raw.ignore) && raw.ignore.every((item: unknown) => typeof item === "string")
          ? raw.ignore
          : DEFAULT_CONFIG.ignore,
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}
