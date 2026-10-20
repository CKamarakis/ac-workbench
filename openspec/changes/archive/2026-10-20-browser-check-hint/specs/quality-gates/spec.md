## MODIFIED Requirements

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
