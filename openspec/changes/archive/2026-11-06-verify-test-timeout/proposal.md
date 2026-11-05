# Proposal

## Why

`/kit:verify` stops every test command after a fixed 10 minutes, then reports it as a plain failure ("failed (exit 1)"). On Acme, `test:integration` takes about 13.5 minutes, so every verify report shows it as failed although no test failed. The user can't tell a time-out from a broken test, or what to do about it.

## What Changes

- The time limit per test command goes from 10 to **15 minutes**, set in one named constant at the top of `verify.mjs`.
- A command stopped by the limit is reported as **ran out of time**, not failed: the report says "ran out after 15 min (not a test failure)" and names the file to edit to raise the limit (the full path of the `verify.mjs` that ran), noting that a kit update resets it.
- The level stays as today: a required command that runs out is still HARD (it didn't pass); an optional one stays ADVISORY.
- The verify skill tells the agent to run `verify.mjs run` in the background: Claude Code's shell tool stops a foreground command at 10 minutes (the tool's own limit, as stated in its tool description; a documented override `BASH_MAX_TIMEOUT_MS` exists: unverified), so a 15-minute test would otherwise be cut off by the tool before the script's own limit.

```
npm run <script>
   |
   +-- exits 0 ................ pass
   +-- exits non-zero ......... fail (exit N)            HARD if required, else ADVISORY
   +-- stopped at 15 min ...... ran out after 15 min      HARD if required, else ADVISORY
                                "not a test failure; to raise the limit edit
                                 TEST_TIMEOUT_MINUTES in <path>/verify.mjs
                                 (a kit update resets it)"
```

Not in this change: a per-project setting for the limit (considered; the user chose the simpler fixed value with a message pointing at the file), and the wider M14 T4 spike on why verify is slow.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `quality-gates`: adds a requirement for the test command time limit and how a time-out is reported.

## Impact

- `plugins/kit/scripts/verify.mjs` (run helper, test loop, report text).
- `plugins/kit/skills/verify/SKILL.md` (run step: background run, time-out wording).
- `tests/kit/verify.test.mjs` (time-out cases).
- Kit version bump (1.0.0-rc.4 -> rc.5); smoke check.
- Roadmap: off Now (M17); a drift entry records it, in the same commit as this change.
