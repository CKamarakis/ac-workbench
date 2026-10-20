# Spec Delta

## MODIFIED Requirements

### Requirement: Verify a change
The verify step SHALL run for one OpenSpec change and SHALL produce a report at `<change folder>/verify.md`. The report SHALL include:
- the date and the commit it ran at;
- the test commands it ran and their result;
- the findings recorded from `/security-review` and `/code-review` on the change's files;
- the scenario-to-test check: the change's scenarios without a matching test;
- when the change's safeguards include it, the review against the spec and its findings;
- a docs-sync section: when the docs were last updated and the code commits since, the items proposed, written, declined or left out, and unplanned dependencies;
- the number of open decisions in the change's decision record, and the date of the oldest;
- every result marked **HARD** or **ADVISORY**;
- an overall result: `pass`, `fail` or `overridden`.

The test commands come from the project type's test policy (see the toolkit-registry requirement). The security and code reviews are run by the agent in the session, and their findings are recorded through the verify script, never typed into the report by hand. The docs-sync section and open decisions SHALL be ADVISORY.

If the change already has a `verify.md` the kit didn't write, verify SHALL keep it as `verify-earlier.md` instead of overwriting it, and SHALL list it as an ADVISORY item.

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

#### Scenario: Earlier report from another tool
- **GIVEN** the change has a `verify.md` written by another tool
- **WHEN** verify runs
- **THEN** that file is renamed to `verify-earlier.md` unchanged, and the report lists it as an advisory item to read

### Requirement: Hard failures and overrides
A failing required test command, a required test command that is missing (where the policy requires one), and a high-severity security finding SHALL be HARD. When the change's Safeguards choose medium security findings blocking (recommended when a dimension is rated high), a medium-severity security finding SHALL also be HARD. Everything else (changed files without tests, scenarios without tests, review comments, spec-review findings, lower-severity findings, browser checks) SHALL be ADVISORY. A HARD item SHALL block until it is fixed and verify passes on a re-run, or until the user overrides it. A fixed review finding SHALL be marked resolved with a note (for example the commit), so the re-run no longer counts it. An override SHALL record the user's reason and the date in the report, and SHALL set the result to `overridden`. The agent SHALL NOT override on its own.

#### Scenario: Override with a reason
- **WHEN** a high-severity finding is a known false positive and the user says to override it, with a reason
- **THEN** the report records the item, the reason and the date, and the result is `overridden`

#### Scenario: Advisory only
- **WHEN** the only items are changed files without tests
- **THEN** the result is `pass`, and the items are listed under advisory for the user to decide on

#### Scenario: Fixed HARD finding
- **GIVEN** a high-severity security finding made the result `fail`
- **WHEN** it is fixed, marked resolved with the commit, and verify runs again
- **THEN** the result is `pass` and the finding is listed under Resolved

#### Scenario: Medium finding on a high-risk change
- **GIVEN** the change's Safeguards choose medium security findings blocking
- **WHEN** the security review records a medium-severity finding
- **THEN** the finding is HARD and the result is `fail` until it is fixed or overridden

## ADDED Requirements

### Requirement: Scenario-to-test check
For every change, verify SHALL list each scenario in the change's delta specs and match it to a test. A scenario counts as tested when a test names it (its title or a clear paraphrase) or the agent records the test that checks it. Each scenario with no test SHALL be listed as ADVISORY, by capability and scenario name. Scenarios that can't be tested automatically (for example the wording of a message the agent writes) MAY be recorded as checked by hand, with a note.

#### Scenario: Untested scenario
- **GIVEN** the change's delta spec has scenarios "Review due" and "Not due", and only "Review due" has a test
- **WHEN** verify runs
- **THEN** the report lists "tool-review: Not due" as a scenario without a test, under advisory

#### Scenario: Checked by hand
- **WHEN** the agent records a scenario as checked by hand, with a note
- **THEN** the report shows it as checked by hand with the note, not as missing

### Requirement: Review against the spec
When the change's Safeguards include the review against the spec, verify SHALL run a read-only reviewer in a fresh context that receives the change's delta specs, tasks and diff, and reports where the built logic doesn't do what a requirement or scenario says. Each finding SHALL name the scenario or requirement and the file. Findings SHALL be ADVISORY. The reviewer SHALL NOT edit files. When the Safeguards choose edge-case probes, the same reviewer SHALL also propose them (inputs the scenarios don't name, such as empty, limits and bad input), listed as ADVISORY.

#### Scenario: Logic differs from a scenario
- **GIVEN** a scenario says the reminder fires after 30 days, and the code compares with 3 days
- **WHEN** the review against the spec runs
- **THEN** the report lists a finding naming that scenario and the file

#### Scenario: Not chosen
- **WHEN** the change's Safeguards don't include the review against the spec
- **THEN** verify doesn't run it, and the report says it wasn't chosen

### Requirement: User's OK before merge on high-risk changes
When the change's Safeguards choose it (recommended when a dimension is rated high), the report SHALL include an item "your OK before merge", which stays open until the user gives it and verify records it with the date. It SHALL NOT block the archive; it SHALL be shown at archive like an open decision.

#### Scenario: OK recorded
- **GIVEN** a change whose Safeguards choose my OK before merge, and whose tests pass
- **WHEN** I give my OK and verify records it
- **THEN** the report shows the OK with its date
