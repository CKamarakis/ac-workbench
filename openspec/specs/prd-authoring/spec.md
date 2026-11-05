# prd-authoring Specification

## Purpose
Turns a project's notes into a PRD that the user owns and edits freely, and hands a Ready PRD to OpenSpec planning with a record of exactly which version was planned.

## Requirements

### Requirement: PRD format and status
Each PRD SHALL be one Markdown file in `prds/`, named `<slug>.md`, or a part of one (see "PRD parts"). Its frontmatter SHALL include:
- `title`
- `status`: one of `Draft`, `Review`, `Ready`, `Building`, `Shipped`, `Dropped`
- `sources`: a list of note paths relative to the knowledge folder (may be empty)
- `change`: the name of the OpenSpec change that uses it, once one exists

`Dropped` marks a PRD or part that won't be built; it needs no `change` and never leads to a next-step suggestion.

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
- **WHEN** a PRD's status is not one of the six values
- **THEN** kit skills report the PRD as invalid and name the bad value, instead of guessing a status

#### Scenario: Dropped PRD
- **GIVEN** a PRD with status `Dropped` and no `change`
- **WHEN** `prd-check` runs
- **THEN** the PRD is valid, and `/kit:next` makes no suggestion about it

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

### Requirement: PRD parts
A PRD SHALL be able to have parts: a parent `prds/<slug>.md` and part files `prds/<slug>/<part>.md`, each with frontmatter `part-of: <slug>` plus the usual PRD fields. A part SHALL be named `<slug>/<part>` in every kit output. Each part SHALL have its own status and `change`. A PRD with no parts SHALL behave exactly as before.

#### Scenario: Part named with its parent
- **GIVEN** `prds/acme-v1.md` and `prds/acme-v1/part-a.md` with `part-of: acme-v1`
- **WHEN** the kit lists PRDs
- **THEN** the part is named `acme-v1/part-a`, with its own status and change

#### Scenario: Same part name under two parents
- **GIVEN** parents `acme-v1` and `acme-v2`, each with a part file `part-a.md`
- **WHEN** the kit lists PRDs
- **THEN** it shows two different parts, `acme-v1/part-a` and `acme-v2/part-a`

#### Scenario: Parent's old change removed
- **GIVEN** parent `acme-v1` is Building with `change: acme-old-change`, an archived change, and has parts
- **WHEN** the user runs `set-field --key change --value ""` on it
- **THEN** the `change` field is removed, and `/kit:status` never flags a parent with parts for its own archived change

#### Scenario: Single-file PRD unchanged
- **GIVEN** a project whose PRDs are all single files with no `part-of`
- **WHEN** `list`, `prd-check`, `/kit:next` and `/kit:status` run
- **THEN** their output is the same as before this change

### Requirement: Create a part
`new-prd --part-of <slug> --title <t>` SHALL create `prds/<slug>/<part slug>.md` from the kit's part template (Scope, Requirements, Done when, Open questions), with status `Draft` and `part-of: <slug>`, and SHALL add a row for the part to the parent's Parts section. It SHALL refuse when the parent doesn't exist, when the parent is itself a part, or when the part file exists. The full PRD template SHALL include a Parts section.

#### Scenario: New part
- **GIVEN** `prds/acme-v1.md` exists
- **WHEN** `new-prd --part-of acme-v1 --title "Part A"` runs
- **THEN** `prds/acme-v1/part-a.md` exists with status `Draft`, `part-of: acme-v1` and the part template's sections, and the parent's Parts section has a row for `acme-v1/part-a`

#### Scenario: Parent missing
- **WHEN** `new-prd --part-of nope --title "Part A"` runs and `prds/nope.md` doesn't exist
- **THEN** it prints an error naming the missing parent and writes nothing

#### Scenario: Parts of parts
- **WHEN** `new-prd --part-of acme-v1/part-a --title "Sub"` runs
- **THEN** it prints an error that a part can't have parts, and writes nothing

### Requirement: Parts listed under their parent
`list` SHALL show each part indented under its parent, each with its status and change. The status report SHALL name a part as "<parent title> › <part title>". Ordering among parents and single-file PRDs SHALL stay newest-updated first, where a parent's update time is the newest of itself and its parts.

#### Scenario: Grouped list
- **GIVEN** parent `acme-v1` with parts `part-a` (Building, change `acme-part-a`) and `part-b` (Ready)
- **WHEN** `list` runs
- **THEN** both parts appear indented directly under `acme-v1`, showing `Building (change: acme-part-a)` and `Ready`

#### Scenario: Part in the status report
- **GIVEN** parent "Acme v1" with a Ready part "Part B" and no roadmap
- **WHEN** `/kit:status` lists what's ready to propose
- **THEN** the row reads "Acme v1 › Part B"

