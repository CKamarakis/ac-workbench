# Design

## Context

See proposal.md (Why) and `evals/trials/prd-pipeline-live.md` (follow-ups 2 and 4, and the UX finding). This builds on `prd-pipeline`:
- `knowledge.mjs` (list, notes, PRDs);
- `next.mjs` (`prdSuggest`, which takes `list` order as given);
- `start-plan.mjs` (plan JSON that the start skill renders as questions);
- `lanes.mjs` (the routing block).

Same constraints as before: zero runtime dependencies, nothing written without a yes, Windows first.

## Goals / Non-Goals

**Goals:**
- One ordering source: `list` sorts PRDs. Everything else uses that order and doesn't re-sort.
- Question context comes from data in the plan JSON, so evals can check it and the model doesn't improvise it.
- Import never loses or rewrites the user's text.

**Non-Goals:**
- Sorting notes (the shortlist is the model's judgment).
- Grouping notes (parked).
- Detecting project types beyond a few config files.
- Importing formats other than `.txt` and `.md`.

## Decisions

**D1. A PRD's "updated" time lives in `list`, with git injectable.**
- `listKnowledge(root, { updatedOf })` adds `updated` (ISO time) to each PRD and sorts newest first, ties by slug.
- The default `updatedOf` uses git: one `git status --porcelain -- <prds dir>` for dirty or untracked files, then `git log -1 --format=%cI -- <file>` per clean file. Dirty, untracked or no-git files fall back to the file's mtime.
- Tests pass a fake `updatedOf`.
- Why: a fresh clone gives every file the same mtime, so the commit time is the honest signal for committed files, and mtime covers edits in progress.
- Alternatives:
  - mtime only: wrong after a clone or checkout;
  - a frontmatter `updated:` field: needs discipline from the user, and drifts.
- Notes stay unsorted (path order), as today.

**D2. `next.mjs` keeps `list` order.**
- `prdSuggest` already takes the first Ready PRD and lists the rest. With `list` sorted, the newest wins.
- No code change beyond a test that checks the order holds end to end.

**D3. The routing rule asks for newest first.**
- The Knowledge section says: when several PRDs are Ready, ask which one, ordered by last update, newest first (git log date of the file, or the file date if uncommitted).
- The agent inside `/opsx:propose` can't call the kit script reliably (`${CLAUDE_PLUGIN_ROOT}` isn't defined in a project's `CLAUDE.md`), so the rule states the ordering itself.
- Unverified until a live run: whether the agent follows it.

**D4. `import` command in `knowledge.mjs`.**
- `import --file <path> --title <t> [--tags a,b] [--date YYYY-MM-DD] [--topic t]`.
  - It reads `.txt` or `.md`.
  - An existing frontmatter (`.md`) is parsed: its title and date are kept unless they're overridden; other keys are kept too.
  - The body is kept as is (line endings normalised).
  - It writes through the same path as `new-note`, with `source: <original file name>`.
- **Inside `notes/`:** write the new file first, re-read it and check the body, and only then remove the original. A failure leaves the original in place.
- **Outside the knowledge folder:** the original is left alone.
- `list` adds `unimported: [paths]` for `notes/**/*.txt` (skipping `archive/`).

**D5. Question context is part of the plan.**
- `planProject` adds the following. The start skill renders `about` + "Recommended: <answer> (<why>)" on each question.
  - `types[]` → `{ name, tools: [names], about, recommended: bool, why }`.
    - Detection: `next.config.*`, `vite.config.*`, `astro.config.*` or `svelte.config.*` suggests `web-ui`, but only when the registry defines that type.
    - Otherwise nothing is recommended, and the skill offers "none" as the safe default.
  - `offeredTools[]` → `{ name, about: <registry reason>, recommend: yes|no, why }`, from the new optional registry fields `recommend` and `recommend_why`. If they're missing: `no`, with "optional; add it later when a change needs it".
  - Each file action gets `about`, `recommend` and `why` from a small table in `start-plan.mjs` (`CLAUDE.md`, `.gitignore`, `openspec/config.yaml`, `.claude/kit.json`, the knowledge folders). The kit-managed blocks are recommended yes.
- `offered` (names) stays for backward compatibility. `formatPlan` prints the `about` line for opt-in tools.
- Alternative: the context lives only in the skill text. Rejected: it drifts from the registry and can't be eval'd.

**D5b. One question (user decision, 2026-10-06, during the live check).**
- The skill asks only the type, using `typeOptions`.
- `offeredTools` is rendered as a summary list, "available on demand", and never asked about.
- File changes are confirmed with one yes, each shown with its diff, `about` and recommendation; the user may exclude one.
- `formatPlan` prints the on-demand list in place of the "Optional for this project" prompt.
- Why: setup questions without a need in sight were noise. Of the tools, only Superpowers' session-start hook and MCP servers cost context while idle, so they wait until a change needs them (M3 flow judge).
- **Archive note (done 2026-10-07):** kit-local-mvp's "Tools are applied by tier" offered opt-ins one by one. Once kit-local-mvp was archived, this change got a MODIFIED delta for that requirement.

**D5c. A three-part summary, `first_use`, the config pointer, and context7 via npx (user review of the live run, 2026-10-07).**
- **Summary:** Done / Needs you / Later.
  - Tool steps for first use come from a new optional registry field `first_use`, so they go under Later.
  - `install_note` stays internal.
- **Config pointer:** an existing `context: |` block gets the pointer line appended (a `CHANGE` with a diff). That replaces a manual step.
- **context7:**
  - `npx -y ctx7@latest library|docs` works without a sign-in (tested 2026-10-07); only `ctx7 setup` forces one.
  - So there's no install: a routing rule tells the agent when to look up docs.
  - Limits without a key are unverified. A limit-hit message and the account setup are deferred (roadmap).
  - A deterministic backstop (a hook on library errors) is M3.

**D6. The registry fields are optional and validated when present.**
- `recommend` must be `yes` or `no`, and needs `recommend_why`.
- Documented in `docs/registry.md`.
- Initial values:
  - SuperSpec: `no` ("plain OpenSpec covers most changes; use SuperSpec for a big or risky one");
  - Superpowers: `no` ("only used inside SuperSpec's flow").

## Risks / Trade-offs

- [`git log` per PRD is slow in big repos] → PRDs are few (tens). It's one call each, with a 10 s timeout and an mtime fallback.
- [The agent ignores the ordering wording in `/opsx:propose`] → Live check in the Toughbubble copy (a task). It's low impact: the user still chooses.
- [Removing the original `.txt` after import] → Only after the new note is verified, and only inside `notes/`, where the file is the kit's to manage. The spec says the text is preserved.
- [The type detection guesses wrong] → It's a recommendation with its reason shown. The user still picks.

## Migration Plan

- Kit 0.2.0 → 0.3.0. The routing block wording changes, so a re-sync shows a `CHANGE` with a diff.
- No data migration: existing notes and PRDs are read as before.
- Rollback: revert the commit. Nothing new is written to projects except notes the user imported.
