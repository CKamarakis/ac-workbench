# living-docs Specification

## Purpose
Gives each project that opts in one browsable docs page: what the product does (Given/When/Then user stories per sub-feature), why where a decision has depth, foundation cards, a tools inventory, history and open decisions. The page is rebuilt from the project's own specs, archived changes and curated notes at no token cost.

## Requirements

### Requirement: Living docs are optional
The living docs SHALL be opt-in per project. A project uses them once `/kit:docs` has created `knowledge/docs/`. Until then no kit step SHALL create docs files, propose foundation cards, or remind about the docs page. `/kit:docs` SHALL work on a project that is already under way, drafting notes from its existing specs and archived changes.

#### Scenario: Small project never opts in
- **GIVEN** a project set up with `/kit:start` where `/kit:docs` was never run
- **WHEN** a change is verified and archived
- **THEN** no docs file is created, no card is proposed, and no docs reminder is shown

#### Scenario: Adopted mid-project
- **GIVEN** a project with 5 archived changes and no `knowledge/docs/`
- **WHEN** the user runs `/kit:docs`
- **THEN** it drafts notes for the existing specs and builds the page

### Requirement: Curated docs notes
A project's living docs SHALL keep the content that specs don't hold in committed Markdown files:
- a **capability note** at `knowledge/docs/<capability-path>.md` with an optional `## How it works, roughly` section and a `## Why` section, a list of entries each starting with the name of the requirement it explains;
- a **tools inventory** at `knowledge/docs/tools.md`, grouped by purpose, where each tool lists its packages, what it's for, the features that use it, the change that added it, and whether it is dev-only;
- **foundation cards** at `knowledge/foundations/<slug>.md` (app-wide) or `knowledge/foundations/<product>/<slug>.md` (one product), each with a title, a status (`current` or `replaced`) and the sections In short, Why (evidence), Gives you, Limits you, Revisit if, Affects and History. A replaced card SHALL stay, naming what replaced it and why.

A "why" entry SHALL be written only for a decision with depth (it trades something, shapes more than one behavior, or would surprise someone later). An empty "why" is valid.

#### Scenario: Card replaced
- **GIVEN** the card "Canvas draws on a canvas" is replaced by a later choice
- **WHEN** the replacement is recorded
- **THEN** the old card stays with status `replaced`, naming the new card and the reason

#### Scenario: Small choice gets no why
- **GIVEN** a requirement whose only decision was a default colour
- **WHEN** `/kit:docs` drafts its capability note
- **THEN** no "why" entry is drafted for that requirement

### Requirement: Docs scan
`docs.mjs scan` SHALL report, for the project:
- each spec found, with its folder path and requirement count;
- capability notes that are missing, and notes that are stale (last changed before the newest archived change that touched that capability);
- tools in `package.json` dependencies or devDependencies that the inventory doesn't cover, and inventory tools no longer in `package.json`;
- foundation cards found;
- whether the page is older than the newest archived change.

A missing source SHALL be reported, never treated as an error.

#### Scenario: Stale note
- **GIVEN** `knowledge/docs/canvas/stickies.md` was last committed on 2026-10-10 and a change touching `canvas/stickies` was archived on 2026-10-12
- **WHEN** the scan runs
- **THEN** that note is listed as stale, naming the archived change

#### Scenario: Unlisted tool
- **GIVEN** `package.json` has `fake-indexeddb` and `tools.md` doesn't mention it
- **WHEN** the scan runs
- **THEN** `fake-indexeddb` is listed as not in the inventory

### Requirement: Draft notes on a yes
`/kit:docs` SHALL run the scan, then draft only the missing or stale capability notes, inventory entries and foundation cards. It SHALL show each draft in full in its message, numbered, with where it will be written, then ask the user per item in one batch (yes / change / skip), naming each draft by its number, and write only what the user says yes to. It SHALL NOT put draft text in a question's option preview. It SHALL then build the page. It SHALL NOT edit specs, archived changes or `decisions.md`, and SHALL NOT commit.

