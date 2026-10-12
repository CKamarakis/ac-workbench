## ADDED Requirements

### Requirement: Foundation card proposals
When a decision with depth found by the docs sync shapes more than one sub-feature, or trades a limit for a gain across the product, the docs sync SHALL also propose a foundation card for it (new, or an update to an existing card), in the card format of the living docs. It SHALL write the card only on a yes, like every other docs-sync update. When a decision replaces what an existing card says, it SHALL propose marking that card `replaced` rather than deleting it.

#### Scenario: Choice that shapes several sub-features
- **GIVEN** the build chose to draw Storms on a canvas, which affects stickies, moving around and accessibility
- **WHEN** the docs sync runs
- **THEN** it proposes the `design.md` decision and a foundation card "Storms draws on a canvas", each written only on a yes

#### Scenario: Decision limited to one sub-feature
- **GIVEN** a decision with depth that affects only Saving
- **WHEN** the docs sync runs
- **THEN** it is proposed for `design.md` only, with no card
