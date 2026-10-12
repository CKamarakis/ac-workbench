## MODIFIED Requirements

### Requirement: Verify a change
The verify step SHALL run for one OpenSpec change and SHALL produce a report at `<change folder>/verify.md`. The report SHALL include:
- the date and the commit it ran at;
- the test commands it ran and their result;
- the findings recorded from `/security-review` and `/code-review` on the change's files;
- a docs-sync section: when the docs were last updated and the code commits since, the items proposed, written, declined or left out, and unplanned dependencies;
- the number of open decisions in the change's decision record, and the date of the oldest;
- every result marked **HARD** or **ADVISORY**;
- an overall result: `pass`, `fail` or `overridden`.

The test commands come from the project type's test policy (see the toolkit-registry requirement). The security and code reviews are run by the agent in the session, and their findings are recorded through the verify script, never typed into the report by hand. The docs-sync section and open decisions SHALL be ADVISORY.

#### Scenario: All green
- **WHEN** the policy's tests pass and the reviews record no high-severity finding
- **THEN** `verify.md` has result `pass`, and lists any advisory items

#### Scenario: Failing test
- **WHEN** a test command required by the policy exits non-zero
- **THEN** `verify.md` has result `fail`, with a HARD item naming the command and the end of its output

#### Scenario: Docs sync with open items
- **GIVEN** the tests pass, and the docs sync leaves one flagged item open
- **WHEN** verify finishes
- **THEN** the result is `pass`, and the advisory list shows the docs-sync summary and "1 decision still open"

### Requirement: Archive gate
In a kit project (one with `.claude/kit.json`), archiving a change with `openspec archive` SHALL be blocked when the change has no `verify.md`, or its result is `fail`, and the block SHALL tell the agent why and what to run. A result of `pass` or `overridden` SHALL let the archive go ahead. When the archive goes ahead and the change has open decisions, the gate SHALL tell the agent how many are open and since when, so it can tell the user, and SHALL NOT block for them. Outside kit projects, the gate SHALL do nothing.

#### Scenario: Archive without verify
- **WHEN** the agent runs `openspec archive add-x` and `openspec/changes/add-x/verify.md` does not exist
- **THEN** the command is blocked, with the reason "run /kit:verify first"

#### Scenario: Archive after pass
- **WHEN** `verify.md` has result `pass`
- **THEN** the archive runs normally

#### Scenario: Archive with open decisions
- **GIVEN** `verify.md` has result `pass` and `decisions.md` has two open items, the oldest from 2026-10-12
- **WHEN** the agent runs `openspec archive add-x`
- **THEN** the archive runs, and the agent is told "2 decisions still open since 2026-10-12"

#### Scenario: Not a kit project
- **WHEN** the project has no `.claude/kit.json`
- **THEN** the gate lets every command through
