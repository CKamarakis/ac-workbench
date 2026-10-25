## ADDED Requirements

### Requirement: Next-step suggestion with PRD parts
The next-step skill SHALL treat a part like a PRD in its PRD rules: a Ready part with no change can be proposed, and a Building part's archived change leads to the "done or continues" question for that part. A parent that has parts SHALL never be suggested for a proposal itself. A `Dropped` PRD or part SHALL never lead to a suggestion.

#### Scenario: Ready part
- **GIVEN** parent `acme-v1` (Ready) with part `part-b` (Ready, no change) and no active change
- **WHEN** the user runs `/kit:next`
- **THEN** the suggestion is `/opsx:propose`, naming `acme-v1/part-b`, not `acme-v1`

#### Scenario: Ready part waits for the active change
- **GIVEN** an active change `acme-part-a` with open tasks, and part `acme-v1/part-b` Ready with no change
- **WHEN** the user runs `/kit:next`
- **THEN** the suggestion is for `acme-part-a`, with the line "PRD acme-v1/part-b is Ready; it waits until acme-part-a is done"

### Requirement: PRD changed checked per part and parent
For a Building part whose change recorded both a part line and a parent line, the next-step skill SHALL suggest reviewing the plan when the part's file or the parent's file changed after the commit recorded for it, and SHALL name which file changed. An edit to another part SHALL NOT trigger it, and neither SHALL an edit to the parent's Parts section alone. A proposal with no parent line SHALL be checked against the part only.

#### Scenario: Other part edited
- **GIVEN** change `acme-part-a` recorded `acme-v1/part-a` and parent `acme-v1`, and only `acme-v1/part-b.md` has commits since
- **WHEN** the user runs `/kit:next`
- **THEN** there is no "PRD changed" suggestion for `acme-part-a`

#### Scenario: Parent edited
- **GIVEN** change `acme-part-a` recorded parent `acme-v1` at commit `5d6e7f8`, and `prds/acme-v1.md` has commits since
- **WHEN** the user runs `/kit:next`
- **THEN** the suggestion says parent PRD `acme-v1` changed after `acme-part-a` was planned, and to review the plan against it

#### Scenario: Part added to the parent
- **GIVEN** change `acme-part-a` recorded parent `acme-v1` at `5d6e7f8`, and since then only a row for a new part was added to the parent's Parts section
- **WHEN** the user runs `/kit:next`
- **THEN** there is no "PRD changed" suggestion for `acme-part-a`

#### Scenario: Own part edited
- **GIVEN** change `acme-part-a` recorded `acme-v1/part-a` at `1a2b3c4`, and `prds/acme-v1/part-a.md` has commits since
- **WHEN** the user runs `/kit:next`
- **THEN** the suggestion says PRD `acme-v1/part-a` changed after `acme-part-a` was planned
