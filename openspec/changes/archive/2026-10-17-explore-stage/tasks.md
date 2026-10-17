# Tasks

## 1. Explore record script

- [x] 1.1 Bump the kit to `0.15.0` in `plugins/kit/.claude-plugin/plugin.json`. Verify with `node plugins/kit/scripts/ping.mjs`
- [x] 1.2 `explore.mjs` read, `stateOf`, `save` (create or append; answers close questions as decisions; unknown source refused; `in-prd` refused), `link-prd`, `list`, CLI with `--dir`, `--json`, `error:` (design D1-D3; spec explore-record "Explore record file", "Record updated, never rewritten", "Record linked to its PRD"). Verify with unit tests in `tests/kit/explore.test.mjs`, one per scenario, plus a CLI test

## 2. Next and status

- [x] 2.1 `next.mjs` (design D4; spec skill-routing "Next-step suggestion", "Next-step suggestion uses PRD status"): remove the notes rule; explore rules (ready -> `/kit:prd`, exploring -> `/opsx:explore` with questions, several -> choose, `--explore`); roadmap step outside a flow (next open task; milestone done -> next milestone, writes nothing); "Nothing open" only with no roadmap. Verify the new scenarios as unit tests; update the existing tests and the `next` evals and smoke steps that expected `/kit:prd` for notes or `/kit:status` with a roadmap
- [x] 2.2 `status.mjs` Now rows for open records (design D7; spec project-status "Facts from their owners"), and unused notes as one count line in Next (readiness D1; spec "Status without a roadmap"). Verify "Explore under way" and "Unused notes as one line" as unit tests and update the status tests and evals that expect note rows

## 3. Skills and routing

- [x] 3.1 Skill `plugins/kit/skills/explore-record/SKILL.md` (save-only; automatic by default; shows what it wrote; drop removes what that save added) and the routing rule in `lanes.mjs` `knowledgeSection` pointing to it (design D5; spec explore-record "Saved at the end of an explore", skill-routing "Explore rule in the routing block"). Verify the install check passes for the skill and a test that the routing block contains the rule naming `/kit:explore-record`
- [x] 3.3 Reminder hook `plugins/kit/hooks/explore-reminder.mjs` in `hooks.json` on UserPromptSubmit (design D8; spec explore-record "Reminder when the next stage starts"). Verify with unit tests (`/kit:prd` in a kit project -> one line; other prompts and non-kit folders -> nothing; exit 0 always) and the install check for the hook entry
- [x] 3.2 `plugins/kit/skills/prd/SKILL.md`: offer `ready-for-prd` records first, draft from decisions plus sources, then `explore.mjs link-prd` (design D6; spec prd-authoring "Draft a PRD from chosen notes"). `plugins/kit/skills/next/SKILL.md`: the explore steps, the choose step for records, the roadmap step (name only; offer `/kit:roadmap`). Verify with eval cases in `evals/prd` and `evals/next` and `npm run evals`

## 4. Docs and checks

- [x] 4.1 README: the flow line shows explore before the PRD and the explore record. Verify by reading the flow block
- [x] 4.2 Smoke steps: `explore.mjs save` then `next.mjs` says `/kit:prd` for a ready record. Verify `npm run smoke` passes
- [x] 4.3 Full run: `npm test`, `npm run evals`, `npm run smoke` pass; on this repo, `/kit:next` names the next roadmap step (M12a T4 while it's open). Record in `openspec/changes/explore-stage/runs.md`
