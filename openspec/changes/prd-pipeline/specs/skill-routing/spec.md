# Spec Delta

## ADDED Requirements

### Requirement: Capture and PRD phases in the lane map
The registry SHALL define the phases `capture` and `prd`. The lane map SHALL show their owner and skill (the kit: `/kit:capture` and `/kit:prd`) by the same owner rules as every other phase.

#### Scenario: Lane map shows the new phases
- **WHEN** the lane map is generated from the registry
- **THEN** `capture` is owned by `kit` with `/kit:capture`, and `prd` by `kit` with `/kit:prd`

### Requirement: Next-step suggestion uses PRD status
Before falling back to the OpenSpec-based suggestion, the next-step skill SHALL check the project's PRDs and SHALL suggest, with a one-line reason:
- the `prd` phase owner, when notes exist but no PRD does, and there is no active change;
- the `artifacts` phase owner (e.g. `/opsx:propose`), naming the PRD, when a PRD is `Ready` and no change uses it;
- reviewing the plan, when a `Building` PRD's file changed after the commit its change recorded;
- marking the PRD `Shipped`, when the change named in a `Building` PRD is archived.

When none of these apply, the existing OpenSpec-based suggestion SHALL be unchanged. Invalid PRDs SHALL be reported, not guessed.

#### Scenario: Ready PRD without a change
- **WHEN** `prds/gift-cards.md` is `Ready` and no change names it
- **THEN** the suggestion is `/opsx:propose`, naming `gift-cards`

#### Scenario: PRD changed since planning
- **WHEN** a `Building` PRD has commits after the commit its change recorded
- **THEN** the suggestion says the PRD changed since planning and names the change to review

#### Scenario: Archived change
- **WHEN** the change named in a `Building` PRD is archived
- **THEN** the suggestion is to mark that PRD `Shipped`, and nothing is written

#### Scenario: Notes but no PRD
- **WHEN** the project has notes, no PRDs and no active change
- **THEN** the suggestion is `/kit:prd`

#### Scenario: No knowledge folder
- **WHEN** the project has no knowledge folder
- **THEN** the suggestion is the same as before this change
