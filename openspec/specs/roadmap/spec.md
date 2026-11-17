# roadmap Specification

## Purpose
A dependable, optional project roadmap: a fixed layout of one file per milestone, a warn-only check that keeps it in good condition, and a `/kit:roadmap` skill that writes it at set moments and reports it back to the user, who alone decides order and scope.

## Requirements

### Requirement: Roadmap layout
A project's roadmap SHALL live in `<knowledge>/roadmaps/`:
- `roadmap.md`: north star, principles, the milestone order as a list of IDs, Now, and Waiting on you;
- `milestones/<id>-<slug>.md`: one file per planned, active or paused milestone, with frontmatter `id`, `title` and `status` (and an optional `checkpoint`), a one-line goal, a task list where each task is a line `- [ ] T<n> <text>`, `- [x] T<n> <text>` or `- [x] T<n> <text> (done <YYYY-MM-DD>)` or, for a dropped task, `- [-] T<n> <text> (dropped <YYYY-MM-DD>: <reason>)`, links to its notes, PRD and change, and at most one `Resume:` line under its Notes;
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

### Requirement: Roadmap is optional
A project without `<knowledge>/roadmaps/roadmap.md` SHALL work with every kit command as before. No command other than `/kit:roadmap` SHALL ask for or create a roadmap; the starter only mentions it.

#### Scenario: No roadmap
- **GIVEN** a project with no `knowledge/roadmaps/`
- **WHEN** the user runs `/kit:next`, `/kit:prd` or `/kit:verify`
- **THEN** none of them mentions or needs a roadmap

#### Scenario: Check without a roadmap
- **GIVEN** a project with no `knowledge/roadmaps/`
- **WHEN** the roadmap check or report runs
- **THEN** it says there is no roadmap here and that it's optional, and exits without an error

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

### Requirement: Stale Now and unplanned work
The check SHALL report Now as stale only when an OpenSpec change was archived, or a branch was merged into the current branch, after the last commit that changed `roadmap.md`: the moments Now should be updated. Ordinary commits SHALL NOT make Now stale. It SHALL list as unplanned work each active OpenSpec change that no milestone links to. Branches are not checked (decided 2026-10-17; revisit with parallel work).

#### Scenario: Archive after the last roadmap update
- **GIVEN** `roadmap.md` was last committed on 2026-10-14 and a change was archived on 2026-10-17
- **WHEN** the check runs
- **THEN** it reports under tidy-up that Now may be stale, naming the archived change and both dates

#### Scenario: Ordinary commits only
- **GIVEN** `roadmap.md` was last committed on 2026-10-14 and only ordinary commits came after it
- **WHEN** the check runs
- **THEN** it doesn't report Now as stale

#### Scenario: Branch not listed
- **GIVEN** an unmerged branch `kit-status` that no milestone links to
- **WHEN** the check runs
- **THEN** it doesn't list the branch as unplanned work

#### Scenario: Change with no milestone
- **GIVEN** an active change `kanban-board` that no milestone links to
- **WHEN** the check runs
- **THEN** it lists `kanban-board` as unplanned work and suggests linking it to a milestone or adding a drift entry

#### Scenario: Roadmap not committed yet
- **GIVEN** `roadmap.md` has no commit yet
- **WHEN** the check runs
- **THEN** it notes in plain words that it can't check whether Now is out of date until `roadmap.md` is committed

### Requirement: Waiting on you by relevance
Each pending decision in `roadmap.md` SHALL name the milestone it belongs to, or `general`, and the date it was proposed. The current milestone SHALL be the first `active` one in the order or, when none is active, the first one in the order that is not `done` or `dropped`. The report SHALL show under **Blocking now** the decisions of the current milestone and of the next not-finished one after it, plus `general` ones; all others SHALL be shown as a count under **Later** and listed in full in the report. Decisions SHALL NOT be flagged or sorted by age.

