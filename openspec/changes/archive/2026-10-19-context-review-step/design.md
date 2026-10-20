# Design

## Context

See proposal.md - Why. Evidence: the test session record in `temp/claude-stranger/projects/...acme-fresh-2/` (2026-10-19): three questions, the third "Write this draft into docs/project-context.md?" with no draft text before it and no option preview.

## Decisions

### D1 The draft lives in the message, not the question

The kit's other skills already follow this (docs sync, `/kit:docs`, the full-text-before-asking rule): show the text in the message, ask after it, never inside the options, which the question box cuts off. The skill names it as a hard rule for this step and says why: a yes to text the user can't see isn't a yes.

### D2 Ask about the source before drafting

A detailed README is a good source, but the user owns what the doc says about their project; asking first makes the step visible as being about the project, not about setup. An empty project skips the question: there is nothing to choose from.

### D3 Ask whether it's right, not whether to write

"Is this right about your project?" puts the content in front; "Write it?" read as one more setup click.

## Safeguards

Written by `/kit:ready` (`ready.mjs safeguards`) on 2026-10-19. Re-run the readiness check to change it.

| Dimension | Rating | Why |
|---|---|---|
| Reach | low | one skill's text (start step 6) and its evals |
| Undo | low | reverting the commit undoes it |
| Safety | low | no secrets, permissions, hooks or user data |

- **Recommended:** scenario-to-test check
- **Chosen:** scenario-to-test check

<!-- kit-safeguards-data {"date":"2026-10-19","ratings":{"reach":{"level":"low","why":"one skill's text (start step 6) and its evals"},"undo":{"level":"low","why":"reverting the commit undoes it"},"safety":{"level":"low","why":"no secrets, permissions, hooks or user data"}},"recommended":["scenario-check"],"chosen":["scenario-check"]} -->
