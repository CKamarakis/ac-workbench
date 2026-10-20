## Why

The M13 T6 eval walk-through (2026-10-20) led to a principle from the user. The kit is for creating products, not for filling a process. You can enter at any step: improve an old PRD, write notes now and explore later, skip steps. **But what passes between steps must be right.**

Three kit behaviours push a fixed order or nag:
- `/kit:capture` offers a PRD update after every note.
- `/kit:status` says "N notes nothing has read yet", and `/kit:next`'s skill text still claims to check "notes with no PRD yet", although its spec already says notes alone lead to no suggestion.
- The PRD → propose routing rule sorts several Ready PRDs by date and expects a Ready status.

The 36 written judgment cases (M13 T6) were never run: the eval runner can't run prompts. The user chose real runs on real projects over automated prompts:
- a one-page **test sheet**, run by the user, once before a release on a copy of a real project (Acme);
- the same sheet, one row at a time, whenever a step feels off.

## What Changes

- **`/kit:capture` only saves.** No PRD scan or offer after a note.
- **No notes nudge:** `/kit:status` drops the unused-notes line, and `/kit:next`'s skill text drops "notes with no PRD yet". Notes are read when the user starts an explore or a PRD.
- **PRD → propose, loose but linked:**
  - propose takes one PRD, any status, as its main input;
  - when it isn't obvious which, it takes the most recently updated one, says so, and the user can switch (or it asks);
  - it never blocks;
  - the proposal keeps one `PRD:` line, the link `/kit:next` uses;
  - "Building" stays a yes-only offer.
- **Test sheet** (`docs/test-sheet.md`): the journey's handoffs as rows, each with what you type, what good looks like, and what went wrong.
  - It starts with handoffs 1–3 (idea → explore, explore → PRD, PRD → propose), which have no checks today, then the later steps in brief.
- **Roadmap:**
  - M13 T6 becomes "test sheet run once on a real project";
  - the 36 written cases are parked (kept, not scored);
  - a v2 item: a notes service (new, orphaned or old notes, on request).

```
 notes ... explore ... PRD ... propose ... build      enter anywhere
            |           |        |          |
            v           v        v          v
         record     sources   PRD link   committed plan   handoffs stay right
```

## Capabilities

### New Capabilities

### Modified Capabilities
- `knowledge-capture`: the PRD offer after capture is removed.
- `project-status`: no unused-notes line.
- `skill-routing`: Ready PRDs aren't sorted; the next step names the PRDs without an order rule.
- `prd-authoring`: the PRD → planning handoff accepts any PRD, defaults to the most recent, and never blocks.
- `project-starter`: the routing rule text matches.

## Impact

- `plugins/kit/skills/capture/SKILL.md`, `next/SKILL.md`, `status/SKILL.md`; `scripts/status.mjs` (unusedNotes), `scripts/lanes.mjs` (routing text), `scripts/next.mjs` (Ready PRD order, if needed); tests and evals that check these.
- Existing projects get the new routing text on their next `/kit:start` re-sync (a `CHANGE` diff, on a yes).
- `docs/test-sheet.md` (new); `knowledge/roadmaps/` (M13 T6 reworded, a v2 item).
