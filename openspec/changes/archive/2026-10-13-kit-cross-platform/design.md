# Design

## Context

- Three scripts read install commands: `setup.mjs:63` (`e.install?.[deps.platform]`), `start-plan.mjs:95` (project tools without a `plugin` field) and `prereqs.mjs:31` (hints). `tools/validate-registry.mjs:136` requires `install.win32`.
- `locate.mjs` already handles the PATH separator, extensions and the npm global folder (`<prefix>/bin`) on every platform; only its "known folders" step returns null off Windows (`locate.mjs:76`).
- Of the 15 install blocks, the npm, npx and `claude` ones are already the same on every platform; only git, gh, jq and gitleaks use WinGet, and `superspec` is a manual instruction.
- `/kit:start` with type `none` installs no tools (dry run 2026-10-13: git init, files, `openspec init`, the stamp), so the smoke test can use the real registry without network installs.
- Hook tests already feed the archive gate a JSON event (`tests/kit/hooks.test.mjs:23,51`); the gate reads the project from `CLAUDE_PROJECT_DIR`, then the event's `cwd`.

## Goals / Non-Goals

**Goals:**
- One lookup for "which install command on this platform", used by all three scripts.
- The smoke test drives the kit only through its command-line scripts and hook, as the skills do, so it tests what users run.
- Windows behavior unchanged.

**Non-Goals:**
- Installing Homebrew, editing shell profiles or PATH.
- Testing on a real Mac or Linux machine (M14, the Mac tester).
- Testing skill judgment (the evals do that) or `claude plugin install` (it needs a login).

## Decisions

**D1. `all` key plus platform keys.** `install: { all: "npm install -g @fission-ai/openspec" }` for commands that are the same everywhere; `win32` / `darwin` / `linux` keys where they differ; a platform key wins over `all`. A shared `installFor(entry, platform)` in `setup.mjs` is used by `start-plan.mjs` and `prereqs.mjs`.
*Alternative:* repeat the same command under three keys. Rejected: 11 of 15 entries would triple, and copies drift.
Commands with shell wildcards differ per shell: Emil's `-s *` stays as is under `win32` (cmd doesn't expand it) and is quoted `-s '*'` under `all` for macOS and Linux, where the shell would expand it into file names. Found while building.

**D2. Homebrew on macOS and Linux.** `brew install gh`, `jq`, `gitleaks`, `git`. All four formulas are in homebrew/core with bottles for Apple Silicon, Intel macOS (jq, gitleaks), x86_64 Linux and arm64 Linux (formulae.brew.sh API, checked 2026-10-13).
*Alternative for Linux:* apt/dnf per distro. Rejected for v1: gh needs its own apt repository, gitleaks isn't in every distro's packages, and per-distro commands can't be tested here. Homebrew gives one tested command set; Linux users without it get the brew.sh hint (spec: tool-setup). Proposed by the agent, confirmed by the user in `/kit:ready` (2026-10-13); revisit if a Linux user asks.

**D3. Homebrew detection.** Before running a command that starts with `brew `, setup locates `brew` (PATH, then the three Homebrew folders). Not found → the tool fails with the brew.sh hint, without running anything. No registry entry for Homebrew: it's a prerequisite of the platform, not a kit tool.

**D4. Known folders off Windows.** For `darwin` and `linux`, `locate` checks `/opt/homebrew/bin/<name>`, `/usr/local/bin/<name>`, `/home/linuxbrew/.linuxbrew/bin/<name>` and `~/.local/bin/<name>` (Claude Code's native installer, unverified on macOS and Linux) for any tool name, after PATH and the npm global folder. Windows keeps its per-tool table.

**D5. Smoke test as a dev tool, not a kit script.** `tools/smoke.mjs` lives in the repo's dev tools (like `run-evals.mjs`), not in `plugins/kit/`, so it never ships to users. It runs each kit script with `node <script> ...` from `plugins/kit/`, and `openspec` through `locate`, in a project under `os.tmpdir()`. Each step is `{ name, cmd, expect }`, where `expect` is an exit code plus a line pattern or a file that must exist; the runner prints `ok <name>` or stops with the failure (spec: kit-self-test).

**D6. Isolation.** The smoke project gets its own home folder for `/kit:start`'s project list (`--home`), `CLAUDE_PROJECT_DIR` set to the project for the hook, and `HOME`, `USERPROFILE` and `XDG_CONFIG_HOME` pointed into the throwaway folder for every child process, so OpenSpec and the kit can't write global config. `APPDATA` stays as it is: on Windows the npm global folder, where `openspec` lives, is under it, and redirecting it made `/kit:start` fail to find OpenSpec (found while building 4.3); OpenSpec takes `XDG_CONFIG_HOME` over `APPDATA`, and the real `%APPDATA%\openspec\config.json` stayed untouched in the smoke runs. Task 1.1 (done) showed OpenSpec writes its global config (a telemetry notice and an anonymous id) to `XDG_CONFIG_HOME/openspec/config.json` and, with the redirect, nothing outside the throwaway folders ([evidence](../../../evals/trials/kit-cross-platform.md)). Every child process also gets `OPENSPEC_TELEMETRY=0` and `DO_NOT_TRACK=1` (OpenSpec's documented opt-out).

**D7. Fixtures, not AI, for the planning artifacts.** The proposal, a flat spec delta, a nested spec delta (`canvas/stickies`), `tasks.md` (all done) and `design.md` are small fixture files in `tools/smoke/fixtures/`, written into the change that `openspec new change` creates. Verify runs the project's `npm run test` (`node -e 0`) and records both reviews as `skipped` with the note "smoke test", so the report passes without AI.

**D8. Last-pass record.** `.smoke-pass.json` at the repo root (`{ commit, date, platform }`), gitignored. `smoke:check` compares `git diff --name-only <commit>` plus `git status --porcelain` against the kit paths (spec: kit-self-test). Exit 0 = not needed; exit 3 = recommended (matches the kit's "attention" code in `prereqs.mjs`).

**D9. Install check as a unit test.** `tests/kit/install-check.test.mjs` reads the real manifests, so it runs in `npm test` on every change at no cost. Hook events allowed: the ones Claude Code documents (PreToolUse, PostToolUse, PostToolUseFailure, SessionStart, Stop, ...; the list is copied from the hooks docs at build time and marked with the date). Frontmatter is parsed with the `yaml` package already in the repo's dev dependencies (tests only; the kit's runtime scripts stay dependency-free).

## Risks / Trade-offs

- [Mac commands untested until M14] → formula names checked against Homebrew's API; the Mac tester runs `/kit:setup` first and the findings go into M14 fixes.
- [The smoke test asserts output lines, so wording changes break it] → expectations use short stable fragments (`created`, `status Draft`, `pass`), not whole sentences; a failure prints the actual output, so updating takes a minute.
- [`openspec init` or `archive` might write global config or telemetry] → D6 redirects the home folders; task 1 checks for writes outside the throwaway folders; OpenSpec telemetry and its opt-out are unverified.
- [A smoke pass on Windows says nothing about macOS] → stated in the README status (M13); the record names the platform it passed on, and `smoke:check` shows it.
- [`smoke:check` trusts a local file] → fine solo; a second maintainer would need CI (later).

## Migration Plan

- Registry: rewrite the 15 install blocks in one commit and regenerate `plugins/kit/data/toolkit.json`; the validator change lands in the same commit so `npm run registry:check` stays green.
- Users on 0.7.0 see no difference on Windows. Rollback: revert the commit; the old `win32` keys are unchanged in content.
