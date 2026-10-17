---
id: M9
title: Fixes, Mac, testing
status: done
---

v1 phase A: follow-up fixes, macOS/Linux installs, smoke test, install check.

## Tasks

## Notes

## Before 2026-10-17 (the old roadmap row, kept whole)

- **Change:** v1 phase A: fixes, Mac, testing from here
- **Delivers:** the follow-up fixes (M6 findings; M8 leftovers: clear fixed verify findings, kit-docs minors, `/kit:start` docs line in the script); macOS and Linux install commands and paths; an end-to-end smoke test without AI, run here with one command; an install check (manifests and skill files); `npm run smoke:check` (kit files changed since the last passing smoke run; required before a release). Two changes: `kit-cross-platform` (done), then `kit-followups`, triaged 2026-10-14 to: `/kit:next` order (active change before a Ready PRD); verify clears fixed findings; Later decisions stay visible after archive; remove the Context7 hook; registry installs that are sentences; unit-test folders in `../temp` with cleanup; `/kit:start` routing-only re-sync; docs page fixes (same-day archive order, locale sort, collapsed product not opening, badge text, the `living-docs` note); `/kit:start` docs line from the script; "tested with" tool versions (a new-kit-version notice only if Claude Code doesn't already tell users about plugin updates). GitHub CI moved to later (2026-10-13)
- **Exit criteria:** The smoke test runs the whole kit in a throwaway project on Windows; macOS is checked by the Mac tester before v1
- **Status:** **done** 2026-10-14: `kit-cross-platform` **done** 2026-10-13, archived (kit 0.8.0; evidence [`kit-cross-platform.md`](../evals/trials/kit-cross-platform.md)); `kit-followups` **done** 2026-10-14, archived (kit 0.9.0; verify passed: security 0, code 9 advisory with C1-C3 and C9 fixed and resolved; 343 tests, smoke 36 steps; evidence [`kit-followups.md`](../evals/trials/kit-followups.md)). **M9 done**
