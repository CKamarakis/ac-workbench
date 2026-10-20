# Proposal

## Why

Three loose ends marked important were checked on 2026-10-19 (drift entry that day). Two lose the user's words: `roadmap.mjs add` and `order` turn a line the user wrote under `## Order` into `- null` (L9), and `roadmap.mjs answer` without `--answer` deletes the question and logs "undefined" (L10). Both reproduced in a throwaway roadmap. The third gives wrong advice on a real project: when a `Building` PRD's linked change is archived, `/kit:status` and `/kit:next` say "mark it Shipped", but a PRD can be built across several changes (Acme's Canvas v1 has three), so it may not be done (L1, blocks M12). The user chose to have the kit ask instead of advise, rather than giving PRDs a list of changes.

## What Changes

- `roadmap.mjs add` and `order` keep every line under `## Order` that isn't a milestone ID, in place, instead of turning it into `- null` (L9).
- `roadmap.mjs answer` refuses without a non-empty `--answer`, and changes nothing (L10).
- `/kit:status` (mismatch) and `/kit:next` (suggestion) word the archived-change case as a question: is the PRD done, or does it continue in another change? The fix offered is `/kit:prd`: mark it Shipped, or link the next change, on the user's yes (L1).
- L15 (false mismatch during an explore) did not reproduce on 2026-10-19 and is closed in loose-ends, not changed here.

```
Building PRD, linked change archived
  before: "mark it Shipped"                     (wrong when the PRD continues)
  after:  "done, or does it continue in another change?"
           -> /kit:prd: mark Shipped, or link the next change (on a yes)
```

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `roadmap`: a new requirement that roadmap writes never lose the user's text (order lines, answers).
- `project-status`: the "PRD not marked Shipped" mismatch asks instead of advising Shipped.
- `skill-routing`: the archived-change suggestion asks instead of advising Shipped.

## Impact

- **Code:** `plugins/kit/scripts/roadmap.mjs` (`addMilestone`, `setOrder`, `resolveWaiting`), `plugins/kit/scripts/status.mjs` (mismatch b), `plugins/kit/scripts/next.mjs` (archived-change reason).
- **Tests:** `tests/kit/roadmap.test.mjs`, `tests/kit/status.test.mjs` (asserts "mark it Shipped" today), the next tests; evals whose expected text names "Shipped" are checked.
- **Skills:** `/kit:status` and `/kit:next` text only if they quote the old wording (checked during apply).
- **Kit version:** a patch bump, so projects pick up the fix on re-sync before the Acme tests.
