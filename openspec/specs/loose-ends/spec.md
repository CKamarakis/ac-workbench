# loose-ends Specification

## Purpose
Gives the things left behind while building (checks, friction, debt, kept findings, cleanup, ideas) one owner, so nothing deferred is lost and the important ones and the blockers surface when they matter, sorted by importance rather than time.

## Requirements

### Requirement: Loose ends file
A project's loose ends SHALL live in `<knowledge>/loose-ends.md`. Each item SHALL have an ID (`L1`, `L2`, ... never changed or reused), a one-line text, a kind (`check`, `friction`, `debt`, `idea`, `cleanup` or `accepted`), an origin (`chat`, `build`, `review`, `verify` or `note`), optional free tags, an important marker, an optional `blocks` target (a milestone ID, a change name or a loose end ID), the date it was added, a source (a path or "chat"), and a state (`open`, `done` or `dropped`, with the date and a reason for done and dropped). Items SHALL NOT have a rank, a due date or any other time field. The file SHALL be optional: with no file, every reader treats the project as having no loose ends.

#### Scenario: Add an item
- **GIVEN** a project with no loose ends file
- **WHEN** the user adds "openspec not on agent PATH" as kind `friction`, origin `chat`, tag `windows`
- **THEN** the file exists with item `L1`, state `open`, today's date and source `chat`

#### Scenario: IDs never reused
- **GIVEN** items `L1` and `L2`, with `L2` dropped
- **WHEN** a new item is added
- **THEN** it is `L3`

#### Scenario: Unknown kind refused
- **WHEN** an item is added with kind `urgent`
- **THEN** nothing is written and the error names the allowed kinds

### Requirement: Writes only through the script, on a yes
Every write to the loose ends file SHALL go through the kit's loose ends script, and the agent SHALL write only after the user's yes: nothing is added, marked important, given a blocker, done or dropped without it. An unreadable file (merge conflict, hand edit) SHALL NOT be replaced: the script SHALL stop and say how to fix it.

#### Scenario: Hand-edited file
- **GIVEN** a loose ends file whose data can't be read
- **WHEN** the script is asked to add an item
- **THEN** it stops with an error saying to fix the file from git, and the file is unchanged

