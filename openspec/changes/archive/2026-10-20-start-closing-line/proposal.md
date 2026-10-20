# Proposal

## Why

In the clean-profile tests (2026-10-19/20) the user found that `/kit:start` ends by naming `/opsx:explore` without saying what `/opsx:` commands are or where they come from. The summary is already long, so the fix must be short: one plain line with a link, and a friendly close.

## What Changes

- The `/kit:start` summary ends with one line: the `/opsx:` commands come from OpenSpec (a short link, not the full URL), and `/kit:next` guides you through explore, propose, apply and archive.
- Then a last bold line: **Have fun!**
- Both on a new project and on one that isn't new.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `project-starter`: the summary's closing lines.

## Impact

- **Skill text:** `plugins/kit/skills/start/SKILL.md` (step 7). **Evals:** `evals/start/cases.yaml`.
- **Kit version:** 0.18.2 -> 0.18.3.
