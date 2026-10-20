# M12 T5: browser-check thresholds from a real project's history (Acme)

Source: a throwaway copy of Acme, the test app: its git history (~200 commits) and 18 archived OpenSpec changes. Read-only. The per-change table stays private (repo-privacy); this file keeps the method and the findings.

## What the kit had
- `verify/SKILL.md` "Browser check (on request)": only when the user asks; spec `quality-gates` "On-demand browser check" the same. A recommendation needed a spec change.
- UI detection was project-level only (`project.mjs` `webUi()`); no per-file UI rule.

## How it was measured
- **UI file** = `src/app/**/*.tsx|css`, `src/components/**/*.ts(x)|css`, any `*.css`; tests excluded. A canvas engine (`.ts`, renderer and pointer input) counted separately.
- Commits matched to changes by name or scope prefix between propose and archive (**inferred, unverified** where commits interleave).
- "Later UI bugs" = later fix commits or failed steps in the project's testing plans (by commit message only, **unverified** beyond that).

## Findings
- 18 changes, from 2 to 38 UI files each. **None had used the kit's browser check**; browser checking happened in tasks or in user testing plans.
- **Bugs after the build clustered in new interaction:** pointer, touch, keyboard, gestures (a canvas board, a full-screen viewer, a palette's Enter key, a long press). Four changes with new interaction had 1 to ~18 follow-up fixes.
- **Wide but shallow styling found nothing** (one change: 15 files, 82 lines, no bugs).
- **File count is a weak signal:** a 1-file change still had 3 fixes, all in engine `.ts`, so a tsx/css-only rule would miss it.

## Proposed (recommend, never require)
1. **A new page or screen-level view.** Strongest signal.
2. **New input handling in UI code** (pointer, touch, key, wheel, paste handlers), including engine `.ts`.
3. ≥ 250 added UI lines and ≥ 10 UI files were considered, but they rest on ~6 data points (**unverified**). Shipped in 0.20.0: rules 1 and 2 only.

## Thin sample
- Only 4 changes had recorded post-build user testing, and 0 used the kit's browser check, so false negatives can't be measured.
- Treat the rules as starting values; recording each recommendation and outcome in `verify.md` would let them be checked later.
