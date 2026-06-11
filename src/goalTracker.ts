import { EmbedBuilder } from "discord.js";

export interface GoalEvent {
  scorerName: string;
  goalSpeedRaw: number;
  goalSpeedLabel: string;
  lastTouchName?: string;
}

const FUNNY_NUMBER = 69;

const MILESTONES = [10, 25, 50, 75, 100, 125, 150, 200, 250, 300, 400, 500];

export function isFunnySpeed(goal: GoalEvent): boolean {
  return Math.round(goal.goalSpeedRaw) === FUNNY_NUMBER;
}

export function isNearMiss(goal: GoalEvent): boolean {
  const diff = Math.abs(goal.goalSpeedRaw - FUNNY_NUMBER);
  return diff > 0 && diff <= 1;
}

export function checkMilestone(count: number): number | null {
  for (const m of MILESTONES) {
    if (count === m) return m;
  }
  return null;
}

export function isGoalThief(goal: GoalEvent): boolean {
  if (!goal.lastTouchName) return false;
  return goal.lastTouchName.toLowerCase() !== goal.scorerName.toLowerCase();
}

export function processGoal(
  scorerName: string | undefined,
  goalSpeedRaw: number,
  lastTouchName?: string,
): GoalEvent {
  const name = scorerName ?? "Unknown";
  const label = goalSpeedRaw.toFixed(0);
  return { scorerName: name, goalSpeedRaw, goalSpeedLabel: label, lastTouchName };
}

