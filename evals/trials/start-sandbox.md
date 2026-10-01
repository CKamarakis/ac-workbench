# Trial: /kit:start in a throwaway sandbox (task 7.6), 2026-10-01

- **Sandbox:** `Projects/kit-start-sandbox` (fresh `git init`)
- **Run:** the starter scripts that `/kit:start` calls, as web-ui with opt-ins `superpowers` and `notion-mcp`

## Trial tool installs, each run by hand first

| Tool | Command (as now in `toolkit.yaml`) | Result | Where it writes |
|---|---|---|---|
| Impeccable | `npx -y impeccable install --providers=claude --scope=project` | PASS | `.claude/skills/impeccable` (+ engine v0.1.5 binary), `.claude/agents/` (4 agents), hooks in `.claude/settings.local.json` (gitignored). Hooks are bash syntax; that they run on Windows is **unverified** |
| Emil skills | `npx -y skills@latest add emilkowalski/skills -a claude-code -s * -y --copy` | PASS | 13 skills in `.claude/skills/`. Project-level by default; `-g` would be user-level |
| Playwright CLI | `npm install -g @playwright/cli@latest && playwright-cli install --skills` | PASS (0.1.22) | CLI in the npm global folder; skill `.claude/skills/playwright-cli`; `.playwright-cli/` added to `.gitignore`; helper `winldd` in `AppData/Local/ms-playwright`; uses the installed Chrome |
| Notion MCP | `claude mcp add --transport http notion https://mcp.notion.com/mcp --scope local` | PASS, then **pending OAuth** | `~/.claude.json` under this project's path only. `claude mcp get notion` exits 0 while "Needs authentication", hence `check_match` |
| Superpowers | `claude plugin install superpowers@superpowers-marketplace --scope project --json` (by the starter) | PASS | `.claude/settings.json` → `enabledPlugins`; check `projectEnabled: true` matched |
| Context7 | `npx -y ctx7@latest setup --claude --cli --project` | not run (OAuth) | **Its default is global**; `--project` is required (from `ctx7 setup --help`). The check path `.claude/skills/context7` is **unverified** |

## Starter run

- **Plan:**
  - CHANGE `.gitignore`: Playwright had created one; the diff only appends the kit block
  - CREATE `CLAUDE.md`, `docs/project-context.md`, `.claude/kit.json`
  - RUN `openspec init`
  - Tools: superpowers and notion to install; the three hand-installed tools `ok`; context7 `YOU`
- **Apply (`--accept all`):**
  - files written, `openspec init` ran, config points at the context doc
  - superpowers installed (project), notion added, then pending sign-in
  - context7 pending
  - project listed in `~/.claude/kit/projects.json`
- **User settings:** `~/.claude/settings.json` hash `4310051E2BE9` before and after.
- **Re-run plan:** `Nothing to change.` Found and fixed along the way: an installed-but-awaiting-sign-in tool was re-planned as an install (now `pending`).
- **Ignores:** `.claude/settings.local.json` and `PM-OS-v2.1/` are ignored.

## Still open

- A live `/kit:start` run (Claude following the skill, with your confirmations), in a fresh folder.
- Context7's interactive setup and its real check path.
- Notion OAuth, and the wording of the connected status.

## Re-run on a Toughbubble copy (task 7.7), 2026-10-01

- **Copy:** `git clone` of `Projects/Toughbubble` (commit `8b0630c`) into a temp folder; origin removed; deleted afterwards. A clone holds tracked files only, so no `.env`.
- **Plan (web-ui):**
  - CHANGE `.gitignore` and `CLAUDE.md`, both **append-only** diffs. Toughbubble's own lines (`design-refs/`, `@AGENTS.md`) are kept.
  - **CONFLICT** `openspec/config.yaml`: it already has its own `context:`, so the kit doesn't touch it and tells you to add the pointer yourself.
  - CREATE `docs/project-context.md` and `.claude/kit.json`.
  - Tools for web-ui: Impeccable and Emil to install, Playwright present, Context7 YOU; Superpowers, Notion and SuperSpec only offered.
- **Apply without any confirmation** (type none, temp home): only the two new files were created. `.gitignore` and `CLAUDE.md` were skipped as not confirmed, the config skipped as a conflict.
- **`git status`: 0 modified tracked files** (only 2 new untracked).
- **The real Toughbubble was never written:** status clean, no kit files.
- **Note for the real run:** the project name comes from the folder (`Toughbubble`), and its config needs a hand-added pointer to `docs/project-context.md`.
