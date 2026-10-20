# explore-record Specification

## Purpose
Gives the explore stage a record (the notes read, the decisions made, the questions still open), so the flow from explore to PRD can be followed by the kit and the PRD is drafted from what was decided rather than from chat.

## Requirements

### Requirement: Explore record file
An explore SHALL be recorded in `<knowledge>/explore/<slug>.md` with a title, `sources` (the notes it read, as paths under the knowledge folder; one note MAY be in several records), decisions (one line each), open questions (each with an ID `Q1`, `Q2` ... never reused within the record), and the PRD it fed, once there is one. The state SHALL be derived from the record and never stored: open questions -> `exploring`; no open questions and no PRD -> `ready-for-prd`; a PRD -> `in-prd`. A source that is not an existing note SHALL be refused.

#### Scenario: New record
- **GIVEN** notes `notes/a.md`, `notes/b.md` and `notes/c.md`
- **WHEN** a record "Kit status" is saved with those 3 sources, 4 decisions and 2 open questions
- **THEN** `explore/kit-status.md` exists with them, the questions are `Q1` and `Q2`, and its state is `exploring`

#### Scenario: Unknown source refused
- **WHEN** a record is saved with the source `notes/missing.md`
- **THEN** nothing is written and the error names the missing note

### Requirement: Record updated, never rewritten
Saving an existing record SHALL add new decisions and questions, and SHALL close answered questions by turning each into a decision that names the question it answers; it SHALL NOT remove decisions or questions. The record SHALL be written only through the kit's explore script (by the `/kit:explore-record` skill or `/kit:prd`). Once a record is `in-prd`, it SHALL refuse further saves and point to the PRD.

#### Scenario: Last question answered
- **GIVEN** a record `exploring` with open question `Q2` only
- **WHEN** a later explore saves the answer to `Q2`
- **THEN** `Q2` is closed, a decision "Q2: <answer>" is added, and the state is `ready-for-prd`

#### Scenario: Record already in a PRD
- **GIVEN** a record linked to `prds/kit-status.md`
- **WHEN** a save is attempted
- **THEN** nothing is written and the error points to `/kit:prd` for that PRD

### Requirement: Saved at the end of an explore
At the end of `/opsx:explore`, the agent SHALL save or update the record through `/kit:explore-record` by default, without asking, and SHALL show what it wrote (title, sources, new decisions, questions answered, new questions). This is a deliberate exception to "nothing is written without the user's yes" (user, 2026-10-17): the record only grows and nothing depends on it until a PRD is drafted from it. When the user says not to keep it, the agent SHALL remove what that save added. When the explore made no decision and raised no question, nothing SHALL be saved.

#### Scenario: Explore with decisions
- **GIVEN** an explore on 2 notes that made 3 decisions and left 1 question
- **WHEN** the explore ends
- **THEN** the agent saves the record through `/kit:explore-record` and shows what it wrote, without asking first

#### Scenario: User drops the save
- **GIVEN** the agent just saved a new record `kit-status` at the end of an explore
- **WHEN** the user says not to keep it
- **THEN** the record file is removed, and the agent says so

#### Scenario: Explore with nothing decided
- **WHEN** an explore ends with no decision and no question
- **THEN** nothing is saved

### Requirement: Reminder when the next stage starts
When the user starts the next stage (a prompt beginning with `/kit:prd`, `/opsx:propose` or `/kit:next`) in a kit project, a kit hook SHALL add one line to the agent's context: if this session explored something whose record isn't saved, save it with `/kit:explore-record` first. The hook SHALL NOT block the prompt or write anything, and SHALL do nothing outside kit projects or for other prompts.

#### Scenario: Next stage after an unsaved explore
- **GIVEN** a kit project
- **WHEN** the user submits `/kit:prd`
- **THEN** the hook adds the reminder to the agent's context, and the prompt goes through unchanged

#### Scenario: Other prompts
- **WHEN** the user submits "what does this function do?"
- **THEN** the hook adds nothing

### Requirement: Record linked to its PRD
When a PRD is drafted from a record, the record SHALL be linked to that PRD (state `in-prd`), and the PRD's `sources` SHALL include the record's notes.

#### Scenario: PRD from a record
- **GIVEN** a record `ready-for-prd` with sources `notes/a.md` and `notes/b.md`
- **WHEN** the PRD `kit-status` is drafted from it
- **THEN** the record names `prds/kit-status.md`, its state is `in-prd`, and the PRD's sources include both notes
