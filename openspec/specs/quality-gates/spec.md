# quality-gates Specification

## Purpose
Checks a change before it is closed, sized to the project: hard failures (failing tests, secrets, high-severity security findings) block, everything else is reported as advice the user decides on.

## Requirements

### Requirement: Verify a change
The verify step SHALL run for one OpenSpec change and SHALL produce a report at `<change folder>/verify.md`. The report SHALL include:
- the date and the commit it ran at;
- the test commands it ran and their result;
- the findings recorded from `/security-review` and `/code-review` on the change's files;
- every result marked **HARD** or **ADVISORY**;
- an overall result: `pass`, `fail` or `overridden`.

The test commands come from the project type's test policy (see the toolkit-registry requirement). The security and code reviews are run by the agent in the session, and their findings are recorded through the verify script, never typed into the report by hand.

#### Scenario: All green
- **WHEN** the policy's tests pass and the reviews record no high-severity finding
- **THEN** `verify.md` has result `pass`, and lists any advisory items

#### Scenario: Failing test
- **WHEN** a test command required by the policy exits non-zero
- **THEN** `verify.md` has result `fail`, with a HARD item naming the command and the end of its output

### Requirement: Hard failures and overrides
A failing required test command, a required test command that is missing (where the policy requires one), and a high-severity security finding SHALL be HARD. Everything else (changed files without tests, review comments, lower-severity findings, browser checks) SHALL be ADVISORY. A HARD item SHALL block until it is fixed and verify passes on a re-run, or until the user overrides it. An override SHALL record the user's reason and the date in the report, and SHALL set the result to `overridden`. The agent SHALL NOT override on its own.

#### Scenario: Override with a reason
- **WHEN** a high-severity finding is a known false positive and the user says to override it, with a reason
- **THEN** the report records the item, the reason and the date, and the result is `overridden`

#### Scenario: Advisory only
- **WHEN** the only items are changed files without tests
- **THEN** the result is `pass`, and the items are listed under advisory for the user to decide on

### Requirement: Changed files without tests (advisory)
The verify step SHALL list source files changed by the change (against the commit the change started from, or the main branch) that have no matching test file by name, and no test file changed in the same change. This SHALL be advisory, and SHALL NOT require a coverage tool.

#### Scenario: New module without a test
- **WHEN** the change adds `src/lib/price.ts` and no `price.test.ts` or `price.spec.ts` exists or changed
- **THEN** the report lists `src/lib/price.ts` under advisory

### Requirement: Archive gate
In a kit project (one with `.claude/kit.json`), archiving a change with `openspec archive` SHALL be blocked when the change has no `verify.md`, or its result is `fail`, and the block SHALL tell the agent why and what to run. A result of `pass` or `overridden` SHALL let the archive go ahead. Outside kit projects, the gate SHALL do nothing.

#### Scenario: Archive without verify
- **WHEN** the agent runs `openspec archive add-x` and `openspec/changes/add-x/verify.md` does not exist
- **THEN** the command is blocked, with the reason "run /kit:verify first"

#### Scenario: Archive after pass
- **WHEN** `verify.md` has result `pass`
- **THEN** the archive runs normally

#### Scenario: Not a kit project
- **WHEN** the project has no `.claude/kit.json`
- **THEN** the gate lets every command through

### Requirement: Opt-in pre-push tests
The verify skill SHALL offer, only when the user asks, to install a git pre-push hook in the project that runs the policy's required test command and stops the push when it fails. It SHALL NOT install it by default, and SHALL NOT overwrite an existing pre-push hook.

#### Scenario: User asks for pre-push
- **WHEN** the user asks to run tests before every push
- **THEN** a pre-push hook is installed that runs the required test command, and an existing hook is left untouched (the user is told)

### Requirement: Review owners
The registry SHALL make `/kit:verify` the owner of the `verify` phase and the built-in `/code-review` the owner of the `review` phase. The routing rules SHALL say to run `/kit:verify` before `/opsx:archive`, and the next-step suggestion SHALL suggest `/kit:verify` when all of a change's tasks are done and it has no passing report.

#### Scenario: Next step after tasks
- **WHEN** all tasks of the active change are done and it has no `verify.md`
- **THEN** the suggestion is `/kit:verify`, then `/opsx:archive`

### Requirement: Review status recorded
For each of the security review and the code review, the report SHALL record how it ran: `ran`, `substitute` (the built-in couldn't run and the agent reviewed the diff itself), or `skipped`. `substitute` and `skipped` SHALL carry a note with the reason. A review that isn't recorded, or was skipped, SHALL appear as an advisory item, so a report never looks clean because a review silently didn't run.

#### Scenario: Built-in security review unavailable
- **WHEN** `/security-review` can't run in the environment, and the agent reviews the diff itself
- **THEN** the report shows the security review as `substitute` with the reason, and lists any findings the agent recorded

#### Scenario: Review never recorded
- **WHEN** verify has run but no security review was recorded
- **THEN** the report lists "security review not recorded (did it run?)" under advisory
