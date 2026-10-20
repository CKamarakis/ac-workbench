# Proposal

PRD: `knowledge/prds/build-safeguards.md @ d802dcd`
Milestone: M15 (T2-T5)

## Why

`/kit:judge` picks OpenSpec or SuperSpec by matching words ("session", "tokens", "unknown"), so its advice can't be trusted, and SuperSpec only enforces Superpowers skills that OpenSpec can call anyway, at ~5x the cost in the one A/B (`evals/trials/workflow-ab.md`). Nothing decides when a change needs a worktree, a fresh-context reviewer or subagents; logic bugs aren't checked against the spec; and tools drift unnoticed (Superpowers was a major version behind, with a stray user-scope copy). The user decided on 2026-10-18 (explore record `knowledge/explore/build-safeguards.md`) to drop SuperSpec and let the kit pick safeguards per change instead.

## What Changes

- **BREAKING: SuperSpec and `/kit:judge` removed.** The `judge` skill, `judge.mjs`, its tests and evals, the `flow-recommendation` capability, the `openspec/schemas/superspec` folder and the routing-block judge line go. The SuperSpec registry entry stays as `dropped`, with a verdict citing its evidence (decided 2026-10-18, so the registry keeps its verdict history); it is never offered or installed. **jq** is dropped too: its only purpose was SuperSpec's setup. History records (archive, `evals/trials/`, `evals/registry/runs/`, `knowledge/`) are kept as they are.
- **Superpowers entry rewritten**: no longer "only through SuperSpec"; it names the skills the kit calls and when (subagent build, test-first per change). Its source moves to `claude-plugins-official` if that catalog carries v7.0.0 (unverified today).
- **`/kit:ready` picks safeguards.** It rates **reach**, **undo** and **safety** as low / medium / high from `design.md` and `tasks.md` (reading the named files only when the plan doesn't say), recommends safeguards with the reason for each, and writes the user's choice into a `## Safeguards` section of `design.md`. Keywords alone never change a rating. Default cut-offs are unverified; M12 calibrates them.
- **Apply follows the choice** (routing-block rule): a native Claude Code worktree when chosen; subagents that build only when chosen (independent tasks, too long for one context).
- **`/kit:verify` catches logic bugs:**
  - **scenario -> test check** (every change): each Given/When/Then scenario in the change's delta specs without a matching test is listed (advisory);
  - **review against the spec** (medium or high): a new read-only kit reviewer agent gets the spec, tasks and diff in a fresh context and reports where the logic doesn't do what a scenario says (advisory);
  - **high**: edge-case probes from the same reviewer, medium security findings also block, and the user's OK before merge is recorded.
  - `/code-review` stays as it is: once, at the end.
- **New `/kit:tool-review`** (monthly, on demand) and a **SessionStart reminder hook**: per tool, does it still exist, latest vs `reviewed_version`, release notes on a major version, smoke result, anything worth borrowing; the user picks update, hold or drop. Nothing updates on its own. The hook reads `reviewed_on` dates, makes no network call, and says one line when the oldest is over 30 days.

```
 propose --> /kit:ready ---------------------------> apply ----------------> /kit:verify --> archive
             rates reach / undo / safety              branch (low)            scenario -> test (always)
             recommends, you choose                   worktree (medium+)      spec review (medium+)
             writes design.md "## Safeguards"  -----> subagents (if chosen)   probes, sec. weighted,
                                                                              your OK (high)
                                                                              /code-review (as today)

 session start --> reminder hook (reviewed_on > 30 days?) --> "run /kit:tool-review"
                                                               exists? latest? notes? smoke? borrow?
                                                               you decide: update / hold / drop
```

## Capabilities

### New Capabilities
- `tool-review`: the monthly tool review (`/kit:tool-review`) and the session-start reminder.

### Modified Capabilities
- `build-readiness`: new requirement for safeguard ratings, recommendation and the `## Safeguards` record.
- `quality-gates`: scenario -> test check; review against the spec for medium/high changes; high-risk additions; the "earlier report" scenario no longer names SuperSpec.
- `flow-recommendation`: all requirements removed (the capability goes).
- `skill-routing`: the routing block drops the judge rule and gains the safeguards-in-apply rule; the lane-map example no longer names SuperSpec.
- `project-starter`: opt-in tool examples name Superpowers instead of SuperSpec.
- `skill-evals`: the A/B example names a generic second setup instead of SuperSpec.

## Impact

- **Removed:** `plugins/kit/skills/judge/`, `plugins/kit/scripts/judge.mjs`, `tests/kit/judge.test.mjs`, `evals/judge/`, `openspec/schemas/superspec/`, `openspec/specs/flow-recommendation/` (at archive), the judge step in `tools/smoke.mjs`.
- **Changed:** `plugins/kit/skills/ready/SKILL.md`, `plugins/kit/scripts/ready.mjs`, `plugins/kit/skills/verify/SKILL.md`, `plugins/kit/scripts/verify.mjs`, `plugins/kit/scripts/lanes.mjs` (routing block), `plugins/kit/hooks/hooks.json`, `toolkit.yaml` and generated `plugins/kit/data/toolkit.json`, `README.md`, `docs/project-context.md`, `.gitignore` comment, tests under `tests/kit/`.
- **New:** `plugins/kit/skills/tool-review/`, `plugins/kit/scripts/tool-review.mjs`, `plugins/kit/hooks/tool-review-reminder.mjs`, `plugins/kit/agents/spec-reviewer.md` (a plugin agent, `kit:spec-reviewer`), eval cases for the new skill.
- **Other projects:** a project with existing SuperSpec changes (Acme) keeps its own schema folder; the kit no longer offers or installs SuperSpec there. Verify still keeps a foreign `verify.md` as `verify-earlier.md`.
- **Network:** only `/kit:tool-review` reaches the network (npm, GitHub releases, marketplace catalogs); the hook never does.
