# Design

## Context

See proposal.md (Why). What exists today:

- `roadmap.mjs` already parses the roadmap (`parseRoadmap`), builds the report rows with Left, current/next milestone and Blocking now/Later (`reportRoadmap`), and finds stale Now and unplanned work from git (`gitFindings`).
- `next.mjs` already reads PRDs and which notes changes cite (`readKnowledge`), the OpenSpec state (`openspecJson`), decisions (`decisionStatus`, `archivedOpen`) and PRD questions (`questionsLine`). Its last fallback, "No active change", suggests the brainstorm owner (`/opsx:explore`); with several active changes it silently takes the most recently modified one and lists the others.
- Kit scripts are zero-dependency Node, each with a pure core plus a thin CLI (`--dir`, `--json`), unit-tested in `tests/kit/` and paired with a skill and eval cases.

## Goals / Non-Goals

**Goals:**
- One script that gathers every fact status needs, by reusing the existing parsers, testable without a model.
- A skill that writes plain words only from those facts.
- `/kit:next` keeps every current suggestion for an item under way.

**Non-Goals:**
- The backlog file (M12a T3), explore-or-PRD for a note (M12a T4), dependency or blocker markers, technical health checks.
- Fixing mismatches: status reports them; the fix stays with `/kit:roadmap` and `/kit:prd`.
- Matching a roadmap task to a specific change (milestones link changes, not tasks), so "task not ticked though its change is archived" is left to the roadmap's existing stale-Now finding.

## Decisions

**D1. `status.mjs` gathers facts; the skill writes words.** Output is one JSON object: `overview` (description file found, built specs, recent archived changes), `sections` (now, next, said, debt, after: rows with `item`, `left`, `status`, `source`, `age`), `mismatches` (`what`, `sources`, `fix`), `missing` (roadmap, backlog, openspec, git), `handoff` (items under way, or the first candidates). Plain-text output exists for the CLI but the skill reads `--json`. *Alternative:* the model reads the files directly. Rejected: counts and states would be guessed, nothing to unit-test, more tokens per run.

**D2. Reuse, don't re-parse.** `status.mjs` imports `parseRoadmap`, `reportRoadmap`, `checkRoadmap`, `gitFindings` from `roadmap.mjs`, and `readKnowledge`, `openspecJson`, `questionsLine` from `next.mjs`, plus `decisionStatus`/`archivedOpen`. *Alternative:* a shared "project state" module refactored out of both. Deferred: bigger diff with no user-visible gain now; revisit if a third reader appears (the backlog).

**D3. Built = main specs + archived changes only.** Specs from the folders under `openspec/specs/` (as built: read straight from the files, so the result never depends on the CLI being on PATH; a missing CLI is only reported); active changes and their task counts from `openspec/changes/*/tasks.md` the same way; archived changes from `openspec/changes/archive/` folder names (date + name), newest first. PRD `Shipped`, the docs page and roadmap ticks are copies and are never used for "built". *Why:* the owner table agreed in the PRD.

**D4. Mismatch rules are a small fixed list** (spec "Mismatches shown, never resolved"): (a) active milestone with open tasks, no active change, and none of its `branches` links existing in `git branch --list`; (b) `Building` PRD whose change is archived; (c) the roadmap's `gitFindings` tidy items (stale Now) and unplanned changes, passed through with their fixes. Each is a pure function over the gathered facts, one test each. *Alternative:* a general "compare everything" engine. Rejected: unbounded, noisy, hard to test.

**D5. "Under way" means an active OpenSpec change.** Both status (Now, handoff) and next use the same definition: changes from `openspec list --json` that aren't archived. A Ready PRD without a change is a candidate (Next), not under way. *Why:* one shared fact keeps status and next from disagreeing (PRD risk "Status and next disagree").

**D6. `next.mjs` changes stay at the edges.** (a) The final fallback in `openspecStep` returns the `status` phase owner instead of `brainstorm`; the PRD rules before it are unchanged, so "Ready PRD → propose" and "notes, no PRD → /kit:prd" still win when they apply. (b) A `--change <name>` flag picks the change; without it and with more than one active change, the result carries `choose: [names]` and the skill asks the user (AskUserQuestion), then reruns with `--change`. One active change: unchanged.

**D7. Section caps and hints in the script, not the skill.** The script cuts each section to 5 rows and reports `more: N`; it adds `age` (days since the file's last commit, or since the decision date) for order hints. It never sorts by age where the roadmap gives an order. *Why:* keeps output short by rule, and testable.

**D8. Overview text comes from the first description file found.** The script reports which of `PRODUCT.md`, `docs/project-context.md`, `README.md` exists (first found wins) and its path; the skill reads that one file and writes one or two lines. *Why:* the "what it is" sentence needs a model, but the choice of file is a fact.

**D9. Items left for later: counted and listed here, managed in the backlog (readiness D4, user 2026-10-17).** Next shows the count in its "Nothing open" message; status lists each item with its source and the command that answers it. Keeping, reprioritising and closing them, and re-asking Later build decisions, belong to the backlog (M12a T3). *Why:* the data already exists in `decisions.md` and PRDs; a place to manage it is T3's job.

**D10. Built shows a count plus the 5 newest (readiness D2).** Newest by archive date of the change that last touched the spec. *Why:* keeps the overview to a few lines on big projects.

**D11. A milestone and its linked change are two rows in Now (readiness D3, user's pick).** Each keeps its own Left (milestone tasks vs change tasks) and Source. *Why:* the user's choice; the two task lists are different levels (goal vs build).

**D12. Without git, the "nothing under way" mismatch is skipped.** Rule (a) needs the branch list to know that no milestone branch exists. With git missing, or outside a repository, the rule isn't checked and `missing` says git was skipped, rather than guessing. *Why:* a false "doesn't match" is worse than a missing one.

**D13. "Left for later" counts differ on purpose (docs sync F1, user 2026-10-17).** `/kit:next`'s "Nothing open" count covers what blocks Ready (questions in Draft/Review PRDs) plus open decisions in archived changes; `/kit:status` lists every PRD's open questions, Building ones included. *Why:* next counts what holds up the next step; status shows the full list.

## Risks / Trade-offs

- [Skill adds claims the facts don't support] → the skill is told to use only the JSON; eval cases check that a fixture with no built specs shows none and that no extra items appear.
- [Acme output too long] → caps per section (D7); the manual run on Acme is part of the tasks.
- [Changing the "No active change" suggestion breaks the smoke test and next evals] → update `tools/smoke.mjs` ("next: explore" → "next: status") and the `next` eval cases in the same group as the code.
- [OpenSpec or git missing on the agent's PATH (Windows)] → `locate.mjs` as in other scripts; a missing tool becomes a `missing` entry and the rest of the report still renders.
- [Mismatch (a) fires during normal planning, before a change exists] → that is the intended nudge (propose, or update Now); the fix line says both.

## Migration Plan

Additive except the "No active change" suggestion. Rollback: revert the commit; no data or project files are written by status.
