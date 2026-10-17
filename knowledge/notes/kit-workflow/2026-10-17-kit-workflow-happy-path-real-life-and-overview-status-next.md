---
title: "Kit workflow: happy path, real life, and overview / status / next"
date: 2026-10-17
tags:
  - kit-workflow
  - kit-status
  - kit-next
  - backlog
  - parallel-work
source: voice
---

**Context:** with more experience building projects, I see a happy path and other needs.

**Happy path (still has asterisks):**
idea or notes → `/kit:capture` → PRD → `/opsx:propose` → judge OpenSpec vs SuperSpec → `/opsx:apply` → `/kit:verify` → `/kit:docs` → push
- Unclear to me: where `/opsx:explore` and the PRD fit.
- The happy path needs to be clear in our docs and the README.

**Real life, outside the happy path:**
- I won't always have the attention, clarity or resources to start and finish something; things come in the middle.
- Tasks leave technical debt; bugs and improvements get put off.
- Bigger plans, like a release, sit above single features.
- I stop somewhere, want to continue, or my priorities change.
- Maybe this isn't the place for a project's roadmap, and yet here we are.

**Unclear today:**
- Do `/kit:next` and `/kit:ready` overlap?
- `/kit:next` seems to work inside one feature or goal. There's no view across them.

**What I want, broken up into reusable parts:**
- **Overview** (e.g. `/kit:overview`, for a new or existing project): what is this, what's built, where is it at. On Toughbubble some files don't exist, so it has to start from what's there and still be useful right away. A new user should see the value immediately.
  - Later, not now: a tool to check the technical side (e.g. vulnerabilities).
- **Status** (`/kit:status`): where we are now, what we're building, the next priority features, what to do next or in parallel, my top 3 from the backlog.
- **Backlog:** what's to do and what's been proposed. It can be called on its own or reused by other commands. I want to prioritise and deprioritise items there.
- **Next** (`/kit:next`): the one task to do right now inside the current project and goal: write more notes, a PRD, propose, apply, verify, or make a decision.
- **Flow when I come back:** status → I agree → next. Or status → backlog to reprioritise → next.

**Parallel features:**
- I often want two or three features at once on different agents, when they don't touch each other. Example on Toughbubble: notes improvements, the next stage of Storms, and a new Scrum/Kanban task board.
- Is this supported now? Would next and status collide? It should be supported. I don't have a solution, and I don't know what to search for yet.

**To do in explore:** research online what others do for overview, status, backlog and parallel work. Play with the criteria for what "useful" means.
