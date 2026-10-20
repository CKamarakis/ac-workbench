# Design

## Context

See proposal.md - Why. Facts checked 2026-10-20 on throwaway copies of `temp/acme-upgrade`:
- `npx -y impeccable update -y --project` (help: "Update an existing Impeccable skill installation") took the copy from 4.5.0 to 4.7.0. It changed only `.claude/skills/impeccable/`, `.claude/agents/impeccable-*` and `.claude/settings.local.json` (hooks; personal, gitignored). User-level `~/.claude/settings.json` and `~/.claude.json` unchanged (hashes before and after).
- `openspec update` took the skills from `generatedBy: "1.13.2"` to `"1.14.3"` and removed 3 skill folders and 3 commands outside the machine's OpenSpec profile ("Removed: 3 skill directories (deselected workflows)").
- Impeccable records its version in `.claude/skills/impeccable/SKILL.md` (`version: 4.5.0`); OpenSpec in each `.claude/skills/openspec-*/SKILL.md` (`generatedBy: "1.14.3"`).

## Decisions

### D1 Compare with the tested version; update to the latest

The target is the registry's `reviewed_version` ("tested with"). Neither update command takes a version, so an update lands on the latest release, which can be newer than tested; the plan says so. Pinning is v2.

### D2 Newer is never downgraded

A project ahead of the tested version gets one informational line. Downgrading could break a project the user already moved forward.

### D3 OpenSpec skills follow the machine CLI

`openspec update` writes skills for the CLI on this machine, so the project's skills are compared with that CLI, not with `reviewed_version`. A CLI older than tested is a warning with its install command; the kit doesn't update machine tools during `/kit:start` (that is `/kit:setup`'s job, on a yes).

### D4 Updates ride on the tools question

An `UPDATE` line counts like an `INSTALL` line: on a re-sync it brings up "Files and tools / Files only"; files only leaves the tool as it is and lists it. The plan line for `openspec update` says it also removes skills outside the machine's OpenSpec profile, since that deletes tool-generated files.

### D5 Only tools that say where their version is

A tool is version-checked only when the registry gives `project_version: { file, pattern }`. Today: Impeccable. Playwright CLI's project skill doesn't record a version (unverified beyond its folder); it stays presence-only.
