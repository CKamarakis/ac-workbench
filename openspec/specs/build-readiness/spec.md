# build-readiness Specification

## Purpose
Catches the decisions a change still needs before the build starts, asks the user to make them in one batch, and keeps a per-change record of every decision until it is settled.

## Requirements

### Requirement: Readiness check
The readiness check SHALL run for one OpenSpec change whose planning artifacts are complete. It SHALL read the change's proposal, specs, design and tasks, and the PRD the proposal links to, if any. It SHALL list:
- **gaps**: behaviors with no scenario (empty, error, loading, permission and limit cases, UI states and copy, data shape), and vague or unfinished wording (`TBD`, `TODO`, "etc.", "fast", "nice", question marks in requirements);
- **differences**: places where the PRD, the specs and the design disagree;
- **points to confirm**: key assumptions and high-impact behaviors that look decided but that the user should check;
- **new tools**: dependencies the change plans to add (see "New-tool check").

Each item SHALL say where it was found. The check SHALL NOT edit the change's artifacts unless the user picks an answer for that item.

#### Scenario: Missing error case
- **GIVEN** a change whose spec covers uploading an image but has no scenario for a failed upload
- **WHEN** the user runs the readiness check
- **THEN** a gap item names the requirement and asks what the user sees when an upload fails

#### Scenario: PRD and spec disagree
- **GIVEN** the PRD says boards hold up to 5,000 items and the spec says 1,000
- **WHEN** the readiness check runs
- **THEN** a difference item quotes both, with their file paths

#### Scenario: Planning not complete
- **GIVEN** a change with a proposal but no tasks
- **WHEN** the user runs the readiness check
- **THEN** it says planning isn't complete, names the next artifact, and checks nothing

### Requirement: Decisions asked in one batch
The readiness check SHALL show its items before anything else, with their count. Each item SHALL be offered as a question with two to four options, one marked as recommended, and SHALL always allow "Later". The questions SHALL be asked together, not one at a time during the build. When the user picks an answer, the agent SHALL write it into the change: a behavior as a spec scenario, a decision with its reason into `design.md`. When the user picks "Later", nothing in the change SHALL be edited for that item.

#### Scenario: Answer written into the spec
- **GIVEN** a gap item about failed uploads, with the recommended option "Show a broken-image tile"
- **WHEN** the user picks that option
- **THEN** the spec gains a scenario for a failed upload showing a broken-image tile, and the item is recorded as decided

#### Scenario: Deferred
- **WHEN** the user picks "Later" for an item
- **THEN** the item is recorded as open with today's date, and no artifact changes

### Requirement: Readiness never blocks
The readiness check SHALL only warn. It SHALL end by saying the build can go ahead, and how many decisions are still open. No kit hook or skill SHALL stop `/opsx:apply` because of the readiness check or open decisions.

#### Scenario: Open items at apply
- **GIVEN** a change with two open decisions
- **WHEN** the user runs `/opsx:apply`
- **THEN** the apply runs

### Requirement: Decision record
Each change SHALL have at most one decision record, `decisions.md` in the change folder, created on first use. Entries SHALL be added and updated only through the kit's script, never by hand. Each entry SHALL have:
- an id;
- a kind: `gap`, `difference`, `confirm`, `new-tool`, `unplanned-tool`, `behavior`, or `decision`;
- the question or finding, and where it came from;
- the options and the recommended one, when there are options;
- a status: `open`, `decided` or `later`;
- the answer and where it was written, once decided;
- the date of each change of status.

`later` SHALL count as open everywhere open decisions are counted.

#### Scenario: Record created
- **GIVEN** a change with no `decisions.md`
- **WHEN** the readiness check records its first item
- **THEN** `decisions.md` exists in the change folder with that item as `open`

#### Scenario: Decided later
- **GIVEN** an item recorded as `later` on 2026-10-12
- **WHEN** the user answers it on 2026-10-14
- **THEN** the item is `decided`, with the answer, where it was written, and both dates

### Requirement: New-tool check
The readiness check SHALL compare the tools the change plans to add (from its design and tasks) with the project's existing dependencies (`package.json` dependencies and devDependencies) and, when the project has one, with the tools inventory (`knowledge/docs/tools.md`), using the inventory's stated purposes. For each planned tool, it SHALL say whether an existing dependency already covers the same purpose, and SHALL offer to reuse it (recommended when one exists) or to add the new one. A tool kept as new SHALL have its reason written into `design.md`. A project without `package.json` SHALL get a one-line note that the tool check was skipped.

