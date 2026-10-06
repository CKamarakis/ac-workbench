# Tasks

## 1. Prerequisites and registry

- [x] 1.1 Archive `kit-local-mvp` first, or confirm with the user that it stays open (only task 9.4 is left). Verify that `openspec list --specs` shows `project-starter` and `skill-routing`, or record the decision in this file (design: Risks, base specs)
  - **Decision (user, 2026-10-06):** keep `kit-local-mvp` open until its usage review (9.4, ~2026-10-13). Archive it **before** this change, so the base specs for `project-starter` and `skill-routing` exist when this change's ADDED requirements are merged.
- [x] 1.2 Write `evals/trials/notion-spike-2026-10-06.md` from the explore findings in `docs/project-context.md` (text, images, SQL limit, sign-out). Verify that every number in it matches that section
- [x] 1.3 Registry (design D8):
  - add the phases `capture` and `prd`;
  - the `kit` entry claims them with `/kit:capture` and `/kit:prd`;
  - add a situation entry for "I have an idea or a note";
  - move `notion-mcp` to `later`, with a verdict citing 1.2.

  Verify that `npm run registry` passes, and that its lane map prints `capture` and `prd` owned by `kit`
- [x] 1.4 Bump `plugins/kit/.claude-plugin/plugin.json` to `0.2.0`. Verify that `node plugins/kit/scripts/ping.mjs` prints `0.2.0`

## 2. Knowledge helper script

- [x] 2.1 Add `plugins/kit/scripts/knowledge.mjs` with:
  - the knowledge-dir resolver (`.claude/kit.json` `knowledge_dir`, default `knowledge`; design D1);
  - the frontmatter subset parser and writer (design D3).

  Verify with `tests/kit/knowledge.test.mjs` cases: default and configured dir; scalars, inline lists and block lists round-trip; unsupported YAML is reported as invalid
- [x] 2.2 Add `list`: notes recursively, skipping `archive/`, plus PRDs with title, status and sources; `--json`. Verify with tests: a topic-folder note is included, an archived note is excluded, and an invalid status is reported, not guessed
- [x] 2.3 Add `new-note`: slug from the title, date prefix, `-2` suffix on a collision, optional topic folder, an asset copied into `assets/` with a relative link. Verify with tests for each of the knowledge-capture scenarios "Note written", "Name collision", "Topic named" and "Image attached"
- [x] 2.4 Add `citing` and `move`:
  - `move` handles archiving and topic moves;
  - it rewrites the `sources` of citing PRDs;
  - it never deletes anything.

  Verify with tests for "Archive an unused note", "Archive a cited note" and "Nothing deleted" (the file count before equals the file count after)
- [x] 2.5 Add `section-get` and `section-set --expect <hash>` (design D4). Verify with tests: an approved section is written; a section the user changed since `section-get` makes `section-set` exit non-zero with a conflict, and the file is unchanged
- [x] 2.6 Add `prd-check`: status is one of the five values, sources exist, `change` is set when the status is Building or Shipped. Verify with tests for a valid PRD, a bad status and a missing source

## 3. `/kit:capture` skill

- [x] 3.1 Add the note template under `plugins/kit/templates/` and `plugins/kit/skills/capture/SKILL.md`. The skill:
  - proposes a title and waits for a yes;
  - takes text, `/voice` dictation or a pointer;
  - names a topic folder when asked;
  - handles archive and move requests through `knowledge.mjs`, naming the citing PRDs first.

  Verify that the skill text references `${CLAUDE_PLUGIN_ROOT}/scripts/knowledge.mjs` and states the confirm-before-write rule
- [x] 3.2 Add `evals/capture/cases.yaml`:
  - deterministic cases that run `knowledge.mjs new-note`, `move` and `list` in the sandbox;
  - content checks on the SKILL.md rules;
  - a rubric case for title proposal.

  Verify that `npm run evals` passes for `capture`, and that the "skill without evals" check stays green

- [x] 3.3 (Added 2026-10-06 after the live trial, user request.) After saving a note, `/kit:capture` checks the PRDs that aren't Shipped (`list --json`) and offers to update a matching one through `/kit:prd`'s per-section update. For a Building PRD it says that `/kit:next` will flag the change. It says nothing when nothing matches. Spec: knowledge-capture "Offer to update a matching PRD after capture". Verify with a content-match eval on the skill text and a rubric case in `evals/capture/cases.yaml`

## 4. `/kit:prd` skill