### Requirement: One batch at the end of a step
During a step (apply, verify, archive, or a long chat) the agent SHALL collect the things it puts aside, and at the end of the step SHALL show them in one numbered list, each with a proposed kind, origin and, when it applies, a proposed important mark with its reason, and SHALL ask once which to add. An item that belongs to an existing owner (a change's decision record, a PRD's open questions, the roadmap's Waiting on you) SHALL be pointed to that owner instead of listed. With nothing put aside, the agent SHALL NOT ask.

#### Scenario: Three loose ends after verify
- **GIVEN** a verify step that left a kept review finding, a check that belongs to another project and a cleanup
- **WHEN** the step ends
- **THEN** the agent shows the three in one list (kinds `accepted`, `check`, `cleanup`) and asks once which to add
- **AND** only the ones the user picks are added

#### Scenario: Belongs to a PRD
- **GIVEN** an open question about a PRD's scope came up during a step
- **WHEN** the step ends
- **THEN** it is not in the list; the agent offers `/kit:prd` for it instead

#### Scenario: Batch is all or nothing
- **GIVEN** an end-of-step batch of 2 items where the second has an unknown kind
- **WHEN** the batch is added
- **THEN** nothing is written, and the error names item 2

#### Scenario: Nothing put aside
- **WHEN** a step ends with nothing put aside
- **THEN** no loose ends question is asked

### Requirement: Importance
The user or the agent MAY mark an item important. When the agent proposes the mark, it SHALL give a one-line reason, and the mark SHALL be written only on the user's yes. Each mark SHALL record who set it (`user` or `agent`) and the reason, if any. The user SHALL be able to remove a mark.

#### Scenario: Agent proposes important
- **GIVEN** a `friction` item "openspec not on agent PATH" seen in two sessions
- **WHEN** the agent lists it at the end of a step
- **THEN** it proposes important with a reason such as "costs time every session"
- **AND** on the user's yes the item is stored as important, set by `agent`, with that reason

#### Scenario: Accepted can't be important
- **GIVEN** `L5` is `accepted`
- **WHEN** anyone marks `L5` important
- **THEN** nothing is written and the error says to change its kind first (e.g. to `debt`)

#### Scenario: Important item can't become accepted
- **GIVEN** `L2` is marked important
- **WHEN** its kind is changed to `accepted`
- **THEN** nothing is written and the error says to remove the important mark first

### Requirement: Seen again
When something already open in the loose ends file comes up again, the agent SHALL propose "seen again" for that item instead of a new one, in the same end-of-step list. On the user's yes, the item's seen count SHALL go up by one with the date. The kind of an open item SHALL be changeable (e.g. `accepted` to `debt`) with a reason. The list and the analysis SHALL show seen counts above 1.

#### Scenario: Friction seen again
- **GIVEN** the open item `L1` "openspec not on agent PATH", seen once
- **WHEN** the same friction comes up in the next session's step
- **THEN** the end-of-step list shows "L1 seen again" instead of a new item
- **AND** on the user's yes `L1` is seen 2 times, with both dates, and the agent may propose it important ("seen in two sessions")

#### Scenario: Kind changed
- **WHEN** the user changes `L5` from `accepted` to `debt` with the reason "it started to hurt"
- **THEN** `L5` is `debt`, the change and its reason are recorded, and it can now be marked important

### Requirement: Blockers
An item MAY name what it blocks: a milestone ID, a change name or another loose end. The target SHALL be open work: a milestone that is not done or dropped, an active change, or an open loose end. A target that is unknown or already finished SHALL be refused.

#### Scenario: Blocks a milestone
- **WHEN** the user sets `L4` to block `M12` and the roadmap has `M12`
- **THEN** `L4` is stored with `blocks: M12`

#### Scenario: Finished target
- **GIVEN** the change `kit-status` is archived and `M11` is done
- **WHEN** the user sets `L4` to block `kit-status` or `M11`
- **THEN** nothing is written and the error says only open work can be blocked

#### Scenario: Unknown target
- **WHEN** the user sets `L4` to block `M99` and no milestone, change or loose end is named `M99`
- **THEN** nothing is written and the error says the target wasn't found

### Requirement: Done and dropped
An open item SHALL be closed as `done` or `dropped`, each with a reason and the date. Closed items SHALL stay in the file and SHALL NOT appear in any view except the analysis.

#### Scenario: Drop with a reason
- **WHEN** the user drops `L2` with the reason "out of scope"
- **THEN** `L2` is `dropped` with that reason and today's date, and no longer appears in the list or in `/kit:status`

### Requirement: Cleanup
On request, the skill SHALL go through the open items grouped by kind, propose keep or drop for each (no longer relevant, out of scope, won't do), and SHALL drop only the items the user confirms, each with its reason. It SHALL NOT drop items because of their age.

#### Scenario: Cleanup of 40 items
- **GIVEN** 40 open loose ends
- **WHEN** the user asks for a cleanup
- **THEN** the agent shows them by kind with a keep or drop proposal each, and drops only the ones the user confirms

### Requirement: List and analysis
The list SHALL show open items grouped as "must look at" (check, friction), "will do anyway" (debt), "might do" (idea, cleanup) and "nothing to do" (accepted), important items first within each group, with blockers shown. The analysis SHALL show counts by kind, origin, tag and state (open, done, dropped), and the share of open items marked important.

#### Scenario: Grouped list
- **GIVEN** one important `check`, one `friction`, two `idea` and one `accepted` item, all open
- **WHEN** the user asks for the list
- **THEN** the check and the friction are under "must look at" with the important check first, the ideas under "might do", and the accepted item under "nothing to do"

#### Scenario: Analysis
- **GIVEN** 10 items: 6 open, 3 done, 1 dropped; 4 with origin `chat`
- **WHEN** the user asks for the analysis
- **THEN** it shows those counts by state and origin, the counts by kind and tag, and the share of open items marked important
