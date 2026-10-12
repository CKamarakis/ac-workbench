# Tasks

## 1. Hook trial and version

- [x] 1.1 Hook trial before building on it (design D6). In a throwaway folder with `.claude/kit.json`:
  - make a PreToolUse(Bash) probe that prints `hookSpecificOutput.additionalContext` with no `permissionDecision` for a marked command;
  - check in a live session that the command runs and the agent sees the text.

  Record the result in `evals/trials/build-readiness-hooks.md`. If it doesn't reach the agent, switch D6 to its fallback and update `design.md` before group 4
- [x] 1.2 Bump the kit to `0.6.0` in `plugins/kit/.claude-plugin/plugin.json`. Verify with `node plugins/kit/scripts/ping.mjs`

## 2. Decision record (`decisions.mjs`)

- [x] 2.1 `add`, `decide`, `later`, `list` and the rendered `decisions.md` with its `kit-decisions-data` block (design D1, D2). Verify with `tests/kit/decisions.test.mjs` on a temp change folder:
  - first `add` creates the file;
  - ids run `D1`, `D2`… and are never reused;
  - `decide` records the answer, where it was written and the date;
  - `later` keeps the item counted as open;
  - a hand-edited table is re-rendered from the data block;
  - an unknown `--kind` is rejected with `error:`
- [x] 2.2 `ready-done` and the exported `decisionStatus({ dir, change })` → `{ exists, open, oldest, readyAt }`. Verify with tests: no file → `exists: false, open: 0`; one `later` from 2026-10-12 → `open: 1, oldest: 2026-10-12`; `ready-done` with zero items still sets `readyAt`

## 3. Readiness check (`ready.mjs` + `/kit:ready`)

- [x] 3.1 `ready.mjs scan --json` (design D1):
  - the artifact paths;
  - the linked PRD, through `PRD_LINE`;
  - vague-word hits as `file:line` (the list in design Open Questions);
  - requirements with their scenario counts;
  - `package.json` dependencies, or `null`;
  - incomplete planning → `planningComplete: false` plus the next artifact.

  Verify with `tests/kit/ready.test.mjs` on fixture changes: a `TBD` in a spec is reported with its line; a missing `package.json` gives `null`; a change without tasks reports the next artifact
- [x] 3.2 Write `plugins/kit/skills/ready/SKILL.md` following design D4:
  - scan;
  - the four item kinds;
  - the counted list first;
  - batches of at most 4 questions, with "Later" as an option and "later for all of the rest";
  - answers written into the delta spec or `design.md`, with the full-requirement MODIFIED rule;
  - `openspec validate --strict` after edits;
  - `ready-done`, and the closing line "you can build now; K still open";
  - never blocks, never commits.

  Verify that `npm run evals` loads the skill
- [x] 3.3 `evals/ready/cases.yaml` (design D8): trigger and non-trigger cases, plus judgment cases with a rubric (a planted missing error case, a planted PRD/spec difference, a planted overlapping dependency). Verify with `npm run evals`: all trigger cases route to `/kit:ready`, and the judgment cases pass the rubric
  - Accepted by the user 2026-10-12 on the live trial (7.1): `/kit:ready` asked about real missing cases in a requirement. The planted PRD/spec difference and overlapping dependency were not exercised live

## 4. Docs sync in verify

- [x] 4.1 `verify.mjs docs-scan --json` (design D5): `docsUpdated`, `codeCommitsSince`, `receipt` (items under ruling, visible-change or decision headings, or `null`), and `deps.added`/`deps.removed` against the change's base commit. Verify with tests on a temp git repo:
  - artifacts committed, then 3 code commits → `codeCommitsSince: 3`;
  - `verify.md`/`decisions.md` commits don't count as doc updates;
  - an `apply.md` with a "Rulings" list returns its items;
  - an added devDependency appears in `deps.added`
- [x] 4.2 `verify.mjs docs-sync` stores the summary. `run` renders the docs-sync section, plus an ADVISORY item for open decisions from `decisionStatus`. Verify with tests: the docs-sync section appears with its counts; one open decision adds "1 decision still open since <date>" as advisory, and the result stays `pass`
- [x] 4.3 Update `plugins/kit/skills/verify/SKILL.md` with a docs-sync step after the reviews:
  - scan;
  - sort each item (behavior / decision with depth / how the build ran);
  - flag possibly unwanted items;
  - ask about unplanned dependencies;
  - propose → write on a yes → record through `decisions.mjs` → validate → `docs-sync` summary.

  Add docs-sync cases to `evals/verify/cases.yaml` (a planted process ruling is left out; a planted "corrupt data loads empty" is flagged). Verify with `npm run evals`

