# Design

## Context

- Official docs (plugin commands reference and plugin loading reference, read 2026-10-14): `claude plugin install --scope` takes `user` (default), `project` or `local`. `project` writes `enabledPlugins` to `.claude/settings.json` and reaches everyone who clones; `local` writes `.claude/settings.local.json` (this repo, this user). Marketplaces are recorded once per user (`known_marketplaces.json`) and plugin files are cached once per machine (`~/.claude/plugins/cache/`). A plugin whose only `true` is in a project's `.claude/settings.json` isn't fetched onto a machine where it isn't installed; `/plugin` shows "enabled in project settings but isn't installed here". A project-scope plugin loads only after the folder is trusted.
- The registry already models a per-project plugin plus its machine-wide marketplace: `superpowers` (scope `project`, `plugin:`, `check_match` on `"projectEnabled": true`) and `superpowers-marketplace` (scope `machine`). `start-plan.mjs` installs every chosen project plugin with `--scope project --json`; `global`-tier project entries are chosen for every kit project.
- `setup.mjs plan()` already warns when a registry entry with scope `project` is enabled in `~/.claude/settings.json`.
- The kit's hooks already do nothing outside kit projects (`.claude/kit.json`).

## Goals / Non-Goals

**Goals:** the kit is enabled only in projects that installed it; one shell command per new project before `/kit:start`; existing kit projects keep working through the move.

**Non-Goals:** `local` scope (user chose `project`); installing the kit from inside Claude Code for a project that doesn't have it (a skill can't run before its plugin is installed); removing the user-level install automatically; changing which tools `/kit:start` installs.

## Decisions

**D1. Split the kit's registry entry, reuse the Superpowers pattern.** New entry `ac-workbench-marketplace` (scope `machine`, tier `global`, check `claude plugin marketplace list --json` matching `"ac-workbench"`, install `claude plugin marketplace add CKamarakis/ac-workbench`). The `kit` entry becomes scope `project`, tier `global`, `plugin: kit@ac-workbench`, install `claude plugin install kit@ac-workbench --scope project --json`. Its check reads the project's `.claude/settings.json` for `"kit@ac-workbench": true`, not `claude plugin list`: `/kit:start` only runs where the kit is loaded, so whether this project enables it is the whole question. That needs no Claude CLI and gives the same answer in eval sandboxes, which run with a throwaway Claude config (found in task 5.1: evals running `/kit:start` with the real config left 18 install records for deleted sandboxes). Superpowers keeps its CLI check, since a cloned project can enable it on a machine that doesn't have it. The kit's phases and skills stay on the `kit` entry. *Alternative:* a special case in `setup.mjs`/`start-plan.mjs` for the kit. Rejected: the registry already expresses it, and both scripts then need no new branch.

**D2. `/kit:start` installs the kit for the project when only a user-level install serves it.** Because the kit entry is `global`-tier project scope, `start-plan` selects it like any other; its settings check (D1) fails on a project whose `.claude/settings.json` and `.claude/settings.local.json` don't enable the kit, so the plan installs it with `--scope project`. A `--scope local` install counts as present (verify C4). The summary adds one line, worded without assuming where the kit came from (`--plugin-dir`, local scope): if a user-level kit exists, remove it once every kit project has its own (verify C5). If that install fails, it's reported as failed with the command to run, and nothing is written to the settings: unlike other plugins, the kit gets no settings fallback, because its check reads those settings and a written entry would hide the failure (verify C2). Other plugins' fallback now also writes the plugin's marketplace (`extraKnownMarketplaces`, settings reference read 2026-10-14) so a clone can resolve it (verify C9). *Alternative:* a separate migration command. Rejected: re-sync already reaches every kit project.

**D3. Setup's warning for the kit names the safe order.** The existing warning ("remove it there and run /kit:start") would remove the kit everywhere before any project has it, and `/kit:start` can't run without the kit. For the kit, the text becomes: install it per project first (`claude plugin install kit@ac-workbench --scope project` in each kit project, or `/kit:start` there while the user-level install still exists), then `claude plugin uninstall kit@ac-workbench --scope user`.

**D4. Marketplace `--scope user` stays.** `claude plugin marketplace add` declares the marketplace in user settings by default. That's machine-wide by design (principle 2) and enables nothing by itself. The README drops `--scope user` from the marketplace line, since it's the default.

**D5. Proving the per-project path.** The smoke test and the evals never reach the user's Claude config: both set `CLAUDE_CONFIG_DIR` and `CLAUDE_CODE_PLUGIN_CACHE_DIR` to throwaway folders (verify C3; the eval leak is in D1). In the smoke project, `start-plan` lists the kit as an `install` action with `--scope project`, and `start-apply` reports the kit install as failed with its fix (no marketplace in the isolated config), which is the C2 behavior. So the smoke test and the evals never exercise a real install (verify C6, accepted): that path is proven by the real-CLI trial below and the migration of three projects (`evals/trials/kit-per-project.md`). A separate trial in `../temp` runs the real CLI: `marketplace add` from the local repo, `install --scope project`, check `.claude/settings.json` and `claude plugin list --json` (`projectEnabled: true`), a session in a sibling folder shows no kit skills, then uninstall. Whether this can be isolated with `CLAUDE_CONFIG_DIR` is unverified; if not, the trial runs against the real user config with the user's OK and is undone at the end.

## Risks / Trade-offs

- [Removing the user-level install before each kit project has its own leaves those projects without `/kit:start`] → D3's order; migration task does the three named projects first and checks each with `claude plugin list --json` before the uninstall.
- [Collaborators who clone a kit project see an "isn't installed here" notice] → README says to install the kit per project; that's the documented behavior for project-scope plugins.
- [The real Toughbubble gets a settings change] → show the diff of `.claude/settings.json` first; nothing else in the project changes.
- [A stranger following an old README (user scope)] → setup's warning (D3) points them to the per-project install.

## Migration Plan

1. Ship kit 0.11.0 on `main`; update the plugin on this machine (`claude plugin update kit@ac-workbench`).
2. With the user-level kit still present, run in each of ac-workbench, the Toughbubble copy and the real Toughbubble (diff first): `claude plugin install kit@ac-workbench --scope project`. Check `projectEnabled: true` for each. ac-workbench, the kit's own public repo, gets a committed `.claude/settings.json` like any kit project, so people who clone it see Claude Code's "isn't installed here" notice until they install the kit (user, verify F1: it tells contributors the repo is worked on with the kit).
3. `claude plugin uninstall kit@ac-workbench --scope user`, with the user's OK. Check that a session in an unrelated folder lists no kit skills.

Rollback: `claude plugin install kit@ac-workbench --scope user` restores the old setup; the project entries can stay.

## Open Questions

- The real Toughbubble's folder path (asked at migration time).
