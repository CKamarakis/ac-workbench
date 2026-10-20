# Design

## Context

See proposal.md (Why). Today:
- `ready.mjs` has `recommend(ratings, { subagentsWhy })`, the `SAFEGUARDS` table and `writeSafeguards` (which needs an existing `design.md`); the shared format is in `safeguards-data.mjs`.
- `verify.mjs` follows the chosen safeguards (`chose(sg, id)`); reviews are `security`, `code`, `spec`; findings have sources with id prefixes (`S`, `C`, `V`, `X`). `projectType(dir)` reads `.claude/kit.json`.
- `knowledge.mjs set-field` allows only `status`, `change`, `title`.
- Impeccable (v4.5.2 here) writes critique reports under `.impeccable/critique/` (seen in the Acme copy); `critique` combines a design review with its detector and browser evidence; `audit` runs the bundled detector and checks each finding in context.
- Import cycle to avoid: `ready.mjs` imports `next.mjs`, which imports `verify.mjs`; `verify.mjs` must not import `ready.mjs`.

## Goals / Non-Goals

**Goals:**
- One web-ui rule, in one function, used by the PRD offer, the safeguard and the gap check.
- `ui-review` behaves like the other safeguards: recommended with a reason, chosen by the user, read by verify.
- The kit records Impeccable's findings; Impeccable does the judging.

**Non-Goals:**
- Running Impeccable's own flow, `new-work`, or its finish reviewer.
- Parsing Impeccable's report files (the agent reads them and records findings).
- Changing Impeccable's hooks.

## Decisions

### D1. `webUi(dir)` lives in a small `project.mjs`
Returns `{ webUi, why }`. A type in `kit.json` wins (web-ui or not); without one, `.claude/skills/impeccable` or a web app config file decides, using `WEB_APP_CONFIG`, the same list `/kit:start` uses for its type hint (`start-plan.mjs` imports it, so there's one rule). `ready.mjs` and `verify.mjs` both import it; `ready.mjs web-ui --dir .` exposes it to the skills. (Changed at verify, 2026-10-18: it first lived in `verify.mjs` with only `next.config.*`, and files could override a type; the code review showed both, and the user chose the shared list and type-wins.)

### D2. `ui-review` is one more safeguard id, recommended from `uiWhy`
`recommend(ratings, { subagentsWhy, uiWhy })` adds `ui-review` when `uiWhy` is given, the same way subagents work; `ready.mjs safeguards --ui-why "<files>"` passes it. The skill gives `--ui-why` only when `webUi` is true and the plan names UI files. The script refuses a chosen `ui-review` when the project isn't web-ui, so a wrong call can't add it; a reason passed for a UI review the user then dropped is neither checked nor written (code review at verify). *Alternative:* a fourth rating dimension; rejected because it isn't a level, it's yes or no.

### D3. Verify: a `ui` review row and `ui` findings
When `ui-review` is chosen, `reviewItems` adds `ui` (missing -> advisory "ui review not recorded"), `reviewed --source ui` is allowed, and `finding --source ui` records advisory findings with id prefix `I`. The finding text carries the report link (`.impeccable/critique/<file>`), which the skill takes from Impeccable's output. When chosen and `PRODUCT.md` or `DESIGN.md` is missing at the project root, `run` adds an advisory item naming the missing file and the command (`/impeccable init`, `/impeccable document`). Not chosen, in a web-ui project: the Safeguards section of the report says "ui review: not chosen" (other projects get no such line). The review and finding source lists are one constant each (`REVIEW_SOURCES`, `RESOLVABLE`). *Alternative:* parse Impeccable's report JSON; rejected, its format isn't a contract we own.

### D4. PRD offer remembered in frontmatter
`knowledge.mjs set-field` accepts `shape` with `done` or `declined`. The PRD skill checks `webUi`, judges "touches a screen" from the PRD's requirements and UX notes, and offers once unless `shape` is already set. `done` is set only after the brief is written into UX notes; a brief the user doesn't want written sets nothing, so the offer can come back. The brief goes in through the existing per-section update of "UX notes and assets". *Alternative:* remember it in the explore record; rejected, the offer happens at PRD time and the PRD may not come from a record.

### D5. Gap check: a checklist in the ready skill
No script change: in a web-ui project the skill adds, per touched screen, the empty, loading, error, permission and overflow states and copy to its gap search, listing only what the specs don't cover. This is the content of Impeccable's `harden` and `clarify`, without running them.

## Risks / Trade-offs

- [`ui-review` cost is high] -> recommended only for named UI files; dropped by the user for small changes; M12 measures it.
- [A `next.config.*` or a stray Impeccable install makes a non-UI project web-ui] -> the reason names what matched; the user can drop the offer or the safeguard.
- [Impeccable's report path changes between versions] -> the link is only text in the finding; nothing breaks if it moves.
- [The agent runs `critique` without a target and reviews the whole app] -> the verify skill names the change's UI files as the target (lesson from the M4 trial).

## Migration Plan

Built in the current branch. Existing PRDs have no `shape` field and get the offer once when next updated, only if web-ui and touching a screen. Rollback: revert the commits.

## Open Questions

- The exact wording of the `critique`/`audit` target line in the verify skill; tune on the first Acme run.

## Safeguards

Written by `/kit:ready` (`ready.mjs safeguards`) on 2026-10-18. Re-run the readiness check to change it.

| Dimension | Rating | Why |
|---|---|---|
| Reach | medium | Changes shared modules: knowledge.mjs (imported by 9 scripts) and verify.mjs (imported by next.mjs and the archive gate); the new command, flag and field are additive |
| Undo | low | Everything is in the repo; git revert undoes it |
| Safety | low | No secrets, permissions, blocking hooks or network writes |

- **Recommended:** scenario-to-test check, worktree for the build, review against the spec
- **Chosen:** scenario-to-test check, worktree for the build, review against the spec

<!-- kit-safeguards-data {"date":"2026-10-18","ratings":{"reach":{"level":"medium","why":"Changes shared modules: knowledge.mjs (imported by 9 scripts) and verify.mjs (imported by next.mjs and the archive gate); the new command, flag and field are additive"},"undo":{"level":"low","why":"Everything is in the repo; git revert undoes it"},"safety":{"level":"low","why":"No secrets, permissions, blocking hooks or network writes"}},"recommended":["scenario-check","worktree","spec-review"],"chosen":["scenario-check","worktree","spec-review"]} -->
