# Design

## Context

See proposal.md (Why) and `docs/project-context.md`, "prd-pipeline (M2)", for how we got here.

What exists today:
- The kit is skills plus zero-dependency Node scripts (`plugins/kit/scripts/*.mjs`).
- `/kit:start` plans and then applies (`start-plan.mjs`, `start-apply.mjs`). It manages marker blocks in `CLAUDE.md` and `.gitignore` (D5), and writes a stamp at `.claude/kit.json`.
- `/kit:next` is a pure `suggest()` over `openspec list` and `openspec status`, plus the lane map from the registry (`lanes.mjs`, D6).
- Evals run deterministic checks in a temp sandbox (`tools/run-evals.mjs`). Prompt-driven cases need an engine, so they stay `pending` and are checked by rubric.

Constraints:
- Runtime scripts take no dependencies.
- Windows-first (Git Bash and PowerShell).
- Nothing is written without the user's yes.
- PM-OS ideas only, in our own words.

## Goals / Non-Goals

**Goals:**
- Put every deterministic step in a script that evals can check: paths, frontmatter, slugs, listing, which PRDs cite a note, section writes with a conflict check, and PRD and change state for `/kit:next`.
- Leave only the judgment calls to the skill prompts: shortlisting, drafting, wording.
- Keep the knowledge location swappable (one config value), because the final home is still open.

**Non-Goals:**
- No editor or UI. The user edits Markdown in any editor.
- No automatic commits. The user commits; the kit reads git history but never writes it.
- No full YAML support. Frontmatter is limited to the subset the kit writes.

## Decisions

**D1. The knowledge location lives in the stamp file.**
- `.claude/kit.json` gets `knowledge_dir` (default `"knowledge"`). Every script reads it through one helper.
- Why: the stamp is already per project, written by the starter, and read by scripts.
- Alternatives:
  - `openspec/config.yaml`: not ours to manage; the starter treats an existing `context:` there as a conflict.
  - An environment variable: invisible, and lost between sessions.

**D2. One helper script, `knowledge.mjs`, with subcommands.**
- Subcommands:
  - `list` (notes recursively, skipping `archive/`, PRDs with status)
  - `new-note` (slug, date, collision suffix, frontmatter)
  - `move` (moves a note and rewrites the `sources` of PRDs that cite it)
  - `citing` (which PRDs cite a note)
  - `section-get` and `section-set --expect <hash>`
  - `prd-check` (status valid, sources exist)
- JSON output with `--json`, like the other scripts.
- Why: deterministic, testable in the eval sandbox, and the skills just call it.
- Alternative: have the model do it all through prompts. Rejected, because slugs, collisions and path rewrites must be exact.

**D3. A small frontmatter parser, no YAML library.**
- It handles `key: scalar`, `key: [a, b]` and block lists (`- item`), and writes in the same shape.
- Anything else counts as invalid and gets reported, never guessed.
- Why: no runtime dependencies (the `yaml` package is dev-only).
- Alternative: vendor a YAML parser. Too big for a few fields.

**D4. Per-section writes are checked against a hash.**
- Sections are `## ` headings. `section-get` returns the text and a hash.
- `section-set` writes only if the current hash still matches the one the proposal was made from. Otherwise it exits with a conflict.
- Why: this enforces "never overwrite your edits" (P4) mechanically, not by trusting the model.
- Alternative: whole-file diff and approval. Coarser, and it loses the per-section yes.

**D5. The PRD↔change link is recorded on both sides as plain text.**
- **In the proposal:** a line `PRD: <path> @ <commit>`, which `/kit:next` finds with a regex.
- **In the PRD:** frontmatter `change: <name>`.
- **Changed since planning:** `git log <commit>..HEAD -- <path>` has output, or the file has uncommitted changes.
- **Archived:** the change folder sits under `openspec/changes/archive/` (`*-<name>`).
- Why: no new state files, and it survives an archive (proposal.md moves with the change).
- Alternative: a link file under `.claude/`. That's state that can drift, and it's invisible in review.

**D6. The handoff goes through the routing block, with a fallback.**
- The managed `CLAUDE.md` routing block gets a short "Knowledge" section: where the folder is, that `/opsx:propose` reads the Ready PRD, and that it writes the `PRD:` line.
- `routingBlock()` gets the knowledge dir as input.
- Why: it uses the existing managed block (D5 of kit-local-mvp) and doesn't fork OpenSpec.
- **Risk (unverified):** the agent may ignore the rule during `/opsx:propose`. See Risks for the fallback.

**D7. `/kit:next` checks PRDs before OpenSpec.**
- `suggest()` gets an extra input, `prds` (from `knowledge.mjs list` plus git checks), and runs the PRD rules from the skill-routing spec first.
- Without a knowledge folder, the old behaviour is unchanged.
- The PRD rules stay a pure function, so they're unit-testable.

**D8. Registry data, not code, owns the new phases.**
- `phases` gains `capture` and `prd`. The `kit` entry claims them with `skills: {capture: /kit:capture, prd: /kit:prd}`, and a new situation entry is added for "I have an idea or a note".
- `notion-mcp` moves to `later`, with a verdict that cites a new trial note, `evals/trials/notion-spike-2026-10-06.md`, copied from the explore findings.

**D9. The PRD template is written in our own words.**
- Sections: Problem, Users, Goals and success measures, Scope (in and out), Requirements, UX notes and assets, Risks, Open questions.
- Sources live in the frontmatter.
- PM-OS `/prd-draft` is read during apply for ideas only. No text is copied (licence).

**D10. Empty folders get `.gitkeep`.** git doesn't track empty folders, and the layout must survive a clone.

## Risks / Trade-offs

- [`/opsx:propose` ignores the routing rule] → Trial it live in a sandbox (a task).
  - If it fails, add a `rules.proposal` entry to the project's `openspec/config.yaml` as well. OpenSpec feeds those rules into proposal instructions. That would be an opt-in `CHANGE` with a diff.
- [Shortlisting is weak once there are many notes] → Fine for v1. Archiving by hand keeps the pool small. Revisit at the M6 usage review.
- [A user hand-edits the frontmatter into something the parser can't read] → `prd-check` reports the file and the field. Skills stop instead of guessing.
- [git isn't available, or the file isn't committed yet] → The "changed since planning" check is skipped with a note, and the proposal records `uncommitted` as the commit.
- [Base specs for `project-starter` and `skill-routing` aren't archived yet] → Archive `kit-local-mvp` before this change (only task 9.4 is left there). This change's deltas are ADDED only.

## Migration Plan

1. Bump the kit version (0.1.0 → 0.2.0), so re-synced projects see a routing-block `CHANGE`.
2. Existing kit projects: `/kit:start` re-sync shows the new `knowledge/` folders as `CREATE` and the routing block as a `CHANGE` diff. Nothing is applied without a yes.
3. Rollback: uninstall or downgrade the kit plugin. The `knowledge/` folders are plain files and stay usable without the kit.
