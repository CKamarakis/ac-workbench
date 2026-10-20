---
title: Build safeguards, not SuperSpec
sources:
  - notes/kit-workflow/2026-10-17-kit-judge-keyword-criteria-are-unreliable.md
prd: prds/build-safeguards.md
---

# Build safeguards, not SuperSpec

Written by the kit (`explore.mjs`) at the end of `/opsx:explore`; saves only add.

## Decisions

- SuperSpec goes as a flow; Superpowers skills are called from OpenSpec when a change needs them
- Keep /opsx:explore and /opsx:propose; don't use Superpowers brainstorming or writing-plans
- No test-first default; still allowed per change (e.g. a failing test for a bug fix)
- The keyword judge is replaced: /kit:ready picks the safeguards from reach, undo and safety read from design.md and tasks.md, shows its reasons, and writes the answer into design.md; the user decides
- Worktrees use Claude Code's native feature (--worktree, EnterWorktree, isolation: worktree), not Superpowers' using-git-worktrees
- Subagents: a read-only reviewer by default; subagents that build only when tasks are truly independent and too long for one context, with the reason stated
- Logic bugs: a scenario-to-test check (every Given/When/Then scenario in the change has a test) plus a review against the spec
- Code review stays once at the end of apply; severities and per-task review later (team setup)
- Tool review: a monthly /kit:tool-review skill (exists? latest vs reviewed_version, release notes on a major, smoke, what to borrow, user decides) plus a SessionStart reminder hook that reads reviewed_on dates; no update on release
- Separate from M12: its own note and PRD
- Q2: New milestone M15 Build safeguards before M12; M12 paused
- Q5: Yes: /code-review runs as a background subagent with its own context and looks for correctness bugs, but it can't be given a spec (text after the command is the review target), so the review against the spec needs our own reviewer subagent or skill (code.claude.com/docs/en/code-review-local)
- Q1: Default cut-offs (unverified, calibrated in M12): reach low = one spec and no imported file changed, medium = 2+ specs or a shared module, high = a contract others rely on (CLI flags or output, file formats, skill names, hook behaviour); undo high = writes outside the repo (data, state, installed config, deleted user files, migrations); safety high = secrets, permissions, blocking hooks, user data, network writes. Low = today's flow + scenario-to-test check; any medium = + native worktree + review against the spec; any high = + weighted security review + edge-case probes + user OK before merge. /kit:ready shows why; the user can override
- Q3: Update Superpowers to v7.0.0 now, by hand, with the project's tool-update rule (release notes, smoke, reviewed_version)
- Q4: Remove SuperSpec fully: delete openspec/schemas/superspec, remove it from toolkit.yaml and the flow-recommendation spec, replace judge.mjs; rewrite the Superpowers entry to list which skills we call and when

## Open questions

