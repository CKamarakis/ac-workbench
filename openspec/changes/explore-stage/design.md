# Design

## Context

See proposal.md (Why). What exists:

- `next.mjs`: `suggest` runs the active-change rules, then `prdSuggest` (Building PRD changed or archived; Ready PRD -> propose; notes with no PRD at all -> `/kit:prd`), then `openspecStep`, whose "no active change" branch returns the `status` owner with the leftover count. `--change` already picks one of several active changes.
- `roadmap.mjs` `reportRoadmap` gives `current` (first active milestone, else first open) and `next`, with each row's open tasks.
- `status.mjs` builds Now from active changes and the current milestone.
- `knowledge.mjs` parses and writes frontmatter; `lanes.mjs` `knowledgeSection` holds the routing rules for the knowledge folder (the loose-ends rule lives there).
- `/opsx:explore` is OpenSpec's skill; the kit can't edit it.

## Goals / Non-Goals

**Goals:**
- One small record per explore, readable and editable by the kit only.
- Next names the stage from explore to archive and, outside a flow, the roadmap's next step.

**Non-Goals:**
- A kit wrapper for explore (the user: plain `/opsx:explore` works fine).
- Hints about new notes since an explore (loose end L14).
- Next or status acting on notes.

## Decisions

**D1. Record format: frontmatter plus two lists.** `explore/<slug>.md`: frontmatter `title`, `sources` (list), `prd` (empty until linked); body `## Decisions` (`- ` lines, an answer as `- Q2: ...`) and `## Open questions` (`- Q1 ...` lines; a closed question is removed from this list and appears as a decision). Read with `parseFrontmatter` and two section parsers. *Why:* the same shape as notes and PRDs, readable in an editor, and the state can be derived from it. *Alternative:* the JSON data comment of decisions and loose ends — rejected: the record is prose the user reads before a PRD.

**D2. State is derived, never stored.** `stateOf(record)`: `prd` set -> `in-prd`; any open question -> `exploring`; else `ready-for-prd`. *Why:* a stored state could drift from the lists (the owner principle from kit-status).

**D3. Script `explore.mjs`.** `save --slug <s> --file <json>` where the JSON is `{ title, sources, decisions: [], answers: { Q2: "..." }, questions: [] }`: creates the record or appends to it (never removes), refuses unknown sources and records already `in-prd`; `link-prd --slug --prd prds/x.md`; `list [--json]` (slug, title, state, open questions). Slugs are kebab-case.

**D4. Next order.** `suggest`: active change rules -> PRD rules (notes rule removed) -> explore rules (`ready-for-prd` first, then `exploring`; several open and none named -> a choose step, `--explore <slug>` picks) -> outside a flow: roadmap step, else the existing "Nothing open" (status) message with the leftover count. The roadmap step uses `parseRoadmap` + `reportRoadmap`: the current milestone's first open task; or, if the current milestone is `active` with every task ticked, "is done" plus `report.next`. The leftover count rides along on the roadmap message too.

**D5. End-of-explore save: a skill, automatic by default (replaced 2026-10-17 during apply).** A routing block can't run a plugin script: `${CLAUDE_PLUGIN_ROOT}` is expanded only in skills and hooks, not in a project's `CLAUDE.md`. So a small save-only skill, `/kit:explore-record`, writes the record with `explore.mjs save`; it does not wrap explore. The routing rule says: at the end of `/opsx:explore`, save the record with `/kit:explore-record` by default and show what was written; the user can drop it (the skill removes what that save added). *Why:* the user wants the save to be the default; the record only grows and nothing depends on it before a PRD. *Alternatives:* add it to `/kit:capture` (blurs "capture saves ideas"); write the script path into the routing block at `/kit:start` (goes stale on every kit update). **Undo (verify S1, C2, C7):** the state before the last save is kept inside the record as a `<!-- kit-explore-undo {...} -->` comment, not in a temp file: `undo` restores it (or removes a new record), `link-prd` clears it, and a linked record refuses undo. No predictable temp path, nothing left outside the project.

**D8. Reminder hook on UserPromptSubmit.** `hooks/explore-reminder.mjs`, registered in the plugin's `hooks.json`: reads `prompt` from stdin; if the project is a kit project and the prompt starts with `/kit:prd`, `/opsx:propose` or `/kit:next`, prints one line of context ("if this session explored something whose record isn't saved, save it with /kit:explore-record first"); otherwise prints nothing. Exit 0 always; never blocks. Checked against the hooks reference (code.claude.com/docs/en/hooks, 2026-10-17): UserPromptSubmit gets `prompt`; plain stdout on exit 0 is added to Claude's context; a timed-out hook's output is discarded; `${CLAUDE_PLUGIN_ROOT}` works in plugin `hooks.json`. *Why:* there's no "explore ended" event; starting the next stage is the clearest signal. *Alternative:* a Stop hook — rejected: it fires after every reply.

**D6. `/kit:prd` draws from records.** Step 2 (shortlist) lists records `ready-for-prd` first; drafting from one uses its decisions and adds its sources; after `new-prd`, `explore.mjs link-prd`. `knowledge.mjs` is unchanged.

**D7. Status Now rows for records.** Kind `explore`, item = title, Left = open question texts (or "ready for a PRD"), status = the state, source = the record path; they count as under way in the handoff.

## Risks / Trade-offs

- [The agent forgets the end-of-explore save] -> the rule names the moment; next then falls back to the roadmap step, which still points to explore.
- [Removing the notes rule hides a project's first idea] -> the roadmap step or "Nothing open" still points to `/kit:status`, which lists notes no PRD uses.
- [Roadmap step names a task whose work is already under way in a change not linked to it] -> only reached when no change is active; status's unplanned-work mismatch covers the rest.

## Migration Plan

Additive except the removed notes rule. Existing PRDs have no record and keep working (records are optional). Projects get the explore rule on their next `/kit:start` re-sync.