When the user answers a decision, it SHALL leave `roadmap.md` and a drift-log entry SHALL record the date, the question, the answer and who decided, so no decision is lost.

#### Scenario: No active milestone
- **GIVEN** the order `M12, M13, M14`, all `planned`, and decisions for `M12` and `M14`
- **WHEN** the user asks for the report
- **THEN** `M12` counts as current, its decision is under Blocking now, and the `M14` decision is counted under Later

#### Scenario: Decision answered
- **GIVEN** a pending decision for `M12a`
- **WHEN** the user answers it
- **THEN** it no longer appears in `roadmap.md`, and `drift-log.md` gains an entry with the date, the question, the answer and "user"

#### Scenario: Blocking now
- **GIVEN** the order `M12a, M12, M13`, `M12a` active, and decisions for `M12a` and `M13`
- **WHEN** the user asks for the report
- **THEN** the `M12a` decision is under Blocking now and the `M13` decision is counted under Later

#### Scenario: Reorder moves decisions
- **GIVEN** the same decisions
- **WHEN** the user moves `M13` right after `M12a`
- **THEN** the `M13` decision shows under Blocking now

#### Scenario: Old decision not flagged
- **GIVEN** a decision proposed 40 days ago for a later milestone
- **WHEN** the user asks for the report
- **THEN** it is counted under Later with its date, and nothing marks it as old

### Requirement: Roadmap skill writes only on a yes
`/kit:roadmap` SHALL create a roadmap, add a milestone, add tasks to it, start or pause one, finish or drop one, tick a task, add a drift entry, link notes, a PRD or a change, and update Now. Each write SHALL be shown first and applied only on the user's yes. Only the user SHALL change order or scope. After every write the skill SHALL run the check and show any broken finding with its fix.

#### Scenario: Create on a yes
- **GIVEN** a project with no roadmap
- **WHEN** the user runs `/kit:roadmap`
- **THEN** it offers to create `knowledge/roadmaps/` from the templates and writes nothing until the user says yes

#### Scenario: Add a milestone without notes
- **GIVEN** a roadmap
- **WHEN** the user names a goal that has no notes
- **THEN** after a yes, a milestone file with the next free ID, the title, status `planned` and a one-line goal is written and its ID is added to the order where the user says

#### Scenario: Add a milestone from notes
- **GIVEN** explored notes the user agrees are a goal
- **WHEN** the milestone is added
- **THEN** its file links to those notes

#### Scenario: Add a task
- **GIVEN** milestone `M1` with tasks `T1` and `T2`
- **WHEN** the user adds a task "Docs" and says yes
- **THEN** the file gains `- [ ] T3 Docs` after `T2`

#### Scenario: Finish a milestone
- **GIVEN** an active milestone with every task ticked
- **WHEN** the user confirms it is finished
- **THEN** its status becomes `done`, its file moves to `done/`, and the order keeps its ID

#### Scenario: Agent does not reorder
- **GIVEN** the agent thinks `M13` should come first
- **WHEN** it reports
- **THEN** it proposes the reorder with its reason and changes nothing without a yes

### Requirement: Links both ways
When a PRD or OpenSpec change is made for a milestone, the skill SHALL offer to add the link to the milestone file and a `Milestone: <id>` line to the PRD or the proposal. When a linked change is archived, the skill SHALL offer to tick the matching task and update Now.

#### Scenario: Change archived
- **GIVEN** milestone `M12a` with task `T1` linked to change `roadmap-structure`
- **WHEN** `roadmap-structure` is archived
- **THEN** the skill offers to tick `T1` and update Now

### Requirement: Roadmap report
On request, the skill SHALL show a short report: the milestones in order with ID, title, status and the tasks left (or "n of m done"), Now, and Waiting on you. Broken findings, if any, SHALL be listed at the top. After Waiting on you, the report SHALL add one line for tidy-up findings and one for unplanned work when there are any, and SHALL mark the current milestone. When the project has open loose ends, the report SHALL end with one line giving their count and pointing to `/kit:loose-ends`; loose ends SHALL NOT be listed in the roadmap itself.

