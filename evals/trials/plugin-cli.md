# Trial: non-interactive plugin CLI (task 5.1)

- **Date:** 2026-10-01
- **Claude Code:** 2.1.286 (`%USERPROFILE%\.local\bin\claude.exe`)
- **Test folder:** a throwaway temp git repo, deleted afterwards

| Check | Result | Evidence |
|---|---|---|
| `claude plugin install <p> --scope project --json` runs with no prompts | PASS | `{"outcome":"ok","scope":"project",…}`, exit 0 |
| It enables the plugin in the **project** only | PASS | `<project>/.claude/settings.json` → `enabledPlugins: { "superpowers@superpowers-marketplace": true }` |
| User settings untouched | PASS | `~/.claude/settings.json` sha256 `4310051e2be9…` before and after |
| Installed record | project-scoped | `installed_plugins.json` gains `{ scope: "project", projectPath: <project> }`; the shared cache (`plugins/cache/…/6.4.2`) is reused |
| `claude plugin uninstall <p> --scope project --json` | PASS | removes the project record, keeps the cache |
| **Default scope** | **`user`** | `--scope` defaults to user. This explains the earlier global Superpowers install, so the kit must always pass `--scope project` |
| `claude plugin marketplace add` | has `--scope user\|project\|local` (default user) | `--help` |
| Fetch when a plugin is only enabled in settings | not tested | not needed: `install --scope project` fetches and enables in one step |

## Gotcha: git must be the Windows Git with a working `submodule`

- **From the agent's Git Bash environment**, the install failed: `fatal: 'submodule' appears to be a git command, but we were not able to execute it`. Claude Code clones plugins with submodules.
- **From PowerShell without git on PATH**, it failed with `Command 'git' not found`.
- **With `C:\Program Files\Git\cmd` first on PATH**, it worked.
- **Consequence:** `setup.mjs` and `start-apply.mjs` must call `claude plugin …` with `C:\Program Files\Git\cmd` (found by `locate.mjs`) prepended to PATH.

## Side findings

- `claude plugin eval` exists. It runs eval cases (`evals/**/case.yaml`, or `prompt.md` + graders) against a plugin, with a no-plugin baseline arm. This is the candidate engine for Claude-in-the-loop cases (design D8, open question).
- `claude plugin details <name>` shows a plugin's component inventory and projected token cost. That's useful input for the rubric's `context_cost`.
- Superpowers still has a **user-scope install record** from the first install. It is **not enabled** at user scope (removed 2026-09-29), so it doesn't load. Uninstalling that record is optional, since project installs share the cache.