#### Scenario: Nothing missing
- **GIVEN** the scan finds no missing or stale notes and no unlisted tools
- **WHEN** the user runs `/kit:docs`
- **THEN** nothing is asked, and the page is rebuilt

#### Scenario: User skips a draft
- **WHEN** the user picks skip for a drafted card
- **THEN** no file is written for it, and the next scan still lists it as missing

#### Scenario: Drafts shown in full before the question
- **GIVEN** three drafted notes, one of them 12 lines long
- **WHEN** /kit:docs asks which to write
- **THEN** every draft is shown in full in the message, numbered, and the questions name them by number; no draft text sits in an option preview

### Requirement: Docs page build
`docs.mjs build` SHALL write one self-contained HTML file at `knowledge/docs/index.html` that works offline (no network requests). It SHALL contain:
- a tree: App foundations, Tools, then products and sub-features from the spec folder paths (`canvas/stickies` → Canvas › Stickies; a flat spec is one level);
- per sub-feature: "How it works, roughly" when its note has one, then each requirement with its scenarios (user stories) numbered from 1 within the requirement, visibly separated from each other, and split into GIVEN, WHEN, THEN and AND rows;
- per requirement: its "why" entries, the foundation cards they link, and the archived change that added or last changed it;
- per sub-feature: the PRD it came from, when an archived change that touched it names one in its proposal (`PRD: <path> @ <commit>`), with the PRD's title and status;
- per sub-feature: a history of the archived changes that touched it, newest first, each with the first line of its proposal's Why;
- a sort control for the tree: sort by name, last updated or created, ascending or descending; the default is last updated, newest first. A sub-feature's created date is its oldest archived change, its updated date its newest; one never updated has the same date for both; a product takes the newest updated and oldest created of its sub-features. The sort applies among products and among each product's sub-features.

Search is not part of this change (deferred by the user, 2026-10-12).

The build SHALL read requirement names from `spec.md` itself. It SHALL produce the same file for the same sources. Every piece of source text SHALL be HTML-escaped.

#### Scenario: Nested specs become a tree
- **GIVEN** specs at `openspec/specs/canvas/stickies/spec.md` and `openspec/specs/canvas/saving/spec.md`
- **WHEN** the page is built
- **THEN** the tree shows Canvas with the sub-features Stickies and Saving

#### Scenario: Scenario split
- **GIVEN** a scenario with a `- **GIVEN**`, a `- **WHEN**` and a `- **THEN**` line
- **WHEN** the page is built
- **THEN** the scenario shows three labelled rows

#### Scenario: Numbered user stories
- **GIVEN** a requirement with three scenarios
- **WHEN** the page is built
- **THEN** they show as stories 1, 2 and 3, each separated from the next

#### Scenario: Default sort
- **GIVEN** Saving was last changed on 2026-10-12 and Stickies on 2026-10-07
- **WHEN** the page opens
- **THEN** the tree lists Saving above Stickies, and the sort control shows "Last updated", newest first

#### Scenario: PRD link
- **GIVEN** the archived change that touched Stickies has `PRD: knowledge/prds/acme-canvas.md @ abc1234` in its proposal, and that PRD's title is "Canvas" with status `Shipped`
- **WHEN** the page is built
- **THEN** Stickies shows "From PRD: Canvas · Shipped"

#### Scenario: Products open and close
- **GIVEN** the product Canvas with the sub-features Stickies and Saving
- **WHEN** the user clicks Canvas in the left list
- **THEN** its sub-features collapse, and a second click opens them again

#### Scenario: Readable requirement text
- **GIVEN** a requirement whose text has a bullet list, **bold** words and `code`
- **WHEN** the page is built
- **THEN** it shows a list, bold text and code, with no Markdown symbols
- **AND** the sub-feature `prd-authoring` is titled "PRD authoring"

