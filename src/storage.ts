import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, "..", "leaderboard.json");

export interface StoredData {
  leaderboard: Record<string, number>;
  recent: string[];
  season: number;
  announcedMilestones: Record<string, number[]>;
}

function defaultData(): StoredData {
  return { leaderboard: {}, recent: [], season: 1, announcedMilestones: {} };
}

export function loadData(): StoredData {
  try {
    if (existsSync(DATA_FILE)) {
      const raw = readFileSync(DATA_FILE, "utf-8");
      return { ...defaultData(), ...(JSON.parse(raw) as Partial<StoredData>) };
    }
  } catch (err) {
    console.error("[Storage] Failed to load data, starting fresh:", err);
  }
  return defaultData();
}

export function saveData(data: StoredData): void {
  try {
    writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("[Storage] Failed to save data:", err);
  }
}

export function archiveSeason(data: StoredData): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const archiveFile = join(__dirname, "..", `season-${data.season}-${timestamp}.json`);
  try {
    writeFileSync(archiveFile, JSON.stringify(data, null, 2), "utf-8");
    console.log(`[Storage] Archived season ${data.season} to ${archiveFile}`);
  } catch (err) {
    console.error("[Storage] Failed to archive season:", err);
  }
}