#### Scenario: Report
- **GIVEN** a roadmap with `M12` planned and 1 of 5 tasks done
- **WHEN** the user asks for the report
- **THEN** the row shows `M12 · Acme proof · planned`, the four open tasks, and "1 of 5 done"

#### Scenario: Unplanned work in the report
- **GIVEN** an active change `kanban-board` that no milestone links to
- **WHEN** the user asks for the report
- **THEN** it ends with "Unplanned work: kanban-board"

#### Scenario: Loose ends pointer
- **GIVEN** 7 open loose ends, 2 of them important
- **WHEN** the user asks for the report
- **THEN** its last line is "Loose ends: 7 open (2 important): /kit:loose-ends"

#### Scenario: No open loose ends
- **WHEN** the project has no open loose ends
- **THEN** the report has no loose ends line

### Requirement: Roadmap writes never lose the user's text
A roadmap write SHALL NOT drop or replace text the user wrote. Adding a milestone or changing the order SHALL keep every line under `## Order` that isn't a milestone ID, where it was. Answering a waiting decision SHALL require a non-empty answer; without one, the write SHALL fail with an error and change no file.

#### Scenario: A note under Order survives an add
- **GIVEN** `## Order` holds the line "This order is my priority list" above `- M1`
- **WHEN** a milestone is added
- **THEN** that line is still there, unchanged, and the order lists `M1` and the new ID; no `- null` line is written

#### Scenario: A note under Order survives a reorder
- **GIVEN** `## Order` holds a line of the user's text and the IDs `M1`, `M2`
- **WHEN** the order is changed to `M2`, `M1`
- **THEN** the user's line is kept and only the ID lines change

#### Scenario: Answer without an answer
- **GIVEN** a waiting decision "Pick a database engine"
- **WHEN** `answer` runs with `--match "database"` and no `--answer`
- **THEN** it fails with an error naming `--answer`, the decision stays under Waiting on you, and the drift log is unchanged

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

### Requirement: Edit a milestone
A milestone's title and goal SHALL be changed only through the roadmap script and on the user's yes. The ID, file name, status, tasks, links and notes SHALL stay as they were. A changed title SHALL add a drift-log entry naming the old and the new title. An edit with neither a title nor a goal, or with an empty one, SHALL fail with an error and change no file.

#### Scenario: Rename keeps the ID
- **GIVEN** milestone `M4` "Board" with tasks `T1` to `T3` and a linked change
- **WHEN** its title is edited to "Feature A"
- **THEN** its frontmatter reads `id: M4`, `title: Feature A`, the file is still `milestones/m4-board.md`, its tasks and links are unchanged, and the drift log gains an entry "M4 renamed: Board -> Feature A"

#### Scenario: Goal only
- **GIVEN** milestone `M4`
- **WHEN** only its goal is edited
- **THEN** the one-line goal is replaced, the title is unchanged, and no drift entry is added

#### Scenario: Nothing to edit
- **WHEN** `edit` runs for `M4` with no `--title` and no `--goal`
- **THEN** it fails with an error naming both options, and no file changes

#### Scenario: Goal added when missing
- **GIVEN** milestone `M3` has no goal line, and a Notes line "talk to the designer"
- **WHEN** its goal is edited to "Ship X"
- **THEN** "Ship X" is added before the first heading, and the note is unchanged

### Requirement: Checkpoint on a milestone
A planned, active or paused milestone MAY carry one checkpoint, set and cleared through the roadmap script on the user's yes: after one of its tasks (the default form), or after a named OpenSpec change is archived. A checkpoint naming a task the milestone doesn't have, or a dropped task, SHALL fail with an error. The check SHALL report a checkpoint in the wrong shape under broken.

