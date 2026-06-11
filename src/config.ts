import "dotenv/config";

export const config = {
  discordToken: process.env.DISCORD_BOT_TOKEN ?? "",
  discordChannelId: process.env.DISCORD_CHANNEL_ID ?? "",
  guildId: process.env.GUILD_ID ?? "",
  leaderChannelId: process.env.LEADER_CHANNEL_ID ?? "",
  rlPort: Number(process.env.RL_PORT) || 49123,
  rlHost: "127.0.0.1",
  trackedPlayers: (process.env.TRACKED_PLAYERS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
};

function validateConfig() {
  const missing: string[] = [];
  if (!config.discordToken) missing.push("DISCORD_BOT_TOKEN");
  if (!config.discordChannelId) missing.push("DISCORD_CHANNEL_ID");
  if (config.trackedPlayers.length === 0) {
    console.warn("TRACKED_PLAYERS not set — tracking all players");
  }
  if (missing.length > 0) {
    console.error(`Missing .env variables: ${missing.join(", ")}`);
    console.error("Copy .env.example to .env and fill in the values.");
    process.exit(1);
  }
}

validateConfig();
