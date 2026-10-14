# kit-harness-review: trials

## 5.1-5.3 Reviews (2026-10-14, kit 0.10.0 working copy)

The session ran the cached kit 0.5.3, which has no `/kit:harness-review`, so the review was done by following the new `SKILL.md` and `checklist.md` step by step, with `harness.mjs scan`. Tokens and time: not measured separately (part of the build session).

### This repo (`ac-workbench`)

| Layer | Rating | Note |
|---|---|---|
| context | OK | Focused 2.4 KB CLAUDE.md; `/doctor prompt-audit` now and then |
| tools | PARTIAL | Sessions loaded the cached kit 0.5.3 (repo 0.10.0); Notion MCP still set up though Notion was dropped on 2026-10-06 |
| memory | OK | 8 typed memories, none a procedure |
| loops | OK | OpenSpec flow, roadmap with drift rules |
| verification | OK | npm test, smoke, evals; `/kit:verify` per change |
| guardrails | PARTIAL | gitleaks pre-commit; the kit's archive gate is inert here (no `.claude/kit.json`); no permission deny rules |
| feedback | OK | Corrections land in memory and CLAUDE.md; issues route to GitHub |
| observability | OK | Drift log, decision records, verify reports, trials |

Fixes: (1) update the kit plugin: **done by the user** (`claude plugin update kit@ac-workbench`, 0.5.3 -> 0.10.0); (2) decide whether this repo is a kit project (archive gate); (3) remove the unused Notion MCP.

### Toughbubble copy (`../temp/Toughbubble`)

| Layer | Rating | Note |
|---|---|---|
| context | PARTIAL | CLAUDE.md is only the 0.5.3 routing block plus a Next.js note; project facts sit in `docs/project-context.md`, not loaded |
| tools | OK | OpenSpec, Impeccable, Playwright CLI |
| memory | GAP | No memories for the copy's path (the real project has its own) |
| loops | OK | OpenSpec, 14 archived changes |
| verification | OK | test, test:integration; kit verify and archive gate |
| guardrails | PARTIAL | Archive gate blocks; no secret scanning, no `.env*` deny rule (Supabase keys) |
| feedback | PARTIAL | Routing still sends kit issues to the dead `/kit:feedback` |
| observability | OK | Decision records, verify reports |

Fixes: (1) `.env*` deny rule and gitleaks pre-commit; (2) `@docs/project-context.md` or a few project lines in CLAUDE.md; (3) files-only re-sync for the 0.10.0 routing.

### Read-only

`git status` showed no change in either repo after the reviews.

### Verdict (user, 2026-10-14)

"Looks good as a start." Exit criterion met. The first finding was acted on at once (kit plugin updated).

## 6.1 Full run (2026-10-14, Windows 11, kit 0.10.0)

- `npm test`: 354 pass, 0 fail.
- `npm run registry:check`: passes (phases now include `assess`; `kit-issues` routes to GitHub issues).
- `npm run evals`: no script case failed; `harness-review` has 4 script cases (pass) and 3 rubric cases (pending, as for the other skills).
- `npm run smoke`: 37 steps pass (new: `harness: scan` on the smoke project reports its routing block as current).
- No leftover test folders in `../temp` or `%TEMP%`.
