## MODIFIED Requirements

### Requirement: Mismatches shown, never resolved
When a copy disagrees with its owner, status SHALL show a "Doesn't match" list with each mismatch, the sources involved and the fix, and SHALL NOT choose one source over the other. Mismatches SHALL include at least:
- the roadmap has an active milestone with open tasks while no OpenSpec change is active and no milestone branch exists;
- a `Building` PRD whose change is archived;
- the roadmap check's "Now may be stale" and unplanned-work findings;
- an open loose end that blocks a milestone that is done or dropped, a change that is archived, or a loose end that is done or dropped.

When there are no mismatches, the list SHALL NOT appear.

#### Scenario: Now with nothing under way
- **GIVEN** the roadmap's current milestone M12a is active with T2 open, and no change is active and no branch is linked to it
- **WHEN** the user runs `/kit:status`
- **THEN** "Doesn't match" lists it, naming `roadmap.md` and OpenSpec, with the fix "propose a change for it, or update Now (`/kit:roadmap`)"

#### Scenario: PRD not marked Shipped
- **GIVEN** PRD `roadmap-structure` is `Building` and its change is archived
- **WHEN** the user runs `/kit:status`
- **THEN** "Doesn't match" lists it as a question, whether the PRD is done or continues in another change, with the fix `/kit:prd` (mark it Shipped, or link the next change, on the user's yes); it does not advise Shipped

#### Scenario: Everything agrees
- **WHEN** no copy disagrees with its owner
- **THEN** no "Doesn't match" list is shown

#### Scenario: Loose end blocks finished work
- **GIVEN** the open loose end `L4` blocks `M12`, and `M12` is done
- **WHEN** the user runs `/kit:status`
- **THEN** "Doesn't match" lists "L4 blocks M12, but M12 is done", naming `loose-ends.md` and the milestone file, with the fix "mark L4 done, drop it, or point it at what it blocks now (`/kit:loose-ends`)"
