import { config } from "./config.js";
import { createRlListener, type CrossbarHitCallback } from "./rlListener.js";
import { createDiscordBot, type BotCallbacks } from "./discord.js";
import {
  buildGoalEmbed, buildWrongModeEmbed, isFunnySpeed, isNearMiss,
  checkMilestone, isGoalThief, buildMilestoneEmbed, buildStreakEmbed,
  buildThiefEmbed, buildNearMissEmbed, buildLeaderboardEmbed,
  buildCompareEmbed, buildRivalryEmbed, buildSessionEmbed,
  buildCrossbarEmbed,
} from "./goalTracker.js";
import type { GoalEvent } from "./goalTracker.js";
import { loadData, saveData, archiveSeason, type StoredData } from "./storage.js";
import type { UpdateStateData, GoalReplayStartData, GoalReplayEndData } from "rocket-league-stats-api";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

const trackedNames = new Set(config.trackedPlayers.map((p) => p.toLowerCase()));

function isTrackedPlayer(goal: GoalEvent): boolean {
  if (trackedNames.size === 0) return true;
  return trackedNames.has(goal.scorerName.toLowerCase());
}

let storedData: StoredData = loadData();

const leaderboard = new Map<string, number>(Object.entries(storedData.leaderboard));
const recentFunnyGoals: string[] = storedData.recent;
const announcedMilestones: Record<string, number[]> = storedData.announcedMilestones ?? {};
const crossbarHitsMap = new Map<string, number>(Object.entries(storedData.crossbarHits ?? {}));
const crossbarCooldown = new Map<string, number>();
const displayNames: Record<string, string> = storedData.displayNames ?? {};

function canonical(name: string): string {
  return name.toLowerCase();
}

function displayForKey(key: string): string {
  return displayNames[key] ?? key;
}

// Per-session state (doesn't persist)
const streaks = new Map<string, number>();
let nearMiss: { player: string; speed: string; diff: number } | null = null;
let currentPlayers = new Set<string>();
let inReplay = false;

// Session stats
const sessionGoals: Record<string, number> = {};
const sessionBestStreak: Record<string, number> = {};
let sessionNearMissCount = 0;
const sessionStart = Date.now();

function getSessionTime(): string {
  const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  return `${m}m ${s}s`;
}

function persist() {
  storedData.leaderboard = Object.fromEntries(leaderboard);
  storedData.recent = recentFunnyGoals;
  storedData.announcedMilestones = announcedMilestones;
  storedData.crossbarHits = Object.fromEntries(crossbarHitsMap);
  storedData.displayNames = displayNames;
  saveData(storedData);
}

// ── Callbacks for Discord commands ──

function getLeaderboardEmbed() {
  const sorted = [...leaderboard.entries()].sort((a, b) => b[1] - a[1]);
  const total = [...leaderboard.values()].reduce((a, b) => a + b, 0);
  const displayEntries = sorted.map(([k, v]) => [displayForKey(k), v] as [string, number]);
  return buildLeaderboardEmbed(displayEntries, storedData.season, total);
}

function getCompareEmbed() {
  const sorted = [...leaderboard.entries()].sort((a, b) => b[1] - a[1]);
  const displayEntries = sorted.map(([k, v]) => [displayForKey(k), v] as [string, number]);
  const streaksRecord = Object.fromEntries([...streaks.entries()].map(([k, v]) => [displayForKey(k), v]));
  const announcedForDisplay: Record<string, number[]> = Object.fromEntries(
    Object.entries(announcedMilestones).map(([k, v]) => [displayForKey(k), v]),
  );
  return buildCompareEmbed(displayEntries, streaksRecord, announcedForDisplay);
}

function getRivalryEmbed() {
  const sorted = [...leaderboard.entries()].sort((a, b) => b[1] - a[1]);
  const displayEntries = sorted.map(([k, v]) => [displayForKey(k), v] as [string, number]);
  return buildRivalryEmbed(displayEntries, storedData.season);
}

