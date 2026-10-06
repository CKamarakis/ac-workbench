# prd-authoring Specification

## Purpose
Turns a project's notes into a PRD that the user owns and edits freely, and hands a Ready PRD to OpenSpec planning with a record of exactly which version was planned.

## Requirements

### Requirement: PRD format and status
Each PRD SHALL be one Markdown file in `prds/`, named `<slug>.md`. Its frontmatter SHALL include:
- `title`
- `status`: one of `Draft`, `Review`, `Ready`, `Building`, `Shipped`
- `sources`: a list of note paths relative to the knowledge folder (may be empty)
- `change`: the name of the OpenSpec change that uses it, once one exists

The body SHALL follow the kit's PRD template, written in the kit's own words. Licensed PM-OS text SHALL NOT be copied into it.

#### Scenario: New PRD
- **WHEN** a PRD is first drafted
- **THEN** its status is `Draft`, its `sources` lists the notes it was built from, and its body has the template's sections

#### Scenario: Invalid status
- **WHEN** a PRD's status is not one of the five values
- **THEN** kit skills report the PRD as invalid and name the bad value, instead of guessing a status

### Requirement: Draft a PRD from chosen notes
The PRD skill SHALL take an idea (a sentence or a title) and SHALL show a shortlist of relevant notes (excluding `archive/`), each with a one-line reason. It SHALL draft the PRD only from the notes the user picks, and SHALL cite each one in `sources`. Information that is not in the picked notes or the user's prompt SHALL be marked as an assumption or an open question, never stated as fact.

#### Scenario: Shortlist and pick
- **WHEN** the user runs the PRD skill with "gift cards" and the project has notes about checkout and onboarding
- **THEN** the skill shortlists the checkout notes with reasons, and drafts only after the user picks

#### Scenario: No relevant notes
- **WHEN** no note is relevant to the idea
- **THEN** the skill says so, and offers to draft from the prompt alone with `sources` empty

#### Scenario: Gaps marked
- **WHEN** the picked notes don't say who the users are
- **THEN** the draft lists that under open questions instead of inventing users

### Requirement: Update a PRD per section
When the PRD skill runs on an existing PRD, it SHALL propose changes one section at a time and SHALL write a section only after the user approves that section. It SHALL re-read the file right before writing, and SHALL NOT overwrite text the user changed since the proposal was made.

#### Scenario: Section approved
- **WHEN** the skill proposes changes to "Scope" and "Risks" and the user approves only "Scope"
- **THEN** only the "Scope" section changes in the file

#### Scenario: User edited meanwhile
- **WHEN** the user edits the "Scope" section after the proposal is shown but before approving it
- **THEN** the skill does not write "Scope", and shows the conflict for the user to resolve

### Requirement: Ready PRD hands off to planning
When a PRD's status is `Ready`, the project's routing rules SHALL direct the proposal step to read that PRD as its main input. The resulting proposal SHALL record the PRD's path and the commit it was read at. The PRD's `change` field SHALL be set to the new change's name, and its status SHALL move to `Building` only after the user confirms.

#### Scenario: Proposal from Ready PRD
- **WHEN** the user runs `/opsx:propose` in a project with a Ready PRD `prds/gift-cards.md`
- **THEN** the proposal cites `knowledge/prds/gift-cards.md` and the commit it was read at

#### Scenario: Status after proposal
- **WHEN** the proposal is created and the user confirms
- **THEN** the PRD's `change` names the change, and its status is `Building`

### Requirement: Status changes need the user
The kit SHALL NOT change a PRD's status, or any other content, without the user's confirmation. A suggested status change, for example `Shipped` after the change is archived, SHALL be offered and applied only on a yes.

#### Scenario: Shipped suggested
- **WHEN** the change named in a `Building` PRD is archived
- **THEN** the kit suggests marking the PRD `Shipped`, and the file is unchanged until the user agrees

### Requirement: PRDs ordered by most recent update
Wherever the kit lists PRDs or asks the user to choose one, it SHALL order them by when they were last updated, newest first. This covers the knowledge listing, the PRD skill, and the proposal step's choice between several Ready PRDs. A PRD's last update is:
- the file's modification time, when it has uncommitted changes or is not tracked by git;
- otherwise, the time of the last commit that touched it;
- the file's modification time, when git is not available.

Ties are broken by slug.

#### Scenario: Recently edited PRD first
- **WHEN** `prds/a.md` was last committed yesterday and `prds/b.md` has uncommitted edits from today
- **THEN** `b` is listed before `a`

#### Scenario: Proposal choice ordered
- **WHEN** two PRDs are Ready and the proposal step asks which to use
- **THEN** the options are ordered newest-updated first

#### Scenario: No git
- **WHEN** the project is not a git repository
- **THEN** PRDs are ordered by file modification time, newest first
