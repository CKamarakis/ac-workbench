## Context

Evidence: M12 T2 run in a Acme copy (acme-feature, change export-note-markdown, 2026-10-20). The session log shows the agent asking "How should the worktree get the uncommitted plan?" and the user picking "Skip the worktree"; `git status` showed the kit 0.20.0 re-sync files uncommitted next to the feature; tasks.md had an open task 2.2 "Verify in the browser (Chromium)…".

## Decisions

- **D1 Offer the commit, don't make it.** The kit never commits by itself; both `/kit:ready` and `/kit:start` offer it and commit only on a yes. `/kit:ready`'s "Don't commit" rule gets this one exception.
- **D2 Uncommitted check by git, in the skill.** `git status --porcelain -- openspec/changes/<name>` is enough; no new script command.
- **D3 Prevent the browser task at the source.** A `rules.tasks` line in `openspec/config.yaml` (OpenSpec passes per-artifact rules to the agent when it writes that artifact). Cheaper than catching it later in `/kit:ready`. The rule text:
  `Don't add tasks that need a running app, a browser or a check by hand; cover behavior with automated tests. /kit:verify offers a browser check on request.`
- **D4 Place it only where it's safe**, like the context pointer: no `rules:` → append a block; a block `rules:` without `tasks:` → insert `tasks:` as its first child, with the block's own indent; a block with `tasks:` → insert the line as the first item of that list; `rules:` on one line → conflict naming the line. The config edit is a `CHANGE` with a diff, written on the user's yes like the other file changes.
- **D5 One plan action for the file.** The context pointer and the rule are combined into one `openspec/config.yaml` action. If either can't be placed, the whole file is a conflict whose reason names each line to add; nothing is written. This keeps the existing rule that a one-line `context:` is reported as a conflict.

## Risks

- Rules are prompt guidance; OpenSpec can't enforce them, so an agent may still write a manual task. `/kit:verify`'s browser hint and the archive's open-task warning still catch it.

## Safeguards

- reach: medium (two specs; `configAction` is shared by plan and apply)
- undo: low (reverting the commits undoes it; existing projects change only on a re-sync the user confirms)
- safety: low
- chosen: scenario-check, spec review done by me against the delta specs (small change)