function getSessionEmbed() {
  const displaySessionGoals: Record<string, number> = Object.fromEntries(
    Object.entries(sessionGoals).map(([k, v]) => [displayForKey(k), v]),
  );
  const displayBestStreak: Record<string, number> = Object.fromEntries(
    Object.entries(sessionBestStreak).map(([k, v]) => [displayForKey(k), v]),
  );
  return buildSessionEmbed(displaySessionGoals, displayBestStreak, sessionNearMissCount, getSessionTime());
}

function getCrossbarEmbed() {
  const sorted = [...crossbarHitsMap.entries()].sort((a, b) => b[1] - a[1]);
  const displayEntries = sorted.map(([k, v]) => [displayForKey(k), v] as [string, number]);
  const total = [...crossbarHitsMap.values()].reduce((a, b) => a + b, 0);
  return buildCrossbarEmbed(displayEntries, storedData.season, total);
}

function getStreaksStr(): string {
  if (streaks.size === 0) return "No active streaks.";
  return [...streaks.entries()]
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => `${displayForKey(name)}: ${count} in a row`)
    .join("\n");
}

function getSeasonInfo(): string {
  const lines = [`Bot is online.`, `Season **${storedData.season}**`];
  const sorted = [...leaderboard.entries()].sort((a, b) => b[1] - a[1]);
  if (sorted.length > 0) {
    sorted.forEach(([name, count], i) => {
      const medal = i === 0 ? "👑" : "";
      lines.push(`${medal} ${displayForKey(name)}: ${count}`);
    });
  } else {
    config.trackedPlayers.forEach((p) => lines.push(`${p}: 0`));
  }
  return lines.join("\n");
}

function startNewSeason(): string {
  archiveSeason(storedData);
  storedData.season++;
  leaderboard.clear();
  recentFunnyGoals.length = 0;
  streaks.clear();
  crossbarHitsMap.clear();
  nearMiss = null;
  for (const key of Object.keys(announcedMilestones)) delete announcedMilestones[key];
  for (const key of Object.keys(sessionGoals)) delete sessionGoals[key];
  for (const key of Object.keys(sessionBestStreak)) delete sessionBestStreak[key];
  sessionNearMissCount = 0;
  persist();
  return `Season **${storedData.season}** has started! Previous season archived.`;
}

function getRecent(): string {
  if (recentFunnyGoals.length === 0) return "";
  return recentFunnyGoals.slice(-10).map((g, i) => `${i + 1}. ${g}`).join("\n");
}

function getNearMissStr(): string {
  if (!nearMiss) return "No near-misses yet this session.";
  return `**${nearMiss.player}** — ${nearMiss.speed} kp/h (off by ${nearMiss.diff.toFixed(1)})`;
}

const callbacks: BotCallbacks = {
  getRecent,
  getNearMiss: getNearMissStr,
  getLeaderboardEmbed,
  getStreaks: getStreaksStr,
  getCompareEmbed,
  getRivalryEmbed,
  getSessionEmbed,
  getCrossbarEmbed,
  getSeasonInfo,
  newSeason: startNewSeason,
};

// ── Button row for goal messages ──

function goalButtons() {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("btn_leaderboard").setLabel("Leaderboard").setStyle(ButtonStyle.Primary).setEmoji("🏆"),
      new ButtonBuilder().setCustomId("btn_streaks").setLabel("Streaks").setStyle(ButtonStyle.Secondary).setEmoji("🔥"),
      new ButtonBuilder().setCustomId("btn_compare").setLabel("Compare").setStyle(ButtonStyle.Success).setEmoji("⚔️"),
      new ButtonBuilder().setCustomId("btn_rivalry").setLabel("Rivalry").setStyle(ButtonStyle.Danger).setEmoji("💬"),
      new ButtonBuilder().setCustomId("btn_session").setLabel("Session").setStyle(ButtonStyle.Secondary).setEmoji("📊"),
    ),
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("btn_crossbar").setLabel("Crossbar").setStyle(ButtonStyle.Secondary).setEmoji("🏒"),
    ),
  ];
}

