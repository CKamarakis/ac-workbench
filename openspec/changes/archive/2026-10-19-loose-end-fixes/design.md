# Design

## Context

A PRD links one change (`change:` in its frontmatter), but a PRD can be built across several changes (Acme's Canvas v1: canvas, clipboard, sticky-style).

## Decisions

### D1 Ask instead of advising Shipped

When a Building PRD's linked change is archived, `/kit:status`, `/kit:next` and `/kit:prd` ask whether the PRD is done or continues in another change; the user marks it Shipped or links the next change.

- **Why:** one archived change doesn't tell the kit the PRD is done; a wrong "mark it Shipped" hides work still planned.
- **Alternative:** a `changes:` list on the PRD, Shipped only when all are archived. Not chosen (user, 2026-10-19): it touches three skills, and the list can't know changes not yet proposed.
- **Trade-off:** the question shows until the user marks it Shipped or links the next change.
