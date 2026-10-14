# Proposal

## Why

The kit is installed at user level today (`README.md`, `docs/setup.md`: `--scope user`), so its skills are listed in every Claude Code project on the machine, including repos the user doesn't own. The user decided (2026-10-14, roadmap principle 2 and drift log) that the kit is installed **per project only**, like the tools it sets up. New projects are rare, and installing the kit in each one is also a chance to re-check the whole first-run experience.

## What Changes

- **BREAKING (install):** the kit is installed with `claude plugin install kit@ac-workbench --scope project`, run in the project folder, then `/kit:start`. No user-level install. Only CLIs and plugin marketplaces stay machine-wide (the `ac-workbench` marketplace is added once per machine).
- The registry splits the kit's entry: the `ac-workbench` marketplace (machine scope, installed by `/kit:setup`) and the kit plugin (project scope, `global` tier, so every kit project gets it, checked by `projectEnabled`), like Superpowers and its marketplace.
- `/kit:start` makes sure the kit itself is enabled in the project's `.claude/settings.json`. A project that only gets the kit from a user-level install is moved to a project install on its next `/kit:start`.
- `/kit:setup` warns when the kit is installed at user level, with the safe order: install it per project in each kit project first, then remove the user-level install.
- Docs: README install, `docs/setup.md`, the repo's `CLAUDE.md` rule ("kit global"), the setup and start skills' wording.
- Migration on this machine, with the user: ac-workbench, the real Toughbubble (diff shown first) and the Toughbubble copy get a project install; then the user-level install is removed.

```
Before                                       After
------                                       -----
once per machine:                            once per machine:
  marketplace add ac-workbench                 marketplace add ac-workbench
  plugin install kit --scope user              /kit:setup tools (CLIs, marketplaces)
      |                                      per new project (in its folder):
      v                                        plugin install kit --scope project
kit skills in EVERY project  ---------->       /kit:start  (same tools per project as today)
/kit:start per project                             |
                                                   v
                                             kit skills only in projects that installed it
```

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `tool-setup`: machine scope no longer includes the kit plugin; setup warns when the kit is installed at user level, with migration steps.
- `project-starter`: the starter ensures the kit itself is installed at project scope, and moves a project off a user-level kit.

## Impact

- `toolkit.yaml` (kit entry split; `npm run registry` regenerates `plugins/kit/data/toolkit.json`), `plugins/kit/scripts/setup.mjs` (kit warning text), `plugins/kit/scripts/start-plan.mjs` (no change expected: `global`-tier project plugins are already installed with `--scope project`), skills `setup` and `start`, `README.md`, `docs/setup.md`, `CLAUDE.md`, tests, smoke.
- Kit version 0.11.0. Existing kit projects need one project install each before the user-level install is removed; until then nothing breaks.
- Someone who clones a kit project sees "enabled in project settings but isn't installed here" until they install the kit (official docs, plugin loading reference, read 2026-10-14). The kit then loads only after they trust the folder.
- Unverified: whether `claude plugin` commands work with `CLAUDE_CONFIG_DIR` pointed at a throwaway folder (needed for an isolated trial); checked in the trial task.
