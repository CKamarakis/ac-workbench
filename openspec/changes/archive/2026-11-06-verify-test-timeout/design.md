# Design

## Context

`verify.mjs` runs each policy test through `defaultRun`, a `spawnSync` with `timeout: 600000`. When the timer kills the child, `spawnSync` returns `status: null` (with `error.code === 'ETIMEDOUT'` and a `signal`); `defaultRun` maps that to `status ?? 1`, so `runVerify` reports `fail (exit 1)`. The test loop takes an injectable `run`, which the unit tests already use.

The agent runs `verify.mjs run` through Claude Code's shell tool, whose foreground limit is 10 minutes (tool description); longer runs need the tool's background mode.

## Goals / Non-Goals

**Goals:** 15-minute limit in one place; a time-out reported as its own result with a fix the user can act on; the agent's shell call doesn't cut the run short.

**Non-Goals:** a per-project or per-script limit; making verify faster or parallel (M14 T4); changing which results are HARD.

## Decisions

- **D1 One constant.** `const TEST_TIMEOUT_MINUTES = 15` at the top of `verify.mjs`; `defaultRun` uses it. Alternative: a project setting (rejected by the user for now: more to build; the fixed value covers the known case).
- **D2 Detect the time-out from the process, not the status.** `defaultRun` returns `timedOut: true` when `r.error?.code === 'ETIMEDOUT'`. Alternative: treat any `status === null` as a time-out (rejected: a crash by signal would be mislabelled).
- **D3 Report text.** Tests table: `ran out after 15 min`. Item: `npm run <script> ran out after 15 min (not a test failure)`, detail: `To raise the limit, edit TEST_TIMEOUT_MINUTES in <path of this verify.mjs> (a kit update resets it).` plus the end of the output. The path comes from `import.meta.url`, so it points at the installed copy the user actually runs, not this repo; the home folder is shown as `~` (forward slashes), because projects commit `verify.md` and the full path would carry the username (security finding S1 at verify, user chose `~`).
- **D4 Level unchanged.** Required -> HARD, optional -> ADVISORY, same item id `T:<script>`, so overrides and re-runs work as today.
- **D5 Background run in the skill.** SKILL.md step 2 says: run it in the background (Claude Code: `run_in_background`) because tests can take up to 15 minutes and the shell tool stops foreground commands at 10; wait for the completion notice, then read the report. Alternative: raise `BASH_MAX_TIMEOUT_MS` (rejected: a user setting, not the kit's to change; unverified).

## Risks / Trade-offs

- [Edit in the installed copy is lost on a kit update] -> the message says so; a per-project setting is the follow-up if it bites.
- [Background run in other agents without that mode] -> the skill says "if your shell tool has a time limit below 15 minutes"; the script itself is unchanged.
- [A slower suite now costs 5 more minutes before verify gives up] -> accepted; optional suites stay advisory.
