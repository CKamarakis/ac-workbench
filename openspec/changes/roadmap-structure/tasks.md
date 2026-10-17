# Tasks

## 1. Templates and the read side

- [ ] 1.1 Bump the kit to `0.12.0` in `plugins/kit/.claude-plugin/plugin.json`. Verify with `node plugins/kit/scripts/ping.mjs`
- [ ] 1.2 Templates in `plugins/kit/templates/roadmap/` (design D6): `roadmap.md` with the five headings (North star, Principles, Order, Now, Waiting on you), `milestone.md`, `drift-log.md`. Verify the install check in `npm test` lists them
- [ ] 1.3 `roadmap.mjs` parse (design D2): `parseRoadmap(dir)` reads `roadmap.md`, `milestones/`, `done/`, `drift-log.md` into one object (order, Now lines, waiting items, milestones with frontmatter, tasks, links). Verify with unit tests in `tests/kit/roadmap.test.mjs` on fixture folders (valid; missing status; bad task line; order vs files mismatch)

## 2. Check and report

- [ ] 2.1 `checkRoadmap` (spec roadmap "Roadmap check warns and never blocks"): broken findings (missing `id`/`title`/`status`, unknown status, duplicate ID, order vs files, task shape, active without tasks) and tidy-up (over 150 lines, line over 300 characters, Now over 5 lines, done/dropped still in `milestones/`), each with file, line and fix; "in good condition" when none; exit code 0 always. Verify each scenario of the requirement as a unit test
- [ ] 2.2 Stale Now and unplanned work (spec "Stale Now and unplanned work"; design D3, D4): git dates of `roadmap.md` vs the branch; active changes and unmerged local branches no milestone links to; skip with a note when git can't answer. Verify with tests on a temp git repo (Now behind the code; change with no milestone; merged branch ignored)
- [ ] 2.3 `reportRoadmap` (spec "Roadmap report", "Waiting on you by relevance"): milestones in order with status, tasks left or "n of m done", Now, Blocking now (first active milestone and the next one, plus `general`) and a Later count with the full list; broken findings on top; nothing sorted or flagged by age. Verify each scenario as a unit test, including reorder moving a decision and a 40-day-old decision not flagged

## 3. Writes

- [ ] 3.1 `roadmap.mjs` write commands (design D1): `new` (from the templates; refuses if `roadmap.md` exists), `add` (next free ID, `planned`, goal, position in the order), `status` (`done`/`dropped` move the file to `done/`, ID stays in the order), `tick`, `order`, `now`, `wait` (add or resolve), `link` (notes, prd, changes, branches), `drift` (append only). Each write runs `check` and prints broken findings. Verify with unit tests per command, including "IDs never reused" after a drop and "drift entries never rewritten"
- [ ] 3.2 CLI and `--json` for every command, `error:` on bad input, like `knowledge.mjs`. Verify with CLI tests (`node roadmap.mjs check --dir <fixture>` output and exit code 0)

## 4. Skill, registry and starter

- [ ] 4.1 Skill `plugins/kit/skills/roadmap/SKILL.md` (spec "Roadmap skill writes only on a yes", "Links both ways"): create on a yes; add with or without notes; start/pause/finish/drop; tick; drift entry; link a PRD or change (offers the `Milestone: <id>` line back); update Now; report; never reorders or changes scope without a yes; runs check after every write and offers fixes. Verify the install check passes for the new skill
- [ ] 4.2 Eval cases `evals/roadmap/cases.yaml` (spec skill-evals "Every kit skill has eval cases"): create on a yes only; agent proposes a reorder but doesn't apply it; finish moves to `done/`; report shows Blocking now. Verify `npm run evals` runs them
- [ ] 4.3 `toolkit.yaml`: kit phase `roadmap` with skill `/kit:roadmap` (spec skill-routing "Roadmap phase in the lane map"); `npm run registry`. Verify `npm run registry:check` and a lane-map test showing `roadmap` owned by the kit
- [ ] 4.4 Starter (spec project-starter "Setup asks one question"; design D5): `start-plan.mjs --roadmap yes|no|ask`; yes adds the template files as one file change; no adds `/kit:roadmap` once under Later; not asked when `roadmap.md` exists; start skill asks the one yes/no after the type. Verify with tests in `tests/kit/start-plan.test.mjs` for the four scenarios, and `npm run evals` for `start`

## 5. Proof and this repo

- [ ] 5.1 Smoke steps: `roadmap.mjs new`, `add`, `status --to active`, `tick`, `check` ("in good condition"), `report`. Verify `npm run smoke` passes with the new steps
- [ ] 5.2 Move this repo's roadmap (design D7): record counts from `docs/roadmap.md` (milestones, drift entries, pending items); write `knowledge/roadmaps/` through `roadmap.mjs`; compare counts; `check` with no broken findings; `docs/roadmap.md` becomes a pointer; update `CLAUDE.md`, `openspec/config.yaml` context and `docs/project-context.md`. Verify counts match and `node plugins/kit/scripts/roadmap.mjs check --dir .` reports no broken findings; show the user the report
- [ ] 5.3 Full run: `npm test`, `npm run registry:check`, `npm run evals`, `npm run smoke`, `npm run smoke:check`; record results in `evals/trials/roadmap-structure.md`. Ask the user to update the memory note that says "read docs/roadmap.md first"
