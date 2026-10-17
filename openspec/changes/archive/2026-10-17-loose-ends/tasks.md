# Tasks

## 1. Loose ends script

- [x] 1.1 Bump the kit to `0.14.0` in `plugins/kit/.claude-plugin/plugin.json`. Verify with `node plugins/kit/scripts/ping.mjs`
- [x] 1.2 `loose-ends.mjs` read and write core (design D1; spec loose-ends "Loose ends file", "Writes only through the script, on a yes"): `readLooseEnds(dir)`, render table + data comment, `add` with kind/origin/tags/source validation, IDs never reused, refuse an unreadable file. Verify with unit tests in `tests/kit/loose-ends.test.mjs` (add to a new file; L3 after a dropped L2; unknown kind refused; hand-edited file left unchanged)
- [x] 1.3 `add --batch <file.json>`, `important`, `block` (targets checked: milestone, active or archived change, loose end), `done`, `drop`, `seen`, `kind` (design D2, D3, D9, D11; spec "Importance", "Seen again", "Blockers", "Done and dropped"). Verify one unit test per scenario, including the agent's important mark stored with `by: agent` and its reason, accepted refused as important, a seen count of 2 with both dates, a kind change with its reason, and an unknown block target refused
- [x] 1.4 `list` and `analysis` (spec "List and analysis"): groups must look at / will do anyway / might do / nothing to do, important first, blockers shown; counts by kind, origin, tag, state and the important share. CLI with `--dir`, `--json`, `error:` on bad input. Verify the two scenarios as unit tests and a CLI test (exit 0, JSON shape)

## 2. Skill and capture rule

- [x] 2.1 Skill `plugins/kit/skills/loose-ends/SKILL.md` (design D8; spec "One batch at the end of a step", "Cleanup"): numbered end-of-step list, one multi-select question, owned items pointed to their owner, nothing asked when nothing was put aside; cleanup by kind with keep/drop and drop only on yes; list; analysis. Verify the install check passes (`npm test`)
- [x] 2.2 Routing block rule in `lanes.mjs` (design D4; spec skill-routing "Loose ends rule in the routing block") and the kept-findings step in `plugins/kit/skills/verify/SKILL.md`. Verify with a test that `routingBlock(...)` contains the rule naming `/kit:loose-ends`, and the existing routing-block tests still pass
- [x] 2.3 `toolkit.yaml`: kit phase `loose-ends` with `/kit:loose-ends`; `npm run registry`. Verify `npm run registry:check` and a lane-map test showing the phase owned by the kit
- [x] 2.4 Eval cases `evals/loose-ends/cases.yaml`: add via the script then list; batch add; unknown kind refused; skill rules (one question per step, writes only on yes, owned items pointed elsewhere). Verify `npm run evals` runs them with 0 failures

## 3. Status, next and roadmap

- [x] 3.1 `status.mjs` Loose ends section (design D5; spec project-status "Facts from their owners", "Status report sections"): rows for important or blocking-current items, count lines per kind, accepted hidden, `backlog` removed from `missing`; `status/SKILL.md` and `format` say "Loose ends". Mismatch rule (d) for a blocker whose target finished (design D10). Verify the new scenarios as unit tests (rows and counts; no file; L4 blocks a done M12) and update the existing status tests and evals that expect "Tech debt" / "no backlog yet"
- [x] 3.2 `next.mjs` (design D6; spec skill-routing "Next-step suggestion"): loose ends in the "Nothing open" count (accepted excluded) and the `blocked` reminder line for the change the step is for. Verify both scenarios as unit tests; existing next tests still pass
- [x] 3.3 `roadmap.mjs` report pointer line (design D7; spec roadmap "Roadmap report"). Verify the two scenarios as unit tests; existing roadmap tests still pass

## 4. Docs and checks

- [x] 4.1 README: `/kit:loose-ends` in the command table and one line in the "back after a while" flow. Verify the command table lists every kit skill folder
- [x] 4.2 Smoke steps for `loose-ends.mjs` (add, list) and the status Loose ends line in `tools/smoke.mjs`. Verify `npm run smoke` passes
- [x] 4.3 Seed this repo's loose ends from 2026-10-17 (Storms v1 mismatch check, PATH friction, judge criteria pointer to M12 T4 or not, C6/C9 accepted, temp clone cleanup, ideas from the kit-status PRD's Scope Out) through the skill, on the user's yes. Verify `/kit:status` shows the important ones and `list` groups them
- [x] 4.4 Full run: `npm test`, `npm run evals`, `npm run smoke` all pass; record the counts in `openspec/changes/loose-ends/runs.md`
