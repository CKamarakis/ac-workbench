# Tasks

## 1. Registry, version and hook trial

- [x] 1.1 Registry (design D6, D8):
  - a `project_types` section with the `web-ui` and `none` test policies;
  - validator checks (known type, at least one command);
  - documentation in `docs/registry.md`;
  - the `kit` entry claims `verify` with `/kit:verify`, and OpenSpec keeps `verify` as an alternative;
  - a new `claude-code-builtins` entry claims `review` with `/code-review`.

  Verify with `tools/validate-registry.test.mjs` cases (an unknown type and an empty policy are rejected), and that `npm run registry` shows `verify  kit: /kit:verify` and `review  claude-code-builtins: /code-review`
- [x] 1.2 Hook trial before building on it (design D3 risk):
  - add a minimal `plugins/kit/hooks/hooks.json` with a `PreToolUse` Bash hook that runs `node "${CLAUDE_PLUGIN_ROOT}/hooks/probe.mjs"`;
  - in a throwaway folder with `.claude/kit.json`, check that a session sees it deny a marked command;
  - check that it does nothing in a folder without `kit.json`.

  Record the result in `evals/trials/quality-gates-hooks.md`. If it fails, switch D3 to the per-project fallback and update design.md before group 3
- [x] 1.3 Bump the kit to `0.4.0`. Verify with `ping.mjs`

## 2. `verify.mjs` and the report

- [x] 2.1 `run`: read the project type from the stamp, run the policy's scripts with `npm run`, apply the missing-required rule, write `verify.md` (fixed header plus tables), and keep recorded findings and overrides on re-run (design D1). Verify with `tests/kit/verify.test.mjs`, using a temp project with fake scripts: pass; a failing required test gives `fail` with the command and its output tail; a missing required script for `web-ui` is HARD; for `none` it's advisory
- [x] 2.2 The "changed files without tests" check (design D2). Verify with tests on a temp git repo: a new `src/lib/price.ts` without a test is listed; with `price.test.ts` it isn't; a changed test file in the diff clears it; config and `.d.ts` files are ignored
- [x] 2.3 `finding`, `override` and `status`. Verify with tests:
  - a high security finding makes the result `fail`, and a medium one stays advisory;
  - `override` needs `--reason` and turns `fail` into `overridden`, recording the reason and date;
  - `status --json` returns `missing`, `pass`, `fail` or `overridden`
- [x] 2.4 Opt-in pre-push: `verify.mjs prepush --install` writes `.git/hooks/pre-push`, running the required test script, and refuses to overwrite an existing hook. Verify with tests: a fresh install works, an existing hook is untouched, and the message names it

## 3. Hooks: archive gate and library hint

- [x] 3.1 `plugins/kit/hooks/archive-gate.mjs` (design D4): denies `openspec archive <name>` when `status` is `missing` or `fail`, with the reason; allows `pass` and `overridden`; does nothing without `.claude/kit.json`. Verify with `tests/kit/hooks.test.mjs`, feeding JSON events on stdin for each spec scenario
- [x] 3.2 `plugins/kit/hooks/library-hint.mjs` (design D5): `additionalContext` for library errors on failed build or test commands, naming the package when it can be found; nothing on success, on project-code errors, or outside kit projects. Verify with tests for both spec scenarios, plus a `Cannot find module 'x'` case
- [x] 3.3 Register both in `plugins/kit/hooks/hooks.json` (replacing the 1.2 probe). Verify with a live check in the throwaway folder from 1.2: the gate blocks an archive without a report, and a failing `npm run build` that mentions a library gets the hint. Record the result in `evals/trials/quality-gates-hooks.md`

## 4. Flow judge

- [x] 4.1 `plugins/kit/scripts/judge.mjs` (design D7): takes text or a file (PRD or proposal), outputs the matched items with their words and the recommendation with its reasons (`--json` too). Verify with `tests/kit/judge.test.mjs` for the spec scenarios
- [x] 4.2 `evals/judge/cases.yaml`: at least 10 labelled descriptions (5 per flow, including tricky ones such as "update the payment page copy"). Verify that `npm run evals` passes all of them; adjust the word lists, not the labels, when one fails

## 5. `/kit:verify` skill, routing and `/kit:next`

- [x] 5.1 `plugins/kit/skills/verify/SKILL.md`:
  - run `verify.mjs run`;
  - run `/security-review` and `/code-review` on the change's files, and record each finding with `finding` (mapping the severity);
  - show the report: HARD first, then advisory;
  - override only when the user asks, with their reason;
  - offer pre-push only when asked.

  Verify with `evals/verify/cases.yaml`: deterministic runs of the script, plus content checks for the "never override on your own" and "HARD first" rules
- [x] 5.2 Routing block: "run `/kit:verify` before `/opsx:archive`" and "at `/opsx:propose`, run the flow judge and show its recommendation; the user decides". Verify with `tests/kit/lanes.test.mjs`
- [x] 5.3 `next.mjs`: when all tasks are done and `verify.mjs status` isn't `pass` or `overridden`, suggest `/kit:verify`, then `/opsx:archive`. Verify with `tests/kit/next.test.mjs` and an `evals/next` case

## 6. Licensed-material patterns removed

- [x] 6.1 Remove the patterns from `plugins/kit/templates/gitignore-block.txt` and this repo's `.gitignore`, keeping `.claude/settings.local.json` (design D9). Update `tests/kit/templates.test.mjs` and the start eval to check that the settings file is ignored. Verify with `npm test` and `npm run evals`, plus a plan on the Toughbubble copy that shows the block shrinking as a `CHANGE`

## 7. Integration and docs

- [x] 7.1 Live trial on the `Projects/temp/Toughbubble` copy:
  - a small change through `/opsx:propose` (the judge says OpenSpec);
  - `/opsx:apply`;
  - `/kit:verify`: the real `npm test` runs, plus `/security-review` and `/code-review`;
  - try `/opsx:archive` without a passing report (blocked), then with one (allowed).

  Record tokens and time in `evals/trials/quality-gates-live.md`
- [x] 7.2 Run `npm test`, `npm run evals` and `npm run registry`, all green. Then update `README.md` (`/kit:verify`, the gates), `docs/roadmap.md` (M3 status, north-star stages 8–10) and `docs/project-context.md`, in the same commit as the task checkoffs
