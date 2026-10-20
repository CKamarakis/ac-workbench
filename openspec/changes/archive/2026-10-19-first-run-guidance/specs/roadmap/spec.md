## MODIFIED Requirements

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
