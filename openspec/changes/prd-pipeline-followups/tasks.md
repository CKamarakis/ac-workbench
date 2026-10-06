# Tasks

## 1. Registry and version

- [x] 1.1 Add the optional `recommend` (`yes`|`no`) and `recommend_why` fields:
  - validate them when present (`recommend` requires `recommend_why`);
  - document them in `docs/registry.md`;
  - set them for `superspec` and `superpowers` (design D6).

  Verify with a `tools/validate-registry.test.mjs` case (a bad value and a missing reason are rejected), and that `npm run registry` passes
- [x] 1.2 Bump `plugins/kit/.claude-plugin/plugin.json` to `0.3.0`. Verify that `node plugins/kit/scripts/ping.mjs` prints `0.3.0`

## 2. `knowledge.mjs`: order, unimported files, import

- [x] 2.1 `listKnowledge(root, { updatedOf })`: add `updated` to each PRD and sort PRDs newest first, ties by slug. The default `updatedOf` uses git (status, then `log -1 --format=%cI`) with an mtime fallback (design D1). Verify with `tests/kit/knowledge.test.mjs`:
  - a fake `updatedOf` gives the expected order;
  - a real temp git repo puts a dirty file before an older committed one;
  - a folder without git sorts by mtime
- [x] 2.2 `list` reports `unimported` (`notes/**/*.txt`, skipping `archive/`) and does not count them as notes. Verify with a test: a `.txt` in `notes/` is in `unimported` and not in `notes`; one in `archive/` is in neither
- [x] 2.3 Add the `import` command (design D4):
  - `.txt`/`.md`; existing frontmatter kept (title and date unless overridden); body unchanged;
  - `source` = the original file name;
  - an original under `notes/` is removed only after the new note is verified;
  - an original outside the folder is kept.

  Verify with tests for the three knowledge-capture scenarios ("Transcript dropped into notes", "File outside the knowledge folder", "Text kept as is")

## 3. `/kit:capture`: import flow

- [x] 3.1 Update `plugins/kit/skills/capture/SKILL.md`:
  - an "Import a file" section: propose a title and tags, write only on a yes, keep the text, explain what happens to the original;
  - after any capture, if `list` shows `unimported` files, offer to import them.

  Verify with content-match checks in `evals/capture/cases.yaml`
- [x] 3.2 Add eval cases to `evals/capture/cases.yaml`:
  - deterministic: import from `notes/` (the original is gone, the note has the text); import from outside (the original stays); `list` shows `unimported`;
  - a rubric case for the import title proposal.

  Verify that `npm run evals` passes for `capture`

## 4. PRD order in `/kit:prd`, routing and `/kit:next`

- [x] 4.1 `/kit:prd` SKILL.md: when it lists or offers PRDs (choosing which one to update, the status overview), use `list` order (newest first) and say so. Verify with a content-match eval in `evals/prd/cases.yaml`
- [x] 4.2 `lanes.mjs` `knowledgeSection()`: when several PRDs are Ready, ask which one, ordered by last update, newest first (design D3). Verify with `tests/kit/lanes.test.mjs`, which checks the wording, and the start eval's routing check
- [x] 4.3 `next.mjs` end to end: `readKnowledge` passes the sorted list through, so the newest Ready PRD is named first and the others follow in order. Verify with a `tests/kit/next.test.mjs` case on a temp git repo with two Ready PRDs (the newer one named), and an `evals/next/cases.yaml` case

## 5. `/kit:start` questions with context

- [x] 5.1 `start-plan.mjs` (design D5):
  - `types[]` with tools, about, recommended and why (config-file detection for `web-ui`);
  - `offeredTools[]` with about, recommend and why from the registry (default `no` + reason);
  - `about`, `recommend` and `why` on file actions;
  - `formatPlan` prints the about line for opt-in tools.

  Verify with `tests/kit/start-plan.test.mjs` cases:
  - a Next.js folder recommends `web-ui` with its reason; an empty folder recommends no type;
  - SuperSpec carries its registry recommendation; a tool without one defaults to `no` with the default reason;
  - the `CLAUDE.md` `CHANGE` carries about and recommend yes
