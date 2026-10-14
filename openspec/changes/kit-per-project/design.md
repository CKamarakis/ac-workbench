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

**D2. `/kit:start` installs the kit for the project when only a user-level install serves it.** Because the kit entry is `global`-tier project scope, `start-plan` selects it like any other; its `projectEnabled` check fails on a project served only by the user-level install, so the plan installs it with `--scope project`. The summary adds one line: the user-level install can be removed once every kit project has its own. *Alternative:* a separate migration command. Rejected: re-sync already reaches every kit project.

**D3. Setup's warning for the kit names the safe order.** The existing warning ("remove it there and run /kit:start") would remove the kit everywhere before any project has it, and `/kit:start` can't run without the kit. For the kit, the text becomes: install it per project first (`claude plugin install kit@ac-workbench --scope project` in each kit project, or `/kit:start` there while the user-level install still exists), then `claude plugin uninstall kit@ac-workbench --scope user`.

**D4. Marketplace `--scope user` stays.** `claude plugin marketplace add` declares the marketplace in user settings by default. That's machine-wide by design (principle 2) and enables nothing by itself. The README drops `--scope user` from the marketplace line, since it's the default.

**D5. Proving the per-project path.** The smoke test stays without the Claude CLI (it isolates `HOME`). It gains one step: in its throwaway project, `start-plan` lists the kit as an `install` action with `--scope project` (the isolated home has no kit). A separate trial in `../temp` runs the real CLI: `marketplace add` from the local repo, `install --scope project`, check `.claude/settings.json` and `claude plugin list --json` (`projectEnabled: true`), a session in a sibling folder shows no kit skills, then uninstall. Whether this can be isolated with `CLAUDE_CONFIG_DIR` is unverified; if not, the trial runs against the real user config with the user's OK and is undone at the end.

## Risks / Trade-offs

- [Removing the user-level install before each kit project has its own leaves those projects without `/kit:start`] → D3's order; migration task does the three named projects first and checks each with `claude plugin list --json` before the uninstall.
- [Collaborators who clone a kit project see an "isn't installed here" notice] → README says to install the kit per project; that's the documented behavior for project-scope plugins.
- [The real Toughbubble gets a settings change] → show the diff of `.claude/settings.json` first; nothing else in the project changes.
- [A stranger following an old README (user scope)] → setup's warning (D3) points them to the per-project install.

## Migration Plan

1. Ship kit 0.11.0 on `main`; update the plugin on this machine (`claude plugin update kit@ac-workbench`).
2. With the user-level kit still present, run in each of ac-workbench, the Toughbubble copy and the real Toughbubble (diff first): `claude plugin install kit@ac-workbench --scope project`. Check `projectEnabled: true` for each.
3. `claude plugin uninstall kit@ac-workbench --scope user`, with the user's OK. Check that a session in an unrelated folder lists no kit skills.

Rollback: `claude plugin install kit@ac-workbench --scope user` restores the old setup; the project entries can stay.

## Open Questions

- The real Toughbubble's folder path (asked at migration time).
