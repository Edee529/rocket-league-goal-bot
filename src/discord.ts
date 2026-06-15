import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events,
  type TextChannel,
} from "discord.js";

let restInstance: REST | null = null;
let applicationId: string | null = null;

function getRest(token: string): REST {
  if (!restInstance) {
    restInstance = new REST({ version: "10" }).setToken(token);
  }
  return restInstance;
}

export interface BotCallbacks {
  getRecent: () => string;
  getNearMiss: () => string;
  getLeaderboardEmbed: () => EmbedBuilder;
  getStreaks: () => string;
  getCompareEmbed: () => EmbedBuilder;
  getRivalryEmbed: () => EmbedBuilder;
  getSessionEmbed: () => EmbedBuilder;
  getCrossbarEmbed: () => EmbedBuilder;
  getSeasonInfo: () => string;
  newSeason: () => string;
}

async function registerCommands(token: string, clientId: string, guildId?: string) {
  const commands = [
    new SlashCommandBuilder()
      .setName("status")
      .setDescription("Shows bot connection status"),
    new SlashCommandBuilder()
      .setName("leaderboard")
      .setDescription("Shows the 69 kp/h goal leaderboard"),
    new SlashCommandBuilder()
      .setName("compare")
      .setDescription("Head-to-head comparison"),
    new SlashCommandBuilder()
      .setName("rivalry")
      .setDescription("Current rivalry status with trash talk"),
    new SlashCommandBuilder()
      .setName("session")
      .setDescription("Stats since bot started"),
    new SlashCommandBuilder()
      .setName("recent")
      .setDescription("Lists recent 69 kp/h goals"),
    new SlashCommandBuilder()
      .setName("nearmiss")
      .setDescription("Shows the closest goal to 69 this session"),
    new SlashCommandBuilder()
      .setName("streak")
      .setDescription("Shows current funny goal streaks"),
    new SlashCommandBuilder()
      .setName("season")
      .setDescription("Shows current season info"),
    new SlashCommandBuilder()
      .setName("newseason")
      .setDescription("Archives current season and starts a new one"),
    new SlashCommandBuilder()
      .setName("commands")
      .setDescription("Shows descriptions of all available commands"),
    new SlashCommandBuilder()
      .setName("crossbar")
      .setDescription("Shows the crossbar hits leaderboard"),
    new SlashCommandBuilder()
      .setName("clear")
      .setDescription("⚠️ Deletes ALL messages in the channel (last 14 days only)"),
  ];

  try {
    const route = guildId
      ? Routes.applicationGuildCommands(clientId, guildId)
      : Routes.applicationCommands(clientId);

    await getRest(token).put(route, {
      body: commands.map((c) => c.toJSON()),
    });
    console.log(`[Discord] Slash commands registered ${guildId ? "to guild" : "globally"}`);
  } catch (err) {
    console.error("[Discord] Failed to register commands:", err);
  }
}

