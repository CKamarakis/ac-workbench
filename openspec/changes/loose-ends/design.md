# Design

## Context

See proposal.md (Why). What exists:

- `decisions.mjs` already keeps a per-change record as readable Markdown plus a JSON data comment, re-rendered on every write, refusing to overwrite an unreadable file. It is the closest pattern for a list of small items.
- `roadmap.mjs` is the writer and checker of the roadmap; its `report` command is what `/kit:roadmap` shows.
- `status.mjs` (kit-status) has a Tech debt slot that says "no backlog yet" and lists `backlog` under `missing`.
- `next.mjs` builds the "Nothing open" message from `leftoverCount(knowledge, archived)`.
- The routing block (`lanes.mjs` `routingBlock`) is written into every kit project's `CLAUDE.md` by `/kit:start` and re-synced on update. `/opsx:apply` and `/opsx:archive` are OpenSpec's skills and can't be edited by the kit.

## Goals / Non-Goals

**Goals:**
- One owner for deferred items with no other owner, written only through a script.
- Capture that costs one answer per step.
- Status, next and the roadmap report read the same file through one reader.

**Non-Goals:**
- Moving or copying decisions, PRD questions or roadmap Waiting on you.
- Ranking, dates as priority, ageing out.
- Cross-project loose ends.

## Decisions

**D1. File format: Markdown table plus a JSON data comment, like `decisions.mjs`.** `knowledge/loose-ends.md` shows a readable table (ID, kind, text, important, blocks, origin, tags, state, source, date) and keeps the data in `<!-- kit-loose-ends-data {...} -->`; every write re-renders the table from the data. *Why:* one file stays readable in a PR and in an editor, and the data can't drift from the table. *Alternative:* one file per item (roadmap style) — rejected: 40 a week means hundreds of tiny files.

**D2. Script `loose-ends.mjs` with commands** `add` (one item, or `--batch <file.json>` for the end-of-step list), `important --id --on|--off [--by user|agent --reason]`, `block --id --target|--clear`, `done --id --reason`, `drop --id --reason`, `list [--json]`, `analysis [--json]`. Each validates its input (kinds, origins, IDs, targets) and writes nothing on an error. *Why:* the same shape as the other kit writers; `--batch` makes "one answer per step" one command.

**D3. `blocks` targets are checked against the owners.** Milestone IDs from `parseRoadmap`, change names from `openspec/changes/` and its archive, loose end IDs from the file. To avoid an import cycle, `roadmap.mjs` imports only the pure reader (`looseSummary`) from `loose-ends.mjs`, and `loose-ends.mjs` never imports `roadmap.mjs`: as built, its target check reads the milestone IDs (and their status) straight from the frontmatter of `roadmaps/milestones/` and `roadmaps/done/`.

**D4. End-of-step capture lives in the routing block, plus `/kit:verify`.** A new "Loose ends" rule in `routingBlock` tells the agent to collect what it puts aside during apply, verify, archive or a long chat, and to offer one numbered list at the end through `/kit:loose-ends`, pointing owned items to their owner. `/kit:verify` gets an explicit step: kept review findings go into that list as `accepted`. *Why:* the kit can't edit OpenSpec's apply and archive skills; the routing block is read in every session of a kit project. *Alternative:* a Stop hook that asks — rejected: it would fire after every reply, not at the end of a step.

**D5. Status: rows for important and blocking, counts for the rest.** "Current" = the roadmap's current milestone ID plus every active change name. Rows: open items that are important or whose `blocks` is current, important first, capped at 5 like every section; each row's answer command is `/kit:loose-ends`. Then one count line per kind for the remaining open items, `accepted` excluded. `missing` no longer lists `backlog`; with no file, the section says none yet.

**D6. Next: counted, and blockers ride along.** `leftoverCount` adds `loose` (open, not `accepted`); the message reads e.g. "5 items left for later (2 from builds, 1 PRD question, 2 loose ends)". When the change a suggestion is for has open loose ends blocking it, the suggestion carries `blocked: ["L3 Check paste from Word"]`, printed as a reminder line. It never becomes the step.

**D7. Roadmap report: one pointer line.** When there are open loose ends, `formatReport` ends with "Loose ends: N open (M important): /kit:loose-ends". The roadmap files are never touched.

**D8. Skill `/kit:loose-ends`.** Runs the script; on "add" it shows the numbered list and asks once (AskUserQuestion, multi-select) which to add and which to mark important; list, cleanup (by kind, keep or drop each, drop only on yes) and analysis. Lane map phase `loose-ends`.

**D9. Repeats bump a seen count (readiness D1).** Each item keeps `seen: [dates]` (the add date first). A `seen --id` command appends today; a `kind --id --to <kind> --reason` command changes the kind and records it. The agent matches a new loose end against open ones by meaning and offers "seen again" in the end-of-step list. *Why:* a thing that keeps coming back is the best signal for importance; duplicates would hide it.

**D10. A blocker whose target finished is a mismatch (readiness D2).** `status.mjs` adds rule (d): an open loose end whose `blocks` names a done or dropped milestone, an archived change, or a done or dropped loose end. Shown under "Doesn't match" with the fix via `/kit:loose-ends`; never cleared silently.

**D11. Accepted items can't be important (readiness D3).** `important --on` on an `accepted` item is refused; change its kind first. Keeps "nothing to do" meaning nothing to do.

## Risks / Trade-offs

- [The agent forgets to collect during a step] → the routing rule names the moments; `/kit:verify` has it as an explicit step; evals check the rule text is present.
- [Too much marked important] → the mark records who set it and why; the analysis shows the share of important items.
- [Kind or origin lists turn out wrong in use] → they are constants in one place; the analysis will show if `note` or `build` never appear.
- [The PRD's capture of "later" said in chat depends on the agent noticing] → it's a rule, not a guarantee; the M12 week of use is the check.

## Migration Plan

Additive. Projects get the routing rule on their next `/kit:start` re-sync. No file is created until the first loose end is added. Rollback: revert; an existing `loose-ends.md` stays as a readable table.
