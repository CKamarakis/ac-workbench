# Proposal

## Why

Roadmap M12 T5: browser-check thresholds from Acme's changes. The evidence (`evals/trials/m12-t5-browser-check-thresholds.md`, 18 archived changes) shows every bug found after a build came with new interaction (pointer, touch, keyboard, gestures) or a new screen; broad styling changes found none, and file counts predicted nothing. The kit's on-request browser check was never used. The user chose (2026-10-20) to recommend a browser check on those signals: one advisory line, never a run and never a requirement; no line-count threshold (it would be a guess from ~6 changes).

## What Changes

- In a web-ui project, `/kit:verify` adds one ADVISORY item when the change's diff (base to working tree) adds a new page or route file, or new input handling in source code (pointer, touch, key, wheel, gesture, paste, mouse, drag or drop handlers). The item names what it found and says a browser check is worth it; asking for one stays the user's call.
- No item when the project isn't web-ui, when there's no signal, or when a browser check is already recorded for the change.
- The quality-gates requirement "On-demand browser check" changes from "no reminder" to "this one recommendation, on these signals".

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `quality-gates`: a browser check is recommended (not run) when the change adds a screen or input handling in a web-ui project.

## Impact

- **Code:** `plugins/kit/scripts/verify.mjs` (signals from the diff, the advisory item).
- **Skill text:** `plugins/kit/skills/verify/SKILL.md`.
- **Tests:** verify tests; evals for `verify`.
- **Kit version:** 0.19.0 -> 0.20.0.
