# Spec Delta

## MODIFIED Requirements

### Requirement: Next-step suggestion uses PRD status
Before falling back to the OpenSpec-based suggestion, the next-step skill SHALL check the project's PRDs and SHALL suggest, with a one-line reason:
- the `prd` phase owner, when notes exist but no PRD does, and there is no active change;
- the `artifacts` phase owner (e.g. `/opsx:propose`), naming the PRD, when a PRD is `Ready`, no change uses it, and no change is active;
- reviewing the plan, when a `Building` PRD's file changed after the commit its change recorded;
- marking the PRD `Shipped`, when the change named in a `Building` PRD is archived.

While a change is active, a `Ready` PRD without a change SHALL NOT replace the suggestion for the active change; the suggestion SHALL carry one line saying the PRD is waiting until the active change is done.

When none of these apply, the existing OpenSpec-based suggestion SHALL be unchanged. Invalid PRDs SHALL be reported, not guessed.

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
- **THEN** the suggestion is to mark that PRD `Shipped`, and nothing is written

#### Scenario: Notes but no PRD
- **WHEN** the project has notes, no PRDs and no active change
- **THEN** the suggestion is `/kit:prd`

#### Scenario: No knowledge folder
- **WHEN** the project has no knowledge folder
- **THEN** the suggestion is the same as before this change

## REMOVED Requirements

### Requirement: Library-error hook
**Reason**: It never fired in real use (a chained command exits 0, and PowerShell commands were not matched), and the Context7 A/B showed no benefit on typed, installed packages (`evals/trials/context7-ab.md`). Removed as dead code (user triage, 2026-10-14).
**Migration**: None needed. The "Library docs rule in the routing block" stays, so the agent still looks up library docs with `npx -y ctx7@latest` when unsure or after a library error.
