# Spec Delta

## MODIFIED Requirements

### Requirement: Open decisions on the page
The page SHALL show each `open` or `later` item from the decision records of active **and archived** changes as "undecided", with its question, date and change. An item SHALL appear on the sub-feature whose spec folder its `from` path names; otherwise it SHALL appear in an "Undecided" list for its change. An item from an archived change SHALL say which archived change it came from. A sub-feature with undecided items SHALL show their count in the tree.

#### Scenario: Undecided on a sub-feature
- **GIVEN** an open decision whose `from` is `specs/storms/saving/spec.md:40`
- **WHEN** the page is built
- **THEN** Saving shows a badge "1" in the tree (tooltip "1 undecided"), and the item on its page

#### Scenario: Later decision survives the archive
- **GIVEN** a decision marked `later` in change `storms-canvas`
- **WHEN** `storms-canvas` is archived and the page is rebuilt
- **THEN** the item is still shown as undecided, labelled with the archived change `storms-canvas`

## ADDED Requirements

### Requirement: Page order and navigation are stable
The page SHALL order specs and tree entries the same way on every machine, whatever the system locale. Archived changes on the same day SHALL be ordered by when they were archived, newest first, so "changed by", history and the PRD shown name the latest one. Following a link to a sub-feature inside a collapsed product SHALL open that product in the tree.

#### Scenario: Two archives on one day
- **GIVEN** `2026-10-12-kit-docs` was archived after `2026-10-12-build-readiness`
- **WHEN** the page is built
- **THEN** history lists `kit-docs` first, and a requirement both touched shows "changed by kit-docs"

#### Scenario: Link into a collapsed product
- **GIVEN** the Storms product is collapsed in the tree
- **WHEN** the user follows a link to `#spec/storms/stickies`
- **THEN** Storms opens and Stickies is shown as the current entry
