# Tasks

## 1. Registry

- [x] 1.1 `validate-registry.mjs`: optional `project_version` ({file, pattern}) and `update` (one line); tests
- [x] 1.2 `toolkit.yaml`: Impeccable `project_version` and `update`; `npm run registry`

## 2. Plan and apply

- [x] 2.1 `start-plan.mjs`: read a tool's project version; older than tested -> `update` action (from, tested, command); newer -> note; tests first
- [x] 2.2 `start-plan.mjs`: OpenSpec skills older than the machine CLI -> `update` entry `openspec update` (names the removal of skills outside the profile); CLI older than tested -> plan warning; tests first
- [x] 2.3 `start-apply.mjs`: run updates like installs (`--files-only` lists them as left alone); tests first
- [x] 2.4 `formatPlan`/`formatResult`: `UPDATE` and `updated` lines, warnings

## 3. Skill and close out

- [x] 3.1 `/kit:start` skill: UPDATE lines and warnings; the tools question also on UPDATE lines; eval content checks
- [x] 3.2 Kit 0.18.3 -> 0.19.0; `npm test`, `npm run smoke`, `npm run evals -- --dry`, `openspec validate tool-version-sync --strict`; a real re-sync on a fresh copy of the old Acme state (kit 0.11.0)
