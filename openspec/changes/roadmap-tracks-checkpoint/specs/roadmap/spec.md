# Spec Delta

## ADDED Requirements

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

## MODIFIED Requirements

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