function randomItem(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Goal embed ──

export function buildGoalEmbed(goal: GoalEvent): EmbedBuilder {
  const theftNote = (isGoalThief(goal))
    ? `\n*(stolen from ${goal.lastTouchName})*`
    : "";
  return new EmbedBuilder()
    .setColor(0x00b4d8)
    .setTitle("⚽ 69 kp/h GOAL!")
    .setDescription(`**${goal.scorerName}**${theftNote}`)
    .addFields(
      { name: "🎯 Scorer", value: goal.scorerName, inline: true },
      { name: "🚀 Speed", value: `${goal.goalSpeedLabel} kp/h`, inline: true },
    )
    .setTimestamp();
}

// ── Wrong mode embed ──

const wrongModeMessages = [
  "Nice **{speed} kp/h** from **{player}**! Too bad it only counts when you're both in the party.",
  "**{player}** with a clean **{speed} kp/h**! But the leaderboard only tracks duos.",
  "Sick goal **{player}**! **{speed} kp/h** is elite... but the board only counts when you're together.",
  "**{speed} kp/h**?! **{player}** is cracked. Shame your duo partner isn't here.",
  "**{player}** scored **{speed} kp/h**! Nice warmup — now drag your friend into the lobby.",
];

export function buildWrongModeEmbed(goal: GoalEvent): EmbedBuilder {
  const msg = randomItem(wrongModeMessages)
    .replace("{player}", `**${goal.scorerName}**`)
    .replace("{speed}", goal.goalSpeedLabel);

  return new EmbedBuilder()
    .setColor(0x808080)
    .setTitle("🎮 NOT COUNTED")
    .setDescription(msg)
    .setTimestamp();
}

// ── Milestone embed ──

const milestoneTitles: Record<number, string> = {
  10: "🎉 DOUBLE DIGITS!",
  25: "🎊 QUARTER CENTURY!",
  50: "🏆 HALF A HUNDRED!",
  75: "🔥 THREE QUARTERS TO 100!",
  100: "👑 CENTURY CLUB!",
};

const milestoneDescriptions: Record<number, string> = {
  10: "has entered double digits! The grind is real.",
  25: "a quarter century of 69s! Absolutely unhinged.",
  50: "half a hundred funny goals. This is an addiction.",
  75: "three quarters of the way to 100. No stopping now.",
  100: "ONE HUNDRED FUNNY GOALS. LEGENDARY STATUS ACHIEVED.",
};

export function buildMilestoneEmbed(player: string, milestone: number, count: number): EmbedBuilder {
  const title = milestoneTitles[milestone] ?? `💎 ${milestone} FUNNY GOALS!`;
  const desc = milestoneDescriptions[milestone] ?? `**${player}** has reached **${milestone}** funny goals! Unbelievable.`;

  const colors: Record<number, number> = {
    10: 0x00e5ff,
    25: 0xff6b35,
    50: 0xffd700,
    75: 0xb537ff,
    100: 0xff0040,
  };
  const color = colors[milestone] ?? 0xffd700;

  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(desc.replace(/\*\*.*?\*\*/, `**${player}**`))
    .addFields({ name: "🏅 Total", value: `${count}`, inline: true })
    .setTimestamp();
}

// ── Streak embed ──

const streakIntros: Record<number, string> = {
  2: "is heating up!",
  3: "is on fire!",
  4: "is unstoppable!",
  5: "is ABSOLUTELY DOMINATING!",
};

const streakIcons: Record<number, string> = {
  2: "🔥",
  3: "🔥🔥",
  4: "🔥🔥🔥",
  5: "🔥🔥🔥🔥",
};

export function buildStreakEmbed(player: string, streak: number): EmbedBuilder {
  const icon = streakIcons[Math.min(streak, 5)] ?? "🔥".repeat(Math.min(streak, 8));
  const intro = streakIntros[Math.min(streak, 5)] ?? "is on an insane streak!";
  const title = `${icon} STREAK: ${streak}x!`;

  const color = streak >= 4 ? 0xff0040 : streak >= 3 ? 0xff6b35 : 0x00b4d8;

  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(`**${player}** ${intro} ${streak} funny goals in a row!`)
    .addFields({ name: "\u200b", value: "\u200b" })
    .setTimestamp();
}

// ── Thief embed ──

const thiefRoasts = [
  "**{scorer}** robbed **{victim}** blind! That goal was RIGHT THERE.",
  "**{victim}** sets it up perfectly... and **{scorer}** takes the credit. Classic.",
  "BRUTAL. **{scorer}** stole **{victim}**'s 69 right off the goal line.",
  "**{victim}** did all the work. **{scorer}** gets the glory. Unreal.",
  "GOAL THIEF ALERT! **{scorer}** snatches a 69 from **{victim}**!",
  "**{victim}** in shambles. **{scorer}** stole another one.",
  "**{scorer}** couldn't let **{victim}** have that one. Goal theft!",
];

export function buildThiefEmbed(scorer: string, victim: string): EmbedBuilder {
  const roast = randomItem(thiefRoasts)
    .replace("{scorer}", `**${scorer}**`)
    .replace("{victim}", `**${victim}**`);

  return new EmbedBuilder()
    .setColor(0xe63946)
    .setTitle("👀 GOAL THIEF!")
    .setDescription(roast)
    .addFields({ name: "\u200b", value: "\u200b" })
    .setTimestamp();
}

// ── Near miss embed ──

const nearMissMessages = [
  "**{player}** was THIS close — {speed} kp/h!",
  "So close! **{player}** with a near-perfect {speed} kp/h!",
  "AGONY! **{player}** missed 69 by a hair — {speed} kp/h!",
  "**{player}** almost had it! {speed} kp/h is teasing territory.",
];

export function buildNearMissEmbed(player: string, speed: string): EmbedBuilder {
  const msg = randomItem(nearMissMessages)
    .replace("{player}", `**${player}**`)
    .replace("{speed}", speed);

  return new EmbedBuilder()
    .setColor(0x9c89b8)
    .setTitle("😬 SO CLOSE!")
    .setDescription(msg)
    .addFields({ name: "\u200b", value: "\u200b" })
    .setTimestamp();
}

// ── Leaderboard embed ──

export function buildLeaderboardEmbed(
  entries: [string, number][],
  season: number,
  totalGoals: number,
): EmbedBuilder {
  const medals = ["🥇", "🥈", "🥉"];
  const desc = entries.length === 0
    ? "No 69 kp/h goals yet this season."
    : entries.map(([name, count], i) => {
        const medal = i < 3 ? medals[i] : `${i + 1}.`;
        return `${medal} **${name}** — ${count}`;
      }).join("\n");

  const leaders = entries.slice(0, 2).map(([n]) => n);
  const rivalry = leaders.length === 2 ? `${leaders[0]} vs ${leaders[1]}` : "";

  return new EmbedBuilder()
    .setColor(0xffd700)
    .setTitle("🏆 69 kp/h LEADERBOARD")
    .setDescription(desc)
    .addFields(
      { name: "📊 Season", value: `#${season}`, inline: true },
      { name: "🎯 Total", value: `${totalGoals} goals`, inline: true },
      { name: "⚔️ Battle", value: rivalry || "Solo mode", inline: true },
    )
    .setTimestamp();
}

// ── Compare embed ──

export function buildCompareEmbed(
  entries: [string, number][],
  streaks: Record<string, number>,
  milestones: Record<string, number[]>,
): EmbedBuilder {
  if (entries.length < 2) {
    return new EmbedBuilder()
      .setColor(0x70e000)
      .setTitle("⚔️ HEAD TO HEAD")
      .setDescription("Need at least 2 players to compare.")
      .setTimestamp();
  }

  const [p1, p2] = [entries[0][0], entries[1][0]];
  const [s1, s2] = [entries[0][1], entries[1][1]];
  const diff = Math.abs(s1 - s2);
  const leader = s1 > s2 ? p1 : p2;
  const behind = s1 > s2 ? p2 : p1;

  const p1Streak = streaks[p1] ?? 0;
  const p2Streak = streaks[p2] ?? 0;
  const p1Ms = milestones[p1] ?? [];
  const p2Ms = milestones[p2] ?? [];

  return new EmbedBuilder()
    .setColor(0x70e000)
    .setTitle("⚔️ HEAD TO HEAD")
    .setDescription(`**${leader}** leads by **${diff}**`)
    .addFields(
      { name: `🥇 ${p1}`, value: `**${s1}** goals\nBest streak: ${p1Streak}\nMilestones: ${p1Ms.length}`, inline: true },
      { name: `🥈 ${p2}`, value: `**${s2}** goals\nBest streak: ${p2Streak}\nMilestones: ${p2Ms.length}`, inline: true },
      { name: "📊 Gap", value: `${behind} needs **${diff + 1}** to take the lead`, inline: false },
    )
    .setTimestamp();
}

// ── Rivalry embed ──

const rivalryTrashTalk = [
  "is absolutely dominating right now! Can **{trailing}** even compete?",
  "is running away with it! **{trailing}** needs to step it up.",
  "better watch out — **{trailing}** is plotting a comeback.",
  "in the lead! But **{trailing}** is never out of the fight.",
  "showing **{trailing}** how it's done. Clean your game up!",
  "stomping the competition. **{trailing}** is just making up the numbers.",
  "on top! **{trailing}** needs to go back to training mode.",
];

export function buildRivalryEmbed(
  entries: [string, number][],
  season: number,
): EmbedBuilder {
  if (entries.length < 2) {
    const solo = entries[0]?.[0] ?? "You";
    return new EmbedBuilder()
      .setColor(0xff6b35)
      .setTitle("💪 SOLO RIVALRY")
      .setDescription(`**${solo}** is flying solo this season. Get your duo in here!`)
      .setTimestamp();
  }

  const [leader, trailer] = [entries[0], entries[1]];
  const diff = leader[1] - trailer[1];
  const trash = randomItem(rivalryTrashTalk)
    .replace("{trailing}", `**${trailer[0]}**`);

  return new EmbedBuilder()
    .setColor(0xff6b35)
    .setTitle("🔥 RIVALRY STATUS")
    .setDescription(`**${leader[0]}** ${trash}`)
    .addFields(
      { name: `👑 ${leader[0]}`, value: `${leader[1]}`, inline: true },
      { name: `🎯 ${trailer[0]}`, value: `${trailer[1]}`, inline: true },
      { name: "📈 Gap", value: `${diff} goal${diff === 1 ? "" : "s"}`, inline: true },
    )
    .setTimestamp();
}

// ── Session embed ──

export function buildSessionEmbed(
  sessionGoals: Record<string, number>,
  bestStreak: Record<string, number>,
  nearMissCount: number,
  sessionTime: string,
): EmbedBuilder {
  const desc = Object.entries(sessionGoals).length === 0
    ? "No funny goals yet this session."
    : Object.entries(sessionGoals)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count], i) => {
          const medal = i === 0 ? "👑" : "";
          const streak = bestStreak[name] ?? 0;
          const streakText = streak > 0 ? ` (best streak: ${streak})` : "";
          return `${medal} **${name}**: ${count}${streakText}`;
        }).join("\n");

  return new EmbedBuilder()
    .setColor(0x70e000)
    .setTitle("📊 SESSION STATS")
    .setDescription(desc)
    .addFields(
      { name: "⏱️ Duration", value: sessionTime, inline: true },
      { name: "😬 Near misses", value: `${nearMissCount}`, inline: true },
    )
    .setTimestamp();
}

// ── Crossbar hits embed ──

export function buildCrossbarEmbed(
  entries: [string, number][],
  season: number,
  totalHits: number,
): EmbedBuilder {
  const medals = ["🥇", "🥈", "🥉"];
  const desc = entries.length === 0
    ? "No crossbar hits recorded this season."
    : entries.map(([name, count], i) => {
        const medal = i < 3 ? medals[i] : `${i + 1}.`;
        return `${medal} **${name}** — ${count}`;
      }).join("\n");

  return new EmbedBuilder()
    .setColor(0xf72585)
    .setTitle("🏒 CROSSBAR HITS")
    .setDescription(desc)
    .addFields(
      { name: "📊 Season", value: `#${season}`, inline: true },
      { name: "🎯 Total", value: `${totalHits} hits`, inline: true },
    )
    .setTimestamp();
}
