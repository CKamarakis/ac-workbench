# Spec Delta

## MODIFIED Requirements

### Requirement: Draft a PRD from chosen notes
The PRD skill SHALL take an idea (a sentence or a title) and SHALL show a shortlist of relevant notes (excluding `archive/`), each with a one-line reason. It SHALL draft the PRD only from the notes the user picks, and SHALL cite each one in `sources`. Information that is not in the picked notes or the user's prompt SHALL be marked as an assumption or an open question, never stated as fact. When an explore record is `ready-for-prd`, the skill SHALL offer it first: the draft then uses the record's decisions and its notes (all cited in `sources`), and the record is linked to the PRD once the file is created.

#### Scenario: Shortlist and pick
- **WHEN** the user runs the PRD skill with "gift cards" and the project has notes about checkout and onboarding
- **THEN** the skill shortlists the checkout notes with reasons, and drafts only after the user picks

#### Scenario: No relevant notes
- **WHEN** no note is relevant to the idea
- **THEN** the skill says so, and offers to draft from the prompt alone with `sources` empty

#### Scenario: Gaps marked
- **WHEN** the picked notes don't say who the users are
- **THEN** the draft lists that under open questions instead of inventing users

#### Scenario: Draft from an explore record
- **GIVEN** the explore record `kit-status` is `ready-for-prd` with 6 decisions and sources `notes/a.md` and `notes/b.md`
- **WHEN** the user runs the PRD skill
- **THEN** the skill offers the record first; on a yes the draft uses its decisions, cites both notes in `sources`, and the record is linked to the new PRD