- [x] 4.1 Read PM-OS `/prd-draft` and the PRD template locally for ideas. Write `plugins/kit/templates/prd.md` in our own words (sections from design D9; frontmatter title, status, sources, change). Verify that no sentence is copied: diff against the PM-OS files with a word-level check, and record the check in the commit message
- [x] 4.2 Add `plugins/kit/skills/prd/SKILL.md` with these flows:
  - **new:** shortlist with reasons → the user picks → draft with sources, gaps marked as assumptions or open questions;
  - **update:** per-section proposals through `section-get`/`section-set`, one yes per section;
  - **Ready:** explain the handoff to `/opsx:propose`;
  - **status changes:** only on a yes.

  Verify that the skill text covers each prd-authoring requirement by name
- [x] 4.3 Add `evals/prd/cases.yaml`:
  - deterministic: the template has the required frontmatter and sections; `section-set` conflicts; `prd-check` results;
  - rubric cases: shortlist reasons; gaps marked; no overwrite.

  Verify that `npm run evals` passes for `prd`

## 5. Starter: knowledge folder and routing

- [x] 5.1 `start-plan.mjs`/`start-apply.mjs`:
  - plan `CREATE` for each missing `knowledge/` subfolder with a `.gitkeep` (design D10);
  - never touch existing files;
  - write `knowledge_dir` into the stamp.

  Verify with `tests/kit/start-plan.test.mjs`/`start-apply.test.mjs` cases: empty folder; existing notes untouched; only missing subfolders planned
- [x] 5.2 `lanes.mjs` `routingBlock()`: add the "Knowledge" section (folder path; `/opsx:propose` reads the Ready PRD and writes `PRD: <path> @ <commit>`; design D6). Verify with `tests/kit/lanes.test.mjs` that the block names the folder and the handoff, and that a re-sync of an old block shows as `CHANGE` with a diff
- [x] 5.3 Update `plugins/kit/templates/CLAUDE.md` and `project-context.md`: point PRDs and long-lived context to `knowledge/` instead of Notion. Verify with `tests/kit/templates.test.mjs` that "Notion" no longer appears as the PRD home
- [x] 5.4 Extend `evals/start/cases.yaml` with a case where a fresh sandbox gets the four `knowledge/` subfolders and the routing Knowledge section. Verify that `npm run evals` passes for `start`
- [x] 5.5 Update `plugins/kit/skills/start/SKILL.md`: mention the knowledge folder in the summary step, and drop the Notion example in step 2. Verify the content with the existing start evals

## 6. `/kit:next`: PRD-aware suggestions

- [x] 6.1 `next.mjs`: add a pure `prdSuggest()` that runs before the OpenSpec rules (design D5, D7). Inputs: the PRD list, the `PRD:` lines from change proposals (active and archived), and the git "changed since" results. Verify with `tests/kit/next.test.mjs` cases for each skill-routing scenario: Ready without a change; changed since planning; archived; notes but no PRD; no knowledge folder (unchanged output)
- [x] 6.2 Wire up the real inputs:
  - `knowledge.mjs list`;
  - a regex over `openspec/changes/**/proposal.md` and `archive/`;
  - `git log <commit>..HEAD -- <path>` plus an uncommitted-diff check;
  - skip with a note when git is missing.

  Verify with an eval in `evals/next/cases.yaml` that builds a sandbox with a Ready PRD and expects `Next: /opsx:propose` naming it
- [x] 6.3 Update `plugins/kit/skills/next/SKILL.md` to report PRD suggestions and never apply status changes itself. Verify with a content-match eval

## 7. Integration: live trial and docs

- [x] 7.1 Live trial in a throwaway folder (never the real Toughbubble):
  - `/kit:start` → `/voice` note via `/kit:capture` → `/kit:prd` → mark Ready → `/opsx:propose` → `/kit:next`.

  Record in `evals/trials/prd-pipeline-live.md`: whether `/opsx:propose` followed the routing rule and wrote the `PRD:` line (design D6 risk). If it didn't, apply the `rules.proposal` fallback and re-run
- [x] 7.2 Run `/kit:start` re-sync on a Toughbubble **copy**. Verify that only `CREATE` for `knowledge/` and a `CHANGE` for the routing block appear, and that nothing is written without a yes. Record the result in the same trial file
- [x] 7.3 Run `npm test`, `npm run evals` and `npm run registry`, all green. Then update `docs/roadmap.md` (M2 status, stages 1–3) and `docs/project-context.md` in the same commit as the task checkoffs
