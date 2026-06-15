# Changelog

## Unreleased

- Normalize storage keys to canonical lowercase keys and add a `displayNames` map to preserve player display names.
- Use atomic writes for `leaderboard.json` and archived season files to reduce corruption risk.
- Cap `recent` funny goals list to 200 entries to avoid unbounded persisted growth.
- Require `Manage Messages` permission for the `/clear` command.
- Add unit tests (Vitest) and CI workflow to run typecheck and tests.
- Update CI to trigger on `main` and `master`, and support manual runs.

