# Spec Delta

## ADDED Requirements

### Requirement: On-demand browser check
The verify step SHALL include a browser check only when the user asks for one; it SHALL NOT run, or be listed as a reminder, in a default verify. When the user asks, the agent SHALL drive the running app with the browser tool (Playwright CLI) through the flows the change touches, including pages behind login, and SHALL record the outcome in the report: one result (`pass` or `issues`), each issue found as an ADVISORY item, the screenshot paths, and the date. A browser check SHALL never make an item HARD.

#### Scenario: Default verify
- **WHEN** `/kit:verify` runs and the user did not ask for a browser check
- **THEN** no browser check runs, and the report contains no browser-check item

#### Scenario: Browser check on request
- **WHEN** the user asks for a browser check of the lightbox before a release
- **THEN** the agent logs in, exercises the lightbox, and the report shows a "Browser check" result with its issues as advisory items and the screenshot paths

#### Scenario: Issues never block
- **WHEN** the browser check finds an overlapping close button
- **THEN** the item is ADVISORY, and the verify result is unchanged by it
