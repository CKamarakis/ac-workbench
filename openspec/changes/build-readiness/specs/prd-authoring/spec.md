## MODIFIED Requirements

### Requirement: PRD format and status
Each PRD SHALL be one Markdown file in `prds/`, named `<slug>.md`. Its frontmatter SHALL include:
- `title`
- `status`: one of `Draft`, `Review`, `Ready`, `Building`, `Shipped`
- `sources`: a list of note paths relative to the knowledge folder (may be empty)
- `change`: the name of the OpenSpec change that uses it, once one exists

The body SHALL follow the kit's PRD template, written in the kit's own words. Licensed PM-OS text SHALL NOT be copied into it. The template's requirements section SHALL ask for user stories in Given/When/Then form (a starting state, an action, an expected outcome), grouped by flow or screen. The PRD skill SHALL draft requirements in that form, and SHALL keep a short plain statement where a requirement has no meaningful starting state or action.

When a draft or an update leaves items under Open questions, the PRD skill SHALL keep them out of its end report and SHALL ask, as a separate step, whether to go through them now or later. **Now:** it SHALL ask each question with concrete options, its recommendation first, and a Later option, and SHALL write each answer into the PRD. **Later:** it SHALL write nothing, and the questions SHALL stay in the Open questions section.

#### Scenario: New PRD
- **WHEN** a PRD is first drafted
- **THEN** its status is `Draft`, its `sources` lists the notes it was built from, and its body has the template's sections

#### Scenario: Requirements as stories
- **GIVEN** notes that say "dragging a sticky moves it; letting go saves the position"
- **WHEN** the PRD skill drafts the requirements
- **THEN** they include a story such as "Given a sticky on the board, when I drag it and let go, then it stays where I dropped it after a reload"

#### Scenario: Open questions put off
- **GIVEN** a new draft with 4 open questions
- **WHEN** the PRD skill asks "go through them now or later?" and the user picks Later
- **THEN** nothing more is written, the 4 questions stay under Open questions, and the reply says `/kit:next` will remind the user

#### Scenario: Invalid status
- **WHEN** a PRD's status is not one of the five values
- **THEN** kit skills report the PRD as invalid and name the bad value, instead of guessing a status
