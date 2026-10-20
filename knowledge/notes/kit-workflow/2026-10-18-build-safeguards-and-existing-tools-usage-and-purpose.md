---
title: Build safeguards and existing tools usage and purpose
date: 2026-10-18
tags:
  - kit-workflow
  - kit-judge
  - kit-ready
  - tools
source: explore/build-safeguards.md
---

Explore 2026-10-18; full decisions and open questions in `knowledge/explore/build-safeguards.md`. For a new PRD, separate from M12.

- **Drop SuperSpec.** Call Superpowers skills from OpenSpec when a change needs them; keep `/opsx:explore` and `/opsx:propose`.
- **Replace the keyword judge.** `/kit:ready` picks the safeguards from reach, undo and safety (read from `design.md` and `tasks.md`), shows its reasons and writes the answer into `design.md`; the user decides.
- **Safeguards:** native Claude Code worktrees; a read-only reviewer subagent; subagents that build only when tasks are independent and too long for one context; no test-first default.
- **Logic bugs:** a scenario -> test check, plus a review against the spec.
- **Tool review:** a monthly `/kit:tool-review` plus a reminder hook at session start; know what changed and what to do, without updating on release.
