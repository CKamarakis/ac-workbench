## Context

- M7 (`build-readiness`) made the specs and `design.md` match what was built before archive. Nothing yet shows that record in a form the user can browse.
- The explore (note `knowledge/notes/2026-10-12-living-docs-and-build-readiness-…`, "Explore results") fixed the content: three panels (tree / behavior / why), user-centric, Given/When/Then, "why" only where a decision has depth, "how it works, roughly", foundation cards, tools inventory, history, open decisions as "undecided".
- Observed in OpenSpec 1.13.2: `openspec show <spec> --json` gives requirement text and `rawText` scenarios, but **no requirement names**. A `- **GIVEN**` line passes `validate --strict`. Nested spec folders list, validate and show.
- Kit pattern: zero-dependency scripts in `plugins/kit/scripts/` with `node --test` tests; skills call them; `decisions.mjs` owns `decisions.md`; the archive gate (`hooks/archive-gate.mjs`, PreToolUse) can add context on allow.
- Consumers: this repo (11 flat specs, 6 archived changes, one devDependency) and the Toughbubble copy (`Projects/temp/Toughbubble`, nested Storms specs, 28 dependencies + 14 dev tools).

## Goals / Non-Goals

**Goals:**
- `/kit:docs` drafts the missing curated notes, asks the user per item, and builds one committed, offline page.
- Rebuilding is deterministic and costs no tokens.
- The page is rebuilt during archive, after spec sync, and lands in the archive commit.
- `/kit:next`, the archive gate, `/kit:ready` and the docs sync know about the page and its notes.

**Non-Goals:**
- Backfill of an already-built project (its own change later).
- Planned sub-features from PRD non-goals (deferred by the user).
- The cockpit (M5 stays a separate page).
- Hosting, a dev server, or any runtime dependency.
- Regrouping Toughbubble's real specs (done in that project, later).

## Decisions

### D1: Curated notes plus a deterministic script
The agent writes small Markdown notes once; `docs.mjs build` renders everything.
- Alternatives: a pure script (no user-centric "why", no tool grouping) and an agent-written page (tokens on each rebuild, varies run to run). Details in `brainstorm.md`.

### D2: Where each piece lives

| Piece | Path | Written by |
|---|---|---|
| Behaviors | `openspec/specs/<path>/spec.md` | OpenSpec flow (unchanged) |
| How it works, roughly + why | `knowledge/docs/<path>.md` | `/kit:docs`, on a yes |
| Tools inventory | `knowledge/docs/tools.md` | `/kit:docs`, on a yes |
| Foundation cards | `knowledge/foundations/<slug>.md` (app-wide) and `knowledge/foundations/<product>/<slug>.md` | `/kit:docs`, or the docs sync, on a yes |
| History | `openspec/changes/archive/*` | read only |
| Undecided | `openspec/changes/*/decisions.md` | read only (via `decisions.mjs` reader) |
| Page | `knowledge/docs/index.html` | `docs.mjs build` |

- A capability note has two sections: `## How it works, roughly` (optional) and `## Why`, a list of entries that each start with the requirement name they explain and may link a card (`[[card-slug]]`) or a change.
- A card has frontmatter (`title`, `scope`: app or a product, `status`: current or replaced, `replaced_by`) and the sections: In short / Why (evidence) / Gives you / Limits you / Revisit if / Affects / History.
- `tools.md` is a list of groups; each tool has: packages (one tool may be many packages), purpose, features using it, added by (change), dev or runtime.

### D3: `docs.mjs` commands
- `scan --dir . --json`: specs found (path, requirement count), notes missing or stale, cards, tools in `package.json` but not in `tools.md` and the reverse, page age vs the newest archive.
  - **Stale note:** older than the last archived change that touched its capability.
- `build --dir .`: writes `knowledge/docs/index.html`; prints counts and any warnings.
- Parses `spec.md` itself (requirement names are needed; `show --json` drops them). Splits scenario lines on `**GIVEN**` / `**WHEN**` / `**THEN**` / `**AND**`.
- Tree from the spec folder path; one segment → one level.
- An open or later decision maps to a capability when its `from` names a path under that capability's spec folder; otherwise it shows under the change on the page's "Undecided" list.
- Missing sources degrade, never stop: no specs → "no specs yet"; a malformed spec or unreadable `decisions.md` → a warning row; no `package.json` → the tools panel says so.
- All source text is HTML-escaped.

