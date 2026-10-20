## ADDED Requirements

### Requirement: Drop or edit a task
A task SHALL be dropped or have its text edited only through the roadmap script and on the user's yes. A dropped task SHALL keep its number, read `- [-] T<n> <text> (dropped <YYYY-MM-DD>: <reason>)`, and count as neither done nor left. Ticking a dropped task SHALL fail; unticking it SHALL reopen it without the drop note. Adding or editing a task SHALL refuse text that starts with that task's own number.

#### Scenario: Drop a task
- **GIVEN** milestone `M12` with open tasks `T2` and `T4`
- **WHEN** `T4` is dropped with the reason "replaced by test A"
- **THEN** its line reads `- [-] T4 <text> (dropped <date>: replaced by test A)`, the report lists only `T2` as left, and the done count doesn't change

#### Scenario: Tick a dropped task
- **GIVEN** `T4` is dropped
- **WHEN** `T4` is ticked
- **THEN** it fails with an error saying `T4` is dropped, and the file is unchanged

#### Scenario: Edit a task's text
- **GIVEN** task `T1` reads "T1 PRD for the kit"
- **WHEN** its text is edited to "PRD for the kit"
- **THEN** the line reads `- [ ] T1 PRD for the kit` and its number and state are unchanged

#### Scenario: Task text with a number
- **GIVEN** milestone `M12`'s next task number is `T5`
- **WHEN** a task is added with the text "T5 Docs"
- **THEN** it fails with an error asking for the text without the number, and nothing is written
- **AND** the text "T3 stack spike" is added as `T5 T3 stack spike`

#### Scenario: Reopen a dropped task
- **GIVEN** `T4` was dropped by mistake
- **WHEN** `T4` is unticked
- **THEN** its line reads `- [ ] T4 <text>` without the drop note, and it counts as left again

## MODIFIED Requirements

### Requirement: Roadmap layout
A project's roadmap SHALL live in `<knowledge>/roadmaps/`:
- `roadmap.md`: north star, principles, the milestone order as a list of IDs, Now, and Waiting on you;
- `milestones/<id>-<slug>.md`: one file per planned, active or paused milestone, with frontmatter `id`, `title` and `status`, a one-line goal, a task list where each task is a line `- [ ] T<n> <text>`, `- [x] T<n> <text>` or, for a dropped task, `- [-] T<n> <text> (dropped <YYYY-MM-DD>: <reason>)`, and links to its notes, PRD and change;
- `done/`: milestone files whose status is `done` or `dropped`, kept whole;
- `drift-log.md`: drift entries, each with date, what, why, on-plan alternative, impact and decided by; entries are only ever added.

Status SHALL be one of `planned`, `active`, `paused`, `done`, `dropped`. IDs SHALL never change and SHALL never be reused. The order SHALL be kept only in `roadmap.md`, separate from the IDs.

#### Scenario: Milestone file shape
- **GIVEN** a milestone "Acme proof" with ID `M12`
- **WHEN** it is written
- **THEN** `milestones/m12-acme-proof.md` has frontmatter `id: M12`, `title: Acme proof`, `status: planned`, a one-line goal and its task lines

#### Scenario: Reorder keeps IDs
- **GIVEN** the order `M12, M13`
- **WHEN** the user moves `M13` before `M12`
- **THEN** only the order list in `roadmap.md` changes, and both IDs and file names stay the same

### Requirement: Roadmap check warns and never blocks
The roadmap check SHALL report findings in two groups and SHALL NOT block any step, including a release:
- **broken**, shown first: a missing `##` heading (North star, Principles, Order, Now, Waiting on you); a milestone file missing `id`, `title` or `status`, or with unreadable frontmatter; an unknown status; a duplicate ID; an order line not in the shape `- <ID>`, an ID in the order without a file, or a milestone file missing from the order; a task line in the wrong shape, or a task number used twice; an `active` milestone with no tasks; a Waiting-on-you item not in the shape `- [<ID>|general] <question> (proposed YYYY-MM-DD)`, or naming an unknown milestone;
- **tidy-up**: `roadmap.md` over 150 lines, or a line in it over 300 characters; Now longer than 5 lines; a `done` or `dropped` milestone still in `milestones/`; a stale Now.

Each finding SHALL name the file (and line where there is one) and the fix. A roadmap with no findings SHALL report that it is in good condition.

#### Scenario: Broken milestone
- **GIVEN** `milestones/m13-release-prep.md` has no `status`
- **WHEN** the check runs
- **THEN** it reports under broken "m13-release-prep.md: missing status" with the fix, and exits without blocking

#### Scenario: Long row
- **GIVEN** a line in `roadmap.md` of 420 characters
- **WHEN** the check runs
- **THEN** it reports under tidy-up the line number, its length and the 300-character limit

#### Scenario: Finished milestone not moved
- **GIVEN** `milestones/m11-harness-review.md` has `status: done`
- **WHEN** the check runs
- **THEN** it reports under tidy-up that the file should move to `done/`

#### Scenario: Waiting item names an unknown milestone
- **GIVEN** a Waiting-on-you item `- [M7] Who? (proposed 2026-10-17)` and no milestone `M7`
- **WHEN** the check runs
- **THEN** it reports under broken the line and "unknown milestone M7", with the fix

#### Scenario: Dropped task without its note
- **GIVEN** a milestone line `- [-] T2 typed by hand`, without a date and reason
- **WHEN** the check runs
- **THEN** it reports the line under broken with the fix to write it as `- [-] T<n> <text> (dropped <YYYY-MM-DD>: <reason>)` or use `drop-task`

#### Scenario: Text under Order
- **GIVEN** the line "This order is my priority list" under `## Order`
- **WHEN** the check runs
- **THEN** it reports the line under broken with the fix "move this text out of ## Order (for example under North star); Order holds only milestone IDs", not "write it as `- <ID>`"
