import { RocketLeagueStatsClient, type GoalScoredData, type CrossbarHitData } from "rocket-league-stats-api";
import type { GoalEvent } from "./goalTracker.js";
import { processGoal } from "./goalTracker.js";

export type GoalCallback = (goal: GoalEvent) => void;
export type CrossbarHitCallback = (data: CrossbarHitData) => void;

export function createRlListener(port: number, onGoal: GoalCallback, onCrossbarHit?: CrossbarHitCallback): RocketLeagueStatsClient {
  const client = new RocketLeagueStatsClient({
    host: "127.0.0.1",
    port,
    autoReconnect: true,
    reconnectDelayMs: 2000,
    maxReconnectDelayMs: 30000,
    connectTimeoutMs: 10000,
  });

  client.on("connected", () => {
    console.log("[RL] Connected to Rocket League Stats API");
  });

  client.on("disconnected", ({ reason }) => {
    console.log(`[RL] Disconnected (${reason})`);
  });

  client.on("error", (err) => {
    console.error("[RL] Error:", err.message);
  });

  client.on("GoalScored", (data: GoalScoredData) => {
    const goal = processGoal(
      data.Scorer?.Name,
      data.GoalSpeed ?? 0,
      data.BallLastTouch?.Name,
    );
    onGoal(goal);
  });

  if (onCrossbarHit) {
    client.on("CrossbarHit", (data: CrossbarHitData) => onCrossbarHit(data));
  }

  return client;
}