// ── Leader channel trophy ──

async function updateLeaderChannel(client: import("discord.js").Client) {
  if (!config.leaderChannelId) return;
  try {
    const channel = await client.channels.fetch(config.leaderChannelId);
    if (channel && "setName" in channel) {
      const sorted = [...leaderboard.entries()].sort((a, b) => b[1] - a[1]);
      const top = sorted[0];
      const name = top ? `🏆 ${displayForKey(top[0])}: ${top[1]}` : "🏆 No goals yet";
      if (channel.name !== name && typeof channel.setName === "function") {
        await channel.setName(name);
      }
    }
  } catch {
    // channel not available — silently skip
  }
}

// ── Crossbar channel trophy ──

async function updateCrossbarChannel(client: import("discord.js").Client) {
  if (!config.crossbarChannelId) return;
  try {
    const channel = await client.channels.fetch(config.crossbarChannelId);
    if (channel && "setName" in channel) {
      const sorted = [...crossbarHitsMap.entries()].sort((a, b) => b[1] - a[1]);
      const top = sorted[0];
      const name = top ? `🏒 ${displayForKey(top[0])}: ${top[1]}` : "🏒 No crossbars yet";
      if (channel.name !== name && typeof channel.setName === "function") {
        await channel.setName(name);
      }
    }
  } catch {
    // channel not available — silently skip
  }
}

// ── Main ──

