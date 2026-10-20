---
title: "Session 2026-10-19: tool review to kit 0.18.0"
date: 2026-10-19
tags:
  - session
  - kit-workflow
source: text
---

**Tools:** OpenSpec 1.14.3 (+ skills refreshed), gh 2.102.0, git 2.55.0, Impeccable 4.6.0 (telemetry off, machine-wide), playwright-cli 0.1.22, emil-skills 2d22863; context7 held. Lessons: `knowledge/notes/2026-10-19-tool-review-lessons-2026-10-19.md`.

**Changes:**
- loose-end-fixes (0.17.1): roadmap writes keep your text (L9, L10); status/next ask instead of "mark Shipped" (L1).
- kit-debt-fixes (0.17.2): 9 loose ends (notes matching, faster merge check, lane-owner names, drop/edit roadmap tasks, read-only spec reviewer, tool-review drop order, Order-text advice, context-doc size check) plus 11 review findings.
- first-run-guidance (0.18.0): first steps on a new project; project context offered at setup (draft or 5 questions); blank context doc skipped by status; plain git note; setup offered when tools are missing; plus 14 review findings.

**Verify:** every change passed tests, smoke and evals, with code and spec reviews and all findings fixed. Correction: first-run-guidance's security review is recorded as "ran" but was a substitute (manual review of the code diff on 2026-10-19, after merge; no findings), because `/security-review` only sees unmerged branch diffs.

**Testing:** Test A (acme-fresh, 0.17.1, clean profile via CLAUDE_CONFIG_DIR) found L24-L27, all fixed. Copies: acme-fresh (old), acme-upgrade (exact clone, kit 0.11.0), acme-trial-inputs (PRD draft and image-viewer plan from the Oct 12 trial).

**Dropped/closed:** spec-length-split (not needed: long requirements don't fail strict for changes); L2 and L30 closed after checks.

**Next:** test A on 0.18.0 → test B → M12 T2 → M13. The docs page is stale (12 notes to draft with /kit:docs).
