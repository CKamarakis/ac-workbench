---
title: "Road to v1: research and decisions"
date: 2026-10-12
tags:
  - v1
  - roadmap
  - research
source: text
---

Research and decisions from the 2026-10-12 session after M8, for the road to v1 and the LinkedIn share. Overview page (private): https://claude.ai/artifact/QEEarrq35wNcYDnTtf4qtP

## Decided by the user (2026-10-12)

- License: **MIT**.
- Feedback: **public GitHub issues** only. Drop the private inbox and `/kit:feedback` (they came from the 2026-10-01 drift-log entry, when the repo went public).
- Cockpit: not now (post-v1).
- Harness review: out of v1 by default, but wants an estimate ("it's cool, might get attention").
- Mobile: later.
- Mac: the user will find a Mac to test on; research below.
- README gets a "coming next" section, and must say plainly what the kit is good for.
- The rest of the v1 plan (phases A–D) is agreed.

## What the kit supports today (checked in the code)

| Part | Works for |
|---|---|
| capture → PRD → plan → `/kit:ready` → apply → reviews → archive → `/kit:docs` | any project Claude Code can work in |
| `/kit:verify` tests | npm only: runs `npm run <script>` from `package.json` (`verify.mjs:269`) |
| untested-files check | JS/TS only: `src/` or `app/` with `.ts/.tsx/.js/.jsx` (`verify.mjs:61`) |
| tools inventory, new-tool check, unplanned deps | `package.json` only |
| project types | `web-ui` and `none` (`toolkit.yaml` project_types) |
| `/kit:setup` installs | **Windows only**: all 15 install commands are `win32:`; on macOS it reports "no install command for darwin" per tool (`setup.mjs:87`) |
| tool finder (`locate.mjs`) | WinGet and Program Files paths only |
| Impeccable | web, plus native iOS/Android guidance in its own reference files (not trialled by us: unverified) |
| Playwright CLI | web only; can emulate phone viewports, not native apps |

## Mac support (needed for v1's outside test)

- Add `darwin:` (Homebrew: `brew install gh jq gitleaks`; OpenSpec via npm) and `linux:` install commands to the 15 registry entries. Formula names to confirm with `brew search` (unverified).
- Add macOS paths to `locate.mjs` (`/opt/homebrew/bin`, `/usr/local/bin`).
- Claude Code itself installs on macOS with the curl installer or `brew install --cask claude-code` (community docs; check the official page).
- The kit's hooks and scripts are plain Node, so they should run as is (unverified until tested).
- Estimate: **S** (about a quarter of `kit-docs`), plus the tester's time.

## Python and backend

