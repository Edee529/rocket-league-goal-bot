# rocket-league-goal-bot

Discord bot that connects to Rocket League's local TCP Stats API and posts embeds for goals at exactly 69 kp/h, plus crossbar tracking, streaks, milestones, and session stats.

## Commands

| Action | Command |
|---|---|
| Dev (hot reload) | `npm run dev` |
| Build | `npm run build` |
| Start (prod) | `npm start` |
| Typecheck only | `npm run typecheck` |

No tests, no linter, no formatter, no CI. Only verification step is `typecheck`.

## Architecture

- **Entrypoint:** `src/index.ts` — wires RL listener to Discord client
- **Build output:** `tsup` bundles `src/index.ts` → `dist/index.js` (ESM)
- **Runtime:** Node.js 18+ (discord.js v14)
- **External dep:** `rocket-league-stats-api` — TCP client for `MatchStatsExporter_TA` on `localhost:49123`

## Quirks & conventions

- **Duo-mode required:** goals/crossbars only count when **both** tracked players are in the match. Single-player goals get a "NOT COUNTED" embed.
- **Replay-safe:** goals and crossbars are ignored during goal replays (`GoalReplayStart` / `GoalReplayEnd` events).
- **Near-miss every time:** every goal within 1 kp/h of 69 posts an embed; `/nearmiss` still shows the single closest.
- **Crossbar cooldown:** same player's crossbar hits are deduped within 2 seconds.
- **ESM with `__dirname`:** uses `fileURLToPath(import.meta.url)` in `storage.ts` for file paths.
- **`leaderboard.json`** is both committed and `.gitignore`d — already tracked, won't appear in `git status` diffs.
- **`/clear` command** bulk-deletes max 100 messages, limited to last 14 days (Discord API limit).
- **Milestones** are announced once per player per milestone (persisted in `leaderboard.json`).
- **Leader channel trophy:** if `LEADER_CHANNEL_ID` is set, the bot renames the channel to the top scorer.
- **Crossbar channel trophy:** if `CROSSBAR_CHANNEL_ID` is set, the bot renames the channel to the crossbar leader with 🏒.
- **Interactive buttons:** goal embeds include 6 buttons (Leaderboard, Streaks, Compare, Rivalry, Session, Crossbar).
- **`.env` contains real secrets** — the bot token is live; do not commit changes to it.
