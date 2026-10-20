## MODIFIED Requirements

### Requirement: Next-step suggestion uses PRD status
Before falling back to the OpenSpec-based suggestion, the next-step skill SHALL check the project's PRDs and SHALL suggest, with a one-line reason:
- the `artifacts` phase owner (e.g. `/opsx:propose`), naming the PRD, when a PRD is `Ready`, no change uses it, and no change is active;
- reviewing the plan, when a `Building` PRD's file changed after the commit its change recorded;
- asking whether the PRD is done or continues in another change (mark it `Shipped`, or link the next change), when the change named in a `Building` PRD is archived.

While a change is active, a `Ready` PRD without a change SHALL NOT replace the suggestion for the active change; the suggestion SHALL carry one line saying the PRD is waiting until the active change is done.

When none of these apply, the existing OpenSpec-based suggestion SHALL be unchanged. Notes alone SHALL NOT lead to any suggestion: a note is input that an explore reads, not a step. Invalid PRDs SHALL be reported, not guessed.

#### Scenario: Ready PRD without a change
- **WHEN** `prds/gift-cards.md` is `Ready`, no change names it, and no change is active
- **THEN** the suggestion is `/opsx:propose`, naming `gift-cards`

#### Scenario: Ready PRD waits for the active change
- **GIVEN** an active change `acme-canvas` with open tasks
- **AND** `prds/gift-cards.md` is `Ready` and no change names it
- **WHEN** the user runs `/kit:next`
- **THEN** the suggestion is `/opsx:apply` for `acme-canvas`, with the line "PRD gift-cards is Ready; it waits until acme-canvas is done"

#### Scenario: PRD changed since planning
- **WHEN** a `Building` PRD has commits after the commit its change recorded
- **THEN** the suggestion says the PRD changed since planning and names the change to review

#### Scenario: Archived change
- **WHEN** the change named in a `Building` PRD is archived
- **THEN** the suggestion asks whether that PRD is done or continues in another change, offering `/kit:prd` to mark it `Shipped` or link the next change, and nothing is written

#### Scenario: Notes but no PRD
- **WHEN** the project has notes, no PRDs, no explore record and no active change
- **THEN** the suggestion is not `/kit:prd` and says nothing about the notes; it is the step outside a flow (the roadmap's next step, or "Nothing open")

#### Scenario: No knowledge folder
- **WHEN** the project has no knowledge folder
- **THEN** the suggestion is the same as before this change
