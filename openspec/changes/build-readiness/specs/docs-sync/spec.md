# Spec Delta

## Purpose

Brings a change's specs and design up to date with what was actually built, before archive turns them into the project's living record, and asks the user about built behavior that may not be what they want.

## ADDED Requirements

### Requirement: Docs sync sources
The docs sync SHALL run as part of the verify step for one change. It SHALL gather:
- the decisions the build recorded, from the change's apply receipt (`apply.md`) when one exists;
- the commits since the change's artifacts were last edited, with a count of the code commits among them;
- the change's diff;
- dependencies added or removed in `package.json` since the change started.

When the artifacts were last edited before code commits were made, the report SHALL say so, with the date and the count.

#### Scenario: Docs stopped early
- **GIVEN** a change whose `design.md` and specs were last committed on 2026-10-10, followed by 29 code commits
- **WHEN** the docs sync runs
- **THEN** it reports "docs last updated 2026-10-10; 29 code commits since"

#### Scenario: No apply receipt
- **GIVEN** a plain OpenSpec change with no `apply.md`
- **WHEN** the docs sync runs
- **THEN** it works from the commits and the diff alone, and says the apply receipt was missing

### Requirement: Sort what was built
The docs sync SHALL sort each item it finds into one of:
- **behavior**: something the user can observe. It SHALL be proposed as a spec scenario in the change's delta specs (Given/When/Then);
- **decision with depth**: a choice that trades something, shapes more than one behavior, or would surprise someone later. It SHALL be proposed for `design.md`, with its reason;
- **how the build ran**: process detail such as push cadence, task dispatch or test ports. It SHALL NOT be proposed for the docs, and SHALL be listed in one line as left out.

A small or preference decision SHALL NOT be proposed for `design.md` just to give it a reason.

#### Scenario: Behavior found in the receipt
- **GIVEN** the apply receipt says "Fit on a single sticky zooms close to 350%" and no scenario covers fitting one item
- **WHEN** the docs sync runs
- **THEN** it proposes a scenario for fitting a single item under the fit requirement

#### Scenario: Process ruling left out
- **GIVEN** the apply receipt says "the speed test runs its own dev server on port 3101"
- **WHEN** the docs sync runs
- **THEN** the item is listed as left out (how the build ran), and nothing is proposed

### Requirement: Flag built behavior that may be unwanted
The docs sync SHALL flag an item when the built behavior changes what the user sees in a way the specs did not plan, or when it could lose or hide the user's data. A flagged item SHALL be asked as "this is what was built; is it what you want?", with options to keep it (then documented as is) or to change it (then recorded as an open decision and not documented as final).

#### Scenario: Possible data loss
- **GIVEN** the build loads a corrupt saved board as an empty board
- **WHEN** the docs sync runs
- **THEN** the item is flagged and asked before any spec text is written for it

### Requirement: Unplanned dependencies
The docs sync SHALL list each dependency added during the change that the change's proposal, design and tasks do not mention, and SHALL ask whether to keep it. A kept one SHALL get its reason written into `design.md`. Removed dependencies SHALL be listed for information.

#### Scenario: Test helper slipped in
- **GIVEN** the change added `fake-indexeddb` to devDependencies and no change artifact mentions it
- **WHEN** the docs sync runs
- **THEN** an `unplanned-tool` item asks whether to keep `fake-indexeddb` and why

### Requirement: Updates only on a yes
The docs sync SHALL propose each update, show the text it would write and where, and SHALL write it only after the user says yes to that item. Each item SHALL be recorded in the change's decision record with its outcome. The docs sync SHALL be advisory: it SHALL NOT add a HARD item to the verify report.

#### Scenario: User declines an update
- **WHEN** the user says no to a proposed scenario
- **THEN** nothing is written for it, the item is recorded as decided ("not documented"), and verify's result is unchanged
