# kit-cross-platform: build evidence

## 1.1 OpenSpec isolation (2026-10-13, Windows 11, OpenSpec 1.13.2)

- Setup: a throwaway folder with `HOME`, `USERPROFILE`, `APPDATA`, `LOCALAPPDATA` and `XDG_CONFIG_HOME` pointed inside it; then `openspec init --tools claude`, `openspec new change x`, `openspec archive x -y` (all exit 0).
- Written inside the throwaway home: one file, `.config/openspec/config.json`, holding `telemetry.noticeSeen` and an `anonymousId`. So OpenSpec reads its global config from `XDG_CONFIG_HOME` when set, and does write there.
- Written in the real locations (`~/.claude`, `~/.config`, `%APPDATA%`, `%LOCALAPPDATA%\openspec`, newer than a marker file): nothing.
- Conclusion: without the redirect, the smoke test would write to the real OpenSpec config (`%APPDATA%\openspec\config.json` here). With it, nothing outside the throwaway folders changes.
- Telemetry: OpenSpec sends anonymous usage data unless turned off; its README documents `OPENSPEC_TELEMETRY=0` or `DO_NOT_TRACK=1` ("env overrides config", `README.md:254` of the installed package). The smoke test sets both. Whether anything is sent before the variable is read is unverified.

## 4 Smoke test (2026-10-13, Windows 11, OpenSpec 1.13.2)

- `npm run smoke`: 33 steps passed on the first full run.
- Found while building: redirecting `APPDATA` hid the npm global folder, so `/kit:start` couldn't run `openspec init` ("'openspec' is not recognized"). `APPDATA` now stays; `HOME`, `USERPROFILE` and `XDG_CONFIG_HOME` are redirected. The real `%APPDATA%\openspec\config.json` kept its old modified time after the runs.
- Broken on purpose (step 13 expected `/kit:BROKEN`): the run stopped at step 13 of 33, printed the command, the expectation and the real output, exited 1, kept the project folder, and wrote no pass record.
- `npm test` (316 tests, ~15 s) does not run the smoke test.
- Observation for later (not a smoke failure): the docs page counts open decisions only for **active** changes (spec living-docs "Open decisions on the page"). A decision left for Later disappears from the page once its change is archived; the smoke test builds the page before and after the archive, and the count goes 1 → 0.

## 7.1 Full run (2026-10-13, Windows 11)

- `npm test`: 326 pass, 0 fail (was 302 before this change).
- `npm run registry:check`: passes; the `win32` install commands in `plugins/kit/data/toolkit.json` are byte-identical to before (diffed).
- `npm run evals`: no script case failed; judgment cases unscored, as before (M13).
- `npm run smoke`: 33 steps pass in about 20 s. `npm run smoke:check` right after: "not needed", exit 0.
- Tokens: not measured (no per-task counter in this session).
- Found while building: Emil's install `-s *` would be expanded by a macOS/Linux shell; the POSIX command quotes it (`-s '*'`). Windows keeps the original.
- Left for the Mac tester (M14), unverified here: Homebrew installs on a real Mac; Claude Code's native installer path `~/.local/bin/claude` on macOS and Linux; `/kit:setup` with and without Homebrew; the smoke test on macOS.
- Noticed, not changed (pre-existing; for `kit-followups`): two registry entries have prose instead of a command as their install (`claude-code-builtins`: "nothing to install - part of Claude Code"; `context7`: "nothing to install - ..."). If their check ever fails, setup would try to run that text as a command.
