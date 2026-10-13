# kit-cross-platform: build evidence

## 1.1 OpenSpec isolation (2026-10-13, Windows 11, OpenSpec 1.13.2)

- Setup: a throwaway folder with `HOME`, `USERPROFILE`, `APPDATA`, `LOCALAPPDATA` and `XDG_CONFIG_HOME` pointed inside it; then `openspec init --tools claude`, `openspec new change x`, `openspec archive x -y` (all exit 0).
- Written inside the throwaway home: one file, `.config/openspec/config.json`, holding `telemetry.noticeSeen` and an `anonymousId`. So OpenSpec reads its global config from `XDG_CONFIG_HOME` when set, and does write there.
- Written in the real locations (`~/.claude`, `~/.config`, `%APPDATA%`, `%LOCALAPPDATA%\openspec`, newer than a marker file): nothing.
- Conclusion: without the redirect, the smoke test would write to the real OpenSpec config (`%APPDATA%\openspec\config.json` here). With it, nothing outside the throwaway folders changes.
- Telemetry: OpenSpec sends anonymous usage data unless turned off; its README documents `OPENSPEC_TELEMETRY=0` or `DO_NOT_TRACK=1` ("env overrides config", `README.md:254` of the installed package). The smoke test sets both. Whether anything is sent before the variable is read is unverified.
