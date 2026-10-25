# Changelog

What changed in the `kit` plugin, newest first. Versions follow `plugin.json`. The public history restarts at 0.21.0: earlier commits are kept privately, so the entries below are the record.

## 1.0.0-rc.2 (2026-10-25)
- **PRD parts.** One PRD can be split over a parent `prds/<slug>.md` and part files `prds/<slug>/<part>.md` (`part-of: <slug>`), each with its own status and change. `new-prd --part-of` creates a part and adds it to the parent's Parts table; `/kit:prd` can split an existing PRD on request.
- "PRD changed after planning" is checked per part and on the parent (a proposal from a part records a `PRD parent:` line), so editing one part no longer flags the change building another.
- New status `Dropped` for a PRD or part that won't be built. A parent marked Shipped with open parts gets a warning, never a block.
- Moving or archiving a parent asks what to do with each unfinished part (drop, another parent, or its own PRD); finished parts move with it.
- Re-sync projects with `/kit:start` to get the new routing line for proposals made from a part.

## 1.0.0-rc.1 (2026-10-21)
- **First release candidate.** Run on a real project, from setup through verify, before this tag.
- `/kit:start` re-sync reuses the project type saved in `.claude/kit.json`; it asks only on a first setup.
- `/kit:docs`: a big first run (more than 3 drafts) is one question, drafted in parallel, then reviewed with `git diff`; a few new drafts are still asked one by one.
- The docs page shows `code` as code in How it works, Why notes and cards.
- The repo's privacy guard also checks image metadata (EXIF, XMP, PNG text).
- README: the happy path starts at `/kit:capture` and lists the any-time commands.

## 0.21.1 (2026-10-20)
- MIT license, GitHub issue forms (bug, idea), and plugin, marketplace and repo descriptions that say what the kit does today.

## 0.21.0 (2026-10-20)
- **Enter at any step; handoffs stay right.** `/kit:capture` only saves (no PRD offer after each note). `/kit:status` shows a plain notes count, and `/kit:next` says nothing about notes.
- `/opsx:propose` takes one PRD: the one you name, else the most recent, and says which. A Draft PRD gets a one-line note, never a stop.
- `docs/test-sheet.md`: a one-page checklist to test the kit's handoffs by hand on a real project.
- Eval details show paths as `{{kit}}/…`, never your local folders. The repo has a guard against committing real project names.

## 0.20.1 (2026-10-20)
- `/kit:start` adds an OpenSpec rule against tasks that need a running app, a browser or a check by hand, and offers to commit the setup on its own.
- `/kit:ready` offers to commit the plan when a worktree is chosen, so the worktree can see it.

## 0.20.0 (2026-10-20)
- `/kit:verify` recommends (never runs) a browser check in web apps when a change adds a page or new input handling.

## 0.19.0 (2026-10-20)
- A `/kit:start` re-sync updates project tools older than the tested version (Impeccable, the OpenSpec skills), names newer ones, and warns on an old OpenSpec CLI.

## 0.18.0 – 0.18.3 (2026-10-19 – 2026-10-20)
- First-run guidance: clear first steps for a new project, a project context doc filled from five questions (shown in full before it's written), a plain git note.
- `/kit:start` ends with where the `/opsx:` commands come from.

## 0.17.0 – 0.17.2 (2026-10-18 – 2026-10-19)
- UI flow with Impeccable for web apps: `/kit:prd` offers `shape` for a screen; `/kit:ready` checks UI states and copy and can recommend a UI review; `/kit:verify` runs `critique` and `audit` when chosen.
- Roadmap writes keep your own text; a PRD that spans several changes is asked about, not marked Shipped.
- Debt fixes in note matching, merges and dropped tasks.

## 0.16.0 (2026-10-18)
- Build safeguards: `/kit:ready` rates reach, undo and safety, and picks a worktree, a review against the spec or subagents per change. SuperSpec and `/kit:judge` removed.

## 0.15.0 (2026-10-17)
- The flow starts at `/opsx:explore`; its decisions and open questions are saved as an explore record that `/kit:next` and `/kit:prd` follow.

## 0.14.0 (2026-10-17)
- `/kit:loose-ends`: things left behind while building, by importance and blockers, never by date.

## 0.13.0 (2026-10-17)
- `/kit:status`: where the project stands, with every fact's source; `/kit:next` hands off to it.

## 0.12.0 (2026-10-17)
- `/kit:roadmap`: optional goals in order, Now, decisions waiting on you, and a drift log.

## 0.11.0 (2026-10-14)
- The kit is installed per project (`--scope project`), never machine-wide.

## 0.9.0 – 0.10.0 (2026-10-14)
- `/kit:harness-review`: a read-only check-up of a project's Claude Code setup.
- Test folders go next to the repo and are removed after each run.

## 0.8.0 (2026-10-13)
- macOS and Linux install paths (not yet run on a real machine).

## 0.7.0 (2026-10-12)
- `/kit:docs`: a docs page of what's built, why, and what's undecided.

## 0.6.0 – 0.6.4 (2026-10-12)
- `/kit:ready`: the decisions a build would otherwise make alone, asked in one batch, with a per-change decision record and a docs sync at verify.

## 0.5.0 – 0.5.3 (2026-10-08)
- Impeccable and Playwright for web apps; Emil's motion skills on demand. Clickable setup questions.

## 0.4.0 (2026-10-07)
- `/kit:verify` and the archive gate: tests and reviews must pass before `openspec archive`.

## 0.2.0 – 0.3.0 (2026-10-06 – 2026-10-07)
- `/kit:capture` and `/kit:prd`: notes and PRDs in a `knowledge/` folder; one-question setup.

## 0.1.0 (2026-09-29)
- First kit: project starter, next-step routing, tool registry.
