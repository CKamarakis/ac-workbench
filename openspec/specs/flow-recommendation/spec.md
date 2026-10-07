# flow-recommendation Specification

## Purpose
Recommends plain OpenSpec or SuperSpec for a change from a short risk checklist, with the reasons shown, so the user decides with evidence instead of the agent's gut feeling.

## Requirements

### Requirement: Risk checklist
The kit SHALL score a change description (the PRD and/or the proposal text) against a risk checklist:
- touches payments, money or billing;
- touches authentication, sessions or permissions;
- touches personal data;
- includes a data migration or a schema change;
- is hard to undo (deletes data, irreversible operations);
- has a wide reach (many areas or modules named);
- is vague (open questions or "unknown" left in the PRD).

It SHALL report which items matched, with the words that matched.

#### Scenario: Risky change
- **WHEN** the description says "add Stripe payments and migrate the orders table"
- **THEN** the matches are payments and data migration, each with the matched words

### Requirement: Flow recommendation
The kit SHALL recommend SuperSpec when two or more checklist items match, or when payments, authentication or a data migration matches. Otherwise it SHALL recommend plain OpenSpec. The recommendation SHALL show its reasons, and SHALL be offered at proposal time. The user decides, and the agent SHALL NOT switch flows on its own.

#### Scenario: Small change
- **WHEN** the description is "add a dark mode toggle to settings"
- **THEN** the recommendation is OpenSpec, with "no risk items matched"

#### Scenario: User decides
- **WHEN** SuperSpec is recommended and the user chooses OpenSpec
- **THEN** the change proceeds with OpenSpec, and no SuperSpec tools are added

### Requirement: Labelled eval set
The flow recommendation SHALL be tested against a set of at least ten labelled example descriptions, each marked with the expected flow, and SHALL match every label.

#### Scenario: Eval set passes
- **WHEN** the evals run
- **THEN** every labelled example gets its expected flow
