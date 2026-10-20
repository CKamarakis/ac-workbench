# Tasks

## 1. Facts script

- [x] 1.1 Bump the kit to `0.13.0` in `plugins/kit/.claude-plugin/plugin.json`. Verify with `node plugins/kit/scripts/ping.mjs`
- [x] 1.2 `status.mjs` gather (design D1, D2, D3, D8): overview (first of `PRODUCT.md`, `docs/project-context.md`, `README.md`; built specs; archived changes newest first), `missing` (roadmap, backlog, openspec, git). Verify with unit tests in `tests/kit/status.test.mjs` on fixture folders (spec "Overview block": built from specs, not from a `Shipped` PRD; no description file)
- [x] 1.3 Sections (spec "Facts from their owners", "Status report sections", "Several items under way", "Status without a roadmap"; design D5, D7): Now from active changes plus the current milestone; Next from roadmap order, or Ready PRDs then uncited notes; We said from Waiting on you, PRD questions, open and archived-open decisions; Tech debt "no backlog yet"; After; each row with `source`; 5-row cap with `more`; `age` for hints. Verify each scenario as a unit test (with roadmap; no roadmap; two active changes; 8 waiting items → 5 + "+3 more")
- [x] 1.4 Mismatches (spec "Mismatches shown, never resolved"; design D4): rules (a) active milestone with nothing under way, (b) `Building` PRD with archived change, (c) roadmap stale Now and unplanned work passed through; empty list when all agree. Verify one unit test per rule plus "everything agrees", with a temp git repo for (a) and (c)
- [x] 1.5 Handoff and CLI (spec "Handoff to next", "Status is read-only"): `handoff` (under way items, or Next candidates with age); `--dir`, `--json`, plain output; OpenSpec or git missing → `missing` entry, rest still filled. Verify with CLI tests: exit 0, `git status --porcelain` unchanged after a run, and a run with OpenSpec not found

## 2. Status skill

- [x] 2.1 Skill `plugins/kit/skills/status/SKILL.md`: run `status.mjs --json`, read only the reported description file, write the overview and table in plain words (titles not IDs; IDs only in Source), show "Doesn't match" only when present, end with the item plus "run `/kit:next`"; use only reported facts; write nothing; offer `/kit:roadmap` when there's no roadmap. Verify the install check passes for the new skill (`npm test`)
- [x] 2.2 Eval cases `evals/status/cases.yaml`: roadmap project (Now/Next by title, handoff line); no-roadmap project (overview filled, `/kit:roadmap` hint, no file created); mismatch shown with its fix; no extra items or built specs beyond the facts. Verify `npm run evals` runs them with 0 failures

## 3. Next and lane map

- [x] 3.1 `toolkit.yaml`: kit phase `status` with skill `/kit:status` (spec skill-routing "Status phase in the lane map"); `npm run registry`. Verify `npm run registry:check` and a lane-map test in `tests/kit/lanes.test.mjs` showing `status` owned by the kit
- [x] 3.2 `next.mjs` (spec skill-routing "Next-step suggestion"; design D6): "No active change" fallback → `status` owner; `--change <name>`; several active and none named → `choose` list. Verify with `tests/kit/next.test.mjs`: no active change, several active, one active unchanged, `--change` picks; all existing next tests still pass
- [x] 3.3 `plugins/kit/skills/next/SKILL.md`: when the result has `choose`, ask which change (AskUserQuestion) and rerun with `--change`; when the step is `/kit:status`, say nothing is in progress. Update `evals/next/cases.yaml` and the "next: explore" case in `tools/smoke.mjs` to expect `/kit:status`. Verify `npm run evals` (next) and `npm run smoke`

## 4. Docs and real runs

- [x] 4.1 `README.md`: add `/kit:status` to the command table and the "coming back" flow (status → next). Verify the README command table lists every kit skill folder
- [x] 4.2 Run `/kit:status` on this repo and on a copy of Acme in `../temp` (never the real project); record both outputs and the user's verdict (PRD measure: understands where things stand) in `openspec/changes/kit-status/runs.md`
- [x] 4.3 Full run: `npm test`, `npm run evals`, `npm run smoke` all pass; record the counts in `runs.md`
