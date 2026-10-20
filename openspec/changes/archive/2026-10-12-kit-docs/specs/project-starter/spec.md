## ADDED Requirements

### Requirement: Docs page mentioned at setup
The starter's summary SHALL list `/kit:docs` once under Later, saying that it is optional, suits projects that grow beyond a day or two, and can be started at any point, also mid-project: "optional: when you want a browsable page of what's built (worth it beyond a day or two of work), run /kit:docs, any time, also mid-project". The starter SHALL NOT create `knowledge/docs/` or `knowledge/foundations/`.

#### Scenario: Fresh project
- **WHEN** `/kit:start` finishes on a new project
- **THEN** the summary's Later part mentions `/kit:docs`, and no docs folder exists
