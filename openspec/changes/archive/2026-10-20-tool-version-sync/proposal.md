# Proposal

## Why

Test B (2026-10-20, `temp/acme-upgrade`, kit 0.11.0 -> 0.18.3) showed that a re-sync only checks that each tool exists. After it, the project still had OpenSpec skills written by 1.13.2 (the machine has 1.14.3, the kit tested 1.14.3) and Impeccable 4.5.0 (the kit tested 4.6.0). A fresh project got Impeccable 4.7.0, newer than anything the kit tested, without saying so. The user wants old projects brought up to the versions the kit was tested with, so every project works at the same level; pinning exact versions is for v2.

## What Changes

- **Re-sync shows version gaps.** For a project tool that records its version in the project, the plan compares it with the version the kit tested (`reviewed_version`). Older: an `UPDATE` line with the tool's update command, from and tested versions. Newer: one line saying so ("newer than the kit tested"); never a downgrade.
- **OpenSpec's project skills.** When the skills were written by an older OpenSpec than the one on this machine, the plan shows `UPDATE openspec-skills` with `openspec update`.
- **An older machine CLI.** When the OpenSpec CLI is older than the version the kit tested, the plan prints a warning with the update command; it runs nothing.
- **Same yes as installs.** Updates run only under "Files and tools"; "Files only" leaves them alone and lists them.
- Registry: Impeccable gets where its version is recorded and its update command (`npx -y impeccable update -y --project`).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `project-starter`: a re-sync brings old project tools up to the tested versions, on the user's yes.

## Impact

- **Code:** `plugins/kit/scripts/start-plan.mjs` (version reads, `update` tool action, warnings), `start-apply.mjs` (runs updates), `tools/validate-registry.mjs` (new optional fields).
- **Registry:** `toolkit.yaml` (Impeccable `project_version`, `update`).
- **Skill text:** `plugins/kit/skills/start/SKILL.md` (UPDATE lines and warnings in the plan, the tools question).
- **Tests:** start-plan, start-apply, validate-registry tests; evals for `start`.
- **Kit version:** 0.18.3 -> 0.19.0.
