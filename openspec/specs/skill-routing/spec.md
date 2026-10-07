# skill-routing Specification

## Purpose
Makes it predictable which tool or skill handles each phase of work, so overlapping tools don't compete, and tells the user what to do next without memorising hundreds of skills.

## Requirements

### Requirement: Lane map derived from registry
The kit SHALL produce a lane map (each workflow phase to exactly one owning tool) from the registry's phase ownership data, among entries with status `adopted` or `trial`. For each phase it SHALL show the skill or command to use, when the registry records one. Phases without an owner SHALL be listed as unowned.

The owner SHALL be chosen as follows:
1. A tool that lists another claimant of the phase under `overlaps` defers to it, and is shown as an alternative for that phase.
2. Among the remaining claimants, an `adopted` tool wins over a `trial` tool.
3. If more than one claimant still remains, the phase SHALL be shown as a conflict naming those tools. No owner is guessed.

#### Scenario: Complete lane map
- **WHEN** the lane map is generated from a valid registry
- **THEN** every defined phase shows exactly one owner, or is marked unowned or as a conflict

#### Scenario: Deferring tool shown as alternative
- **WHEN** OpenSpec (adopted) and SuperSpec (trial) both claim phase `build`, and SuperSpec lists OpenSpec under `overlaps`
- **THEN** OpenSpec owns `build` with its recorded skill, and SuperSpec is shown as the alternative for `build`

#### Scenario: Tie reported as conflict
- **WHEN** two adopted tools claim the same phase and neither lists the other under `overlaps`
- **THEN** the lane map shows that phase as a conflict naming both tools, with no owner

### Requirement: Projects receive routing rules
When a project is bootstrapped or re-synced, the kit SHALL write routing rules derived from the lane map into the project's agent instructions. The rules state which skill to use for each phase and which overlapping skills not to use. User-written instructions SHALL be preserved.

#### Scenario: Routing rules present
- **WHEN** a project is bootstrapped
- **THEN** its agent instructions contain a routing section matching the current lane map

#### Scenario: User edits preserved
- **WHEN** routing rules are re-synced in a project whose instructions contain user-written sections
- **THEN** only the routing section changes

### Requirement: Next-step suggestion
The next-step skill SHALL inspect the project's current state (active OpenSpec change and its artifact and task status) and SHALL suggest the next step with the owning skill from the lane map, with a one-line reason.

#### Scenario: Planning incomplete
- **WHEN** the active change has a proposal but no specs
- **THEN** the suggestion is to continue the change with the artifact workflow, naming the next artifact

#### Scenario: Tasks ready
- **WHEN** planning is complete and tasks are unchecked
- **THEN** the suggestion is the build phase owner (e.g. apply with the TDD skill)

#### Scenario: No active change
- **WHEN** the project has no active change
- **THEN** the suggestion is the brainstorm phase owner (e.g. `/opsx:explore`)

### Requirement: Tool updates trigger lane review
When a registry entry's installed version is newer than its reviewed version, the kit SHALL flag the entry for review. Owners and verdicts SHALL NOT change automatically.

#### Scenario: Updated tool flagged
- **WHEN** Superpowers updates past its reviewed version
- **THEN** the entry is flagged "needs review" in validation output, and its lane ownership is unchanged

### Requirement: Capture and PRD phases in the lane map
The registry SHALL define the phases `capture` and `prd`. The lane map SHALL show their owner and skill (the kit: `/kit:capture` and `/kit:prd`) by the same owner rules as every other phase.

#### Scenario: Lane map shows the new phases
- **WHEN** the lane map is generated from the registry
- **THEN** `capture` is owned by `kit` with `/kit:capture`, and `prd` by `kit` with `/kit:prd`

### Requirement: Next-step suggestion uses PRD status
Before falling back to the OpenSpec-based suggestion, the next-step skill SHALL check the project's PRDs and SHALL suggest, with a one-line reason:
- the `prd` phase owner, when notes exist but no PRD does, and there is no active change;
- the `artifacts` phase owner (e.g. `/opsx:propose`), naming the PRD, when a PRD is `Ready` and no change uses it;
- reviewing the plan, when a `Building` PRD's file changed after the commit its change recorded;
- marking the PRD `Shipped`, when the change named in a `Building` PRD is archived.

When none of these apply, the existing OpenSpec-based suggestion SHALL be unchanged. Invalid PRDs SHALL be reported, not guessed.

#### Scenario: Ready PRD without a change
- **WHEN** `prds/gift-cards.md` is `Ready` and no change names it
- **THEN** the suggestion is `/opsx:propose`, naming `gift-cards`

#### Scenario: PRD changed since planning
- **WHEN** a `Building` PRD has commits after the commit its change recorded
- **THEN** the suggestion says the PRD changed since planning and names the change to review

#### Scenario: Archived change
- **WHEN** the change named in a `Building` PRD is archived
- **THEN** the suggestion is to mark that PRD `Shipped`, and nothing is written

#### Scenario: Notes but no PRD
- **WHEN** the project has notes, no PRDs and no active change
- **THEN** the suggestion is `/kit:prd`

#### Scenario: No knowledge folder
- **WHEN** the project has no knowledge folder
- **THEN** the suggestion is the same as before this change

### Requirement: Ready PRDs picked newest-updated first
When several PRDs are Ready and no change uses them, the next-step suggestion SHALL name the most recently updated one, and SHALL list the others in the same newest-first order.

#### Scenario: Two Ready PRDs
- **WHEN** `prds/old.md` and `prds/new.md` are both Ready, and `new` was updated more recently
- **THEN** the suggestion names `new`, and lists `old` under the other Ready PRDs

### Requirement: Library docs rule in the routing block
The routing rules SHALL tell the agent to look up current library documentation with context7 through `npx` (no install, no sign-in) before writing code against a library API it isn't sure of for the project's installed version, and after a build, type or test error that comes from a library. The starter SHALL NOT require a context7 setup or sign-in.

#### Scenario: Rule present
- **WHEN** a project is bootstrapped
- **THEN** its routing section contains the library docs rule with the `npx -y ctx7@latest` commands

#### Scenario: No sign-in step
- **WHEN** the starter sets up any project
- **THEN** no context7 step appears under "Needs you"

### Requirement: Library-error hook
In a kit project, after a shell command that builds, type-checks or tests the project fails with an error that comes from a library (for example "is not exported", "has no exported member", "Cannot find module", or "is not a function" on an imported name), the kit SHALL add one line of context for the agent: look up the library's current docs with `npx -y ctx7@latest` before trying another fix. It SHALL add nothing when the command succeeds, or when the error doesn't match a library pattern. Outside kit projects, it SHALL do nothing.

#### Scenario: Library API mismatch
- **WHEN** `npm run build` exits non-zero with "'revalidateTag' is not exported from 'next/cache'"
- **THEN** the agent receives the docs-lookup hint naming `next`

#### Scenario: Own bug
- **WHEN** `npm test` fails with an assertion error in the project's own code
- **THEN** no hint is added