### D4: The page
- One file, inline CSS and JS, no network.
- Left: project name, a sort control (sort by name / last updated / created, ascending or descending; default last updated, newest first), then the tree (App: Foundations, Tools; Products: products › sub-features), an "undecided" badge with a count. No item numbers. Search deferred (user, 2026-10-12).
- Middle: breadcrumb and title, the sub-feature's "How it works, roughly", then requirements, each with its user stories numbered 1, 2, 3 and separated by a divider, each story as GIVEN / WHEN / THEN rows. No margin line numbers.
- Right (a light panel): for the selected sub-feature or requirement: its "why", the change that added or last changed it, the PRD it came from (title and status, from the archived proposals' `PRD:` line via `prdLink` in `next.mjs`), linked cards, open decisions.
- Look: the category-standard three-panel docs style chosen by the user over the rolled "patent" and the "drawing set" directions (sketches in `.impeccable/mocks/decision/`, final one `canon-v2.html`), because colour makes it easier to read and to spot things. The right panel is light, not dark.
- A History view per sub-feature: archived changes, newest first, each with the first line of its proposal's "Why".
- Visual design comes from Impeccable (`/impeccable shape` naming this page as the target; then `critique` and `audit` on the built page). Its findings are fixed in the script's template.

### D5: Rebuild during archive
- The archive gate, on allow, adds: "after the archive, ask the user whether to rebuild the docs page (`docs.mjs build`) and include `knowledge/docs/index.html` in the archive commit". Only when the project has `knowledge/docs/index.html` or `knowledge/docs/`.
- It relies on the same `additionalContext` path as the open-decisions reminder (build-readiness D6). If that context doesn't reach the agent, `/kit:next` (D6) is the fallback.
- Rebuilding earlier, in `/kit:verify`, was rejected: main specs only get the change's behaviors at archive, so the script would have to imitate OpenSpec's merge.

### D6: Links into the existing kit
- `/kit:next`: when the page is older than the newest archived change, suggest `/kit:docs`.
- `/kit:ready`: a new-tool item also checks `knowledge/docs/tools.md` and names an existing tool with the same purpose.
- Docs sync (`/kit:verify`): a decision with depth that shapes more than one sub-feature may be proposed as a foundation card, as well as `design.md`.
- `/kit:start`: one line about `/kit:docs` in the summary; no files.
- Registry: a `docs` phase after `close` (the archive phase), owned by `/kit:docs`; the lane map and routing block follow.

### D8: Impeccable stays out of git (user, 2026-10-12)
- Impeccable is a tool each clone downloads (`npx -y impeccable install --providers=claude --scope=project`); its skill folder (21 MB, with a Windows binary) and its agents are gitignored. Its hooks are already in the gitignored `settings.local.json`.
- The files it creates for this project (`PRODUCT.md`, `DESIGN.md`) are committed.

### D9: History is read, never stored
- Note dates come from git (`git log -1`), falling back to the file's mtime when it isn't committed yet.
- A sub-feature's history comes from the archived change folders: each holds the proposal's "why" and the specs it touched, a link raw `git log` lacks. No new history files.

### D7: Release and evidence
- Kit 0.7.0. Unit tests for `docs.mjs` on fixtures (flat and nested specs, G/W/T split, stale notes, undecided mapping, missing sources, escaping). Eval cases in `evals/docs/`.
- Trials: this repo and the Toughbubble copy; evidence in `evals/trials/kit-docs.md`.

## Risks / Trade-offs

- [Curated notes go stale] → `scan` flags notes older than the last change to their capability; `/kit:next` suggests `/kit:docs`.
- [The archive reminder doesn't reach the agent] → `/kit:next` suggests the rebuild; the page is a few minutes behind at worst.
- [`/opsx:archive` may not merge into nested spec paths (unverified)] → test first in a throwaway folder; if it fails, record it and keep the trial on flat paths plus a hand-made nested fixture.
- [Our `spec.md` parser drifts from OpenSpec's format] → parse only headings and the bold scenario keywords; fixtures copied from real specs; `validate --strict` stays the source of truth.
- [Committed HTML makes noisy diffs] → accepted by the user; the page is rebuilt only at archive.
- [Impeccable's cost (~69k output tokens in M4)] → name the page as the target and the scope in each prompt.
- [Spec text in HTML] → escape everything; no `innerHTML` from source text.

## Migration Plan

- Additive. Projects without `knowledge/docs/` see no change until they run `/kit:docs`.
- Rollback: delete `knowledge/docs/` and `knowledge/foundations/`; revert the kit version.

## Open Questions

- ~~`/opsx:archive` into nested spec paths~~ **Checked 2026-10-12 (task 1.1):** OpenSpec 1.13.2 merges a delta into `specs/a/b/spec.md`; evidence in `evals/trials/kit-docs.md`.
- **Unverified:** Impeccable's bash-syntax hooks on Windows in this repo (they worked on the Toughbubble copy in M4).