export async function createDiscordBot(
  token: string,
  channelId: string,
  callbacks: BotCallbacks,
  guildId?: string,
) {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  });

  client.once(Events.ClientReady, async () => {
    console.log(`[Discord] Logged in as ${client.user?.tag}`);
    applicationId = client.user?.id ?? null;

    if (applicationId) {
      await registerCommands(token, applicationId, guildId);
    }
  });

  const buttonActions: Record<string, () => EmbedBuilder | string> = {
    btn_leaderboard: () => callbacks.getLeaderboardEmbed(),
    btn_streaks: () => callbacks.getStreaks(),
    btn_compare: () => callbacks.getCompareEmbed(),
    btn_rivalry: () => callbacks.getRivalryEmbed(),
    btn_session: () => callbacks.getSessionEmbed(),
    btn_crossbar: () => callbacks.getCrossbarEmbed(),
  };

  client.on("interactionCreate", async (interaction) => {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "status") {
        await interaction.reply({ content: callbacks.getSeasonInfo(), ephemeral: false });
      } else if (interaction.commandName === "leaderboard") {
        await interaction.reply({ embeds: [callbacks.getLeaderboardEmbed()], ephemeral: false });
      } else if (interaction.commandName === "compare") {
        await interaction.reply({ embeds: [callbacks.getCompareEmbed()], ephemeral: false });
      } else if (interaction.commandName === "rivalry") {
        await interaction.reply({ embeds: [callbacks.getRivalryEmbed()], ephemeral: false });
      } else if (interaction.commandName === "session") {
        await interaction.reply({ embeds: [callbacks.getSessionEmbed()], ephemeral: false });
      } else if (interaction.commandName === "streak") {
        const s = callbacks.getStreaks();
        await interaction.reply({ content: s || "No active streaks.", ephemeral: false });
      } else if (interaction.commandName === "recent") {
        const r = callbacks.getRecent();
        await interaction.reply({ content: r || "No 69 kp/h goals yet this session.", ephemeral: false });
      } else if (interaction.commandName === "nearmiss") {
        const nm = callbacks.getNearMiss();
        await interaction.reply({ content: nm || "No near-misses yet this session.", ephemeral: false });
      } else if (interaction.commandName === "season") {
        await interaction.reply({ content: callbacks.getSeasonInfo(), ephemeral: false });
      } else if (interaction.commandName === "newseason") {
        await interaction.reply({ content: callbacks.newSeason(), ephemeral: false });
      } else if (interaction.commandName === "crossbar") {
        await interaction.reply({ embeds: [callbacks.getCrossbarEmbed()], ephemeral: false });
      } else if (interaction.commandName === "commands") {
        const embed = new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle("📖 Command Guide")
          .setDescription("Here's what every command does:")
          .addFields(
            { name: "/status", value: "Shows bot connection status and current season info", inline: false },
            { name: "/leaderboard", value: "Shows the 69 kp/h goal leaderboard for the season", inline: false },
            { name: "/compare", value: "Head-to-head comparison between the top 2 players", inline: false },
            { name: "/rivalry", value: "Current rivalry status with trash talk between leaders", inline: false },
            { name: "/session", value: "Stats since the bot started (goals, streaks, near misses)", inline: false },
            { name: "/recent", value: "Lists recent 69 kp/h goals scored this session", inline: false },
            { name: "/nearmiss", value: "Shows the closest goal to 69 kp/h this session", inline: false },
            { name: "/streak", value: "Shows current funny goal streaks for each player", inline: false },
            { name: "/crossbar", value: "Shows the crossbar hits leaderboard for the season", inline: false },
            { name: "/season", value: "Shows current season number and total goals", inline: false },
            { name: "/newseason", value: "Archives current season stats and starts a fresh season", inline: false },
            { name: "/clear", value: "⚠️ Deletes ALL messages in the channel (last 14 days only)", inline: false },
          )
          .setTimestamp();
        await interaction.reply({ embeds: [embed], ephemeral: false });
      } else if (interaction.commandName === "clear") {
        await interaction.deferReply({ ephemeral: false });
        let deleted = 0;
        try {
          let fetched;
          do {
            fetched = await (channel as any).bulkDelete(100);
            deleted += fetched.size;
          } while (fetched.size === 100);
        } catch (err: any) {
          console.error("[Discord] /clear error:", err.message);
          await interaction.editReply({ content: `Deleted ${deleted} messages, then hit an error: ${err.message}. Older messages may remain.` });
          return;
        }
        await interaction.editReply({ content: `✅ Deleted **${deleted}** messages. Note: only messages from the last 14 days can be deleted.` });
      }
      return;
    }

    if (interaction.isButton()) {
      const action = buttonActions[interaction.customId];
      if (!action) {
        await interaction.reply({ content: "Unknown button.", ephemeral: false });
        return;
      }
      const result = action();
      if (result instanceof EmbedBuilder) {
        await interaction.reply({ embeds: [result], ephemeral: false });
      } else {
        await interaction.reply({ content: result || "No data.", ephemeral: false });
      }
    }
  });

  await client.login(token);

  const channel = await client.channels.fetch(channelId);
  if (!channel?.isTextBased()) {
    console.error(`[Discord] Channel ${channelId} not found or not a text channel`);
    process.exit(1);
  }

  async function postGoal(content: { embeds: EmbedBuilder[]; components?: ActionRowBuilder<ButtonBuilder>[] }) {
    try {
      await (channel as { send: Function }).send(content);
    } catch (err) {
      console.error("[Discord] Failed to send goal message:", err);
    }
  }

  return { client, postGoal };
}
