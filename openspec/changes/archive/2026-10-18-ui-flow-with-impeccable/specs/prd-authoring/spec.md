# Spec Delta

## ADDED Requirements

### Requirement: Shape offered for screens
When a PRD is drafted or updated in a web-ui project (build-readiness "Web-ui project") and it touches a screen, the kit SHALL offer `/impeccable shape` once for that PRD. On a yes, the confirmed brief SHALL be proposed for the PRD's "UX notes and assets" section and written only on the user's yes, like any section update. The kit SHALL NOT run `shape` without the user's yes, and SHALL NOT offer it again for the same PRD after a no. The answer SHALL be kept in the PRD's frontmatter as `shape: done` or `shape: declined`, set through the helper like the other fields.

#### Scenario: Screen in a web-ui project
- **GIVEN** a web-ui project, and a PRD whose requirements describe a board screen
- **WHEN** I draft it
- **THEN** I'm offered `/impeccable shape` once; on a yes, its brief is proposed for UX notes and written on my yes

#### Scenario: No screen
- **GIVEN** a web-ui project, and a PRD about a background job
- **WHEN** I draft it
- **THEN** no `shape` offer is made

#### Scenario: Declined
- **GIVEN** I said no to the `shape` offer for a PRD
- **WHEN** I update that PRD later
- **THEN** the offer isn't repeated