#### Scenario: After a task
- **GIVEN** milestone `M4` with tasks `T1` to `T5`
- **WHEN** a checkpoint is set after `T3`
- **THEN** `M4` records the checkpoint after `T3`, and the report shows it on the `M4` row

#### Scenario: After an archive
- **GIVEN** milestone `M4` linked to change `a-editor`
- **WHEN** a checkpoint is set after `a-editor` is archived
- **THEN** `M4` records the checkpoint after that archive

#### Scenario: Unknown task
- **WHEN** a checkpoint is set on `M4` after `T9`, which `M4` doesn't have
- **THEN** it fails with an error, and no file changes

#### Scenario: After a task already done
- **GIVEN** milestone `M4` with `T3` already ticked
- **WHEN** a checkpoint is set after `T3`
- **THEN** it is recorded and counts as reached at once, so the report shows it as reached

### Requirement: Checkpoint reached
A checkpoint SHALL count as reached when its task is ticked, or its change is archived. Ticking that task, the check and the report SHALL then say the checkpoint is reached. The report SHALL show every active or paused milestone side by side, each with the number and text of its last done task (see Tick date), its next open task, and its resume note. Reaching a checkpoint SHALL NOT block any step, change any status, or switch on its own.

#### Scenario: Tick reaches it
- **GIVEN** `M4` "Feature A" active with a checkpoint after `T3`, and `M1` "Feature B v1" paused with `T2` done and `T3` open
- **WHEN** `T3` of `M4` is ticked
- **THEN** the tick output says the `M4` checkpoint is reached, and shows `M4` with `T3 <text>` as last done and `T4 <text>` as next, and `M1` with `T2 <text>` and `T3 <text>`
- **AND** both milestones keep their status

#### Scenario: Archive reaches it
- **GIVEN** `M4` has a checkpoint after change `a-editor` is archived
- **WHEN** `a-editor` is archived and the check runs
- **THEN** it reports the `M4` checkpoint as reached, without blocking

#### Scenario: No other track
- **GIVEN** `M4` reaches its checkpoint and no other milestone is active or paused
- **WHEN** the report runs
- **THEN** it shows `M4` alone with its last and next task, and names the next planned milestone in the order as the other choice

### Requirement: Continue or switch at a checkpoint
When a checkpoint is reached, `/kit:roadmap` SHALL ask the user once: continue this milestone, or switch to another active, paused or planned one, showing the side-by-side view first. The user's answer SHALL add a drift-log entry with the date, the checkpoint, the choice and the reason, and SHALL clear the checkpoint. Without an answer nothing SHALL change; the checkpoint stays reached.

#### Scenario: Continue
- **GIVEN** the `M4` checkpoint is reached
- **WHEN** the user chooses to continue `M4`
- **THEN** the drift log gains "Checkpoint M4 after T3: continued M4" with the reason, the checkpoint is cleared, and both statuses are unchanged

#### Scenario: Switch
- **GIVEN** the `M4` checkpoint is reached and `M1` is paused
- **WHEN** the user chooses to switch to `M1`
- **THEN** `M4` becomes `paused`, `M1` becomes `active`, the drift log gains "Checkpoint M4 after T3: switched to M1" with the reason, the checkpoint is cleared, and Now is offered for an update

#### Scenario: No answer yet
- **GIVEN** the `M4` checkpoint is reached
- **WHEN** the user moves on without answering
- **THEN** no file changes, and the next report still says it is reached

#### Scenario: Switch to a finished or the same milestone
- **GIVEN** the `M4` checkpoint is reached, `M2` is `done` and `M3` is `dropped`
- **WHEN** the answer is a switch to `M2`, `M3` or `M4`
- **THEN** it fails with an error naming the milestone and why, and no file changes

#### Scenario: Next checkpoint offered after continue
- **GIVEN** the user chose to continue `M4`, which has `T4` and `T5` open
- **WHEN** the answer is written
- **THEN** `/kit:roadmap` offers once, skippably, to set the next checkpoint on `M4`, and sets it only on a yes

