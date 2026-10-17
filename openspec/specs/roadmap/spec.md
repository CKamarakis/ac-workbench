# roadmap Specification

## Purpose
A dependable, optional project roadmap: a fixed layout of one file per milestone, a warn-only check that keeps it in good condition, and a `/kit:roadmap` skill that writes it at set moments and reports it back to the user, who alone decides order and scope.

## Requirements

### Requirement: Roadmap layout
A project's roadmap SHALL live in `<knowledge>/roadmaps/`:
- `roadmap.md`: north star, principles, the milestone order as a list of IDs, Now, and Waiting on you;
- `milestones/<id>-<slug>.md`: one file per planned, active or paused milestone, with frontmatter `id`, `title` and `status`, a one-line goal, a task list where each task is a line `- [ ] T<n> <text>` or `- [x] T<n> <text>`, and links to its notes, PRD and change;
- `done/`: milestone files whose status is `done` or `dropped`, kept whole;
- `drift-log.md`: drift entries, each with date, what, why, on-plan alternative, impact and decided by; entries are only ever added.

Status SHALL be one of `planned`, `active`, `paused`, `done`, `dropped`. IDs SHALL never change and SHALL never be reused. The order SHALL be kept only in `roadmap.md`, separate from the IDs.

#### Scenario: Milestone file shape
- **GIVEN** a milestone "Toughbubble proof" with ID `M12`
- **WHEN** it is written
- **THEN** `milestones/m12-toughbubble-proof.md` has frontmatter `id: M12`, `title: Toughbubble proof`, `status: planned`, a one-line goal and its task lines

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
On request, the skill SHALL show a short report: the milestones in order with ID, title, status and the tasks left (or "n of m done"), Now, and Waiting on you. Broken findings, if any, SHALL be listed at the top. After Waiting on you, the report SHALL add one line for tidy-up findings and one for unplanned work when there are any, and SHALL mark the current milestone.

#### Scenario: Report
- **GIVEN** a roadmap with `M12` planned and 1 of 5 tasks done
- **WHEN** the user asks for the report
- **THEN** the row shows `M12 · Toughbubble proof · planned`, the four open tasks, and "1 of 5 done"

#### Scenario: Unplanned work in the report
- **GIVEN** an active change `kanban-board` that no milestone links to
- **WHEN** the user asks for the report
- **THEN** it ends with "Unplanned work: kanban-board"