## 5. Routing, next step and archive reminder

- [x] 5.1 `toolkit.yaml` (design D7): phase `ready` after `plan`; the kit owns `ready: /kit:ready`; a new `situations` entry. Run `npm run registry`. Verify that the lane map prints `ready  kit: /kit:ready` between `plan` and `build`, and that `tools/` registry tests pass
- [x] 5.2 `lanes.mjs` routing block: the `/kit:ready` line and the Given/When/Then line. Verify with `tests/kit/lanes.test.mjs` (both lines are present in the generated block, and the existing lines are unchanged)
- [x] 5.3 `next.mjs` (design D3): planning complete, no task checked and no `readyAt` → phase `ready` with `then: /opsx:apply`; open decisions add the "N still open since" line to any suggestion for the change. Verify with `tests/kit/next.test.mjs`:
  - suggests `/kit:ready` before the first task;
  - suggests build once `readyAt` is set, or a task is checked;
  - the open-decision line appears, and is absent at zero
- [x] 5.4 `archive-gate.mjs`: on allow with open decisions, output `additionalContext`, or apply the fallback recorded in 1.1. Verify with `tests/kit/hooks.test.mjs`: pass plus 2 open → allowed with the reminder; pass plus 0 open → no output; no verify → still denied

## 6. PRD template

- [x] 6.1 `templates/prd.md`: the Requirements section asks for Given/When/Then stories grouped by flow or screen, with one example. Update `skills/prd/SKILL.md` so drafts use stories, and keep plain statements where there's no starting state. Verify with `tests/kit/templates.test.mjs` (the template contains the stories guidance) and a `evals/prd` case (a draft from a note produces at least one Given/When/Then story)
  - Live 2026-10-12 on the Toughbubble copy (kit 0.6.1, sidebar note): stories grouped by flow, rules without a starting state kept plain, 4 open questions left open
- [x] 6.2 Open questions now or later (added by the user 2026-10-12, from the 6.1 trial; kit 0.6.2): `/kit:prd` keeps open questions out of its end report and asks "now or later?" (now: options with a recommendation and Later; later: nothing written). `knowledge.mjs` counts a PRD's open questions (shared with `judge.mjs`), and `/kit:next` adds a `later:` reminder for Draft or Review PRDs that have them. Verify with `tests/kit/knowledge.test.mjs`, `tests/kit/next.test.mjs` and the `evals/prd` case `open-questions-now-or-later`

## 7. Integration trial and records

- [x] 7.1 Trial on `Projects/temp/Toughbubble`. Re-sync its routing with `/kit:start`, then:
  - run `/kit:verify` on `storms-canvas` and check that the docs sync finds what the manual dry run found (`docsUpdated` 2026-10-10, 29 code commits; the 4 behaviors; the 4 decisions; `fake-indexeddb` unplanned; 2 flags; 10 rulings left out);
  - run `/kit:ready` on a fresh small change in the copy;
  - record the findings and the token use in `evals/trials/build-readiness-live.md`
  - Done 2026-10-12: docs sync found 9 of 10 dry-run items and asked both flags; `/kit:ready` asked 3 real gaps. The re-sync was cancelled (it bundles a tool install with the routing) and isn't re-run: the routing block is covered by `tests/kit/lanes.test.mjs` and the trial showed the 0.6.0 diff. Evidence for 3.3: the live gaps; the planted PRD/spec difference and overlapping dependency aren't covered live. 6.1 isn't covered (no `/kit:prd` run)
- [x] 7.3 Trial fixes (kit 0.6.1): the docs-sync summary must cover every receipt item (the live run dropped 4 of 20, including a visible change); `/kit:verify` keeps a `verify.md` it didn't write as `verify-earlier.md` instead of overwriting it. Verify with `tests/kit/verify.test.mjs`
- [x] 7.4 Verify code-review fixes (kit 0.6.3), C1–C5: planning complete needs applyRequires and the files check (`/kit:next`, `/kit:ready`); unreadable `decisions.md` or kit `verify.md` stops the write; `-->` escaped in data comments; dependency "planned" matches whole package names. Sub-work: `/kit:next` only passes kebab-case folder names to the `openspec status` shell string (security review note). Verify with `npm test`
- [x] 7.2 Update the README (new `/kit:ready`, docs sync in verify), `docs/project-context.md` (a build-readiness section) and `docs/roadmap.md` (status). Verify that `npm test` and `npm run evals` pass
