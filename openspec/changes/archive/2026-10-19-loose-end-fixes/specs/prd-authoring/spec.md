## MODIFIED Requirements

### Requirement: Status changes need the user
The kit SHALL NOT change a PRD's status, or any other content, without the user's confirmation. A suggested status change, for example `Shipped` after the change is archived, SHALL be offered and applied only on a yes.

#### Scenario: Shipped suggested
- **WHEN** the change named in a `Building` PRD is archived
- **THEN** the kit asks whether the PRD is done or continues in another change, offering `Shipped` or linking the next change, and the file is unchanged until the user agrees
