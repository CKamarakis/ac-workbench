# Design

## Context

See proposal.md (Why); the specs carry the requirements.

What exists:
- **`verify` phase:** owned by OpenSpec as "validate + the change's tests", with nothing behind it. **`review`:** unowned (lane map).
- **Scripts:** the kit's scripts are zero-dependency Node (`plugins/kit/scripts/`). `/kit:start` writes per-project files through a plan that's applied only after a yes.
- **Hooks:** Claude Code hooks are checked against the docs (2026-10-07).
  - A `PreToolUse` hook on `Bash` can deny a call, with a reason the agent sees.
  - A `PostToolUse` hook sees `tool_input.command` and `tool_response` (stdout, stderr, exit code), and can add `additionalContext`.
  - On Windows, hooks run in Git Bash by default.
- **Test bed:** the Toughbubble copy has vitest (`test` = unit, `test:integration`) and eslint, with no coverage package.

## Goals / Non-Goals

**Goals:**
- Every gate decision is a script result that evals can check. The agent's only judgement work is running `/security-review` and `/code-review` and passing their findings to the script.
- Hooks are inert outside kit projects and cheap inside them.

**Non-Goals:**
- CI, coverage percentages, lint as a gate (lint stays the project's own business for now).
- Changing OpenSpec's own skills, which `openspec update` regenerates.
- The SuperSpec A/B re-test.

## Decisions

**D1. `verify.mjs` owns the report.**
- Subcommands:
  - `run --change <name>`: runs the policy's test commands (`npm run <script>`), does the "changed files without tests" check, writes `verify.md`;
  - `finding --change <name> --source security|code --severity high|medium|low --text "…"`: appends one finding; high-severity security findings are HARD;
  - `override --change <name> --item <id> --reason "…"`: records an override, user-requested only;
  - `status --change <name> [--json]`: prints the result for the gate and for `/kit:next`.
- `verify.md` is Markdown with a small fixed header (`result:`, `date:`, `commit:`) followed by tables, so people can read it and the gate can parse it.
- Re-running `run` keeps recorded findings and overrides unless their items are gone.
- Why: the gate and `/kit:next` need a machine-readable result, and a person needs a readable one. A single file does both, and it's archived with the change.

**D2. The "changed files without tests" check uses git and file names, not coverage.**
- Base: the merge base with `main` (or the first commit that touched the change folder).
- Source files: `src/**` and `app/**` with `.ts`/`.tsx`/`.js`/`.jsx`, excluding tests, `*.d.ts` and config files.
- A file is covered when `<name>.test.*` or `<name>.spec.*` exists anywhere, or any test file changed in the same diff.
- Advisory only.

**D3. The hooks ship in the kit plugin, not per project.**
- `plugins/kit/hooks/hooks.json` registers a `PreToolUse` Bash hook (`archive-gate.mjs`) and a `PostToolUse` Bash hook (`library-hint.mjs`), each run as `node "${CLAUDE_PLUGIN_ROOT}/hooks/<file>.mjs"`.
- Each script exits immediately unless `${CLAUDE_PROJECT_DIR}/.claude/kit.json` exists.
- Why:
  - no files written into projects;
  - versioned with the kit;
  - "tools per project" holds, because the hooks do nothing outside kit projects.
- Alternative: copy them into each project's `.claude/settings.json` through `/kit:start`. That's the **fallback** if plugin hooks or `${CLAUDE_PLUGIN_ROOT}` don't work on Windows (**unverified**, task 1.2 checks it).

**D4. The archive gate matches commands, not skills.**
- It denies Bash commands matching `openspec(\.cmd)? archive <name>` when `verify.mjs status` says `missing` or `fail`. The reason given is "run /kit:verify first", or "verify failed: <items>; fix or ask the user to override".
- Why: `/opsx:archive` ends up calling the CLI, so matching the command catches every route.
- Risk: a renamed or aliased CLI call slips through. That's acceptable, because the gate is a guard rail, not security.

**D5. The library hint is a pattern match on failed build, type or test commands.**
- It fires when the command matches `npm (run )?(build|test)|tsc|vitest|next build|jest`, `exit_code != 0`, and stderr or stdout match the library patterns from the spec.
- It extracts the module name from `from '<pkg>'` or `module '<pkg>'` when present.
- Output: `{hookSpecificOutput: {hookEventName: <event>, additionalContext: "…npx -y ctx7@latest library <pkg> …"}}`.
- **Correction from the live check (2026-10-07):** a failed Bash command fires `PostToolUseFailure`, whose input carries `error: "Exit code N\n<output>"` instead of `tool_response`. The hook is registered on `PostToolUseFailure` and parses `error`, and still accepts the documented `PostToolUse` shape. Evidence: `evals/trials/quality-gates-hooks.md`.

**D6. Test policy in the registry:**
```yaml
project_types:
  web-ui: { tests: [{ script: test, required: true }, { script: "test:integration", required: false }], missing_required: hard, advisory: [browser-check-for-ui-flows] }
  none:   { tests: [{ script: test, required: false }], missing_required: advisory, advisory: [] }
```
- The validator checks that the type names exist (from tool tiers, plus `none`) and that each policy has at least one command.
- Projects without a type use `none`.

**D7. The flow judge is a deterministic keyword scorer** (`judge.mjs`).
- A word list per checklist item, matched case-insensitively on whole words.
- "Wide reach" = five or more distinct areas named, from a short list (UI, API, database, auth, payments, email, jobs, …).
- "Vague" = an "Open questions" section with items, or the words "unknown" or "TBD".
- The rule comes from the spec. The routing block tells the agent to run it at `/opsx:propose` and show the result.
- Why: predictable, testable with labelled examples, and free.
- Alternative: let the model judge. Rejected, since it can't be tested.

**D8. Owners:**
- the `kit` entry claims `verify` with `/kit:verify`;
- OpenSpec keeps `verify` only as an alternative (`overlaps: [kit]`), so the kit wins;
- a new registry entry, `claude-code-builtins` (adopted, machine scope, no install, check `claude --version`), claims `review` with `/code-review`.

**D9. Removing the licensed-material patterns:**
- remove them from `gitignore-block.txt` and this repo's `.gitignore`;
- keep `.claude/settings.local.json` in the block;
- update the template test and the start eval (both currently assert them).

## Risks / Trade-offs

- [**Plugin hooks or `${CLAUDE_PLUGIN_ROOT}` misbehave on Windows**] → Task 1.2 trials it first. The fallback is per-project hooks written by `/kit:start` as a `CHANGE` to `.claude/settings.json`.
- [**The gate blocks a legitimate archive**] → The user can override in `verify.md` with a reason. The hook also names the fix command.
- [**Keyword judge misses or over-flags**] → It's a recommendation only, the user decides, and the labelled eval set grows when it's wrong.
- [**Test commands are slow**] → `run` streams nothing and has a generous timeout (10 min, configurable per policy later). Integration tests are optional by policy.
- [**`/security-review` severity labels vary**] → The skill maps the review's own wording onto high, medium or low when it records a finding. Only `high` blocks.

## Migration Plan

- Kit 0.3.0 → 0.4.0. A `/kit:start` re-sync shows the `.gitignore` block shrinking (a `CHANGE`) and the new routing lines.
- Hooks are active as soon as the plugin updates, and only in kit projects.
- Rollback: disable the kit plugin's hooks by reverting the commit. `verify.md` files stay as plain records.
