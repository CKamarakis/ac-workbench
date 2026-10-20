# Design

## Context

See proposal.md (Why). Today:
- `/kit:ready` (`ready.mjs scan` + `decisions.mjs`) finds gaps, differences, points to confirm and new tools; it writes answers into the change and never blocks.
- `/kit:verify` (`verify.mjs`) runs the policy's tests, records `/security-review` and `/code-review` findings, does the docs sync and lists changed files without tests. It already keeps a foreign `verify.md` as `verify-earlier.md`.
- The routing block (`lanes.mjs` `qualityGatesSection`) tells the agent to run `/kit:judge` at propose time.
- `/code-review` runs as a background subagent with its own context, but the text after it is only the review target, so it can't be given a spec ([docs](https://code.claude.com/docs/en/code-review-local.md)).
- Claude Code has native worktrees: `EnterWorktree` can enter a path under `.claude/worktrees/`, and fresh worktrees branch from the default branch unless told otherwise ([docs](https://code.claude.com/docs/en/worktrees.md)).
- Plugins ship agents from `agents/`, named `<plugin>:<agent>` ([docs](https://code.claude.com/docs/en/plugins-reference.md)).
- Plugin hooks are inert outside kit projects by convention (`explore-reminder.mjs`); hook stdout on exit 0 is added to the agent's context.
- Acme has its own SuperSpec schema and changes. This change doesn't touch it.

## Goals / Non-Goals

**Goals:**
- Ratings and choices are recorded in one place the scripts can read (`design.md` Safeguards), so verify and apply act on the same choice.
- The script does the bookkeeping (valid values, the recommendation from the ratings, the record); the agent does the judging, with reasons shown.
- The reminder costs nothing at session start: no network, no tokens beyond one line when due.

**Non-Goals:**
- Calibrating the cut-offs (M12).
- Per-task review, severities on review findings, team review.
- Making test-first a default.
- Automating tool updates.

## Decisions

### D1. Safeguards live in `design.md`, written by `ready.mjs safeguards`
A `## Safeguards` section with a readable table (dimension, rating, reason), the recommendation, the user's choice, and a data comment (`<!-- kit-safeguards-data {...} -->`) that `verify.mjs` and the routing rule read. The section is written only through the script, like `decisions.md`. The script validates ratings (`low|medium|high`) and computes the recommendation from them (pure function `recommend(ratings)`), so the mapping in the spec lives in one place. If `design.md` doesn't exist, the script stops and says to write the design first: a stub would make OpenSpec count the design artifact as done (decided at verify, 2026-10-18). The format (the data comment) lives in `safeguards-data.mjs`, shared by `ready.mjs` and `verify.mjs`.
- *Alternatives:* a `decisions.md` entry (the PRD says `design.md`, and decisions are questions, not a record); free text in `design.md` (verify couldn't read it reliably).

### D2. The agent rates; the script helps with reach
The skill reads `design.md` and `tasks.md` and rates each dimension with a reason. When the plan names a module but not who uses it, `ready.mjs importers --dir . --file <path>` lists the files that import or require it (text search, no parser), so the read costs one command instead of opening files.
- *Alternative:* a scored formula (files x weights) like the tools found in research. Rejected: no evidence that weights predict bugs; the cut-offs are already unverified.

### D3. Worktree: native, from the current branch
When the Safeguards choose a worktree, the routing rule tells the agent to create it from the current branch (`git worktree add .claude/worktrees/<change> -b wt/<change>`), enter it with `EnterWorktree`, tell the user the full path, and after verify offer a fast-forward merge back into the feature branch. `.claude/worktrees/` goes into `.gitignore` (the starter adds it).
- *Why not `claude --worktree` or a fresh `EnterWorktree`:* they branch from the default branch (`main`), not from the feature branch the work is on. `worktree.baseRef: "head"` would fix that but changes the project's settings for every worktree.
- *Why not Superpowers `using-git-worktrees`:* the native feature is maintained by Claude Code and enforces isolation for the session and its subagents.

### D4. Subagent build: Superpowers, on demand
When the Safeguards choose subagents, apply uses Superpowers `subagent-driven-development` with `tasks.md` as the plan, in the worktree. Superpowers stays a `project`-tier, on-demand tool; if it isn't installed, ready says so and offers the install (project scope) on a yes.

### D5. Spec reviewer: a kit plugin agent
`plugins/kit/agents/spec-reviewer.md`: read-only tools (Read, Grep, Glob, and Bash limited to `git diff`/`git log`), a prompt that takes the change's delta specs, `tasks.md` and the diff range, and reports findings as `scenario/requirement | file | what the code does vs what the scenario says`. The verify skill dispatches it and records each finding with `verify.mjs finding --source spec`. At high risk the prompt also asks for edge-case probes, recorded with `--source probe`.
- *Alternatives:* `/code-review` (can't take a spec); Superpowers `requesting-code-review` (built around its own plan files and commit ranges; this one is fitted to OpenSpec's delta specs and works without Superpowers installed).

### D6. Scenario-to-test check: name match first, the agent for the rest
`verify.mjs scenarios --change <name>` lists every scenario in the change's delta specs and marks the ones whose name appears (case-insensitive) in a test file. Test files are the ones verify already recognises for "changed files without tests" (`isTest`: `*.test.*`, `*.spec.*`), so both checks agree in any project (decided at ready, 2026-10-18). The verify skill looks at the unmatched ones, finds tests that check them, and records `verify.mjs scenario --name "<capability: scenario>" --test <path>` or `--by-hand --note "..."`. What's left is listed as advisory.
- *Why not only the name match:* this repo's tests don't always use scenario names. *Why not only the agent:* the name match is free and makes the agent's list short.

### D7. High risk in verify
`verify.mjs` reads the Safeguards data and follows the **choice**, not the ratings (decided at verify, 2026-10-18): with `security-weighted` chosen, a medium security finding becomes HARD (this is what "weighted security review" means; overridable with a reason, or resolved once fixed); with `user-ok` chosen, the report gets an open "your OK before merge" item, recorded with `verify.mjs ok`. Both are recommended when a dimension is rated high. The OK never blocks the archive; it is shown at archive like an open decision (both confirmed at ready, 2026-10-18). With no Safeguards section, verify behaves as today.

### D8. `/kit:tool-review`: script for facts, skill for judgement
`tool-review.mjs scan` reads `toolkit.yaml` and, per adopted or trial entry, gets the latest version by source kind: `npm:` → `npm view <pkg> version`; `github:` → `gh api repos/<r>/releases/latest` (tags as fallback); a plugin → the marketplace catalog; `winget:`/`brew:` → their show command where available. Anything it can't read is "unknown" with the reason. The skill reads release notes for majors, judges what to borrow, and asks update / hold / drop per tool. `tool-review.mjs record --name <tool> --action update|hold|drop [--version v] [--reason ...]` makes the targeted `toolkit.yaml` edits (`reviewed_version`, `reviewed_on`, a `dropped` verdict), then the skill runs `npm run registry`. Updates go through the project's tool-update steps (smoke before `reviewed_version`). npm package names are checked before they reach the shell (on Windows npm runs through its `.cmd` shim; found by the security review at verify, 2026-10-18). Below 1.0 a minor bump counts as major; with no releases, the highest semver tag counts as the latest.
- *Alternative:* the agent edits `toolkit.yaml` by hand. Rejected: easy to break the verdict history; a script edit is testable.

### D9. Reminder: a SessionStart hook in the kit plugin
`plugins/kit/hooks/tool-review-reminder.mjs`: inert unless `toolkit.yaml` is at the project root; reads `reviewed_on` and `status` per entry with a line scan (no YAML parser, no network); prints one context line telling the agent to tell the user that a review is due, naming the oldest tool and its age. 30 days is a constant.
- *Why the kit repo only:* the registry and its review dates live here; other projects get tool changes through `/kit:start` re-sync.

### D10. SuperSpec and jq: dropped, not deleted, in the registry
Both entries stay in `toolkit.yaml` with status `dropped` and a verdict citing the evidence (SuperSpec: `evals/trials/workflow-ab.md` and this change; jq: no remaining use). Everything else about SuperSpec is removed: schema folder, judge skill, script, tests, evals, routing line, README and project-context mentions, lane `skills`/`phases` fields. The superspec `jq` dependency text goes with it.
- **History kept as it is:** `openspec/changes/archive/`, `evals/trials/`, `evals/registry/runs/`, `knowledge/`, and the provenance comment in `tools/validate-registry.mjs`. A test lists the live paths (`plugins/`, `README.md`, `docs/`, `tools/`, `tests/`, `evals/` without its run records and trials, `.gitignore`) and fails if "superspec" or "kit:judge" appears there outside dropped registry entries and verdict history. `openspec/specs/` isn't scanned: it changes at archive, through this change's deltas.

### D11. Superpowers entry and source
The entry's `reason`, `recommend_why`, `rubric.overlap` and comments say what the kit calls (subagent-driven development for a subagent build; test-first per change when chosen) and that brainstorming and writing-plans stay skipped. The source moves to `claude-plugins-official` only if its catalog pins a commit at or after the v7.0.0 tag; then the project-local install is replaced (uninstall the marketplace one, install the official one at local scope) and `superpowers-marketplace` is dropped if nothing else needs it. If the catalog is older, the source stays and the tool review records why.

### D12. Dogfooding
This change is built before `/kit:ready` can rate safeguards, so it runs `/kit:ready` as today. After T3 is built, `/kit:ready` is run again on this change to write its own Safeguards section, as the first real test.

## Risks / Trade-offs

- [The agent's ratings drift between runs] → reasons are written next to each rating, and the user confirms the choice; calibration in M12.
- [Name matching misses tests with other titles] → the agent fills the gap (D6); the list is advisory.
- [The spec reviewer is noisy] → findings are advisory and must name a scenario; narrow the prompt after the first runs.
- [Worktree from the current branch diverges from `main`] → it's the same base the branch already has; the merge back is fast-forward only, and it stops with a message if it can't.
- [Version lookups hit rate limits or need `gh` sign-in] → "unknown" with the reason; the review continues.
- [Removing `/kit:judge` breaks a project whose CLAUDE.md routing block still names it] → `/kit:start` re-sync rewrites the routing block; the old line only points at a skill that no longer exists.

## Migration Plan

1. Build in `m12-next` (branch); no worktree for this change (see D12).
2. After archive, run `/kit:start` re-sync in this repo so the routing block loses the judge line.
3. Acme: nothing now; M12 T6 tests the upgrade.
4. Rollback: revert the change's commits; the registry entries were only re-statused, so reverting restores them.

## Open Questions

- The exact wording of the spec reviewer's prompt; tune after its first runs.

## Safeguards

Written by `/kit:ready` (`ready.mjs safeguards`) on 2026-10-18. Re-run the readiness check to change it.

| Dimension | Rating | Why |
|---|---|---|
| Reach | high | Removes the /kit:judge skill, changes the routing block and verify's HARD rules, adds a SessionStart hook: contracts other projects rely on |
| Undo | high | Most of it is in git, but the Superpowers switch changed installed plugin config outside the repo (user-scope copy removed, source moved to claude-plugins-official) |
| Safety | low | The archive gate's blocking logic is unchanged (only its reminder grew); no secrets or permissions; network is read-only version lookups |

- **Recommended:** scenario-to-test check, worktree for the build, review against the spec, edge-case probes, medium security findings block, your OK before merge
- **Chosen:** scenario-to-test check, review against the spec, edge-case probes, medium security findings block, your OK before merge

<!-- kit-safeguards-data {"date":"2026-10-18","ratings":{"reach":{"level":"high","why":"Removes the /kit:judge skill, changes the routing block and verify's HARD rules, adds a SessionStart hook: contracts other projects rely on"},"undo":{"level":"high","why":"Most of it is in git, but the Superpowers switch changed installed plugin config outside the repo (user-scope copy removed, source moved to claude-plugins-official)"},"safety":{"level":"low","why":"The archive gate's blocking logic is unchanged (only its reminder grew); no secrets or permissions; network is read-only version lookups"}},"recommended":["scenario-check","worktree","spec-review","probes","security-weighted","user-ok"],"chosen":["scenario-check","spec-review","probes","security-weighted","user-ok"]} -->
