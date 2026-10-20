---
title: Build safeguards
status: Shipped
sources:
  - notes/kit-workflow/2026-10-17-kit-judge-keyword-criteria-are-unreliable.md
  - notes/kit-workflow/2026-10-18-build-safeguards-and-existing-tools-usage-and-purpose.md
change: build-safeguards
---

<!-- Keep it to one or two pages. Every section should help someone decide or build. Write "Unknown" or move it to Open questions rather than guessing. -->

## Problem

`/kit:judge` picks OpenSpec or SuperSpec from keywords ("session", "tokens", "unknown"), so its recommendation can't be relied on and every one turns into an argument. SuperSpec only enforces Superpowers skills that OpenSpec can call anyway, at ~5x the cost on the one A/B we ran. Meanwhile, nothing decides when a change needs a worktree, a fresh-context reviewer or subagents. Logic bugs, the hardest to find later, aren't checked against the spec. Tools also drift: Superpowers was a major version behind, and a user-scope copy broke a project rule without anyone noticing.

**Bet:** if `/kit:ready` picks safeguards from what a change touches, and verify checks the logic against the spec, we get fewer logic bugs at lower cost than a whole second flow, because the expensive safeguards only run where the risk calls for them.

## Users

The kit's owner, building solo with an AI agent. Later: a team (per-task review and severities are kept for then).

## Goals and success measures

- **Goal:** each change gets the safeguards its risk needs, with reasons, and the user decides.
- **Measure:** the recommendation is based on reach, undo and safety, with zero keyword matches; every scenario in a change has a test or is listed by verify; the tool review flags a tool more than one version behind.
- **Must not get worse:** the cost of a low-risk change. It stays today's flow plus one cheap check.

## Scope

**In:**
- Remove SuperSpec: `openspec/schemas/superspec`, the `flow-recommendation` spec, `judge.mjs`; its `toolkit.yaml` entry stays as `dropped`, with a verdict citing the evidence.
- Drop jq in the registry: its only use was SuperSpec's setup.
- Rewrite the Superpowers entry: which skills we call and when.
- `/kit:ready` picks safeguards from reach, undo and safety, and writes them into `design.md`.
- Native Claude Code worktrees; a read-only reviewer subagent that reviews against the spec.
- Scenario -> test check in `/kit:verify`.
- `/kit:tool-review` plus a reminder hook at session start.
- Switch the Superpowers source to `claude-plugins-official`, after checking that it carries v7.0.0.

**Out (and why):**
- Test-first as a default: the evidence is mixed and costs 3-8.5x tokens. It stays allowed per change.
- Superpowers brainstorming and writing-plans: `/opsx:explore` and `/opsx:propose` cover them.
- Per-task review and severities: later, for teams.
- Subagents that build by default: only when tasks are independent and too long for one context.
- Calibrating the cut-offs: M12, on Acme.

## Requirements

**Ready: safeguards**
- Given a planned change, when I run `/kit:ready`, then it rates reach, undo and safety as low, medium or high from `design.md` and `tasks.md`, with the reason for each.
- Reach is rated from `design.md` and `tasks.md` first; ready reads the named files (e.g. who imports a module) only when the plan doesn't say.
- Given the ratings, then it recommends: all low = today's flow; any medium = + native worktree + review against the spec; any high = + weighted security review + edge-case probes + my OK before merge.
- Given a recommendation, when I accept or change it, then the choice is written into `design.md`, and apply follows it.
- Building with subagents is recommended only when the tasks are independent and too long for one context, and the reason is stated.
- Words like "payments" or "session" alone never change a rating.

**Verify: logic bugs**
- Given a change with Given/When/Then scenarios, when I run `/kit:verify`, then each scenario without a test is listed.
- Given a medium or high change, when verify runs, then a fresh-context reviewer gets the spec, tasks and diff, and reports where the logic doesn't do what a scenario says.
- `/code-review` stays as it is, once at the end.

**Tool review**
- Given `reviewed_on` dates in `toolkit.yaml`, when a session starts and the oldest is over 30 days, then I see one line: a tool review is due.
- Given I run `/kit:tool-review`, then for each tool I see: does it still exist, latest vs `reviewed_version`, the release notes for a major version, smoke result, anything worth borrowing; and I choose update, hold or drop.
- Nothing is updated without my yes.

**SuperSpec removed**
- Given the kit after this change, then no file, skill, lane or spec refers to SuperSpec, except git history and the archive.

## UX notes and assets

Flow: propose -> **ready (safeguards, reasons, my choice)** -> apply in a branch or worktree -> **verify (scenario -> test, spec review)** -> archive. The hook makes no network call; the review does.

## Risks

| Risk | How we'd notice | What we'd do |
|---|---|---|
| Wrong cut-offs: too many or too few safeguards | Acme runs (M12) | Calibrate them there |
| The spec reviewer flags noise | Findings you dismiss again and again | Narrow its prompt; make it advisory |
| Worktree friction (dependencies, `.env`, files out of view) | Builds failing in the worktree | `.worktreeinclude`; give full paths |
| The reminder hook nags | You ignore it | Longer interval; snooze |

## Open questions

-
