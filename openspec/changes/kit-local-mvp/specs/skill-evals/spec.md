# Spec Delta

## Purpose

Makes "this skill or tool works" a measured result instead of a feeling: every kit skill ships fixed test cases, and results feed registry verdicts and A/B tool trials.

## ADDED Requirements

### Requirement: Every kit skill has eval cases
Each skill shipped by the kit SHALL have at least one eval case. Each case defines an input or setup, the expected outcome, and how the outcome is checked. Checks SHALL be automatic wherever the outcome can be checked deterministically (files exist, commands succeed, content matches).

#### Scenario: Skill without evals
- **WHEN** a kit skill has no eval cases
- **THEN** the kit's eval check reports that skill as missing evals and fails

#### Scenario: Deterministic check
- **WHEN** the project-starter eval runs in an empty sandbox folder
- **THEN** it passes only if every Tier 2 basic exists and the licensed-folder pattern is ignored by git

### Requirement: Judgement checks use an explicit rubric
Where an outcome needs judgement (e.g. the quality of a review or document), the eval case SHALL define a written rubric with named criteria. The result SHALL record a pass/fail per criterion, not only an overall score.

#### Scenario: Rubric result
- **WHEN** a harness-review eval is scored
- **THEN** the result lists each rubric criterion with pass/fail and a one-line reason

### Requirement: Eval runs produce comparable results
Each eval run SHALL record:
- date
- the setup under test (e.g. schema or tool combination)
- per-case outcomes
- time taken
- the number of manual interventions

Runs of the same cases under two setups SHALL be comparable side by side.

#### Scenario: A/B comparison
- **WHEN** the same eval cases run under setup A (plain OpenSpec) and setup B (SuperSpec)
- **THEN** a comparison shows per-case outcomes, time and interventions for both setups

### Requirement: Results can back a registry verdict
An eval run SHALL be referenceable from a registry verdict, so every adopted or dropped status can point to its evidence.

#### Scenario: Verdict cites evidence
- **WHEN** a tool's verdict is recorded after a trial
- **THEN** the verdict references the eval run that supports it
