## MODIFIED Requirements

### Requirement: Ready PRD hands off to planning
The project's routing rules SHALL direct the proposal step to take one PRD as its main input. With one candidate PRD, it uses that one. With several, it takes the most recently updated one, names it, and lists the others so the user can switch; when the user's words point to none of them, it asks. A PRD that isn't `Ready` SHALL get a one-line note, never a stop. The resulting proposal SHALL record the PRD's path and the commit it was read at. The PRD's `change` field SHALL be set to the new change's name, and its status SHALL move to `Building` only after the user confirms.

#### Scenario: Proposal from Ready PRD
- **WHEN** the user runs `/opsx:propose` in a project with a Ready PRD `prds/gift-cards.md`
- **THEN** the proposal cites `knowledge/prds/gift-cards.md` and the commit it was read at

#### Scenario: Status after proposal
- **WHEN** the proposal is created and the user confirms
- **THEN** the PRD's `change` names the change, and its status is `Building`

#### Scenario: Several PRDs
- **GIVEN** two PRDs, `prds/new.md` updated after `prds/old.md`
- **WHEN** the user runs `/opsx:propose` without naming one
- **THEN** the proposal step takes `new`, says so, and names `old` as the other choice; nothing blocks

#### Scenario: Draft PRD
- **WHEN** the user proposes from a PRD whose status is `Draft`
- **THEN** the proposal step notes in one line that it isn't Ready and goes on
