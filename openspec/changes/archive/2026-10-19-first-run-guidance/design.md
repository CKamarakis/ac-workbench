# Design

## Context

See proposal.md - Why. Evidence: test A screenshots (2026-10-19) and the status run on `temp/acme-fresh`; the five questions were agreed with the user the same day (loose end L26).

## Decisions

### D1 "New project" means nothing to read and nothing built

The kit set it up (its knowledge folder exists), and it has no notes (valid, invalid or `.txt` not imported yet), no PRDs, no explore records and no changes (active or archived). Main specs alone don't count: in a kit project they come from archived changes. One helper, `isNewProject` in `next.mjs`, is the test for `/kit:next`, `/kit:status` and, through `next.mjs`, `/kit:start`'s last step (verify findings S3, C2, C7, C8). A project with history and nothing open keeps today's "Nothing open", and so does a project without a knowledge folder (the existing skill-routing scenario "No knowledge folder": same suggestion as before). The same test in `/kit:next` and `/kit:status`, so they agree.

### D2 A blank context doc is recognised by its template lines

A doc counts as blank when every line in it, apart from headings, the title and the intro line, is a line of the kit's template (the current one or the previous one, so docs made by older kits are recognised too). Any line the user wrote makes it not blank. No marker to remove, so a user who never runs the fill step isn't punished.

### D3 The fill step lives in the skill, not a script

Drafting from a README needs reading and judgement, which is the agent's job; the script side stays as is (`start-apply` creates the template). The skill drafts, shows the full text, and writes with the user's yes, only in the run that created the doc. The rule "never edit `docs/project-context.md` once it exists" stays for every other case.

### D4 Template sections follow the five questions

Problem, Users, What it does, Rules the agent must follow, Not now; then Decided, Open questions, Links as before. Each with a hint and an example. Existing docs keep their sections: they're the user's.

### D5 First steps name the lane owners

`/kit:next` takes the capture and brainstorm owners from the lane map (as it does for every reason since kit-debt-fixes L17); the start and status skills name `/kit:capture` and `/opsx:explore` in their text.

## Risks / Trade-offs

- [A README that describes something else, such as a template's boilerplate] -> The draft is shown in full and written only on a yes; the user can switch to the questions.
- [More questions at setup] -> One offer, skippable with "later"; the setup question itself stays one.

## Safeguards

Written by `/kit:ready` (`ready.mjs safeguards`) on 2026-10-19. Re-run the readiness check to change it.

| Dimension | Rating | Why |
|---|---|---|
| Reach | medium | four specs and two shared scripts (status.mjs imports next.mjs) |
| Undo | low | reverting the commits undoes it; nothing written outside the repo |
| Safety | low | no secrets, permissions, blocking hooks or user data |

- **Recommended:** scenario-to-test check, worktree for the build, review against the spec
- **Chosen:** scenario-to-test check, review against the spec

<!-- kit-safeguards-data {"date":"2026-10-19","ratings":{"reach":{"level":"medium","why":"four specs and two shared scripts (status.mjs imports next.mjs)"},"undo":{"level":"low","why":"reverting the commits undoes it; nothing written outside the repo"},"safety":{"level":"low","why":"no secrets, permissions, blocking hooks or user data"}},"recommended":["scenario-check","worktree","spec-review"],"chosen":["scenario-check","spec-review"]} -->
