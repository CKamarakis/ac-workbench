## ADDED Requirements

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
- **GIVEN** the card "Storms draws on a canvas" is replaced by a later choice
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
- **GIVEN** `knowledge/docs/storms/stickies.md` was last committed on 2026-10-10 and a change touching `storms/stickies` was archived on 2026-10-12
- **WHEN** the scan runs
- **THEN** that note is listed as stale, naming the archived change

#### Scenario: Unlisted tool
- **GIVEN** `package.json` has `fake-indexeddb` and `tools.md` doesn't mention it
- **WHEN** the scan runs
- **THEN** `fake-indexeddb` is listed as not in the inventory

### Requirement: Draft notes on a yes
`/kit:docs` SHALL run the scan, then draft only the missing or stale capability notes, inventory entries and foundation cards. It SHALL show each draft with where it will be written, ask the user per item in one batch (yes / change / skip), and write only what the user says yes to. It SHALL then build the page. It SHALL NOT edit specs, archived changes or `decisions.md`, and SHALL NOT commit.

#### Scenario: Nothing missing
- **GIVEN** the scan finds no missing or stale notes and no unlisted tools
- **WHEN** the user runs `/kit:docs`
- **THEN** nothing is asked, and the page is rebuilt

#### Scenario: User skips a draft
- **WHEN** the user picks skip for a drafted card
- **THEN** no file is written for it, and the next scan still lists it as missing

### Requirement: Docs page build
`docs.mjs build` SHALL write one self-contained HTML file at `knowledge/docs/index.html` that works offline (no network requests). It SHALL contain:
- a tree: App foundations, Tools, then products and sub-features from the spec folder paths (`storms/stickies` → Storms › Stickies; a flat spec is one level);
- per sub-feature: "How it works, roughly" when its note has one, then each requirement with its scenarios (user stories) numbered from 1 within the requirement, visibly separated from each other, and split into GIVEN, WHEN, THEN and AND rows;
- per requirement: its "why" entries, the foundation cards they link, and the archived change that added or last changed it;
- per sub-feature: the PRD it came from, when an archived change that touched it names one in its proposal (`PRD: <path> @ <commit>`), with the PRD's title and status;
- per sub-feature: a history of the archived changes that touched it, newest first, each with the first line of its proposal's Why;
- a sort control for the tree: sort by name, last updated or created, ascending or descending; the default is last updated, newest first. A sub-feature's created date is its oldest archived change, its updated date its newest; one never updated has the same date for both; a product takes the newest updated and oldest created of its sub-features. The sort applies among products and among each product's sub-features.

Search is not part of this change (deferred by the user, 2026-10-12).

The build SHALL read requirement names from `spec.md` itself. It SHALL produce the same file for the same sources. Every piece of source text SHALL be HTML-escaped.

#### Scenario: Nested specs become a tree
- **GIVEN** specs at `openspec/specs/storms/stickies/spec.md` and `openspec/specs/storms/saving/spec.md`
- **WHEN** the page is built
- **THEN** the tree shows Storms with the sub-features Stickies and Saving

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
- **GIVEN** the archived change that touched Stickies has `PRD: knowledge/prds/storms-canvas.md @ abc1234` in its proposal, and that PRD's title is "Storms canvas" with status `Shipped`
- **WHEN** the page is built
- **THEN** Stickies shows "From PRD: Storms canvas · Shipped"

#### Scenario: Markup in spec text
- **GIVEN** a requirement whose text contains `<script>`
- **WHEN** the page is built
- **THEN** the page shows the text literally and runs no script from it

### Requirement: Open decisions on the page
The page SHALL show each `open` or `later` item from the active changes' decision records as "undecided", with its question, date and change. An item SHALL appear on the sub-feature whose spec folder its `from` path names; otherwise it SHALL appear in an "Undecided" list for its change. A sub-feature with undecided items SHALL show their count in the tree.

#### Scenario: Undecided on a sub-feature
- **GIVEN** an open decision whose `from` is `specs/storms/saving/spec.md:40`
- **WHEN** the page is built
- **THEN** Saving shows "1 undecided" in the tree, and the item on its page

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
