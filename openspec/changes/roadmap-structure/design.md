# Design

## Context

See proposal.md (Why) and the PRD. Constraints that shape the approach:
- Kit scripts are zero-dependency Node modules with a CLI and pure, unit-tested functions (`knowledge.mjs`, `decisions.mjs`, `next.mjs`). Skills call scripts; they don't hand-edit structured files.
- `knowledge.mjs` already parses and writes frontmatter (`parseFrontmatter`, `writeFrontmatter`) and resolves the knowledge folder per project (`knowledgeDir`).
- The starter plans before it applies (`start-plan.mjs` → `start-apply.mjs`) and confirms file changes with one yes.
- The smoke test runs the kit end to end in a throwaway project without AI.

## Goals / Non-Goals

**Goals:**
- One script owns every roadmap write and the check, so the format can't drift by hand-written agent edits.
- The skill stays thin: it decides what to propose, shows it, and calls the script on a yes.
- This repo's roadmap moves without losing a milestone, drift entry or pending decision.

**Non-Goals:**
- No converter for other old-format roadmaps: only this repo has one.
- No `/kit:next` or `/kit:status` integration here (change 3).
- No hook that writes the roadmap automatically.

## Decisions

### D1. One script, `roadmap.mjs`, for all reads and writes
Commands: `new`, `add`, `status` (planned/active/paused/done/dropped; `done`/`dropped` also moves the file to `done/`), `tick`, `order`, `now`, `wait` (add or resolve a Waiting-on-you item), `link`, `drift` (append), `check`, `report`, all with `--dir` and `--json` like the other kit scripts. Pure functions (`parseRoadmap`, `checkRoadmap`, `reportRoadmap`) are exported for tests.
- *Why:* the PRD's main risk is the format drifting as agents write it; a script that is the only writer makes the format a property of code, and `check` covers hand edits.
- *Alternative:* the skill edits Markdown directly and only `check` runs after. Rejected: the same freehand writing that caused today's file.

### D2. Machine-readable parts are few and fixed
- **Milestone frontmatter:** `id`, `title`, `status` (required); `notes`, `prd`, `changes`, `branches` (optional lists, the links).
- **Tasks:** lines matching `- [ ] T<n> <text>` / `- [x] T<n> <text>`; `T<n>` unique per milestone.
- **`roadmap.md`:** fixed `##` headings: `North star`, `Principles`, `Order`, `Now`, `Waiting on you`. `Order` is a list of `- <ID>` lines; Waiting on you is `- [<ID>|general] <question> (proposed YYYY-MM-DD)`. Text between the headings is free.
- *Why:* everything the check, report and later `/kit:status` compute comes from these; everything else stays free prose for the user.
- *Alternative:* a hidden JSON block (like `decisions.md`) or a YAML source (option C). Declined by the user: a second copy goes out of sync; one big file conflicts under parallel work.

### D3. Links and unplanned work
A milestone links work through frontmatter `changes` and `branches`. Unplanned work = active OpenSpec changes (folders in `openspec/changes/` except `archive`) and local branches (except the main branch and branches merged into it), not listed by any milestone. A Ready-PRD/proposal link back is a `Milestone: <id>` line, offered by the skill.
- *Why:* both are cheap to read (filesystem and `git branch`) and match how parallel features are run (one branch or worktree per feature).

### D4. Stale Now from git dates
`check` compares the last commit date of `roadmap.md` (`git log -1 --format=%cI -- <file>`) with the branch's latest commit. If git can't answer, the finding is skipped with a note, never guessed.

### D5. The starter's roadmap question
`start-plan.mjs` gets `--roadmap yes|no|ask`. With `yes` the plan adds the template files as one more file change; `no` adds a Later line; the skill asks the question only when no `roadmap.md` exists. `SUBDIRS` is unchanged: no empty `roadmaps/` folder is created on a no.

### D6. Templates in the kit
`plugins/kit/templates/roadmap/`: `roadmap.md` (the five headings with one line of guidance each), `milestone.md`, `drift-log.md` (header row). `new` copies them; nothing project-specific in them.

### D7. Moving this repo (one-off, agent-run, script-checked)
1. Count in `docs/roadmap.md`: milestone rows, drift rows, pending items.
2. Write `knowledge/roadmaps/` through `roadmap.mjs` (`new`, `add`, `status`, `tick`, `drift`, `wait`), shortening each finished milestone to its one-line goal and an evidence link; details already live in the archived changes and `evals/trials/`.
3. Compare counts; run `check` until no broken findings.
4. Replace `docs/roadmap.md` with a 3-line pointer to the new location (kept for old links), update `CLAUDE.md`, `openspec/config.yaml`, `docs/project-context.md`; the user updates the memory note.
- *Why no converter:* only one old-format file exists; a script for it would be dead code.

## Risks / Trade-offs

- [Format too rigid for hand edits] → only the parts in D2 are checked; prose is free; findings are warnings.
- [Moving loses history] → counts compared before the old file becomes a pointer; git keeps the full old file.
- [Stale-Now false alarms on busy branches] → it's a tidy-up line with both dates, not a broken finding.
- [Unplanned-work noise from short-lived branches] → merged branches are excluded; tune after the Toughbubble trial.

## Migration Plan

D7 for this repo. Other projects: none (new projects start from the templates). Rollback: `git revert` the move commit; the old file comes back whole.