#### Scenario: Refused before writing
- **GIVEN** the `M4` checkpoint is reached
- **WHEN** the answer switches to a milestone with no tasks, answers a checkpoint on a `done` or `dropped` milestone, or gives a resume note with continue
- **THEN** it fails with an error saying why, and no file changes

#### Scenario: Switch from a planned milestone
- **GIVEN** planned `M5`'s checkpoint after the archive of `a-api` is reached
- **WHEN** the user switches to `M6`
- **THEN** `M5` stays `planned`, `M6` becomes `active`, and the checkpoint is cleared

### Requirement: Tick date
Ticking a task SHALL record the date it was done, as `- [x] T<n> <text> (done <YYYY-MM-DD>)`. Unticking SHALL remove the date. Editing a done task's text SHALL keep its date. A milestone's last done task SHALL be the done task with the latest date, the highest number among tasks with that date, and among undated done tasks only when none has a date. The date SHALL NOT count as part of the task's text.

#### Scenario: Tick writes the date
- **GIVEN** `M4` task `T3` "List view" is open
- **WHEN** `T3` is ticked on 2026-11-20
- **THEN** its line reads `- [x] T3 List view (done 2026-11-20)`

#### Scenario: Last done by date, not number
- **GIVEN** `M4` has `T5` done on 2026-11-10 and `T3` done on 2026-11-20
- **WHEN** the report shows `M4`'s track
- **THEN** its last done task is `T3 List view`

#### Scenario: Older roadmap without dates
- **GIVEN** `M1` has `T1` and `T2` ticked before this change, with no dates
- **WHEN** the report shows `M1`'s track
- **THEN** its last done task is `T2`, and the check reports nothing about the missing dates

#### Scenario: Untick removes the date
- **GIVEN** `T3` reads `- [x] T3 List view (done 2026-11-20)`
- **WHEN** `T3` is unticked
- **THEN** its line reads `- [ ] T3 List view`

#### Scenario: Tick a done task again
- **GIVEN** `T1` is done
- **WHEN** `T1` is ticked again
- **THEN** its line is unchanged, and no checkpoint question is shown

#### Scenario: Date in another shape
- **WHEN** `tick --date 17/11/2026` runs
- **THEN** it fails with an error asking for YYYY-MM-DD, and nothing is written

### Requirement: Resume note when switching away
When the user pauses a milestone, or switches away from it, `/kit:roadmap` SHALL offer a one-line resume note drafted from the milestone's last done task, its next open task and any open linked change, each task named by number and text. The user SHALL be able to keep, correct or skip it. A kept note SHALL be the milestone's only `Resume:` line under its Notes, replacing an older one.

#### Scenario: Drafted note kept
- **GIVEN** `M4` with `T3` done, `T4` open and the open change `a-api`
- **WHEN** the user switches away from `M4` and keeps the draft
- **THEN** `M4`'s Notes hold one line `Resume: stopped after T3 <text>; next T4 <text>; open change a-api`

#### Scenario: Note skipped
- **WHEN** the user skips the note
- **THEN** the milestone is paused and its Notes are unchanged

#### Scenario: Older note replaced
- **GIVEN** `M1` holds a `Resume:` line from an earlier switch
- **WHEN** a new note is kept for `M1`
- **THEN** `M1` holds only the new `Resume:` line

### Requirement: More than two active milestones
When more than two milestones are `active`, the check and the report SHALL add one tidy-up line naming them and saying that more than two tracks in flight is a lot to switch between. It SHALL NOT block, and starting a third milestone SHALL still succeed.

#### Scenario: Third active milestone
- **GIVEN** `M1` and `M4` are active
- **WHEN** `M5` is started
- **THEN** `M5` becomes active, and the check reports one tidy-up line naming `M1`, `M4` and `M5`