- Correction to a common belief: on GitHub, **TypeScript passed Python in August 2025** as the most-used language by monthly contributors (2.64M, +66%). Python is still first in AI and data science. Source: GitHub Octoverse 2025, https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/
- So the JS/TS focus is defensible for v1, and Python is the natural second language.
- **Node backend** (`node-api` type): a registry project type with an npm test policy, a `/kit:start` option, evals. Estimate: **XS–S**.
- **Python**:
  - test policy as a command, not just an npm script (e.g. `uv run pytest` or `pytest`); the common pattern is `uv run pytest` with pytest as a dev dependency (community guides, not uv's official docs: https://pydevtools.com/handbook/tutorial/setting-up-testing-with-pytest-and-uv/);
  - untested-files patterns for `.py` (`tests/test_*.py`, `*_test.py`);
  - dependencies from `pyproject.toml` or `requirements.txt` for the tools inventory, new-tool check and unplanned deps;
  - a `python` project type, detected from `pyproject.toml`;
  - the pre-push hook runs the policy command;
  - Windows: `python` is missing on this machine (M6 finding 7).
  - Estimate: **M** (about half to two thirds of `kit-docs`).

## Mobile (later)

- Native apps need a different test tool. 2026 comparisons (vendor-leaning, unverified):
  - Maestro: YAML flows, quick setup, Expo-friendly, real devices;
  - Detox: JS/TS with Jest, gray-box and less flaky, more setup, iOS simulator only.
- Sources: https://www.pkgpulse.com/guides/detox-vs-maestro-vs-appium-react-native-e2e-testing-2026, https://oneuptime.com/blog/post/2026-01-15-react-native-maestro-testing/markdown
- Needs a trial before adoption (kit rule).

## Harness review (M5 spec exists)

- What it is: a read-only check-up of an AI-agent setup (`CLAUDE.md`, skills, memory, hooks, MCP) across 8 layers: context, tools, memory, loops, verification, guardrails, feedback, observability.
- It starts with a diagram and ends with a scorecard and the top 3 fixes; memory is checked by type.
- Pieces:
  - a skill with a written checklist (our own words; the idea came from PM-OS);
  - a small script that lists the setup (`CLAUDE.md`, skills, hooks, settings, memory);
  - the scorecard format;
  - evals with rubrics;
  - a trial on this repo and Toughbubble.
- Estimate: **M** (about half of `kit-docs`).
- Why it may draw attention: it is useful to **any** Claude Code user, without adopting the whole pipeline. A good hook for the post.

## Cockpit (post-v1)

- One local page across all your projects: kit version per project (flags ones behind), every registry tool with status, the lane map and a "situation → skill" guide.
- Value grows with several projects; little for a first-time user. The situation guide can be a README table instead.

## Target user and use cases (proposal)

- **User:** a solo product builder (designer, PM, founder) who builds web apps with Claude Code, from quick prototypes to products they ship, and wants to stay in the decision seat while the agent builds, tests and documents.
- **Use cases:**
  1. Prototype in a day: idea → quick plan → build → share a link. **(Dropped 2026-10-14, user: notes always become a PRD; see roadmap drift log.)**
  2. Ship a feature on a real product: PRD → ready → build → verify → archive → docs.
  3. Adopt mid-project: `/kit:start` + `/kit:docs` on an existing repo.
- **Gaps to make it round:**
  - a light prototype lane (skip PRD, readiness and docs; tests minimal); **(dropped 2026-10-14)**
  - a share step (a preview deploy link; which tool is not yet researched); **(moved after v1, as a proposal of how to deploy and share, not a built feature)**
  - a 10-minute demo walkthrough in the README.

## Positioning for the post

- "How I build with Claude Code, shared for feedback", not "a product".
- v1 claim: JS/TS web apps, Windows tested, macOS checked by a tester; the planning and docs parts work with any stack.
- The repo is already public with personal notes, trials and Toughbubble details: read through once for anything to keep private (gitleaks only checks secrets).

## v1 scope (user, 2026-10-12)

- **In v1:** Mac support, harness review, and a reliable way to test the kit from here before anyone else touches it ("I share as a professional; no basic bugs"). **(2026-10-14: prototype lane and share link dropped from v1.)**
- **After v1 (coming next):** Python, Node backend, mobile, cockpit, small teams.
- **Small teams (checked in the code, 2026-10-12):** everything is files in git and the project tools are committed, so a team can share a repo. But `decisions.md` keeps its data in one JSON block (two branches adding decisions conflict), the committed docs page conflicts across parallel archives (a rebuild fixes it), and `/kit:next` assumes one person. Untested with more than one person. v1 wording: "built for solo builders; a small team can share it, untested with more than one person". Evidence idea: one M14 friend shares a repo for a day.
- **Install test in CI:** try `claude plugin marketplace add` + `install` on a clean runner (no model calls, no API key); fall back to our own manifest check if the CLI wants a login. Research thin: https://claudeissues.com/issue/12840-feature-headless-programmatic-plugin-installation, https://github.com/anthropics/claude-code/issues/66750.

## Testing the kit from here (proposal, to plan in phase A/C)

1. **(Moved to later by the user, 2026-10-13: no CI for now; the smoke test and install check run here.)** **CI on three systems:** a GitHub Actions workflow runs `npm test`, `npm run evals` (script cases) and `npm run registry:check` on Windows, macOS and Ubuntu runners. Free for public repos (to confirm on GitHub's pricing page: unverified). This catches Mac and Linux breakage without owning a Mac.
2. **End-to-end smoke test (no AI):** a script that makes a throwaway project and runs the kit's scripts in order: start plan and apply, new note, new PRD, decisions, verify run, docs build, and checks every output. Runs in CI on all three systems.
3. **Install test:** in CI, add the marketplace and install the plugin with the `claude` CLI on a clean runner (needs research: whether the CLI runs on CI without a login is unverified).
4. **Skill runs with Claude:** score the 18 judgment evals once per release by running each prompt headless (`claude -p`) in a sandbox here, on your subscription; record tokens. Not in CI (it needs a login and costs usage).
5. **Clean Windows:** the user has no spare Windows account, so the clean GitHub Actions Windows runner (step 1 and 3) covers it. Optional: Windows 11 Home can add a second local user for free (Settings, Accounts, Other users). Windows Sandbox is not available on Home.
6. **Then people:** friends and the Mac tester try only after 1–5 pass.
