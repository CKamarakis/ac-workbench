# Design

## Context

See `proposal.md` (Why). What exists today and shapes the approach:
- **Kit pattern:** zero-dependency scripts do the deterministic work (`plugins/kit/scripts/*.mjs`, tests in `tests/kit/`, `node --test`); skills do the judgment and talk to the user. Reports with a data block are already used by `verify.mjs`: `verify.md` holds a rendered report plus `<!-- kit-verify-data {...} -->`.
- **`next.mjs`** maps OpenSpec status to a phase (`artifacts` → `plan` → `build` → `verify` → `close`) and looks up the owner in the lane map. It already parses the proposal's `PRD: <path> @ <commit>` line (`PRD_LINE`).
- **`lanes.mjs`** writes the routing block, including the `/opsx:propose` PRD rule and the context7 rule. Phases come from `toolkit.yaml` (`phases:`), and the kit entry owns `capture`, `prd`, `verify`, `kit-issues`.
- **`archive-gate.mjs`** is a PreToolUse(Bash) hook that denies `openspec archive` without a passing `verify.md`.
- **Apply receipts:** SuperSpec writes `apply.md` with "Rulings made during apply" and "Visible changes worth knowing" (seen in Toughbubble's `storms-canvas`). Plain OpenSpec's apply writes no receipt.
- **Questions UI:** `AskUserQuestion` takes 1–4 questions per call, with 2–4 options each, plus an automatic "Other".

## Goals / Non-Goals

**Goals:**
- One shared decision record that the readiness check, docs sync, `/kit:next`, verify and the archive gate all read.
- Deterministic signals (vague words, dependency diffs, "docs stopped" dates) come from scripts and are unit-tested. Judgment (gaps, differences, sorting) stays in the skills.
- Nothing new can block a build or an archive.

**Non-Goals:**
- The docs page, feature tree, foundation cards, tools inventory and backfill (change `kit-docs`).
- Dependency checks beyond `package.json` (Python, Go and others get a one-line "skipped").
- Changing OpenSpec's or SuperSpec's own skills.

## Decisions

### D1: Two scripts, split by lifetime
- `decisions.mjs` owns `decisions.md`. Commands:
  - `add --kind --text --from [--options a|b|c --recommended a]`
  - `decide --id --answer --written <path>`
  - `later --id`
  - `ready-done`
  - `list [--open] [--json]`

  It exports `decisionStatus({ dir, change }) → { exists, open, oldest, readyAt }` for `next.mjs`, `verify.mjs` and the archive gate.
- `ready.mjs scan --dir . --change <name> --json` (read-only). It returns:
  - the artifact paths;
  - the linked PRD (reusing `PRD_LINE` from `next.mjs`);
  - vague-word hits as `file:line: text`;
  - requirements and their scenario counts;
  - the project's dependencies from `package.json`, or `null`.

**Why two:** the record is shared by five callers and outlives the check; the scan is only the readiness check's input. **Alternative:** one `ready.mjs` doing both, rejected because `verify.mjs` and the hook would import a module named for a different step.

### D2: `decisions.md` mirrors `verify.md`
A rendered Markdown table (id, kind, question, status, answer, where written, dates) plus `<!-- kit-decisions-data {...} -->` holding the JSON state. The JSON is the source; the table is re-rendered on every write. A hand edit to the table is overwritten, and that is acceptable, because the spec says script-only.

- **Ids:** `D1`, `D2`… in order of creation, never reused.
- **The readiness stamp** (`readyAt: { date, commit, items }`) is set by `ready-done`, even when there were zero items. That is how `/kit:next` knows the check ran.

**Alternative:** YAML frontmatter, rejected because the list grows long and `verify.mjs` already has a tested pattern.

### D3: Where open decisions show up
- `next.mjs`, in the build branch:
  - if no task is checked and `readyAt` is missing → suggest phase `ready`, with `then: /opsx:apply`;
  - any suggestion for a change with `open > 0` gets `"N decisions still open since <oldest>"`.
- `verify.mjs run` adds an ADVISORY item for open decisions. It never adds a HARD item for them.
- `archive-gate.mjs`, when it allows the archive and `open > 0`, returns `hookSpecificOutput.additionalContext` with the same line (D6).

### D4: Readiness check flow (`/kit:ready`)

```
ready.mjs scan --json ---> agent reads PRD + artifacts + scan
        |                      |
        |              items: gap / difference / confirm / new-tool
        v                      v
  show "N decisions for you" (full list, counted) first
        |
  ask in batches of <= 4 questions (AskUserQuestion), 2-3 options + "Later"
        |
  each answer: decisions.mjs add ... then
     answer -> edit delta spec (scenario) or design.md -> decisions.mjs decide
     Later  -> decisions.mjs later
        |
  openspec validate <change> --strict   (after any edit)
  decisions.mjs ready-done ---> "You can build now; K still open."
```

- "Later" uses one of the four option slots, so an item gets at most three real options. "Other" lets the user type their own answer.
- More than 4 items: the batches run back to back in the same turn, ordered by impact (confirm items first, then differences, gaps, tools). Before the first batch, the user can answer "later for all of the rest".
- The new-tool check is agent judgment over the scan's dependency list ("does an existing package cover this purpose?"), not a lookup table.

### D5: Docs sync inside verify
- `verify.mjs docs-scan --json` (read-only) returns:
  - `docsUpdated`: the last commit touching the change's planning artifacts (`proposal.md`, `design.md`, `tasks.md`, `specs/**`), excluding `verify.md`, `decisions.md` and `apply.md`;
  - `codeCommitsSince`: commits after that one touching paths outside `openspec/`;
  - `receipt`: list items under `apply.md` headings matching /ruling|visible change|decision/i, or `null`;
  - `deps`: `{ added, removed }` between `package.json` at the change's base commit and HEAD. The base is the same one the changed-files check already uses.
- The agent sorts each item (behavior / decision with depth / how the build ran) and flags any that could be unwanted. It proposes the text and its location, writes on a yes, and records each item through `decisions.mjs`.
- `verify.mjs docs-sync --proposed N --written N --declined N --left-out N --unplanned <pkg,...>` stores the summary for the report's docs-sync section.
- **Adding a scenario to a requirement that the change's delta doesn't already contain** means copying the whole requirement under `## MODIFIED Requirements` (an OpenSpec rule; a partial copy loses text at archive). The skill says so explicitly, and validation runs after each edit.

**Why direct edits, not `/opsx:update`:** the items are small and already located; `/opsx:update` re-reads and reconciles the whole change, which costs far more tokens per item. **Alternative:** a separate `/kit:sync` skill, rejected because the user asked for it at verify time, and verify already runs right before archive.

### D6: Archive reminder through the existing hook
`gate()` returns `{ deny }` or `{ context }`. On allow with open decisions, the hook prints `{"hookSpecificOutput": {"hookEventName": "PreToolUse", "additionalContext": "..."}}` with no `permissionDecision`, so normal permissions still apply. The hooks docs list PreToolUse among the events that accept `additionalContext` (code.claude.com/docs/en/hooks, "Add context for Claude"). **Not yet tested here.** **Fallback** if it doesn't reach the agent: the verify report and `/kit:next` already carry the reminder, so the spec is met through them, and the hook change is dropped (recorded in the trial notes).

### D7: Registry and routing
- `toolkit.yaml`:
  - `phases:` gets `ready` after `plan`;
  - the kit entry gets `ready: /kit:ready`;
  - `situations` gets "the plan is done; check it's ready to build → /kit:ready".
- `lanes.mjs` routing block, two lines:
  - after planning is complete, run `/kit:ready` before `/opsx:apply`; it warns, never blocks;
  - the proposal step writes scenarios from the PRD's Given/When/Then stories, and adds `- **GIVEN**` when a behavior depends on a starting state.
- `templates/prd.md`: the Requirements section asks for stories ("Given … when … then …"), grouped by flow or screen, with a one-line example.

### D8: Version and evals
- Kit 0.6.0.
- `evals/ready/cases.yaml`:
  - trigger cases ("is this ready to build?", "check the plan before apply");
  - non-trigger cases ("verify the change", "what's next");
  - judgment cases with a rubric: finds a planted missing error case; finds a planted PRD/spec difference; recommends reusing a planted overlapping dependency.
- `evals/verify/cases.yaml` gains docs-sync cases: it sorts a planted process ruling as left out, and flags a planted "corrupt data shows empty".

## Risks / Trade-offs

- [The readiness check asks too much and becomes noise] → items are ordered by impact, there's a "later for the rest" option, and small or preference choices are excluded by the same rule as the docs sync. Tune it after the Toughbubble trial.
- [`apply.md`'s headings are SuperSpec's and may change] → the receipt is optional input. The heading match is loose, and with no match the sync falls back to commits and diff (and says so).
- [Plain OpenSpec builds leave no receipt, so the sync has less to go on] → commits and diff are the backstop. If it proves thin, the routing block could ask `/opsx:apply` to note rulings in `tasks.md` (a later change, not this one).
- [A MODIFIED copy for one new scenario is easy to get wrong] → the skill copies the full requirement block from the main spec, and `openspec validate --strict` runs after every edit.
- [Token cost: the check reads the PRD and all artifacts] → it runs once per change, on demand. The scan does the mechanical parts. Token use is measured in the Toughbubble trial.
- [`/kit:judge` flagged this change as risky through "permissions" and "backfill"] → both are false positives (the user chose OpenSpec). "backfill" as a migration word is worth an eval case in a later judge tweak, not here.

## Migration Plan

- Existing projects get the routing lines and the `ready` phase on their next `/kit:start` re-sync. Nothing else changes until `/kit:ready` is used.
- Changes without `decisions.md` behave as today (no reminders), apart from `/kit:next` suggesting `/kit:ready` once for a change whose planning is complete and whose tasks are untouched.
- **Rollback:** revert the kit version. A `decisions.md` left in a change folder is plain Markdown and harmless.

## Open Questions

- The exact vague-word list. Start with `TBD`, `TODO`, `etc.`, `fast`, `nice`, `simple`, `should probably`, and `?` inside a requirement line, then tune it from the trial.
