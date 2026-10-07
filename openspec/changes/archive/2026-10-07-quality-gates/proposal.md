# Proposal

## Why

The kit plans and builds, but nothing checks the result before a change is closed:
- `verify` means "openspec validate + the change's tests", without saying which tests;
- the `review` phase has no owner;
- the agent picks OpenSpec or SuperSpec by gut feeling.

M3's goal (`docs/roadmap.md`): a project's verify step fails on missing tests or a security finding, at a level that fits the project, without over-engineering. Decisions from the 2026-10-07 explore:
- **Block only on hard failures:** a failing test, a secret, a high-severity security finding. Everything else is advisory.
- **One `verify` step is required before `/opsx:archive`.** Secrets stay in pre-commit. A test run on pre-push is opt-in per project.
- **Earlier inputs:**
  - a flow judge (OpenSpec vs SuperSpec, from a risk checklist);
  - a library-error hook (the backstop for the context7 docs rule);
  - removing the licensed-material `.gitignore` patterns, since that material is no longer used.

## What Changes

- **New `/kit:verify`:**
  - it runs the project's tests (as its type's test policy defines) and an advisory "changed files without tests" check;
  - the agent runs `/security-review` and `/code-review` on the change and records their findings;
  - it writes a short report, `verify.md`, in the change folder.
  - Hard failures (a failing test, a missing test command where the policy requires one, a high-severity security finding) block until fixed, or until the user overrides them with a stated reason, which is recorded.
- **Archive gate:** a kit hook stops `openspec archive` when the change has no passing `verify.md`, or one with an unresolved hard failure. It acts only in kit projects.
- **Test policy per project type,** in the registry: `web-ui` requires a test command and runs unit tests, plus integration tests if the project has them; `none` runs tests only if a test command exists. Browser checks are advisory, for UI flows the change touches.
- **Review owners:** the built-in `/code-review` owns `review`; `/kit:verify` owns `verify`.
- **Flow judge:**
  - a risk checklist (payments, auth, personal data, data migration, hard to undo, wide reach, vague spec) checked when a change is proposed;
  - it recommends OpenSpec or SuperSpec with the reasons, and the user decides;
  - an eval set of labelled examples tests it.
- **Library-error hook:** after a build, type or test command fails with a library error, the agent is told to look up current docs (`npx ctx7`) before retrying.
- **Opt-in pre-push:** `/kit:verify` can install a pre-push hook that runs the project's fast tests, only when the user asks.
- **BREAKING (kit behaviour):** the kit no longer writes the licensed-material patterns into project `.gitignore` files, and this repo drops them. The kit block keeps `.claude/settings.local.json`.
- Kit 0.3.0 → 0.4.0.

```
 /opsx:propose --> [flow judge] OpenSpec or SuperSpec? (reasons; you decide)
 /opsx:apply   --> [library-error hook] "look up docs" when a library call fails
 /kit:verify   --> tests (policy by type) + /security-review + /code-review
                   --> verify.md: HARD failures | advisory items | overrides (reason)
 /opsx:archive --> [archive gate hook] blocked unless verify.md passes or is overridden
 git commit    --> gitleaks (unchanged)        git push --> tests (opt-in per project)
```

Out of scope:
- the SuperSpec A/B re-test (it waits for a real risky change);
- CI;
- a coverage tool (`@vitest/coverage-*` is added only on demand);
- the context7 limit message.

## Capabilities

### New Capabilities
- `quality-gates`: `/kit:verify`, the report, hard vs advisory results, overrides, the archive gate, test policy per project type, the opt-in pre-push, and review owners.
- `flow-recommendation`: the risk checklist and the OpenSpec vs SuperSpec recommendation at proposal time.

### Modified Capabilities
- `project-starter`: the Tier 2 basics no longer include the licensed-material `.gitignore` patterns (MODIFIED "Bootstrap installs Tier 2 basics").
- `skill-routing`: the library-error hook backs the "Library docs" rule (ADDED).
- `toolkit-registry`: the registry defines a test policy per project type (ADDED).

## Impact

- **New:**
  - `plugins/kit/skills/verify/`;
  - scripts `verify.mjs`, `judge.mjs`, and hook scripts under `plugins/kit/hooks/` (plugin-level hooks gated on `.claude/kit.json`);
  - `evals/verify/`, `evals/judge/`.
- **Changed:**
  - `toolkit.yaml` (project-type policies, review and verify owners);
  - the routing block (verify before archive, flow judge at propose);
  - `/kit:next` (verify before close);
  - the gitignore template and this repo's `.gitignore`;
  - tests and evals for start, next and registry.
- **Unverified:** plugin-level hooks with `${CLAUDE_PLUGIN_ROOT}` on Windows. A task checks this before relying on it, with a per-project `.claude/settings.json` fallback.
- **Test bed:** the `Projects/temp/Toughbubble` copy (vitest unit and integration tests, eslint, no coverage tool).
