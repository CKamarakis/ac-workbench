# Spec Delta

## ADDED Requirements

### Requirement: Fixed findings are resolved
After a review finding is fixed, the agent SHALL be able to mark it resolved with a short note (for example the commit that fixed it). A resolved finding SHALL move from the advisory list to a "Resolved" list in the report, with its note and date, and SHALL NOT count as open. Only advisory findings SHALL be resolvable this way; a HARD item still needs a passing re-run or an override. Resolving SHALL NOT be done for a finding the user decided to keep.

#### Scenario: Code finding fixed
- **GIVEN** a verify report with advisory finding C1
- **WHEN** C1 is fixed and the agent resolves it with the note "fixed in 76fbaaa"
- **THEN** the report lists C1 under Resolved with "fixed in 76fbaaa" and today's date, and no longer under advisory

#### Scenario: HARD item cannot be resolved
- **GIVEN** a failing required test listed as HARD
- **WHEN** the agent tries to resolve it
- **THEN** the command refuses and says a HARD item needs a passing re-run or the user's override
