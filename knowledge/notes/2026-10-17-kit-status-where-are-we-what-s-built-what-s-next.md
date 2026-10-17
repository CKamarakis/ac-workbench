---
title: kit:status – where are we, what's built, what's next
date: 2026-10-17
tags:
  - kit-status
  - kit-next
  - onboarding
source: voice
---

**Problem:** after a week of coding I don't know what I was doing or where I stopped. When I reopen a project I don't remember the details. The `/kit:next` output and Claude Code's job list are hard to read: one cut-off line per item, no context.

**Want:** a `/kit:status` command that shows a small, readable table:
- **Project:** what it is, in plain words.
- **What's built** so far.
- **What I'm working on:** the feature or topic in plain words (not codes like "M12" or a branch name), and where I stopped in it.
- **Next step** in that feature, with the command to copy and paste (e.g. `/kit:prd`).
- **If that feature is finished:** the last thing worked on, and what's next in the backlog, so I can start the next item.
- **Priorities and roadmap:** what's been set as priorities, what's next.

**Also:** a command to show what's next in the backlog in general.

**Use case:** after installing or updating the kit in a project (e.g. Toughbubble), run it to understand the project: what's built, the priorities, the roadmap. You lose track of what you're building and what's next, so status matters.

**Decided (2026-10-17):** goes into v1, and it's part of the pitch. `/kit:next` stays, and keeps giving a copyable command.

**Related:** `2026-10-12-next-on-roadmap-and-pending-tasks.md` (the "what's waiting" list, which this command would cover).
