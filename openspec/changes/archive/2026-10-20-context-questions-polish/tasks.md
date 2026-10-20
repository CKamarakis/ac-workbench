# Tasks

## 1. Start

- [x] 1.1 `.gitignore`: the dedupe was built, then undone after the code review (privacy must not rest on the user's lines); test "the kit block always lists its own lines" pins the kept behaviour
- [x] 1.2 `/kit:start` skill: type order (web-ui first without evidence, none last); the questions in two rounds with the voice hint and blank lines; the `docs/` line at the end; eval content checks
- [x] 1.3 `/voice` checked against the official commands reference before naming it

## 2. Routing block and README

- [x] 2.1 `lanes.mjs`: drop the Owner column, header line about re-sync; regenerate the golden file and review its diff; lane and harness tests pass
- [x] 2.2 README: when the kit loads, Update the kit, Remove the kit from a project (`claude plugin uninstall kit@ac-workbench --scope project`, checked against `claude plugin uninstall --help`); `claude plugin update --help` (has `--scope`, default auto-detect), `claude plugin marketplace update --help` and the plugins docs (`/reload-plugins`) checked 2026-10-19

## 3. Close out

- [x] 3.1 Kit 0.18.1 -> 0.18.2; `npm test`, `npm run smoke`, `npm run evals -- --dry`, `openspec validate context-questions-polish --strict` pass

## Workflow follow-up

- `/kit:verify`, archive, merge and push; re-check `acme-empty` quickly, then test B.
