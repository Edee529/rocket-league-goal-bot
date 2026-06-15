import { readFileSync, writeFileSync, existsSync, renameSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, "..", "leaderboard.json");

export interface StoredData {
  leaderboard: Record<string, number>;
  recent: string[];
  season: number;
  announcedMilestones: Record<string, number[]>;
  crossbarHits: Record<string, number>;
  // normalizedKey -> display name
  displayNames?: Record<string, string>;
}

function defaultData(): StoredData {
  return { leaderboard: {}, recent: [], season: 1, announcedMilestones: {}, crossbarHits: {}, displayNames: {} };
}

function normalize(name: string): string {
  return name.toLowerCase();
}

export function loadData(): StoredData {
  try {
    if (existsSync(DATA_FILE)) {
      const raw = readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(raw) as any;

      const displayNames: Record<string, string> = { ...(parsed.displayNames ?? {}) };

      const leaderboardRaw: Record<string, any> = parsed.leaderboard ?? {};
      const crossbarRaw: Record<string, any> = parsed.crossbarHits ?? {};
      const announcedRaw: Record<string, any> = parsed.announcedMilestones ?? {};

      const leaderboard: Record<string, number> = {};
      const crossbarHits: Record<string, number> = {};
      const announcedMilestones: Record<string, number[]> = {};

      for (const [name, val] of Object.entries(leaderboardRaw)) {
        if (typeof val === "number") {
          const k = normalize(name);
          leaderboard[k] = (leaderboard[k] ?? 0) + val;
          if (!displayNames[k]) displayNames[k] = name;
        } else if (val && typeof val === "object") {
          const nameField = (val.name ?? name) as string;
          const count = Number(val.count ?? 0);
          const k = normalize(nameField);
          leaderboard[k] = (leaderboard[k] ?? 0) + count;
          if (!displayNames[k]) displayNames[k] = nameField;
        }
      }

      for (const [name, val] of Object.entries(crossbarRaw)) {
        if (typeof val === "number") {
          const k = normalize(name);
          crossbarHits[k] = (crossbarHits[k] ?? 0) + val;
          if (!displayNames[k]) displayNames[k] = name;
        } else if (val && typeof val === "object") {
          const nameField = (val.name ?? name) as string;
          const count = Number(val.count ?? 0);
          const k = normalize(nameField);
          crossbarHits[k] = (crossbarHits[k] ?? 0) + count;
          if (!displayNames[k]) displayNames[k] = nameField;
        }
      }

      for (const [name, arr] of Object.entries(announcedRaw)) {
        const k = normalize(name);
        announcedMilestones[k] = Array.isArray(arr) ? arr : [];
        if (!displayNames[k]) displayNames[k] = name;
      }

      return {
        ...defaultData(),
        ...parsed,
        leaderboard,
        crossbarHits,
        announcedMilestones,
        recent: parsed.recent ?? [],
        season: parsed.season ?? 1,
        displayNames,
      };
    }
  } catch (err) {
    console.error("[Storage] Failed to load data, starting fresh:", err);
  }
  return defaultData();
}

function atomicWrite(file: string, content: string) {
  const tmp = `${file}.tmp`;
  writeFileSync(tmp, content, "utf-8");
  try {
    renameSync(tmp, file);
  } catch (err) {
    // fallback: overwrite
    writeFileSync(file, content, "utf-8");
  }
}

export function saveData(data: StoredData): void {
  try {
    atomicWrite(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("[Storage] Failed to save data:", err);
  }
}

export function archiveSeason(data: StoredData): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const archiveFile = join(__dirname, "..", `season-${data.season}-${timestamp}.json`);
  try {
    atomicWrite(archiveFile, JSON.stringify(data, null, 2));
    console.log(`[Storage] Archived season ${data.season} to ${archiveFile}`);
  } catch (err) {
    console.error("[Storage] Failed to archive season:", err);
  }
}
