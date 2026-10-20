## MODIFIED Requirements

### Requirement: First step after setup
The starter's summary SHALL end with one next step. On a project with no notes, PRDs or changes yet, it SHALL name two first steps: `/kit:capture` to save ideas and notes, or `/opsx:explore` to explore an idea the user already has. Otherwise it SHALL name `/kit:next`. After the next step it SHALL add one line saying that the `/opsx:` commands come from OpenSpec, as a short link rather than the full URL, and that `/kit:next` guides the user through explore, propose, apply and archive, and then close with "**Have fun!**".

#### Scenario: New project
- **GIVEN** a fresh setup in a project with no notes, PRDs or changes
- **WHEN** the summary ends
- **THEN** it names `/kit:capture` and `/opsx:explore`, each with what it's for, and not `/kit:next`

#### Scenario: Where the opsx commands come from
- **WHEN** the summary ends, on a new project or not
- **THEN** after the next step there is one line naming OpenSpec as a link (not the full URL) and `/kit:next` as the guide through explore, propose, apply and archive, and the last line is "**Have fun!**"
