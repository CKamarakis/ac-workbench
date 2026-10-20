# Tasks

Every code task: the failing test first, then the change; verify with the named test file and the rest of `npm test` passing.

## 1. Context template and status (L26, L25)

- [x] 1.1 Template `plugins/kit/templates/project-context.md`: sections Problem, Users, What it does, Rules the agent must follow, Not now, Decided, Open questions, Links, each with a hint and an example (design D4); verify the start tests still pass and a fresh plan creates the new template
- [x] 1.2 `status.mjs`: skip a blank context doc as the description (D2, current and previous template), "Project not described yet" with the fix when nothing describes the project, and a `fresh` flag on the handoff for a new project (D1); tests for "Blank doc and a README", "Nothing describes the project" and "Empty project"
- [x] 1.3 `/kit:status` skill: the project line for "not described yet", and the closing line offering `/kit:capture` and `/opsx:explore` when the handoff is fresh; eval content checks for both

## 2. Next (L25)

- [x] 2.1 `next.mjs`: on a new project with nothing open (D1), suggest the capture owner and name the brainstorm owner; tests for "Empty project after setup" and "Project with history"

## 3. Roadmap note (L27)

- [x] 3.1 `roadmap.mjs`: the "not committed yet" note in plain words; test for "Roadmap not committed yet"

## 4. Start (L24, L25, L26)

- [x] 4.1 `/kit:start` skill: offer to run `/kit:setup` when machine tools are missing and continue after it; after a fresh setup, offer to fill the context doc (draft from the project's own files, or the five questions with hints and examples; write on a yes; "later" is fine); end with `/kit:capture` and `/opsx:explore` on a new project, `/kit:next` otherwise; the rule on editing the doc names this one exception; eval content checks for the three parts

## 5. Close out

- [x] 5.1 Kit 0.17.2 -> 0.18.0; `npm test`, `npm run smoke`, `npm run evals -- --dry`, `openspec validate first-run-guidance --strict` all pass

## Workflow follow-up

- `/kit:verify`, archive, mark L24-L27 done, merge and push.
- Re-run test A on a fresh copy of Acme with the new kit (clean profile), then test B.
