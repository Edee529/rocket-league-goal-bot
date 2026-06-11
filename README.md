# 🚀 69 kp/h Goal Bot

A Discord bot that tracks **69 kp/h** goals in Rocket League via the [rocket-league-stats-api](https://github.com/itslupus/rocket-league-stats-api).

## Prerequisites

- **Node.js 18+** (discord.js v14 requirement)
- **Rocket League** running on the same machine with the [Stats API plugin](https://github.com/itslupus/rocket-league-stats-api)

## Setup

1. **Install dependencies**
   ```sh
   npm install
   ```

2. **Create a Discord bot**
   - Go to https://discord.com/developers/applications
   - Create a new application → Bot → Copy the token
   - Enable **Message Content Intent** in the Bot settings
   - Invite the bot to your server with `bot` and `applications.commands` scopes

3. **Configure environment**
   ```sh
   cp .env.example .env
   ```
   Fill in:
   - `DISCORD_BOT_TOKEN` — token from step 2
   - `DISCORD_CHANNEL_ID` — channel where goal posts go
   - `GUILD_ID` (optional) — server ID for instant command registration
   - `TRACKED_PLAYERS` — comma-separated Rocket League player names
   - `LEADER_CHANNEL_ID` (optional) — voice channel to auto-update with the leader's name
   - `RL_PORT` (optional, default `49123`) — Rocket League Stats API port

4. **Run**
   ```sh
   npm run dev       # development with hot reload
   npm run build     # production build
   npm start         # start production build
   ```

## Commands

| Command | Description |
|---------|-------------|
| `/commands` | Shows descriptions of all available commands |
| `/leaderboard` | Season leaderboard ranked by 69 kp/h goals |
| `/compare` | Head-to-head breakdown between the top 2 players |
| `/rivalry` | Rivalry status with trash talk |
| `/session` | Stats since the bot started |
| `/recent` | Last 10 funny goals this session |
| `/nearmiss` | Closest goal to 69 kp/h this session |
| `/streak` | Current funny goal streaks per player |
| `/season` | Current season info |
| `/status` | Bot connection status and season overview |
| `/newseason` | Archives the current season and starts a fresh one |

Goal messages also include interactive buttons for **Leaderboard**, **Streaks**, **Compare**, **Rivalry**, and **Session** — no need to type commands.

## How it works

- Connects to Rocket League Stats API over TCP (port `49123` by default)
- Listens for `GoalScored` events and checks if the speed rounds to **69 kp/h**
- Posts a styled embed to the configured Discord channel
- Detects streaks, milestones (10, 25, 50, 75, 100+), goal thieves, and near-misses
- Tracks both players and requires both to be in the match for goals to count
- Persists leaderboard data to `leaderboard.json`
- Archives seasons to timestamped JSON files

## Project structure

```
src/
  config.ts        — environment configuration
  discord.ts       — Discord client, slash commands, button handlers
  goalTracker.ts   — embed builders, speed/milestone/thief logic
  index.ts         — main entry point, goal processing pipeline
  rlListener.ts    — Rocket League Stats API connection
  storage.ts       — JSON file persistence and season archiving
```
