---
name: loose-ends
description: Keep this project's loose ends (knowledge/loose-ends.md) - the things left behind while building that have no other owner (a check that belongs elsewhere, friction worked around, debt, a review finding kept on purpose, cleanup, an idea out of scope). Offer them once at the end of a step, mark what's important or what it blocks, mark one seen again, close or drop them, run a cleanup, and show the list or an analysis. Use at the end of an apply, verify, archive or long chat when something was put aside, or when the user asks for loose ends, tech debt, small things left, a cleanup, or why things pile up.
---

# Kit loose ends

One owner for what's left behind while building. **Importance and blockers, never rank or time.** You propose; the user decides. Nothing is written without a yes.

Every write goes through the script, run from the project folder. If it prints `error:`, show it and stop.
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/loose-ends.mjs" <command> --dir . [--json]
```

| User wants | Command |
|---|---|
| Add (end of a step) | `add --batch <file.json>` (array of `{text, kind, origin, tags, source, blocks, important, by, reason}`), or one with `add --text ... --kind ... --origin ...` |
| Important, or not | `important --id L1 --on [--by user\|agent --reason "..."]` / `--off` |
| What it blocks | `block --id L1 --target <milestone ID\|change\|L#>` / `--clear` |
| It came up again | `seen --id L1` |
| A different kind | `kind --id L1 --to <kind> --reason "..."` |
| Finished / not doing it | `done --id L1 --reason "..."` / `drop --id L1 --reason "..."` |
| See them | `list` · why they pile up: `analysis` |

Kinds: `check` (an open question about correctness), `friction` (a recurring cost), `debt` (known wrong behaviour), `idea`, `cleanup`, `accepted` (decided not to fix; never shown in status, can't be important). Origins: `chat`, `build`, `review`, `verify`, `note`.

## At the end of a step

When a step (apply, verify, archive, a long chat) put things aside:

1. Build **one numbered list**, each line: kind, the one-line text, origin, source, and, when it applies, a proposed **important** mark with a one-line reason (e.g. friction seen in two sessions, a check that could hide a bug) or what it **blocks**.
2. Check `list --json` first: an item that matches an open one becomes "**L4 seen again**", not a new line.
3. Leave out what has an owner, and name that owner instead: a change's open decisions (`decisions.mjs`), a PRD question (`/kit:prd`), a roadmap decision (`/kit:roadmap wait`).
4. Show the list in your message, then ask **once** with AskUserQuestion (multi-select): which to add, and which proposed important marks to keep.
5. Write the picked ones in one `add --batch` (and `seen` for the repeats). Nothing put aside: ask nothing.

## Cleanup (on request)

Go through `list` by group. For each item propose keep or drop with a reason (no longer relevant, out of scope, won't do). Ask in batches of up to 4 questions. Drop only what the user confirms, each with its reason. Never drop because an item is old.

## Rules

- Write only on the user's yes: no add, mark, blocker, seen, kind change, done or drop without it.
- Never edit `loose-ends.md` by hand; the table is re-rendered from its data on every write.
- Don't rank and don't add dates as priority; importance and blockers are the only signals.
- Don't commit.
