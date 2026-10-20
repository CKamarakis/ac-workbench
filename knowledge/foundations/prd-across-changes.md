---
title: A PRD can take several changes, so the kit asks before calling it shipped
status: current
---

## In short

A PRD names one change at a time. When that change is archived, the kit asks whether the PRD is done or continues in another change, instead of telling you to mark it Shipped.

## Why (evidence)

Acme's Canvas v1 was built across three changes (canvas, clipboard, sticky-style). After the first was archived, `/kit:status` said "mark it Shipped" while more work was planned (loose end L1, 2026-10-17).

## Gives you

- No wrong "Shipped" on a PRD that is still being built.
- The PRD format stays as it is: one `change:` line.

## Limits you

- The question shows in `/kit:status` and `/kit:next` until you mark the PRD Shipped or link the next change.
- The kit doesn't track which earlier changes built a PRD.

## Revisit if

Most PRDs span several changes and the repeated question gets in the way; then give PRDs a list of changes.

## Affects

`/kit:status`, `/kit:next`, `/kit:prd`.

## History

- 2026-10-19: chosen over a list of changes per PRD (change `loose-end-fixes`, decision D1).
