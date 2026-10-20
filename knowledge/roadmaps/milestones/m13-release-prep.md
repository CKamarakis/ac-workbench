---
id: M13
title: Release prep
status: planned
changes:
  - public-repo-scrub
  - flexible-handoffs
---

v1 phase D: everything a stranger needs to install and trust the kit.

## Tasks

- [ ] T1 MIT license
- [ ] T2 README for strangers (who, quickstart, screenshot, status, limits, coming next, happy path)
- [ ] T3 GitHub issue templates
- [ ] T4 Honest plugin descriptions
- [ ] T5 CHANGELOG and tags
- [ ] T6 Test sheet (docs/test-sheet.md) run once on a real project's copy
- [x] T7 Privacy read of the public repo

## Notes

- 2026-10-20, T6 changed (the user): the 36 written judgment cases were never run (the eval runner can't run prompts). The user chose hand-run checks on real projects: `docs/test-sheet.md` (flexible-handoffs). The 36 cases are parked in `evals/*/cases.yaml`, unscored. Batch decisions from the walk-through, kept for when a step keeps failing: keep 28; fix 6 (capture import (add the .txt), docs never-commits (git repo + a spec), prd shortlist (add notes, drop the later-update criterion), tool-review failing smoke (own toolkit.yaml, failing smoke, answer no: nothing installed), verify severity mapping (a diff with an injection and a naming nit), verify single-feature card (a change with the decision, plus knowledge/docs/)); split 1 (prd now-or-later into two); drop 1 (capture PRD offer, removed from the kit).

## Before 2026-10-17 (the old roadmap row)

- **Delivers:** MIT license; README for strangers (who it's for, quickstart, screenshot, status table, limits, coming next); GitHub issue templates; honest plugin descriptions; CHANGELOG and tags; judgment evals scored once; a privacy read of the public repo
- **Exit criteria:** Tag `v1.0.0-rc.1`
