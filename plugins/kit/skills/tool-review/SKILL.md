---
name: tool-review
description: Monthly review of the kit's tools (toolkit.yaml) - for each adopted or trial tool, does its source still exist, the latest version vs the reviewed one, the release notes for a major version, what's new that the kit could use - then update, hold or drop each one on the user's yes, with the smoke test before any reviewed_version changes. Use when the session-start reminder says a tool review is due, or when the user asks to check the tools, keep them up to date, or whether anything new is worth using.
---

# Kit tool review

Keeps the kit's tools known to be current and working. **Nothing updates on release, and nothing changes without the user's yes per tool.** It runs in the kit repo (where `toolkit.yaml` is); other projects get tool changes through `/kit:start` re-sync.

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/tool-review.mjs" scan --dir . --json
node "${CLAUDE_PLUGIN_ROOT}/scripts/tool-review.mjs" record --dir . --name <tool> --action update|hold|drop [--version <v>] [--reason "..."]
```
If either prints `error:`, show it and stop.

## Steps

1. **Scan** (network: npm, GitHub, winget, the local marketplace catalogs). For a plugin whose catalog may be stale, run `claude plugin marketplace update <market>` first. Each tool comes back as `up-to-date`, `behind`, `major`, `ahead`, `changed` (no semver, e.g. a commit or a differently named tag), `unknown` (with the reason) or `source-not-found`.
2. **Read before you judge**, only for the tools that changed:
   - **major** (or a `changed` tag that looks like a new major): read the release notes from the source (GitHub releases or the changelog) before recommending anything. List breaking changes, removed or renamed commands and skills, and hook changes.
   - **behind / changed**: skim what's new.
   - For each, name **what the kit could use**: a new skill, command or option that fits one of the kit's lanes (`npm run registry` prints the lane map). Say "nothing for the kit" when that's the answer.
   - Never call an `unknown` tool up to date; say why it's unknown.
3. **Show one table**: tool, reviewed -> latest, state, what changed for the kit (one line), recommendation (**update**, **hold** or **drop**) with the reason. Tools that are up to date go in one line at the end.
4. **Ask per tool** with **AskUserQuestion** (up to 4 per call, back to back): the recommendation first with " (Recommended)", then the others.
5. **Do what was chosen:**
   - **update:** update the tool the way its registry entry installs it (project scope for project tools; never user scope), run `npm run smoke`, and only when it passes: `record --action update --version <v>`. If the smoke test fails, keep `reviewed_version`, tell the user the failure, and offer to roll the tool back.
   - **hold:** `record --action hold` (only `reviewed_on` changes, so the reminder counts from today).
   - **drop:** `record --action drop --reason "..."`, then ask separately whether to uninstall it; uninstall only on that yes.
   - After any `record`: `npm run registry` (it must pass), and tell the user what changed in `toolkit.yaml`.
6. **Loose ends:** something worth borrowing that is bigger than an update (a new skill to trial, a tool to replace) goes to `/kit:loose-ends` as an idea, offered once.

## Rules

- No update, install, uninstall or registry change without the user's yes for that tool.
- A major version: release notes first, always.
- `reviewed_version` means "tested with": set it only after the smoke test passed.
- Don't commit.
