# Spec Delta

## ADDED Requirements

### Requirement: Test command time limit
Verify SHALL stop a test command that runs longer than 15 minutes. A stopped command SHALL be reported as having run out of time, never as failed, with a message that says it is not a test failure and names the file to edit to raise the limit. It keeps the level a failure would have: HARD when the policy requires the command, ADVISORY when it is optional.

#### Scenario: Optional suite runs out of time
- **GIVEN** the policy marks `test:integration` optional
- **WHEN** `npm run test:integration` is still running after 15 minutes
- **THEN** verify stops it, the report's tests table shows `ran out after 15 min`, and an ADVISORY item says it is not a test failure and names the path of the `verify.mjs` file whose limit to edit, with the home folder shown as `~` (no username in a committed report)

#### Scenario: Required suite runs out of time
- **GIVEN** the policy marks `test` required
- **WHEN** `npm run test` is still running after 15 minutes
- **THEN** the item is HARD with the same ran-out message, and the result is `fail` until a re-run passes or the user overrides it

#### Scenario: Suite under the limit
- **WHEN** a test command finishes in 13.5 minutes and exits 0
- **THEN** it is reported as `pass`

#### Scenario: Real failure is unchanged
- **WHEN** a test command exits non-zero before the limit
- **THEN** it is reported as `fail (exit N)` with the end of its output, as today
