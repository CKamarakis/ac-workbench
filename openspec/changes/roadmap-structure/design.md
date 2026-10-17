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
Commands: `new`, `add`, `status` (planned/active/paused/done/dropped; `done`/`dropped` also moves the file to `done/`), `task` (adds a `T<n>` line; added at apply, since `tick` and the "active without tasks" rule need it), `tick`, `order`, `now`, `wait` (adds an item), `answer` (the item leaves `roadmap.md` and a drift-log entry records question, answer, date and who decided; readiness D6), `link`, `drift` (append), `check`, `report`, all with `--dir` and `--json` like the other kit scripts. Pure functions (`parseRoadmap`, `checkRoadmap`, `reportRoadmap`) are exported for tests.
- *Why:* the PRD's main risk is the format drifting as agents write it; a script that is the only writer makes the format a property of code, and `check` covers hand edits.
- *Alternative:* the skill edits Markdown directly and only `check` runs after. Rejected: the same freehand writing that caused today's file.

### D2. Machine-readable parts are few and fixed
- **Milestone frontmatter:** `id`, `title`, `status` (required); `notes`, `prd`, `changes`, `branches` (optional lists, the links).
- **Tasks:** lines matching `- [ ] T<n> <text>` / `- [x] T<n> <text>`; `T<n>` unique per milestone.
- **`roadmap.md`:** fixed `##` headings: `North star`, `Principles`, `Order`, `Now`, `Waiting on you`. `Order` is a list of `- <ID>` lines; Waiting on you is `- [<ID>|general] <question> (proposed YYYY-MM-DD)`. Text between the headings is free.
- *Why:* everything the check, report and later `/kit:status` compute comes from these; everything else stays free prose for the user.
- *Alternative:* a hidden JSON block (like `decisions.md`) or a YAML source (option C). Declined by the user: a second copy goes out of sync; one big file conflicts under parallel work.

### D3. Links and unplanned work
A milestone links work through frontmatter `changes` and `branches`. Unplanned work = active OpenSpec changes (folders in `openspec/changes/` except `archive`) not listed by any milestone. Branches are not checked for now (readiness D5, user: branches like `m12-next` or `kit-status` would be noise); `branches` stays as an optional link for later parallel-work views. A Ready-PRD/proposal link back is a `Milestone: <id>` line, offered by the skill.
- *Why:* cheap to read from the filesystem; every planned feature gets an OpenSpec change. *Alternative:* also branches; deferred until the parallel-work view.

### D4. Stale Now from archives and merges
`check` takes the last commit date of `roadmap.md` (`git log -1 --format=%cI -- <file>`) and reports Now as stale only if a change was archived after it (folders `openspec/changes/archive/<date>-<name>`, dated by their commit) or a merge commit landed on the current branch after it (`git log --merges`). Ordinary commits never make it stale (readiness D3, user: avoid nagging after every commit). If git can't answer, the finding is skipped with a note, never guessed.

### D5. The starter only mentions the roadmap
The starter keeps its one question (readiness D1, user; this differs from the PRD, which said the starter asks). When no `roadmap.md` exists, `start-plan.mjs` adds one Later line for `/kit:roadmap`. `SUBDIRS` is unchanged: no `roadmaps/` folder is created.

### D6. Templates in the kit
`plugins/kit/templates/roadmap/`: `roadmap.md` (the five headings with one line of guidance each), `milestone.md`, `drift-log.md` (header row). `new` copies them; nothing project-specific in them.

### D7. Moving this repo (one-off, agent-run, script-checked)
1. Count in `docs/roadmap.md`: milestone rows, drift rows, pending items.
2. Write `knowledge/roadmaps/` through `roadmap.mjs` (`new`, `add`, `status`, `tick`, `drift`, `wait`). Each finished milestone's file in `done/` keeps its full old row text below its one-line goal (readiness D2, user: nothing lost); the main file stays short because finished milestones are only IDs in the order.
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
