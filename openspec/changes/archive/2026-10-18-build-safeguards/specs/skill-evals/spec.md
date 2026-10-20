# Spec Delta

## MODIFIED Requirements

### Requirement: Eval runs produce comparable results
Each eval run SHALL record:
- date
- the setup under test (e.g. schema or tool combination)
- per-case outcomes
- time taken by the setup under test (for a trial, the working session's wall time, not the time the checks took to run)
- the number of manual interventions

Runs of the same cases under two setups SHALL be comparable side by side.

#### Scenario: A/B comparison
- **WHEN** the same eval cases run under setup A (plain OpenSpec) and setup B (another flow or tool combination)
- **THEN** a comparison shows per-case outcomes, time and interventions for both setups
