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

The body SHALL follow the kit's PRD template, written in the kit's own words. Licensed PM-OS text SHALL NOT be copied into it. The template's requirements section SHALL ask for user stories in Given/When/Then form (a starting state, an action, an expected outcome), grouped by flow or screen. The PRD skill SHALL draft requirements in that form, and SHALL keep a short plain statement where a requirement has no meaningful starting state or action.

When a draft or an update leaves items under Open questions, the PRD skill SHALL keep them out of its end report and SHALL ask, as a separate step, whether to go through them now or later. **Now:** it SHALL ask each question with concrete options, its recommendation first, and a Later option, and SHALL write each answer into the PRD. **Later:** it SHALL write nothing, and the questions SHALL stay in the Open questions section.

#### Scenario: New PRD
- **WHEN** a PRD is first drafted
- **THEN** its status is `Draft`, its `sources` lists the notes it was built from, and its body has the template's sections

#### Scenario: Requirements as stories
- **GIVEN** notes that say "dragging a sticky moves it; letting go saves the position"
- **WHEN** the PRD skill drafts the requirements
- **THEN** they include a story such as "Given a sticky on the board, when I drag it and let go, then it stays where I dropped it after a reload"

#### Scenario: Open questions put off
- **GIVEN** a new draft with 4 open questions
- **WHEN** the PRD skill asks "go through them now or later?" and the user picks Later
- **THEN** nothing more is written, the 4 questions stay under Open questions, and the reply says `/kit:next` will remind the user

#### Scenario: Invalid status
- **WHEN** a PRD's status is not one of the five values
- **THEN** kit skills report the PRD as invalid and name the bad value, instead of guessing a status

### Requirement: Draft a PRD from chosen notes
The PRD skill SHALL take an idea (a sentence or a title) and SHALL show a shortlist of relevant notes (excluding `archive/`), each with a one-line reason. It SHALL draft the PRD only from the notes the user picks, and SHALL cite each one in `sources`. Information that is not in the picked notes or the user's prompt SHALL be marked as an assumption or an open question, never stated as fact. When an explore record is `ready-for-prd`, the skill SHALL offer it first: the draft then uses the record's decisions and its notes (all cited in `sources`), and the record is linked to the PRD once the file is created.

#### Scenario: Shortlist and pick
- **WHEN** the user runs the PRD skill with "gift cards" and the project has notes about checkout and onboarding
- **THEN** the skill shortlists the checkout notes with reasons, and drafts only after the user picks

#### Scenario: No relevant notes
- **WHEN** no note is relevant to the idea
- **THEN** the skill says so, and offers to draft from the prompt alone with `sources` empty

#### Scenario: Gaps marked
- **WHEN** the picked notes don't say who the users are
- **THEN** the draft lists that under open questions instead of inventing users

#### Scenario: Draft from an explore record
- **GIVEN** the explore record `kit-status` is `ready-for-prd` with 6 decisions and sources `notes/a.md` and `notes/b.md`
- **WHEN** the user runs the PRD skill
- **THEN** the skill offers the record first; on a yes the draft uses its decisions, cites both notes in `sources`, and the record is linked to the new PRD

### Requirement: Update a PRD per section
When the PRD skill runs on an existing PRD, it SHALL propose changes one section at a time and SHALL write a section only after the user approves that section. It SHALL re-read the file right before writing, and SHALL NOT overwrite text the user changed since the proposal was made.

#### Scenario: Section approved
- **WHEN** the skill proposes changes to "Scope" and "Risks" and the user approves only "Scope"
- **THEN** only the "Scope" section changes in the file

#### Scenario: User edited meanwhile
- **WHEN** the user edits the "Scope" section after the proposal is shown but before approving it
- **THEN** the skill does not write "Scope", and shows the conflict for the user to resolve

### Requirement: Ready PRD hands off to planning
The project's routing rules SHALL direct the proposal step to take one PRD as its main input. With one candidate PRD, it uses that one. With several, it takes the most recently updated one, names it, and lists the others so the user can switch; when the user's words point to none of them, it asks. A PRD that isn't `Ready` SHALL get a one-line note, never a stop. The resulting proposal SHALL record the PRD's path and the commit it was read at. The PRD's `change` field SHALL be set to the new change's name, and its status SHALL move to `Building` only after the user confirms.

#### Scenario: Proposal from Ready PRD
- **WHEN** the user runs `/opsx:propose` in a project with a Ready PRD `prds/gift-cards.md`
- **THEN** the proposal cites `knowledge/prds/gift-cards.md` and the commit it was read at

#### Scenario: Status after proposal
- **WHEN** the proposal is created and the user confirms
- **THEN** the PRD's `change` names the change, and its status is `Building`

#### Scenario: Several PRDs
- **GIVEN** two PRDs, `prds/new.md` updated after `prds/old.md`
- **WHEN** the user runs `/opsx:propose` without naming one
- **THEN** the proposal step takes `new`, says so, and names `old` as the other choice; nothing blocks

#### Scenario: Draft PRD
- **WHEN** the user proposes from a PRD whose status is `Draft`
- **THEN** the proposal step notes in one line that it isn't Ready and goes on

### Requirement: Status changes need the user
The kit SHALL NOT change a PRD's status, or any other content, without the user's confirmation. A suggested status change, for example `Shipped` after the change is archived, SHALL be offered and applied only on a yes.

#### Scenario: Shipped suggested
- **WHEN** the change named in a `Building` PRD is archived
- **THEN** the kit asks whether the PRD is done or continues in another change, offering `Shipped` or linking the next change, and the file is unchanged until the user agrees

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

### Requirement: Shape offered for screens
When a PRD is drafted or updated in a web-ui project (build-readiness "Web-ui project") and it touches a screen, the kit SHALL offer `/impeccable shape` once for that PRD. On a yes, the confirmed brief SHALL be proposed for the PRD's "UX notes and assets" section and written only on the user's yes, like any section update. The kit SHALL NOT run `shape` without the user's yes, and SHALL NOT offer it again for the same PRD after a no. The answer SHALL be kept in the PRD's frontmatter as `shape: done` or `shape: declined`, set through the helper like the other fields.

#### Scenario: Screen in a web-ui project
- **GIVEN** a web-ui project, and a PRD whose requirements describe a board screen
- **WHEN** I draft it
- **THEN** I'm offered `/impeccable shape` once; on a yes, its brief is proposed for UX notes and written on my yes

#### Scenario: No screen
- **GIVEN** a web-ui project, and a PRD about a background job
- **WHEN** I draft it
- **THEN** no `shape` offer is made

#### Scenario: Declined
- **GIVEN** I said no to the `shape` offer for a PRD
- **WHEN** I update that PRD later
- **THEN** the offer isn't repeated
