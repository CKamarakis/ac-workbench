# Design

## Context

See proposal.md - Why. Each item was checked against its code on 2026-10-19; the user chose the open points the same day (L18 format, L20 remove Bash, fix L11 and L13 rather than accept them).

## Decisions

### D1 A dropped task keeps its line and number (L18)

`- [-] T<n> <text> (dropped <date>: <reason>)`. The number stays, so `task` never reuses it (it takes the highest number + 1), and the reason stays where the task was. Counted as neither done nor left, so "1 of 6" becomes "1 of 5" and the task leaves the list of what's left.
- **Alternative:** remove the line and record the drop in the drift log. Not chosen (user, 2026-10-19): the milestone file would no longer show what was planned, and a removed last task would free its number.

### D2 L20: the reviewer gets the diff as text, not Bash

The docs say a plugin agent's `tools` field takes tool names only (a specifier such as `Bash(git diff *)` doesn't narrow Bash) and `permissionMode` is ignored for plugin agents ([sub-agents docs](https://code.claude.com/docs/en/sub-agents), read 2026-10-19). So the only way to make the reviewer read-only by its tools is to drop Bash. `/kit:verify` already runs git; it pastes the diff into the agent's prompt, or, for a diff over about 2000 lines, the list of changed files, which the agent reads with Read. The quality-gates spec already says the reviewer "receives the change's delta specs, tasks and diff".

### D3 L13: one `git diff-tree --stdin` call

Input lines `<merge> <first parent>`; git compares the merge with only that parent and prints the merge's ID before each difference ([git-diff-tree docs](https://git-scm.com/docs/git-diff-tree), `--stdin`: "The remaining commits ... are used as if they are parents of the first commit"; "the ID of the first (or only) commit ... is printed"). Same test as today's `git diff --quiet <h>^1 <h> -- <roadmap>`, checked in a throwaway repo on 2026-10-19 with a merge whose branch changed the roadmap (reported) and a merge whose first parent had changed it (not reported).

### D4 L11: `.md` or the path

A note named in a proposal or design counts only with `.md` or its path. Notes the kit creates are named `<date>-<slug>.md`, so cited notes keep matching; a hand-named note such as `auth.md` no longer matches the word "auth".

### D5 L29: 60 lines

The kit's template is 30 lines and Acme's filled-in doc is 41; 60 leaves room for a real project before the review speaks. It's a judgment, not a measured limit: revisit if real docs land well past it for good reasons. The review flags; it never edits the doc.

## Risks / Trade-offs

- [Proposals that cited a note by its bare name stop counting it as read] -> Only hand-named notes without a date are likely affected; the count is advisory.
- [A large diff pasted into the reviewer's prompt] -> Over about 2000 lines, the changed-file list instead.
