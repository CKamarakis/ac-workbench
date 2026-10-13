# Proposal

## Why

The kit installs and finds its tools on Windows only: all 15 `install:` entries in `toolkit.yaml` are `win32`, so on a Mac `/kit:setup` reports "no install command for darwin" for each tool (`setup.mjs:87`), and `locate.mjs` knows only WinGet and Program Files folders. v1 needs a Mac tester to install it from the README (M14), and the user wants a reliable way to test the whole kit from here before anyone else touches it ("no basic bugs"). GitHub CI is out for now (user, 2026-10-13: no extra costs), so the test must run on this machine with one command.

## What Changes

- **Install commands per platform.** Registry entries gain `darwin` and `linux` install commands, or one `all` command when the same command works everywhere (npm, npx, `claude`). macOS and Linux use Homebrew (`brew install gh jq gitleaks git`; formula names verified on formulae.brew.sh, 2026-10-13). When Homebrew itself is missing, setup says so with the brew.sh link and does not try to install it.
- **Validation** requires an install command for every supported platform (Windows, macOS, Linux) on adopted and trial entries, through platform keys or `all`.
- **Tool finder on macOS and Linux.** `locate.mjs` also looks in `/opt/homebrew/bin`, `/usr/local/bin`, `/home/linuxbrew/.linuxbrew/bin` and `~/.local/bin`. The npm global folder already works on every platform.
- **`npm run smoke`** (new, this repo only): runs the whole kit without AI in a throwaway project, using the real OpenSpec CLI installed here, and checks every step's exit code and output. Run on request only. On a pass, it records the commit in a gitignored file.
- **`npm run smoke:check`** (new): lists kit files changed since the last passing smoke run and says whether a run is recommended. Required before a release (the M13 tagging step will enforce it); a line in this repo's `CLAUDE.md` tells the agent to run it when verifying a kit change.
- **Install check** (new, part of `npm test`): validates the marketplace manifest, `plugin.json`, `hooks.json` and every skill's frontmatter, so a broken manifest never reaches a user.
- Kit version 0.8.0.

```
 toolkit.yaml  install: { win32, darwin, linux | all }
      |
      v
 /kit:setup  --> installFor(entry, platform) --> brew / winget / npm
      |                                            |
      v                                            v
 locate.mjs  <-- PATH, npm global, known folders (WinGet | Homebrew, ~/.local/bin)

 this repo only:
   npm test          unit tests + install check (manifests, hooks, skill frontmatter)
   npm run smoke     temp project: start -> note -> PRD -> change -> judge -> ready
                     -> next -> verify -> archive gate -> archive -> docs   (no AI)
   npm run smoke:check   kit files changed since last pass -> "run recommended" / "not needed"
```

Not in this change: the browser-check recommendation and fixes 3a–3g (`kit-followups`), GitHub CI (later), README for strangers (M13).

## Capabilities

### New Capabilities
- `kit-self-test`: the smoke test, the smoke-test judge and the install check that test the kit itself in this repo.

### Modified Capabilities
- `toolkit-registry`: "Entries declare how to check and install" requires install instructions for Windows, macOS and Linux (platform keys or `all`).
- `tool-setup`: setup installs with the current platform's command and reports a missing Homebrew; tools outside PATH are found on macOS and Linux too.

## Impact

- Code: `toolkit.yaml` (15 install blocks), `tools/validate-registry.mjs`, `plugins/kit/scripts/setup.mjs`, `start-plan.mjs`, `prereqs.mjs` (one shared install lookup), `locate.mjs`; new `tools/smoke.mjs`, `tools/smoke-check.mjs`, smoke fixtures, an install-check test; `package.json` scripts; `.gitignore`; `CLAUDE.md`; `plugin.json` 0.8.0; `plugins/kit/skills/setup/SKILL.md` wording (no longer Windows-only).
- Windows behavior is unchanged.
- No new dependencies, no services, no cost.
- Unverified until the Mac tester runs it (M14): Homebrew installs on a real Mac; Claude Code's native installer path `~/.local/bin/claude` on macOS and Linux; whether `openspec init` writes outside the project (checked in task 1 on Windows); Linux is not tested in v1.
