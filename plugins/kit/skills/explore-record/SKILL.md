---
name: explore-record
description: Save or update the explore record (knowledge/explore/<slug>.md) at the end of an /opsx:explore - the notes it read, the decisions made, the questions answered and still open - automatically, and show what was written; drop the last save when the user says not to keep it; list records. Use at the end of an explore that decided something or raised a question, when the kit's reminder says an explore record isn't saved, or when the user asks to save, show or undo an explore record.
---

# Kit explore record

Saves what an explore decided so the flow (explore -> PRD -> propose -> ...) can be followed by `/kit:next` and `/kit:status`, and so `/kit:prd` drafts from decisions, not chat. It doesn't run the explore: `/opsx:explore` does that.

Every write goes through the script, run from the project folder. If it prints `error:`, show it and stop.
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/explore.mjs" <command> --dir . [--json]
```

## At the end of an explore (default: save, no question)

1. Nothing decided and no question raised: save nothing, say nothing about it.
2. Pick the record: `list --json`. Continue the open record this explore was about (same topic); otherwise a new one with a short kebab-case slug and a 2-5 word title.
3. Write a JSON file in the scratchpad with only what this explore **added**:
   `{ "title": "...", "sources": ["notes/...md"], "decisions": ["one line each"], "answers": { "Q2": "..." }, "questions": ["one line each"] }`
   (`title` only for a new record; `sources` are the notes the explore read, paths under the knowledge folder.)
4. `save --slug <slug> --file <that.json>`. It only adds; answered questions become decisions ("Q2: ...").
5. Show what was written: the record path, its state, the new decisions, the questions answered, the questions still open. Then one line: "Saved by default; say so if you don't want to keep it."
6. The user doesn't want it: `undo --slug <slug>` (a new record is removed; an update goes back to before this save).

## Rules

- Save automatically only at the end of an explore (a deliberate exception: the record only grows and nothing depends on it before a PRD). Every other change goes through the user.
- Never edit `explore/*.md` by hand; never remove decisions or questions.
- A record already in a PRD refuses saves: update the PRD with `/kit:prd` instead.
- Don't commit.
