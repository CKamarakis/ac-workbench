# Design

## Context

See proposal.md (Why). Current state, from reading the code:
- `knowledge.mjs` walks `prds/` recursively; `readPrd` validates one file in isolation and names it by its file name (`slug = basename`). `listKnowledge` returns one flat `prds` array, newest-updated first. Every consumer (`next.mjs`, `status.mjs`, `ready.mjs`, `docs.mjs`) reads that array or matches PRDs by their project-relative path.
- `STATUSES` drives both `readPrd` validation and `set-field`; `Building` and `Shipped` need a `change`.
- A proposal links its PRD through one line matched by `PRD_LINE` (`PRD: <path>.md @ <commit>`). `prdSuggest` runs the "changed since" check on that one file.
- `roadmap.mjs link` accepts any value for `--kind prd`; nothing validates it.

## Goals / Non-Goals

**Goals:**
- Parts work with every existing consumer through the same flat `prds` array, with a few added fields.
- Nothing changes for a PRD without parts, including files already sitting in subfolders without `part-of`.

**Non-Goals:**
- Parts of parts (one level only).
- Status rolling up on its own: the parent's status stays the user's choice; the kit only warns.
- Grouping parts on the docs page (a part shows under its own title there, as any PRD does today).
- Moving an existing PRD into parts by script: the split is a skill flow over existing commands.

## Decisions

### D1 A part is a file with `part-of`, in its parent's folder
A part is detected by its `part-of` frontmatter, never by its location alone. Its name is `<parent slug>/<file name>`. A file in a subfolder without `part-of` keeps today's behaviour and name, so no existing project changes.
- Alternative: detect parts by folder. Rejected: it would silently rename existing nested PRDs.

### D2 Flat list, extra fields
`readPrd` adds `name` (`acme-v1/part-a` for a part, the slug otherwise), `partOf`, and `label` ("Acme v1 › Part A" for a part, the title otherwise). `listKnowledge` runs a second pass over all PRDs to:
- attach `parts` (names) to each parent;
- check each part's parent exists and that `part-of` matches the folder (errors make the part invalid);
- add `warnings` (the early-Shipped parent);
- order the list: parents and single PRDs newest first, a parent's time being the newest of itself and its parts, each part right after its parent (newest first among them).

Consumers switch from `slug` to `name` in messages and from `title` to `label` in the status report. Matching by path is unchanged.
- Alternative: nested `parts` objects inside the parent entry. Rejected: every consumer would need a tree walk.

### D3 `Dropped` is a sixth status
Added to `STATUSES`, so `set-field` accepts it with no other change. It's excluded from the Ready and Building rules in `prdSuggest` (they filter on those exact statuses already) and counts as finished for the parent's Shipped check.

### D4 Parents with parts
A parent is any PRD at least one part points at. A parent's `Building` needs no `change`. `prdSuggest` and the status report's "ready to propose" list skip a parent with parts.

### D5 Parts row appended, not rewritten
`newPrd({ partOf })` validates the parent (exists, isn't a part), writes `prds/<parent>/<part>.md` from `templates/prd-part.md` with `part-of` set, then appends one row `| <parent>/<part> | <title> |` to the parent's `## Parts` section (adding the section, with a table header, if it's missing). It never rewrites other lines, so a user's own edits survive. The table carries no status column: status lives only in each part's frontmatter, so it can't go stale.

### D6 Warnings never change the exit code
`prd-check` prints warnings after the per-file lines and keeps exit 0 when every file is valid. `set-field --key status --value Shipped` on a parent prints the same warning after writing. `list` prints the same early-Shipped warnings as `prd-check`.

### D7 Two proposal lines
A second pattern, `PRD parent: <path>.md @ <commit>`, is read by `prdLink`, which returns `{ path, commit, parent: { path, commit } | null }`. `PRD_LINE` is unchanged; "PRD parent:" never matches it because it has no `PRD:` token. The routing block in `lanes.mjs` adds one sentence: from a part, also add the parent line. `prdSuggest` checks the part first, then the parent, and names which file changed.

### D8 Moving a parent: the user decides per unfinished part (readiness D2)
`move` of a parent with unfinished parts moves nothing and prints the warning: each unfinished part with its status, and the three choices (drop, another parent, its own PRD). The capture skill shows it and asks per part. The choices use existing pieces plus one: `set-field --key part-of` (a parent slug, or empty to remove it) together with `move` of the part file. Once every part is finished, `move` takes the parent file and its folder together, updating cited sources as today. A part made independent keeps its file name; if `prds/<part>.md` already exists, the move refuses, as `move` does today. `move` exits 3 (like a conflict) when unfinished parts block it; nothing is moved. Because the folder moves whole, `move` also refuses (exit 3, naming them) while the folder holds files that aren't the parent's parts: a detached part, a part whose frontmatter doesn't parse, or a nested PRD of its own (verify finding).
- Alternative: move the parts along silently. Rejected by the user: what to do with an unfinished part differs case by case.

## Risks / Trade-offs

- [The second pass reads every PRD once more] → It works on the already-parsed list in memory; no extra file reads.
- [A user renames a parent file, orphaning its parts] → `prd-check` reports each orphan as invalid with "parent not found", naming the expected path.
- [Old proposals have no parent line] → The check runs on the part only (spec scenario), so nothing breaks.
- [The user writes a status into the Parts table by hand] → Harmless; the kit never reads the table.

## Migration Plan

None for existing PRDs. Projects get the new routing sentence on their next `/kit:start` re-sync (the block is generated by `lanes.mjs`). Rollback: revert the change; part files then show up as separate PRDs, as today.

## Safeguards

Written by `/kit:ready` (`ready.mjs safeguards`) on 2026-10-25. Re-run the readiness check to change it.

| Dimension | Rating | Why |
|---|---|---|
| Reach | high | Changes contracts: PRD frontmatter (part-of, Dropped), command flags and output (new-prd --part-of, list, prd-check, set-field, move), proposal PRD lines, generated routing block |
| Undo | low | Reverting the commits undoes it; nothing written outside the repo; projects get the routing line only on re-sync |
| Safety | low | No secrets, permissions, hooks, user data or network writes |

- **Recommended:** scenario-to-test check, worktree for the build, review against the spec, edge-case probes, medium security findings block, your OK before merge
- **Chosen:** scenario-to-test check, worktree for the build, review against the spec, edge-case probes, medium security findings block, your OK before merge

<!-- kit-safeguards-data {"date":"2026-10-25","ratings":{"reach":{"level":"high","why":"Changes contracts: PRD frontmatter (part-of, Dropped), command flags and output (new-prd --part-of, list, prd-check, set-field, move), proposal PRD lines, generated routing block"},"undo":{"level":"low","why":"Reverting the commits undoes it; nothing written outside the repo; projects get the routing line only on re-sync"},"safety":{"level":"low","why":"No secrets, permissions, hooks, user data or network writes"}},"recommended":["scenario-check","worktree","spec-review","probes","security-weighted","user-ok"],"chosen":["scenario-check","worktree","spec-review","probes","security-weighted","user-ok"]} -->
