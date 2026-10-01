# Spec Delta

## Purpose

Gives the user a guided second opinion on any agent system they build: a checklist review across eight harness layers that yields a scorecard, top fixes, and explanations that build the user's own judgement over time.

## ADDED Requirements

### Requirement: Review covers eight layers
A harness review SHALL assess the target system across these layers: context, tools, memory, loops, verification, guardrails, feedback and observability. For each layer it SHALL ask the checklist questions defined for that layer.

#### Scenario: Full review
- **WHEN** the user asks to review a project's agent setup
- **THEN** the output contains a section for each of the eight layers

### Requirement: Review starts with a map
The review SHALL begin by producing a diagram of the system under review (components and how they connect), using plain ASCII, before scoring any layer.

#### Scenario: Diagram first
- **WHEN** a review runs
- **THEN** the first section of the output is a system diagram

### Requirement: Memory is checked by type
The memory layer check SHALL classify stored knowledge by type (working, project, procedural, episodic, preferences). It SHALL flag knowledge stored as the wrong type, e.g. how-to steps kept in fact memory instead of a skill.

#### Scenario: Procedure stored as fact
- **WHEN** a memory file contains step-by-step instructions for a recurring task
- **THEN** the review flags it and suggests moving it to a skill

### Requirement: Output is a scorecard with top fixes
The review SHALL end with a scorecard (each layer rated OK, PARTIAL or GAP, with a one-line note) and at most three prioritized fixes. Each fix SHALL explain why that layer matters.

#### Scenario: Scorecard format
- **WHEN** a review completes
- **THEN** it shows eight rated layers and no more than three fixes, each with a reason

### Requirement: Overlaps are flagged
The review SHALL compare installed tools against the registry's phase ownership and SHALL flag two tools claiming the same phase without a recorded resolution.

#### Scenario: New overlap detected
- **WHEN** a project has two enabled tools that both own phase `plan` with no overlap recorded
- **THEN** the review flags the overlap under the loops layer

### Requirement: Checklist-only in the MVP
The MVP review SHALL be a guided checklist run inside a Claude session. It SHALL NOT require external services or automated scanners, and SHALL NOT modify the reviewed project.

#### Scenario: Read-only review
- **WHEN** a review runs on a project
- **THEN** no files in that project are created or changed