#### Scenario: Overlapping tool
- **GIVEN** the project already depends on `@dnd-kit/core`
- **WHEN** a change's design plans to add another drag-and-drop library
- **THEN** a `new-tool` item names `@dnd-kit/core` and recommends reusing it

#### Scenario: Truly new tool
- **WHEN** the user keeps a planned tool that nothing existing covers
- **THEN** `design.md` records why it is added, and the item is decided

#### Scenario: Purpose found in the inventory
- **GIVEN** `tools.md` lists TipTap under "Rich text" for Stickies
- **WHEN** a change's design plans to add another rich-text editor
- **THEN** the `new-tool` item names TipTap, says the inventory already has it for rich text, and recommends reusing it

### Requirement: Open decisions resurface
While a change has open decisions, the next-step suggestion, the verify report and the archive step SHALL each mention how many are open and the date of the oldest one. None of them SHALL block on it.

#### Scenario: Reminder at verify
- **GIVEN** a change with one item marked `later` on 2026-10-12
- **WHEN** the user runs `/kit:verify`
- **THEN** the report lists "1 decision still open since 2026-10-12" as advisory, and the result is unaffected

### Requirement: Decisions after archive
A decision left `open` or `later` when its change is archived SHALL stay in the archived change's decision record, SHALL be counted in one line of the next-step suggestion (never blocking), and SHALL still be decidable: the decision record commands SHALL accept the archived change by its change name and find it under the archive. Deciding it SHALL record the answer and date as for an active change.

#### Scenario: Deciding a Later item after archive
- **GIVEN** change `acme-canvas` was archived with item D2 marked `later`
- **WHEN** the user decides D2 with the answer "keep full undo history"
- **THEN** the archived change's decision record shows D2 decided with that answer and today's date, and the docs page no longer lists it as undecided

#### Scenario: Reminder in /kit:next
- **GIVEN** two items left `later` in archived changes and no docs page
- **WHEN** the user runs `/kit:next`
- **THEN** the suggestion carries the line "2 decisions still open in archived changes", and the suggested step is unchanged

### Requirement: Safeguards picked per change
The readiness check SHALL rate the change on three dimensions, each low, medium or high, with the reason for each rating:
- **reach**: what depends on what the change touches. Low: one spec, and no file that other files import changes. Medium: two or more specs, or a shared module changes. High: a contract others rely on changes (command flags or output, file formats, skill names, hook behaviour).
- **undo**: whether reverting the commits undoes the change fully. Low: it does. High: the change writes outside the repository (data, state, installed configuration, deleted user files, migrations).
- **safety**: low, unless the change touches secrets, permissions, blocking hooks, user data or network writes, which is high.

The ratings SHALL come from `design.md` and `tasks.md`; the check SHALL read the files they name only when the plan doesn't say. A word in the text (for example "payments" or "session") SHALL NOT change a rating on its own. The cut-offs are defaults, to be calibrated on real changes.

From the ratings it SHALL recommend safeguards:
- all low: the current flow (build in the branch, verify as today, plus the scenario-to-test check);
- any medium: also a worktree for the build, and a review against the spec at verify;
- any high: also edge-case probes, medium-severity security findings blocking, and the user's OK before merge.

Building with subagents SHALL be recommended only when the tasks are independent of each other and too long for one context, with that reason stated. The user SHALL be able to accept the recommendation or change any part of it. The choice and the ratings with their reasons SHALL be written into a `## Safeguards` section of `design.md`; when the change has no `design.md` yet, the check SHALL say to write the design first and SHALL NOT create one.

#### Scenario: Low-risk change
- **GIVEN** the design changes one skill's text and its one spec, and no shared module
- **WHEN** the readiness check runs
- **THEN** reach, undo and safety are low, each with its reason, and the recommendation is the current flow plus the scenario-to-test check

#### Scenario: Shared module
- **GIVEN** the tasks change a module that three other scripts import
- **WHEN** the readiness check runs
- **THEN** reach is medium with that reason, and the recommendation adds a worktree and the review against the spec

#### Scenario: Keyword alone
- **GIVEN** the proposal mentions "session start" but nothing touches sessions or permissions
- **WHEN** the readiness check runs
- **THEN** safety stays low

