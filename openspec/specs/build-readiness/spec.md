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
The readiness check SHALL compare the tools the change plans to add (from its design and tasks) with the project's existing dependencies (`package.json` dependencies and devDependencies). For each planned tool, it SHALL say whether an existing dependency already covers the same purpose, and SHALL offer to reuse it (recommended when one exists) or to add the new one. A tool kept as new SHALL have its reason written into `design.md`. A project without `package.json` SHALL get a one-line note that the tool check was skipped.

#### Scenario: Overlapping tool
- **GIVEN** the project already depends on `@dnd-kit/core`
- **WHEN** a change's design plans to add another drag-and-drop library
- **THEN** a `new-tool` item names `@dnd-kit/core` and recommends reusing it

#### Scenario: Truly new tool
- **WHEN** the user keeps a planned tool that nothing existing covers
- **THEN** `design.md` records why it is added, and the item is decided

### Requirement: Open decisions resurface
While a change has open decisions, the next-step suggestion, the verify report and the archive step SHALL each mention how many are open and the date of the oldest one. None of them SHALL block on it.

#### Scenario: Reminder at verify
- **GIVEN** a change with one item marked `later` on 2026-10-12
- **WHEN** the user runs `/kit:verify`
- **THEN** the report lists "1 decision still open since 2026-10-12" as advisory, and the result is unaffected
