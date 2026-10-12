## ADDED Requirements

### Requirement: Docs page mentioned at setup
The starter's summary SHALL list `/kit:docs` once under Later, phrased as "when you want a browsable page of what's built, run /kit:docs". The starter SHALL NOT create `knowledge/docs/` or `knowledge/foundations/`.

#### Scenario: Fresh project
- **WHEN** `/kit:start` finishes on a new project
- **THEN** the summary's Later part mentions `/kit:docs`, and no docs folder exists
