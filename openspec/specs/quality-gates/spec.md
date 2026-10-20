# quality-gates Specification

## Purpose
Checks a change before it is closed, sized to the project: hard failures (failing tests, secrets, high-severity security findings) block, everything else is reported as advice the user decides on.

## Requirements

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

### Requirement: Changed files without tests (advisory)
The verify step SHALL list source files changed by the change (against the commit the change started from, or the main branch) that have no matching test file by name, and no test file changed in the same change. This SHALL be advisory, and SHALL NOT require a coverage tool.

#### Scenario: New module without a test
- **WHEN** the change adds `src/lib/price.ts` and no `price.test.ts` or `price.spec.ts` exists or changed
- **THEN** the report lists `src/lib/price.ts` under advisory

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

### Requirement: On-demand browser check
The verify step SHALL run a browser check only when the user asks for one. In a web-ui project, when the change adds a page or route file or new input handling (pointer, touch, key, wheel, gesture, paste, mouse, drag or drop handlers), and no browser check is recorded at the current commit, the report SHALL include one ADVISORY item recommending one and naming what it found; otherwise a default verify SHALL list no browser-check item. When the user asks, the agent SHALL drive the running app with the browser tool (Playwright CLI) through the flows the change touches, including pages behind login, and SHALL record the outcome in the report: one result (`pass` or `issues`), each issue found as an ADVISORY item, the screenshot paths, and the date. A browser check SHALL never make an item HARD.

#### Scenario: Default verify
- **WHEN** `/kit:verify` runs, the user did not ask for a browser check, and the change adds no page and no input handling
- **THEN** no browser check runs, and the report contains no browser-check item

#### Scenario: Browser check recommended
- **GIVEN** a web-ui project whose change adds an `onPointerDown` handler to a board component
- **WHEN** `/kit:verify` runs
- **THEN** no browser check runs, and the report has one ADVISORY item saying a browser check is worth it, naming the file and the handler

#### Scenario: Not a web-ui project
- **GIVEN** a project that isn't web-ui
- **WHEN** its change adds a key handler and `/kit:verify` runs
- **THEN** the report has no browser-check item

#### Scenario: Browser check on request
- **WHEN** the user asks for a browser check of the lightbox before a release
- **THEN** the agent logs in, exercises the lightbox, and the report shows a "Browser check" result with its issues as advisory items and the screenshot paths, and no recommendation item

#### Scenario: Issues never block
- **WHEN** the browser check finds an overlapping close button
- **THEN** the item is ADVISORY, and the verify result is unchanged by it

### Requirement: Docs page rebuild at archive
In a kit project that has a `knowledge/docs/` folder, when the archive gate lets an archive go ahead, it SHALL also tell the agent to ask the user, after the spec sync, whether to rebuild the docs page, and on a yes to run the build and include `knowledge/docs/index.html` in the archive commit. It SHALL NOT block for this. A project without `knowledge/docs/` SHALL get no such message.

#### Scenario: Project with a docs page
- **GIVEN** `verify.md` has result `pass` and the project has `knowledge/docs/index.html`
- **WHEN** the agent runs `openspec archive add-x`
- **THEN** the archive runs, and the agent is told to ask about rebuilding the docs page into the archive commit

#### Scenario: Project without docs
- **GIVEN** the project has no `knowledge/docs/` folder
- **WHEN** the archive goes ahead
- **THEN** no docs message is added

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

### Requirement: UI review at verify
When the change's Safeguards include `ui-review`, verify SHALL run `/impeccable critique` and `/impeccable audit` on the UI the change touches, and record each finding in `verify.md` as ADVISORY, with a link to Impeccable's own report under `.impeccable/critique/` when one was written. The report SHALL record how the UI review ran (`ran`, `substitute` or `skipped` with a note), and a chosen UI review that isn't recorded SHALL appear as an advisory item. When the project has no `PRODUCT.md` or no `DESIGN.md`, verify SHALL offer `/impeccable init` or `/impeccable document` before the review and list the missing file as advisory. When `ui-review` isn't chosen, the report SHALL say so.

#### Scenario: Chosen and run
- **GIVEN** the Safeguards include `ui-review`
- **WHEN** verify runs the UI review and it finds a low-contrast label
- **THEN** `verify.md` lists the finding as advisory with a link to the report in `.impeccable/critique/`, and the UI review shows as `ran`

#### Scenario: Chosen, not recorded
- **GIVEN** the Safeguards include `ui-review`
- **WHEN** verify finishes without the UI review recorded
- **THEN** the report lists "ui review not recorded" as advisory

#### Scenario: Design context missing
- **GIVEN** the Safeguards include `ui-review`, and the project has no `DESIGN.md`
- **WHEN** verify runs
- **THEN** the missing `DESIGN.md` is listed as advisory, and I'm offered `/impeccable document` before the review

#### Scenario: App can't run
- **GIVEN** the Safeguards include `ui-review`, and the app can't be started at verify
- **WHEN** the UI review runs
- **THEN** it reviews from the code and committed screenshots, and the report shows the UI review as `substitute` with the reason

#### Scenario: Impeccable not installed
- **GIVEN** the Safeguards include `ui-review`, and the project has no Impeccable installed
- **WHEN** verify reaches the UI review
- **THEN** I'm offered the project-scope install; on a no, the UI review is recorded as `skipped` with the reason

#### Scenario: UI review not chosen
- **WHEN** the Safeguards don't include `ui-review`
- **THEN** verify doesn't run it, and the report says it wasn't chosen
