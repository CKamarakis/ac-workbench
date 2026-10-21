---
id: M13
title: Release prep
status: done
changes:
  - public-repo-scrub
  - flexible-handoffs
  - release-basics
  - release-docs
  - rc-fixes
---

v1 phase D: everything a stranger needs to install and trust the kit.

## Tasks

- [x] T1 MIT license
- [x] T2 README for strangers (who, quickstart, screenshot, status, limits, coming next, happy path)
- [x] T3 GitHub issue templates
- [x] T4 Honest plugin descriptions
- [x] T5 CHANGELOG and tags
- [x] T6 Test sheet (docs/test-sheet.md) run once on a real project's copy
- [x] T7 Privacy read of the public repo

## Notes

- 2026-10-20, T6 changed (the user): the 36 written judgment cases were never run (the eval runner can't run prompts). The user chose hand-run checks on real projects: `docs/test-sheet.md` (flexible-handoffs). The 36 cases are parked in `evals/*/cases.yaml`, unscored. Batch decisions from the walk-through, kept for when a step keeps failing: keep 28; fix 6 (capture import (add the .txt), docs never-commits (git repo + a spec), prd shortlist (add notes, drop the later-update criterion), tool-review failing smoke (own toolkit.yaml, failing smoke, answer no: nothing installed), verify severity mapping (a diff with an injection and a naming nit), verify single-feature card (a change with the decision, plus knowledge/docs/)); split 1 (prd now-or-later into two); drop 1 (capture PRD offer, removed from the kit).

## Before 2026-10-17 (the old roadmap row)

- **Delivers:** MIT license; README for strangers (who it's for, quickstart, screenshot, status table, limits, coming next); GitHub issue templates; honest plugin descriptions; CHANGELOG and tags; judgment evals scored once; a privacy read of the public repo
- **Exit criteria:** Tag `v1.0.0-rc.1`

- 2026-10-21, T5: CHANGELOG.md written (0.1.0 to 0.21.1). The v1.0.0-rc.1 tag waits for T6 (the user's run on the real project) and one change with its fixes: the type question on re-sync, one yes for a big /kit:docs first run with parallel drafting, backticks shown literally on the docs page.
- 2026-10-21, also for that fix change: the pre-commit hook doesn't read text metadata inside images (PNG text chunks, JPEG EXIF/XMP), where a path or name could hide; and strip the editor metadata from docs/images/kit-status.png (editor name and time zone only, nothing private).
- 2026-10-21, T6 closed (the user: "wrap this up"): the run on the real project went from setup through verify. Its findings were fixed in rc-fixes; /kit:verify's 10+ minutes is M14 T4. Time and /cost not recorded. Tag v1.0.0-rc.1 (the M13 exit) set with rc-fixes.