#### Scenario: PRD file no longer there
- **GIVEN** an archived proposal names `knowledge/prds/old.md`, and that file was deleted
- **WHEN** the page is built
- **THEN** the sub-feature shows "From PRD: knowledge/prds/old.md · unknown"

#### Scenario: Markup in spec text
- **GIVEN** a requirement whose text contains `<script>`
- **WHEN** the page is built
- **THEN** the page shows the text literally and runs no script from it

### Requirement: Open decisions on the page
The page SHALL show each `open` or `later` item from the decision records of active **and archived** changes as "undecided", with its question, date and change. An item SHALL appear on the sub-feature whose spec folder its `from` path names; otherwise it SHALL appear in an "Undecided" list for its change. An item from an archived change SHALL say which archived change it came from. A sub-feature with undecided items SHALL show their count in the tree.

#### Scenario: Undecided on a sub-feature
- **GIVEN** an open decision whose `from` is `specs/canvas/saving/spec.md:40`
- **WHEN** the page is built
- **THEN** Saving shows a badge "1" in the tree (tooltip "1 undecided"), and the item on its page

#### Scenario: Later decision survives the archive
- **GIVEN** a decision marked `later` in change `acme-canvas`
- **WHEN** `acme-canvas` is archived and the page is rebuilt
- **THEN** the item is still shown as undecided, labelled with the archived change `acme-canvas`

### Requirement: Missing sources degrade
The build SHALL NOT stop for a missing or broken source:
- no specs → the page says "no specs yet" and still shows foundations and tools;
- a spec that can't be parsed or an unreadable decision record → a warning row in its place;
- no `package.json` → the Tools panel says so;
- an archived change without specs → listed in history as "no spec changes".

#### Scenario: Project without specs
- **GIVEN** a project with foundation cards but no `openspec/specs/`
- **WHEN** the page is built
- **THEN** the page shows the cards and "no specs yet", and the build exits successfully

### Requirement: Page order and navigation are stable
The page SHALL order specs and tree entries the same way on every machine, whatever the system locale. Archived changes on the same day SHALL be ordered by when they were archived, newest first, so "changed by", history and the PRD shown name the latest one. Following a link to a sub-feature inside a collapsed product SHALL open that product in the tree.

#### Scenario: Two archives on one day
- **GIVEN** `2026-10-12-kit-docs` was archived after `2026-10-12-build-readiness`
- **WHEN** the page is built
- **THEN** history lists `kit-docs` first, and a requirement both touched shows "changed by kit-docs"

#### Scenario: Link into a collapsed product
- **GIVEN** the Canvas product is collapsed in the tree
- **WHEN** the user follows a link to `#spec/canvas/stickies`
- **THEN** Canvas opens and Stickies is shown as the current entry

### Requirement: One yes for a big batch
When more than 3 notes, cards or tools entries need drafting, the docs skill SHALL list them and ask once whether to write all, go one by one, or stop. On "write all" it SHALL draft them in parallel where the agent can (one agent per capability, then one per card), write them as uncommitted files, rebuild the page, and tell the user to review with git. Batches of 3 or fewer SHALL keep the question per draft.

#### Scenario: First run on a project with history
- **GIVEN** 8 capabilities without notes and several card candidates
- **WHEN** the user runs `/kit:docs` and answers "Write all"
- **THEN** one question was asked, the files are written uncommitted, the page is rebuilt, and the report says to review them with `git diff`

#### Scenario: A few new drafts
- **WHEN** 2 notes are missing
- **THEN** each draft is shown and asked about, as before

### Requirement: Code in notes renders as code
Text between backticks in a capability note's "How it works", its Why entries and foundation cards SHALL render as code on the page, escaped like all other text, with `[[card]]` links still working.

#### Scenario: Command in How it works
- **WHEN** a note's How it works says "Run `/kit:ready` first"
- **THEN** the page shows `/kit:ready` as code, with no backticks