#### Scenario: User changes the recommendation
- **GIVEN** the recommendation includes a worktree
- **WHEN** I choose to build in the branch instead
- **THEN** `design.md`'s Safeguards section records the ratings, the recommendation and my choice

#### Scenario: No design yet
- **GIVEN** the change has no `design.md`
- **WHEN** the safeguards are recorded
- **THEN** I'm told to write the design first, and no `design.md` is created

#### Scenario: Plan doesn't say
- **GIVEN** the design names a module but not who uses it
- **WHEN** the readiness check rates reach
- **THEN** it reads which files import that module, and the reason says so

### Requirement: Web-ui project
The kit SHALL treat a project as web-ui when its `.claude/kit.json` has `project_type: web-ui`. A type in `kit.json` SHALL win: any other type (for example `cli` or `none`) means not web-ui, whatever files exist. Only when `kit.json` names no type (or doesn't exist) SHALL files decide: Impeccable installed (`.claude/skills/impeccable`), or a web app's config file at the root (the same list `/kit:start` uses: `next`, `vite`, `astro`, `svelte`, `nuxt`). The same rule SHALL decide the `shape` offer, the `ui-review` safeguard and the UI gap check.

#### Scenario: Type in kit.json
- **GIVEN** `.claude/kit.json` says `project_type: web-ui`
- **WHEN** the kit checks the project
- **THEN** it is web-ui

#### Scenario: Impeccable installed, no type
- **GIVEN** there's no `.claude/kit.json` type, and `.claude/skills/impeccable` exists
- **WHEN** the kit checks the project
- **THEN** it is web-ui, and the reason names Impeccable

#### Scenario: Explicit type wins
- **GIVEN** `.claude/kit.json` says `project_type: cli`, and a `vite.config.ts` exists
- **WHEN** the kit checks the project
- **THEN** it is not web-ui, and the reason names the type

#### Scenario: Neither
- **WHEN** the project has no type in `kit.json`, no Impeccable and no web app config file
- **THEN** it is not web-ui

### Requirement: UI review safeguard
In a web-ui project, the readiness check SHALL recommend the `ui-review` safeguard when the change's `design.md` or `tasks.md` names UI files (pages, components, styles, or code that generates pages users see), with the files as the reason. A word in the text (for example "button" or "screen") SHALL NOT add it on its own. The user SHALL be able to drop it like any other safeguard, and the choice SHALL be written into the Safeguards section.

#### Scenario: UI files named
- **GIVEN** a web-ui project, and `tasks.md` names `src/app/board/page.tsx` and `src/components/Sticky.tsx`
- **WHEN** the readiness check runs
- **THEN** `ui-review` is recommended, and the reason names those files

#### Scenario: Generated page
- **GIVEN** a web-ui project, and `tasks.md` changes the script that generates the docs page's HTML and CSS
- **WHEN** the readiness check runs
- **THEN** `ui-review` is recommended, and the reason names the generator

#### Scenario: Word alone
- **GIVEN** a web-ui project, and the proposal says "the button label" but the plan only changes a script
- **WHEN** the readiness check runs
- **THEN** `ui-review` is not recommended

#### Scenario: Not web-ui
- **GIVEN** a project that isn't web-ui, and the plan names a page file
- **WHEN** the readiness check runs
- **THEN** `ui-review` is not recommended

### Requirement: UI states and copy in the gap check
In a web-ui project, the readiness check's gap list SHALL also cover, for each screen the change touches, the empty, loading, error, permission and overflow states and unclear copy (labels, error messages), each as a gap only when the specs don't already cover it.

#### Scenario: Missing empty state
- **GIVEN** a web-ui change that adds a board screen, and no scenario says what an empty board shows
- **WHEN** the readiness check runs
- **THEN** the empty board is listed as a gap

### Requirement: Worktree needs a committed plan
When the chosen safeguards include a worktree and the change's planning files have uncommitted changes, the readiness close SHALL say that a worktree starts from the last commit and won't see them. It SHALL offer to commit the planning files, and commit only on a yes. With everything committed, or without a worktree, it SHALL say nothing about it.

#### Scenario: Worktree with an uncommitted plan
- **GIVEN** the safeguards include a worktree
- **WHEN** `openspec/changes/<name>/` has uncommitted files at the close
- **THEN** the close says the worktree won't see them and offers to commit them

#### Scenario: Plan committed
- **WHEN** the safeguards include a worktree and the change folder has no uncommitted files
- **THEN** the close says nothing about committing
