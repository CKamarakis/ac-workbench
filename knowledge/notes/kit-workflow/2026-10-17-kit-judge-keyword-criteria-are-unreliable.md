---
title: "Kit judge: keyword criteria are unreliable"
date: 2026-10-17
tags:
  - kit-workflow
  - kit-judge
  - tech-debt
source: voice
---

**Problem (2026-10-17):** `/kit:judge` recommended SuperSpec for the roadmap-structure PRD on false positives: "session" (meant *session start*), "tokens" (meant AI usage tokens) and "unknown" (from the PRD template's own help text). It's a keyword checklist (M3); it matches words, not meaning, so its recommendation can't be depended on.

**User's view:** the true metric is who does the better job at a decent price. SuperSpec should fit complex work and OpenSpec normal work, but the judge's criteria aren't smart or sustainable. Asking is fine; the recommendation must be dependable.

**Agent's view:**
- "SuperSpec does a better job" is unverified here: the earlier A/B chose OpenSpec as default; the quality-per-cost verdict is M12 T4.
- Better criteria: size and reach (specs and files touched, new capabilities), reversibility, number of open questions, read from the PRD's structure, not keywords. Or the AI applies a short rubric and shows its reasons.
- Also: ignore template help text (e.g. the PRD template's "Unknown" comment).

**When:** with M12 T4 (SuperSpec verdict), checked against the Toughbubble evidence. Backlog / tech debt until then.
