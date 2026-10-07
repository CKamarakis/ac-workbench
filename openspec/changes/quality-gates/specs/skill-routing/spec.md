# Spec Delta

## ADDED Requirements

### Requirement: Library-error hook
In a kit project, after a shell command that builds, type-checks or tests the project fails with an error that comes from a library (for example "is not exported", "has no exported member", "Cannot find module", or "is not a function" on an imported name), the kit SHALL add one line of context for the agent: look up the library's current docs with `npx -y ctx7@latest` before trying another fix. It SHALL add nothing when the command succeeds, or when the error doesn't match a library pattern. Outside kit projects, it SHALL do nothing.

#### Scenario: Library API mismatch
- **WHEN** `npm run build` exits non-zero with "'revalidateTag' is not exported from 'next/cache'"
- **THEN** the agent receives the docs-lookup hint naming `next`

#### Scenario: Own bug
- **WHEN** `npm test` fails with an assertion error in the project's own code
- **THEN** no hint is added