### Requirement: Parts checked against their parent
`prd-check` SHALL report a part as invalid when its parent file doesn't exist or `part-of` doesn't match the part's folder. A parent with parts SHALL be valid as `Building` or `Shipped` without a `change`. A parent marked `Shipped` while any part is neither `Shipped` nor `Dropped` SHALL get a warning that names those parts; the PRD stays valid and nothing is blocked.

#### Scenario: Orphan part
- **WHEN** `prds/acme-v1/part-a.md` says `part-of: acme-v1` and `prds/acme-v1.md` doesn't exist
- **THEN** `prd-check` reports the part as invalid: parent not found

#### Scenario: Parent shipped too early
- **GIVEN** parent `acme-v1` is `Shipped`, `part-a` is `Shipped`, `part-b` is `Building`
- **WHEN** `prd-check` runs
- **THEN** it warns that `acme-v1` is Shipped while `acme-v1/part-b` is Building, and exits without error

#### Scenario: Parent shipped with a dropped part
- **GIVEN** parent `acme-v1` is `Shipped`, `part-a` is `Shipped`, `part-b` is `Dropped`
- **WHEN** `prd-check` runs
- **THEN** there is no warning

### Requirement: Proposal from a part
When the proposal step takes a part as its PRD, the proposal SHALL record two lines: `PRD: <part path> @ <commit>` and `PRD parent: <parent path> @ <commit>`, each commit read the same way as for a single PRD. After the proposal, the offer to set `change` and `Building` SHALL apply to the part, not the parent.

#### Scenario: Proposal lines from a part
- **WHEN** the user runs `/opsx:propose` from Ready part `prds/acme-v1/part-b.md`
- **THEN** the proposal has `PRD: knowledge/prds/acme-v1/part-b.md @ <commit>` and `PRD parent: knowledge/prds/acme-v1.md @ <commit>`

#### Scenario: Part linked to a milestone
- **WHEN** the user links part `prds/acme-v1/part-b.md` to milestone M3 with the roadmap's `link --kind prd`
- **THEN** the link is saved and the roadmap check reports no problem

#### Scenario: Link to a PRD that doesn't exist
- **GIVEN** no file `prds/acme-v1/nope.md`
- **WHEN** the user runs `link --kind prd --value acme-v1/nope`
- **THEN** the roadmap says there is no PRD `acme-v1/nope` and writes nothing

#### Scenario: Link stored in one form
- **WHEN** the user links `acme-v1/part-b`, `prds/acme-v1/part-b.md` or `knowledge/prds/acme-v1/part-b.md`
- **THEN** the milestone stores `prds/acme-v1/part-b.md` once

### Requirement: Move a parent with parts
Before a parent with parts is moved or archived, the kit SHALL warn and name every part that is neither `Shipped` nor `Dropped`, and SHALL ask, per part, what to do: drop it (`Dropped`), put it under another parent, or make it a PRD of its own. The parent SHALL NOT move while an unfinished part is left. Finished parts SHALL move with the parent. No part SHALL be left pointing at a missing parent.

#### Scenario: Unfinished parts named first
- **GIVEN** parent `acme-v1` with `part-a` Shipped and `part-b` Building
- **WHEN** the user asks to archive `acme-v1`
- **THEN** the kit warns that `acme-v1/part-b` is unfinished, offers drop, another parent or its own PRD for it, and moves nothing yet

#### Scenario: Part made independent
- **GIVEN** the user picked "its own PRD" for `acme-v1/part-b`
- **WHEN** the kit applies it
- **THEN** the part is `prds/part-b.md` without `part-of`, keeps its status and change, and the proposal lines that cited the old path still resolve or are named to the user

#### Scenario: Folder holds files that aren't parts
- **GIVEN** parent `acme-v1` (Shipped) whose folder holds `part-a` (Shipped), a detached `part-b.md` with no `part-of`, and a `part-c.md` whose frontmatter doesn't parse
- **WHEN** the user archives `acme-v1`
- **THEN** the kit names `part-b.md` and `part-c.md` as not its parts and moves nothing

#### Scenario: All parts finished
- **GIVEN** parent `acme-v1` with `part-a` Shipped and `part-b` Dropped
- **WHEN** the user archives `acme-v1`
- **THEN** `acme-v1.md` and its `acme-v1/` folder both move under `archive/`, and nothing is deleted

### Requirement: Split a PRD into parts
The PRD skill SHALL offer to split an existing PRD into parts on request: it SHALL propose the parts and which sections or rows move to each, create each part with `new-prd --part-of`, fill it per section, and trim the parent per section, each write only on the user's yes. It SHALL never delete the parent or rewrite it whole.

#### Scenario: Split on request
- **GIVEN** a single-file PRD `acme-v1` whose requirements cover three slices
- **WHEN** the user asks to split it into parts
- **THEN** the skill shows the proposed parts and what moves to each, and writes nothing until the user says yes
