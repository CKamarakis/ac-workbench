# kit-per-project: trials

## 4.2 Real-CLI trial (2026-10-14, Windows 11, Claude Code CLI at `~/.local/bin/claude.exe`, kit 0.11.0 working copy)

Throwaway folder `../temp/kpp-trial` (`proj/`, a sibling `other/`), deleted afterwards.

**Isolation (was unverified):** `CLAUDE_CONFIG_DIR=<trial>/cfg` plus `CLAUDE_CODE_PLUGIN_CACHE_DIR=<trial>/plugins` keeps every `claude plugin` command off the real config: `marketplace list` and `plugin list` start empty, the CLI writes its `.claude.json` into `<trial>/cfg`, and the modified times of the real `~/.claude/plugins/installed_plugins.json`, `known_marketplaces.json`, `~/.claude/settings.json` and `~/.claude.json` were the same before and after the whole trial.

| Step | Result |
|---|---|
| `claude plugin marketplace add <local repo>` | "Successfully added marketplace: ac-workbench (declared in user settings)" (the trial's user settings) |
| `claude plugin install kit@ac-workbench --scope project --json` in `proj/` | `"outcome":"ok"`, `"scope":"project"` |
| `proj/.claude/settings.json` | `{"enabledPlugins": {"kit@ac-workbench": true}}` |
| `claude plugin list --json` in `proj/` | `kit@ac-workbench 0.11.0 project enabled: true, projectEnabled: true`; the registry's `check_match` matches |
| same in the sibling `other/` | `enabled: false, projectEnabled: false` |
| `start-plan.mjs --dir proj` (real CLI) | `ok kit  global tier: every kit project` (no reinstall) |
| `claude plugin uninstall kit@ac-workbench --scope project`, `marketplace remove` | both succeed; `proj/.claude/settings.json` back to `{"enabledPlugins": {}}` |

Not checked: a live session's skill list in the sibling folder (would need sign-in inside the isolated config). The `enabled: false` there is the CLI's own answer to "does this folder load the kit".

Also seen on this machine (real config, read only): the user-level kit reports `"scope": "user"`, `"projectEnabled": false`, `"readFromFolder"` the repo, so `/kit:start` in a kit project plans `INSTALL kit ... --scope project` there (task 5.1).

## 4.3 Full run (2026-10-14, Windows 11, kit 0.11.0, before the commit)

- `npm test`: 359 pass, 0 fail (new: kit warning order, real-registry setup plan, kit per project in `start-plan`).
- `npm run registry:check`: passes (new entry `ac-workbench-marketplace`; `kit` is scope `project`, tier `global`).
- `npm run evals`: no script case failed (setup 5, start 14).
- `npm run smoke`: 38 steps pass (new: `start: kit per project` - the plan installs the kit with `--scope project`).
- `npm run smoke:check`: asks for a run because the files aren't committed yet; the smoke run above covers them.
- No leftover test folders in `../temp` or `%TEMP%`.
