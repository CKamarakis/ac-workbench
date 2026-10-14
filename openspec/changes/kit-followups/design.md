# Design

## Context

Ten small items, triaged by the user to stay lean (roadmap 2026-10-14). Each one touches one or two existing scripts; none adds a dependency. Where the code stands today:

- `next.mjs:43` `prdSuggest` runs before the OpenSpec step and returns a Ready-PRD suggestion even when changes are active (`activeCount` is only used for the notes case).
- `verify.mjs` has `finding`, `reviewed` and `override` (HARD only); nothing removes an advisory item.
- `docs.mjs:270` `undecided()` skips the `archive` folder; `decisions.mjs` resolves `--change` to `openspec/changes/<name>` only.
- `hooks.json` registers `library-hint.mjs` under `PostToolUseFailure`; `tests/kit/hooks.test.mjs` covers it.
- `claude-code-builtins` (machine) and `context7` (project) have prose as their install; `setup.mjs` would run it if their check failed.
- 17 test files call `mkdtempSync(os.tmpdir())` 20 times and never remove the folders.
- `start-apply.mjs` applies files, init commands and tool installs together; `--accept` only covers file diffs.
- `docs.mjs` sorts with `localeCompare()` without a locale; archives of one day sort by folder name (`docs.mjs:120`); the page's `show()` doesn't open `<details>` ancestors; the badge prints a bare count.
- `/kit:start`'s skill composes the `/kit:docs` Later line itself (`skills/start/SKILL.md:54`).
- `toolkit.yaml` already has `reviewed_version` per tool; `tools/smoke.mjs` hard-codes `TESTED_OPENSPEC`.

## Goals / Non-Goals

**Goals:** fix each item with the smallest change that meets its spec; one test per behavior.

**Non-Goals:** the "what's waiting" list, a kit-update notice (Claude Code's plugin update covers it; README line in M13), the browser-check recommendation (M12), new docs-page features.

## Decisions

**D1. `/kit:next` order.** `prdSuggest` returns the Ready-PRD suggestion only when `activeCount === 0`; otherwise it returns a `waiting` line that `suggest()` attaches to the OpenSpec suggestion (like `questions` today). Building/Shipped checks are unchanged.

**D2. `verify.mjs resolve --item <id> --note "<text>"`.** Moves an advisory item to `state.resolved` (`{ item, what, note, date }`); the report renders a "Resolved" section. Refuses HARD items. A later `run` keeps resolved ids out of the advisory list as long as the same finding text isn't recorded again (re-recording means it came back). *Alternative:* re-running the review clears unrecorded findings automatically. Rejected: the kit can't tell "fixed" from "review skipped it".

**D3. Decisions after archive.** One helper `changeDir(dir, change)` in `decisions.mjs`: `openspec/changes/<change>` if it exists, else the newest `openspec/changes/archive/*-<change>`. `undecided()` in `docs.mjs` also reads archived records and marks their items `archived: true`; the page labels them "from archived change <name>".

**D4. Remove the hook.** Delete `plugins/kit/hooks/library-hint.mjs`, its `hooks.json` entry and its tests. The routing rule and the Context7 registry entry stay (trial).

**D5. `install: none`.** A string value `none` (with `install_note`). `installFor()` returns `null` for it; `setup.mjs plan` lists such entries as `nothing to install` (never missing); `start-plan.mjs` treats them as present. The validator accepts `none` instead of the platform keys.

**D6. Test folders.** `tests/helpers/tmp.mjs` exports `tmpDir(prefix)`: creates under `testRoot()` (shared with `tools/smoke.mjs`: `KIT_TEST_DIR`, else `../temp` if it exists, else `os.tmpdir()`) and registers the folder; an `after()` hook removes all registered folders at the end of each test file (errors ignored, so a locked file never fails a test). All 20 `mkdtempSync` calls switch to it.

**D7. Files-only re-sync.** `start-apply.mjs --files-only`: skips the tool step (and the opt-in tool installs), still runs `git init`/`openspec init` when missing, writes accepted files and the stamp; the summary lists skipped tools as "left alone". The start skill offers it when re-syncing an existing project ("files only, or files and tools?").

**D8. Docs page fixes.** Sort with plain `<` comparison (`a < b ? -1 : a > b ? 1 : 0`) everywhere `localeCompare()` is used in `docs.mjs`; same-day archives tie-broken by the git commit time of the archive folder (one `git log -1 --format=%ct -- <folder>` per tied archive; name order when git has none); `show()` opens every `<details>` ancestor of the target; the badge text is "N undecided" (title kept). The two missing notes (`living-docs`, `kit-self-test`) are drafted through `/kit:docs` and written only on the user's yes.

**D9. Docs line from the planner.** `formatPlan` in `start-plan.mjs` adds the `/kit:docs` line under Later when `knowledge/docs/` doesn't exist; the skill shows the planner's Later lines as is and drops its own sentence.

**D10. Tested versions.** `tools/smoke.mjs` reads OpenSpec's `reviewed_version` from `plugins/kit/data/toolkit.json` instead of `TESTED_OPENSPEC`. One `CLAUDE.md` line: after updating a tool, run `npm run smoke`; when it passes, set `reviewed_version` and run `npm run registry`.

## Risks / Trade-offs

- [Resolving hides a finding that wasn't really fixed] → a note is required, and the Resolved list stays in the report for review.
- [Removing the hook loses a hint that might help someday] → the routing rule still asks for doc lookups; the hook never fired in 16 sessions.
- [Files-only re-sync leaves a project without a tool it needs] → the summary names every tool left alone; a full re-sync installs them.
- [Changing sort order rewrites the committed docs page once] → expected one-time diff on the next build.

## Migration Plan

Kit 0.9.0. Existing projects: re-sync with `/kit:start` (files only is enough). Rollback: revert the change's commits.
