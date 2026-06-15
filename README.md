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
   - `LEADER_CHANNEL_ID` (optional) — channel to auto-rename with the goal leader (🏆)
   - `CROSSBAR_CHANNEL_ID` (optional) — channel to auto-rename with the crossbar leader (🏒)
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
| `/crossbar` | Season leaderboard for crossbar hits |
| `/season` | Current season info |
| `/status` | Bot connection status and season overview |
| `/newseason` | Archives the current season and starts a fresh one |

Goal messages include interactive buttons for **Leaderboard**, **Streaks**, **Compare**, **Rivalry**, **Session**, and **Crossbar** — no need to type commands.

## How it works

- Connects to Rocket League Stats API over TCP (port `49123` by default)
- Listens for `GoalScored` events and checks if the speed rounds to **69 kp/h**
- Listens for `CrossbarHit` events and silently counts per tracked player
- Posts a styled embed to the configured Discord channel for every 69 kp/h goal with interactive buttons
- Every goal within 1 kp/h of 69 also posts a near-miss embed
- Detects streaks, milestones (10, 25, 50, 75, 100+), goal thieves, and near-misses
- Ignores goals and crossbars during goal replays (the API still fires events, but replay events gate the counting)
- Tracks both players and requires both to be in the match for goals and crossbar hits to count
- Optionally renames channels to show the leaderboard champion and crossbar champion
- Persists leaderboard and crossbar data to `leaderboard.json`
- Archives seasons to timestamped JSON files

## Credits

Built with heavy use of AI (opencode).

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

## Development & Testing

- Run the development bot with hot reload: `npm run dev`
- Build for production: `npm run build` and start with `npm start`
- Typecheck: `npm run typecheck`
- Unit tests: `npm test` (uses Vitest). The repository includes tests under `test/` that cover `goalTracker` logic, storage normalization, embed builders, and basic crossbar/replay handling.

CI: GitHub Actions runs `npm ci`, `npm run typecheck`, and `npm test` for push and pull requests. You can also trigger the workflow manually via the Actions UI.

## Data & Storage Notes

- Persistent data is stored in `leaderboard.json` in the repository root (managed by `src/storage.ts`).
- Keys are stored canonically (lowercased) to avoid duplicate entries when player display names change; a `displayNames` map preserves the preferred display name for UI output.
- Writes to `leaderboard.json` and season archives are atomic (written to a temp file and renamed) to reduce the risk of corruption on crashes.
- The in-memory `recent` list is capped (currently 200 entries) to avoid unbounded growth and large persisted files.

## Important Behaviour Changes

- The `/clear` command now requires the `Manage Messages` permission; this prevents accidental bulk deletion.
- The bot rounds speeds to detect the funny number (69) — see `src/goalTracker.ts` for the exact detection logic.

## CHANGELOG

See [CHANGELOG.md](CHANGELOG.md) for recent notable changes.
