# Spec Delta

## ADDED Requirements

### Requirement: UI review at verify
When the change's Safeguards include `ui-review`, verify SHALL run `/impeccable critique` and `/impeccable audit` on the UI the change touches, and record each finding in `verify.md` as ADVISORY, with a link to Impeccable's own report under `.impeccable/critique/` when one was written. The report SHALL record how the UI review ran (`ran`, `substitute` or `skipped` with a note), and a chosen UI review that isn't recorded SHALL appear as an advisory item. When the project has no `PRODUCT.md` or no `DESIGN.md`, verify SHALL offer `/impeccable init` or `/impeccable document` before the review and list the missing file as advisory. When `ui-review` isn't chosen, the report SHALL say so.

#### Scenario: Chosen and run
- **GIVEN** the Safeguards include `ui-review`
- **WHEN** verify runs the UI review and it finds a low-contrast label
- **THEN** `verify.md` lists the finding as advisory with a link to the report in `.impeccable/critique/`, and the UI review shows as `ran`

#### Scenario: Chosen, not recorded
- **GIVEN** the Safeguards include `ui-review`
- **WHEN** verify finishes without the UI review recorded
- **THEN** the report lists "ui review not recorded" as advisory

#### Scenario: Design context missing
- **GIVEN** the Safeguards include `ui-review`, and the project has no `DESIGN.md`
- **WHEN** verify runs
- **THEN** the missing `DESIGN.md` is listed as advisory, and I'm offered `/impeccable document` before the review

#### Scenario: App can't run
- **GIVEN** the Safeguards include `ui-review`, and the app can't be started at verify
- **WHEN** the UI review runs
- **THEN** it reviews from the code and committed screenshots, and the report shows the UI review as `substitute` with the reason

#### Scenario: Impeccable not installed
- **GIVEN** the Safeguards include `ui-review`, and the project has no Impeccable installed
- **WHEN** verify reaches the UI review
- **THEN** I'm offered the project-scope install; on a no, the UI review is recorded as `skipped` with the reason

#### Scenario: UI review not chosen
- **WHEN** the Safeguards don't include `ui-review`
- **THEN** verify doesn't run it, and the report says it wasn't chosen
