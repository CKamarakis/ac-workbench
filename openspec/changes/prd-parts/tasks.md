# Tasks

## 1. Status and part model (knowledge.mjs)

- [ ] 1.1 Add `Dropped` to `STATUSES`; tests in `tests/kit/knowledge.test.mjs`: a Dropped PRD without `change` is valid, `set-field --key status --value Dropped` works, an unknown status still names the six values
- [ ] 1.2 `readPrd` adds `name`, `partOf`, `label` (D1, D2); a nested file without `part-of` keeps its old name; tests for both, plus the two-parents-same-part-name case
- [ ] 1.3 `listKnowledge` second pass: `parts` on parents, orphan and folder-mismatch errors, parent `Building` without `change` is valid, early-Shipped `warnings` (Dropped counts as finished), parent-then-parts ordering (D2, D4); tests for each spec scenario under "Parts checked against their parent" and "Parts listed under their parent"
- [ ] 1.4 `list` text output indents parts under their parent with status and change; `prd-check` prints warnings and keeps exit 0 (D6); `set-field` Shipped on a parent prints the warning; tests on the formatted output and exit codes

## 2. Create a part

- [ ] 2.1 New `plugins/kit/templates/prd-part.md` (Scope, Requirements, Done when, Open questions) and a `## Parts` section with table header in `templates/prd.md`; extend `tests/kit/templates.test.mjs`
- [ ] 2.2 `new-prd --part-of <slug>`: refuses a missing parent, a parent that is a part, an existing file; writes the part; appends the Parts row without touching other lines, adding the section if missing (D5); tests for each case, including a parent with user text in Parts

- [ ] 2.3 Moving a parent (D8): `set-field --key part-of` (slug or empty); `move` of a parent with unfinished parts moves nothing and prints them with the three choices; with all parts finished it moves the file and folder together; `/kit:capture` SKILL.md asks per unfinished part; tests for each "Move a parent with parts" scenario

## 3. Proposal lines and next step

- [ ] 3.1 `PRD parent:` pattern and `prdLink` returning `parent` (D7); tests: both lines, part line only, old single line unchanged, "PRD parent:" never read as the PRD line
- [ ] 3.2 Routing block in `lanes.mjs`: from a part, also add the parent line, and the change/Building offer goes to the part; extend `tests/kit/lanes.test.mjs`
- [ ] 3.3 `prdSuggest`: names use `name`; parents with parts never proposed; Dropped ignored; changed check on part then parent, message names the file (spec: "Next-step suggestion with PRD parts", "PRD changed checked per part and parent"); tests in `tests/kit/next.test.mjs` for every scenario, plus the no-parts cases unchanged

## 4. Status, roadmap, skill

- [ ] 4.1 `status.mjs` uses `label` for PRD rows and skips parents with parts in "ready to propose"; test in `tests/kit/status.test.mjs` for "Acme v1 › Part B"
- [ ] 4.2 Roadmap: test in `tests/kit/roadmap.test.mjs` that `link --kind prd --value prds/acme-v1/part-b.md` saves and `check` reports nothing
- [ ] 4.3 `/kit:prd` SKILL.md: parts (create a part, Dropped, which PRD lists parts by name), the split flow (spec: "Split a PRD into parts"), the proposal lines; add cases to `evals/prd/cases.yaml` for "new part", "split on request" and "dropped part"; `npm run evals` passes

## 5. Integration

- [ ] 5.1 `npm test` passes; `npm run smoke:check`, and `npm run smoke` if it recommends one; report both to the user
- [ ] 5.2 Hand check in a throwaway project in `../temp`: parent plus two parts, `list`, `prd-check`, `/kit:next` with a Ready part; findings noted in the verify report
- [ ] 5.3 Bump the kit version and add a CHANGELOG entry

## Workflow follow-up

- `/kit:ready`, then `/opsx:apply`, `/kit:verify`, `/opsx:archive`.
- After archive: tick M17 T1-T6 and update Now (`/kit:roadmap`).
