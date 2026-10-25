## MODIFIED Requirements

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

## ADDED Requirements

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
`prd-check` SHALL report a part as invalid when its parent file doesn't exist or `part-of` doesn't match the part's folder. A parent with parts SHALL be valid as `Building` without a `change`. A parent marked `Shipped` while any part is neither `Shipped` nor `Dropped` SHALL get a warning that names those parts; the PRD stays valid and nothing is blocked.

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

### Requirement: Split a PRD into parts
The PRD skill SHALL offer to split an existing PRD into parts on request: it SHALL propose the parts and which sections or rows move to each, create each part with `new-prd --part-of`, fill it per section, and trim the parent per section, each write only on the user's yes. It SHALL never delete the parent or rewrite it whole.

#### Scenario: Split on request
- **GIVEN** a single-file PRD `acme-v1` whose requirements cover three slices
- **WHEN** the user asks to split it into parts
- **THEN** the skill shows the proposed parts and what moves to each, and writes nothing until the user says yes
