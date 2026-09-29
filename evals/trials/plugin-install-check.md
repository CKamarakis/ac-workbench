# Trial: local plugin install + script paths (task 2.2)

- **Date:** 2026-09-29
- **Claude Code:** 2.1.284 (from the session transcript)
- **Sandbox:** `C:\Users\Chris\Documents\Projects\worklow-test` (fresh `git init`)
- **Install:** this repo added as a local-directory marketplace, then `kit` installed and `/kit:ping` run.

| Check | Result | Evidence |
|---|---|---|
| Skill appears as `/kit:<name>` | PASS | `/kit:ping` ran |
| Script runs from the plugin | PASS | `kit ok: kit 0.1.0`, exit 0 |
| `${CLAUDE_PLUGIN_ROOT}` in SKILL.md | PASS: **replaced in the text** | The loaded skill text already held the absolute path `.../ac-workbench/plugins/kit/scripts/ping.mjs` |
| `CLAUDE_PLUGIN_ROOT` env var in the Bash tool | **NOT SET** | `CLAUDE_PLUGIN_ROOT=[]` |
| Plugin location in dev mode | Runs in place from the repo (no copy made) | `plugin root: C:\Users\Chris\Documents\Projects\ac-workbench\plugins\kit` |

## Consequences for the design

- SKILL.md files call scripts as `node "${CLAUDE_PLUGIN_ROOT}/scripts/<x>.mjs"`. This works because the path is swapped into the text.
- Scripts never read `process.env.CLAUDE_PLUGIN_ROOT`. They find the plugin folder from `import.meta.url`, as `ping.mjs` does.
- In dev mode, edits apply immediately, which confirms proposal rule 4.
- **Unverified:** a GitHub install (stable mode) will likely run from a copy in the plugin cache. If so, `data/toolkit.json` must be committed, as design D2 already says. Check this once a GitHub remote exists.