- [x] 5.2 Update `plugins/kit/skills/start/SKILL.md` step 2 and the confirm step: every question shows `about` and "Recommended: <answer> (<why>)" from the plan JSON, and offers the recommended answer first. Verify with content-match evals in `evals/start/cases.yaml`, plus a deterministic case where `start-plan --json` in a sandbox with `next.config.js` contains the `web-ui` recommendation

- [x] 5.3 (Direction change, 2026-10-06.) `start-plan.mjs` `formatPlan`: replace the "Optional for this project" prompt with "Available on demand (not installed now)", each with its `about`. Keep `--opt-in` working for an explicit request. Verify with `tests/kit/start-plan.test.mjs`: the on-demand wording, no "opt in" prompt, and `--opt-in sp` still installs `sp`
- [x] 5.4 Update `plugins/kit/skills/start/SKILL.md` to the one-question flow (spec: project-starter "Setup asks one question"):
  - step 2 asks only the type (`typeOptions`);
  - no opt-in questions; the summary lists `offeredTools` as available on demand;
  - the confirm step uses one yes for all file changes (each shown with its diff, about and recommendation), with exclusions allowed.

  Verify with `evals/start/cases.yaml` content checks (one question, no per-tool question, "available on demand", the one yes)

- [x] 5.5 Registry field `first_use` (optional, one line), shown under "Later" in the plan summary. Set it for Impeccable (`/impeccable init`). `formatPlan` and the start skill's summary use three parts: Done, Needs you, Later; install notes are not shown to the user. Verify with `tests/kit/start-plan.test.mjs` (Impeccable's step is under Later; no install_note text in the output) and a start eval content check
- [x] 5.6 `configAction`: an existing `context: |` block without the pointer becomes a `CHANGE` that appends the pointer line to the block. A one-line `context:` stays a conflict. Verify with `tests/kit/start-plan.test.mjs` (block case and one-line case) and on the Toughbubble copy (its config shows `CHANGE`, not `CONFLICT`)
- [x] 5.7 context7 without setup: registry entry install = none (used through `npx -y ctx7@latest`), not interactive, with today's evidence (lookups work logged out; setup forces a sign-in). Add a "Library docs" rule to `knowledgeSection`'s routing block (or its own section). Verify with `npm run registry`, a `tests/kit/lanes.test.mjs` check, and a plan on the copy with no context7 "YOU" step

## 6. Integration and docs

- [x] 6.1 Live check in `Projects/temp/Toughbubble` (the copy):
  - `/kit:start` asks only the type (web-ui recommended), installs the web-ui tools without asking, lists SuperSpec and Superpowers as available on demand, and confirms the file changes with one yes;
  - Impeccable's hooks run without errors on Windows (its install note flags them as unverified);
  - with two Ready PRDs, `/opsx:propose` offers the newer one first;
  - `/kit:capture` imports a `.txt` dropped into `knowledge/notes/`.

  Record the results in `evals/trials/prd-pipeline-live.md` under a "Follow-ups (0.3.0)" section
- [x] 6.2 Run `npm test`, `npm run evals` and `npm run registry`, all green. Then:
  - update `docs/roadmap.md`: remove the done follow-ups from the next actions, and set the change status;
  - update `docs/project-context.md`;

  in the same commit as the task checkoffs
- [x] 6.3 README bookkeeping (user request, 2026-10-06): update `README.md` to the current kit, covering what it is, install, the skills (`/kit:setup`, `/kit:start` with one question, `/kit:next`, `/kit:capture`, `/kit:prd`), the `knowledge/` layout, the workflow from idea to PRD to OpenSpec, tools on demand, and where the plan lives (roadmap). Verify that every command the README names exists in `plugins/kit/skills/` or OpenSpec, and that its install steps match `toolkit.yaml`
