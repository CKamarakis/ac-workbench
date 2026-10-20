# Trial: Context7 A/B (M6 usage review)

Date: 2026-10-12. Claude Code CLI headless (`claude -p`, default model Opus 5.5), Windows 11. Throwaway project in the session scratchpad.

## Question

The kit's Library docs rule (routing block) and library-error hook have been on trial since 2026-10-07. In 16 real Acme sessions, the agent ran Context7 **zero** times. The hook never fired: no library error happened. So: does an agent follow the rule, and does it help?

## Setup

- One base project with packages that had a major release near or after the model's training cutoff (June 2026): `ai` 7.0.137 + `@ai-sdk/anthropic` 4 (major 2026-06-25), `react-router` 8.4.0 (2026-06-17), `vitest` 5.0.4 (2026-09-03), plus `zod` 4, React 19.3, TypeScript 5.9.
- **Arm A:** `CLAUDE.md` with the kit's Library docs rule, word for word, and `.claude/kit.json`, so the kit's library-error hook is active. **Arm B:** neither.
- Same prompts in both arms. They never mention docs. WebFetch and WebSearch disabled in both arms.
- Graded by us after each run: `tsc --noEmit`, `vitest run --reporter=verbose` (vitest task), and content checks.
- Tasks: an `ai` tool call with a 3-step limit; a react-router data route with typed loader data; vitest with two projects (node and jsdom); a planted wrong import (`maxSteps` from `ai`) with "typecheck fails, fix it".

## Results

All 8 runs passed (type-check, content and, for vitest, both projects ran).

| Task | A: ctx7 calls | A: type-check runs | B: type-check runs | Output tokens A / B | Cache read A / B | Time A / B |
|---|---|---|---|---|---|---|
| ai v7 tool + steps | 8 | 5 | 2 | 3.0k / 1.7k | 252k / 140k | 57s / 24s |
| react-router v8 loader | 1 | 2 | 5 | 2.7k / 3.2k | 228k / 357k | 43s / 41s |
| vitest 5 projects | 2 | 7 | 9 | 2.2k / 3.2k | 223k / 248k | 48s / 48s |
| planted wrong import | 2 | 3 | 2 | 1.4k / 2.0k | 183k / 152k | 33s / 27s |
| **Total** | **13** | **17** | **18** | **9.3k / 10.2k** | **885k / 896k** | **181s / 140s** |

- **The rule is followed in a clean context:** 4 of 4 arm-A runs called Context7, one saying "per project rules, look up docs first". It found the v7 rename `stepCountIs` → `isStepCount`.
- **No measurable benefit here:** arm B also passed 4 of 4, at about the same token cost. Without the rule, the agent read the installed type definitions in `node_modules` (and once loaded the `claude-api` skill). For installed, typed packages, the `.d.ts` files are already the ground truth.
- **The hook never fired, in any run:** the agent chains commands (`npm run typecheck 2>&1; cat …`), so the Bash call exits 0 even when the type-check fails, and a PostToolUseFailure hook doesn't trigger. In arm B the agent also used the PowerShell tool, which the hook's `Bash` matcher doesn't cover.

## Limits

- 4 tasks per arm, one run each: thin evidence.
- Every task had typed, installed packages. Context7 may matter more where types don't tell the answer: config semantics, runtime behavior, untyped libraries, or a package before it's installed. Not tested.
- Real sessions are long. The rule was never followed in 16 real sessions, but no session showed a need for it either. Whether a long context makes the agent skip the rule is **unverified**.

## Verdict

Pending the user's decision (M6). See `usage-review-1.md`.
