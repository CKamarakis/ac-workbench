# Tasks

## 1. Web-ui rule and the PRD offer

- [x] 1.1 Bump the kit to `0.17.0` in `plugins/kit/.claude-plugin/plugin.json`. Verify with `node plugins/kit/scripts/ping.mjs`
- [x] 1.2 `verify.mjs` `webUi(dir)` (kit.json type, then `.claude/skills/impeccable`, then `next.config.*`; returns `{ webUi, why }`) and `ready.mjs web-ui --dir .` (design D1; spec build-readiness "Web-ui project"). Verify with unit tests for "Type in kit.json", "Impeccable installed, other type", "Neither", and the CLI
- [x] 1.3 `knowledge.mjs set-field` accepts `shape` with `done` or `declined` (design D4). Verify with a unit test in `tests/kit/knowledge.test.mjs` (valid values set; another value -> error) and `prd-check` passing on a PRD with the field
- [x] 1.4 `plugins/kit/skills/prd/SKILL.md`: after drafting or before a per-section update, in a web-ui project (`ready.mjs web-ui`) with a PRD that touches a screen and no `shape` field, offer `/impeccable shape` once; on a yes, propose its brief for "UX notes and assets" (per-section yes), then `set-field shape done`; on a no, `set-field shape declined` (spec prd-authoring "Shape offered for screens"). Verify with eval cases in `evals/prd` (screen -> offer; background job -> none; declined -> not repeated) and `npm run evals`

## 2. Ready: ui-review and UI gaps

- [x] 2.1 `ready.mjs`: `ui-review` in `SAFEGUARDS`; `recommend(..., { uiWhy })`; `safeguards --ui-why "..."`; refuse `--ui-why` and `ui-review` in `--choice` when the project isn't web-ui (design D2; spec build-readiness "UI review safeguard"). Verify with unit tests for "UI files named" (recommended with the reason), "Not web-ui" (refused), and the Safeguards section showing it
- [x] 2.2 `plugins/kit/skills/ready/SKILL.md`: in a web-ui project, give `--ui-why` only when `design.md`/`tasks.md` name pages, components, styles or code that generates pages users see (never from words; ready D1), and add the states and copy checklist to the gap search (design D5; scenarios "Word alone", "Missing empty state"). Verify with eval cases in `evals/ready` and `npm run evals`

## 3. Verify: the UI review

- [x] 3.1 `verify.mjs`: with `ui-review` chosen, the `ui` review row (advisory when not recorded), `reviewed --source ui`, `finding --source ui` (prefix `I`, advisory), advisory items for a missing `PRODUCT.md` or `DESIGN.md`, and "ui review: not chosen" otherwise (design D3; spec quality-gates "UI review at verify"). Verify with unit tests, one per scenario
- [x] 3.2 `plugins/kit/skills/verify/SKILL.md`: a UI review step (only when chosen): offer `/impeccable init` or `document` when the report lists them missing; run `/impeccable critique` and `/impeccable audit` with the change's UI files as the target; record each finding with its `.impeccable/critique/` link; `reviewed --source ui`. Also: app can't run -> review from code and goldens, `--how substitute`; Impeccable not installed -> offer the project-scope install, else `--how skipped` (ready D2, D3). Verify with eval cases in `evals/verify` and `npm run evals`

## 4. Docs and integration

- [x] 4.1 README: the flow shows `shape` at the PRD and `ui-review` at ready/verify for web-ui projects; the Impeccable row says when the kit calls it. Verify by reading the flow block and the tools table
- [x] 4.2 Smoke step: `ready.mjs web-ui` in the smoke project (type none, no Impeccable) says not web-ui. Verify `npm run smoke` passes
- [x] 4.3 Full run: `npm test`, `npm run evals`, `npm run smoke` pass; `/kit:ready` on this change records its own Safeguards. Record in `openspec/changes/ui-flow-with-impeccable/runs.md`