async function main() {
  console.log(`[Bot] Starting — Season ${storedData.season}`);

  const discord = await createDiscordBot(
    config.discordToken,
    config.discordChannelId,
    callbacks,
    config.guildId || undefined,
  );

  const onCrossbarHit: CrossbarHitCallback = async (data) => {
    const raw = data as any;
    const playerName = raw.BallLastTouch?.Player?.Name;
    if (!playerName || typeof playerName !== "string") {
      console.log("[Bot] CrossbarHit — could not extract player name");
      return;
    }
    if (!isTrackedPlayer({ scorerName: playerName, goalSpeedRaw: 0, goalSpeedLabel: "0" })) return;
    if (inReplay) return;

    const bothTrackedPresent = config.trackedPlayers.length <= 1 ||
      config.trackedPlayers.every(p => currentPlayers.has(p.toLowerCase()));
    console.log(`[Bot] Crossbar hit by ${playerName} [both: ${bothTrackedPresent}]`);
    if (!bothTrackedPresent) return;

    const key = canonical(playerName);
    const lastHit = crossbarCooldown.get(key) ?? 0;
    if (Date.now() - lastHit < 2000) return;
    crossbarCooldown.set(key, Date.now());

    crossbarHitsMap.set(key, (crossbarHitsMap.get(key) ?? 0) + 1);
    displayNames[key] = playerName;
    console.log(`[Bot] Crossbar hit by ${playerName} (total: ${crossbarHitsMap.get(key)})`);
    await updateCrossbarChannel(discord.client);
    persist();
  };

  const rlClient = createRlListener(config.rlPort, async (goal) => {
    if (!isTrackedPlayer(goal)) {
      console.log(`[Bot] Ignored goal by ${goal.scorerName} (not tracked)`);
      return;
    }
    if (inReplay) return;

    const bothHere = config.trackedPlayers.every(p => currentPlayers.has(p.toLowerCase()));
    console.log(`[Bot] Goal by ${goal.scorerName} — ${goal.goalSpeedRaw.toFixed(1)} kp/h [both: ${bothHere}]`);

    // ── Near-miss ──
    if (isNearMiss(goal) && !isFunnySpeed(goal)) {
      const diff = Math.abs(goal.goalSpeedRaw - 69);
      if (!nearMiss || diff < nearMiss.diff) {
        nearMiss = { player: goal.scorerName, speed: goal.goalSpeedLabel, diff };
      }
      sessionNearMissCount++;
      await discord.postGoal({ embeds: [buildNearMissEmbed(goal.scorerName, goal.goalSpeedLabel)], components: goalButtons() });
    }

    if (!isFunnySpeed(goal)) {
      streaks.set(canonical(goal.scorerName), 0);
      return;
    }

    // ── Valid mode check ──
    const bothTrackedPresent = config.trackedPlayers.length <= 1 ||
      config.trackedPlayers.every(p => currentPlayers.has(p.toLowerCase()));

    if (!bothTrackedPresent) {
      await discord.postGoal({ embeds: [buildWrongModeEmbed(goal)] });
      return;
    }

    // ── Count the goal ──
    const key = canonical(goal.scorerName);
    const current = leaderboard.get(key) ?? 0;
    leaderboard.set(key, current + 1);
    displayNames[key] = goal.scorerName;

    sessionGoals[key] = (sessionGoals[key] ?? 0) + 1;

    const streak = (streaks.get(key) ?? 0) + 1;
    streaks.set(key, streak);

    if (streak > (sessionBestStreak[key] ?? 0)) {
      sessionBestStreak[key] = streak;
    }

    for (const [player] of streaks) {
      if (player !== key) streaks.set(player, 0);
    }

    // ── Goal thief ──
    if (isGoalThief(goal) && trackedNames.has(goal.lastTouchName!.toLowerCase())) {
      await discord.postGoal({ embeds: [buildThiefEmbed(goal.scorerName, goal.lastTouchName!)], components: goalButtons() });
    }

    // ── Milestone ──
    const playerMilestones = announcedMilestones[key] ?? [];
    const milestone = checkMilestone(leaderboard.get(key)!);
    if (milestone && !playerMilestones.includes(milestone)) {
      playerMilestones.push(milestone);
      announcedMilestones[key] = playerMilestones;
      await discord.postGoal({ embeds: [buildMilestoneEmbed(displayForKey(key), milestone, leaderboard.get(key)!)], components: goalButtons() });
    }

    // ── Post goal with buttons ──
    const embeds = [buildGoalEmbed(goal)];
    if (streak >= 2) {
      embeds.push(buildStreakEmbed(goal.scorerName, streak));
    }

    recentFunnyGoals.push(`${goal.scorerName} — ${goal.goalSpeedLabel} kp/h`);
    // keep recent list bounded to avoid unbounded growth
    if (recentFunnyGoals.length > 200) {
      recentFunnyGoals.splice(0, recentFunnyGoals.length - 200);
    }
    await discord.postGoal({ embeds, components: goalButtons() });
    await updateLeaderChannel(discord.client);
    persist();
  }, onCrossbarHit);

  // ── Track players in match ──
  rlClient.on("UpdateState", (data: UpdateStateData) => {
    currentPlayers = new Set(data.Players.map((p) => p.Name.toLowerCase()));
  });

  rlClient.on("GoalReplayStart", () => {
    inReplay = true;
    console.log("[Bot] Replay started — ignoring goals and crossbars");
  });

  rlClient.on("GoalReplayEnd", () => {
    inReplay = false;
    console.log("[Bot] Replay ended — resuming tracking");
  });

  await updateLeaderChannel(discord.client);
  await updateCrossbarChannel(discord.client);

  try {
    await rlClient.connect();
    console.log("[Bot] Ready — waiting for 69 kp/h goals...");
  } catch {
    console.log("[Bot] Will keep Discord bot running and retry RL connection...");
  }

  process.on("SIGINT", () => {
    console.log("\nShutting down...");
    persist();
    rlClient.disconnect();
    discord.client.destroy();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    persist();
    rlClient.disconnect();
    discord.client.destroy();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
