## MODIFIED Requirements

### Requirement: Kit checks only with the kit
When the project has `.claude/kit.json`, the review SHALL also check the kit's setup: unresolved tool overlaps from the lane map (under loops) whether the CLAUDE.md routing block is present and current (under context), and the size of the project context doc (`docs/project-context.md`), flagged under context when it is over 60 lines. Without the kit it SHALL NOT mention the kit's tools or suggest installing the kit.

#### Scenario: Project without the kit
- **GIVEN** a project with no `.claude/kit.json`
- **WHEN** the review runs
- **THEN** no layer note or fix mentions the kit

#### Scenario: Kit overlap
- **GIVEN** a kit project whose registry has two active tools owning `plan` with no recorded overlap
- **WHEN** the review rates loops
- **THEN** it flags the overlap

#### Scenario: Context doc grown long
- **GIVEN** a kit project whose `docs/project-context.md` has 198 lines
- **WHEN** the review rates context
- **THEN** it names the file, its 198 lines and the 60-line mark, and suggests moving history out to the archive, roadmap and foundation cards
