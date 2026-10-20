# Design

## Context

See proposal.md - Why. Evidence: the user's screenshots of test A round 2 (2026-10-19), the test agent's review checked against `temp/acme-fresh-2` (CLAUDE.md block 55 lines, 5.2 KB; `.gitignore` lines 39/58 and 53/60 repeated).

## Decisions

### D1 web-ui first, Recommended only with evidence

The user's choice (2026-10-19): most kit projects are web apps, so `web-ui` leads; "Recommended" stays tied to evidence (a file such as `next.config`) so a non-web project isn't pushed the wrong way.

### D2 Two rounds of questions

The user's choice: the core three first, the two optional ones after; less to read at once, and the order says what matters most.

### D3 The CLAUDE.md block: safe trim only

Most of the block is rules the agent follows (the PRD hand-off to `/opsx:propose`, worktree builds, the archive gate); cutting them changes behaviour. Only the Owner column and the header wording are trimmed here (5,225 -> 5,074 bytes with the kit's registry). Moving long rules into the skills that use them is a separate change with its own tests, on the user's decision.

## Safeguards

Written by `/kit:ready` (`ready.mjs safeguards`) on 2026-10-19. Re-run the readiness check to change it.

| Dimension | Rating | Why |
|---|---|---|
| Reach | medium | the routing block and .gitignore block are written into every kit project on re-sync |
| Undo | low | reverting the commits undoes it; projects re-sync |
| Safety | low | no secrets, permissions, hooks or user data |

- **Recommended:** scenario-to-test check, worktree for the build, review against the spec
- **Chosen:** scenario-to-test check, review against the spec

<!-- kit-safeguards-data {"date":"2026-10-19","ratings":{"reach":{"level":"medium","why":"the routing block and .gitignore block are written into every kit project on re-sync"},"undo":{"level":"low","why":"reverting the commits undoes it; projects re-sync"},"safety":{"level":"low","why":"no secrets, permissions, hooks or user data"}},"recommended":["scenario-check","worktree","spec-review"],"chosen":["scenario-check","spec-review"]} -->
