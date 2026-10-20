## Context

The decisions come from the user, during an explore on 2026-10-20:
- B every day and A once per release: handoff checks, plus one journey run;
- handoffs 1–3 first;
- no automated prompt runs: the user types, the agent says what to watch for;
- flexible entry, straight handoffs;
- PRD choice: one PRD, the most recent or ask, never a blocker;
- capture stays quiet, next stays quiet about notes, and a notes service only in v2.

## Decisions

- **D1 Delete behaviour rather than add rules.** Removing the capture offer and the notes line is simpler than tuning them. Notes are still read: by an explore, by `/kit:prd` and by the explore record.
- **D2 PRD → propose, as a default plus a question.**
  - With one candidate PRD, use it.
  - With several, take the most recently updated, name it, and list the others in one line so the user can switch. Ask instead if the user's words point to none of them.
  - Any status counts; a Draft PRD gets a one-line note that it isn't Ready, never a stop.
  - The `PRD: <path> @ <commit>` line stays: `/kit:next` uses it to spot a PRD changed after planning.
- **D3 The newest-first rule stays.** "PRDs ordered by most recent update" (prd-authoring) and "Ready PRDs picked newest-updated first" (skill-routing) already give the default the user asked for: take the most recent and list the others. They are kept unchanged; only "Ready" stops being a requirement.
- **D4 The test sheet is a doc, not a runner.**
  - It lives in `docs/test-sheet.md`, one table per handoff: you type · good looks like · what went wrong.
  - Rows for handoffs 1–3 are detailed; 4–7 get one line each, pointing to the existing skills' "good looks like".
  - Findings from a run go to `/kit:loose-ends` or a fix, as today.
  - It's run on an Acme copy, never on a real project directly, and nothing about the real project goes into the sheet (repo-privacy).
- **D5 The 36 written cases are parked, not deleted.** They stay in `evals/*/cases.yaml`, unscored, and the batch decisions (keep, fix, split, drop) are recorded in the M13 milestone notes. If a step keeps failing in real runs, its cases are the first place to look.
- **D6 Roadmap edits go with this change**, in one commit, per the repo rule. M13 T6's text changes; the v2 item goes under "After v1".

- **D7 Status keeps a plain notes count** (the user, 2026-10-20): one line "N notes", no "nothing has read yet" and no call to action. The used/unused computation (and its requirement) is removed.

## Risks

- Removing the capture offer means a late note won't reach a PRD unless the user brings it up. That's accepted: the user asked for this, and a v2 notes service covers it.

## Safeguards

- reach: medium (four skills plus the routing text that `/kit:start` writes into projects)
- undo: low (text and script changes; projects change only on a confirmed re-sync)
- safety: low
