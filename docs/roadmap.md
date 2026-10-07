# Roadmap

**Read this first in every session.** It holds the goal, the order of work, where we are, and every change of direction with its reason. When work drifts from it, the drift gets logged here (rules at the bottom) before anything else happens.

Last updated: 2026-10-07 (M3 quality gates built: kit 0.4.0, `/kit:verify`, `/kit:judge`, archive gate, live trial passed)

## North star: the workflow this kit exists for

In the user's words (2026-10-01): *"I create context, it is formatted in a PRD or proper requirements, we make a plan, we make the task lists and development starts until delivery, while I am in the guiding position providing information, context, making decisions and testing. I want to know the code is solid, without over-engineering for each project's needs, but with test coverage and security. ... a pipeline of cool tools to help me build faster, with high quality and reliably, as a product builder with a mind for business and design."*

| # | Stage | Your role | Tool(s) | Milestone | Status |
|---|---|---|---|---|---|
| 1 | Capture an idea (voice / text) | talk, type | `/voice` + `/kit:capture` | M2 | ✅ |
| 2 | Shape into a PRD / requirements | decide, correct | `/kit:prd` | M2 | ✅ |
| 3 | Store and retrieve context | review | Markdown in the project repo (`knowledge/`); Notion dropped 2026-10-06 | M2 | ✅ |
| 4 | Plan: proposal, specs, design | review, decide | OpenSpec (adopted) | M1 | ✅ |
| 5 | Task list | approve | OpenSpec tasks | M1 | ✅ |
| 6 | Build | answer, test | `/opsx:apply`; SuperSpec for big or risky changes; Context7 | M1 | ✅ |
| 7 | Design | direct, judge | Impeccable (owner), Emil (motion), Figma/Miro MCP per project | M4 | ⬜ trial |
| 8 | Tests, right-sized per project | set the bar | test policy per project type (registry); `/kit:verify`; Playwright CLI (web UI, advisory) | M3 | ✅ |
| 9 | Security | — | gitleaks ✅; `/security-review` in `/kit:verify` (high blocks; a substitute review is recorded when it can't run); ECC AgentShield (candidate) | M3 | ✅ |
| 10 | Code review | — | `/code-review` (owner of review; advisory in `/kit:verify`) | M3 | ✅ |
| 11 | Delivery | test, accept | `/opsx:archive`; deploys out of scope for now | M1 | ◐ |
| 12 | See everything in one place | look | cockpit | M5 | ⬜ |

Kit plumbing that makes it repeatable: registry (`toolkit.yaml`), `/kit:setup`, `/kit:start`, `/kit:next`, lane map, evals.

## Principles (every decision is checked against these)

1. **The user guides; the agent proposes.** Reorders, scope changes and tool verdicts are the user's decisions.
2. **Kit global, tools per project.** Only the kit, CLIs and marketplaces are global. Workflow plugins, MCPs and tool configs are per project, and never touch repos the user doesn't own.
3. **Right-sized quality.** Every project gets tests and security checks, sized to its needs. No over-engineering.
4. **Evidence before adoption.** Read the full docs; trial a tool before it becomes a default; record the verdict with its evidence in `toolkit.yaml`.
5. **Free to run** beyond the Claude plan.

## Milestones (in order)

| # | Change | Delivers | Exit criteria | Status |
|---|---|---|---|---|
| M1 | `kit-local-mvp` | registry, evals, `/kit:setup`, lane map, `/kit:start`, `/kit:next`, tag `v0.1.0` | A fresh folder gets the full setup with one command; a re-run on a Toughbubble **copy** shows diffs only | **done**, tagged `v0.1.0`; archived 2026-10-07 (the usage review, 9.4, moved to M6) |
| M2 | `prd-pipeline` | `/kit:capture`, `/kit:prd`, `knowledge/` folder via `/kit:start`, PRD-aware `/kit:next` | An idea dictated by voice ends as a Ready PRD in a project's `knowledge/prds/`, and `/opsx:propose` in that project uses it | **done**: `prd-pipeline` and `prd-pipeline-followups` built (kit 0.3.0) and archived 2026-10-07 |
| M3 | `quality-gates` | owners for review and security, a right-sized test policy per project type, a coverage check in verify | A project's verify step fails on missing tests or a security finding, at a level set per project | **built** 2026-10-07 (kit 0.4.0; live trial on the Toughbubble copy passed) |
| M4 | design trial (registry + one web UI project) | Impeccable, Emil, Playwright CLI tried for real; verdicts recorded | Verdicts with evidence in `toolkit.yaml` | not started |
| M5 | `kit-overview-feedback` | cockpit, `/kit:feedback` to a private inbox, `/kit:harness-review` | See that change's tasks | planned (0/13) |
| M6 | usage review (~2026-10-13) | review after two weeks of real use (was kit-local-mvp task 9.4); revisit task-observer | Findings in `evals/trials/usage-review-1.md` | not started |

## Current position and next actions

1. **Now:** M3 is built (`quality-gates`, kit 0.4.0); archive it after your review. Next on the roadmap: M4 design trial, M5 cockpit/feedback, M6 usage review (~2026-10-13).
2. **Done 2026-10-07:** [`prd-pipeline-followups`](../openspec/changes/archive/2026-10-07-prd-pipeline-followups/) (kit 0.3.0). PRDs newest first; `.txt` import; `/kit:start` asks one question with a three-part summary; context7 through `npx` (no sign-in); a README. Archived 2026-10-07 with the other two.
   - Still open from the trials (`evals/trials/prd-pipeline-live.md`):
     - **parked** (user): keeping loose notes manageable, decided after real use;
     - **idea:** offer to tidy hand-made notes that have no frontmatter;
     - **check in M6:** a Ready PRD outranks an active change in `/kit:next`.
   - Test bed: `Projects/temp/Toughbubble` (a copy), before touching the real Toughbubble.
3. Alongside: use the kit for real (e.g. `/kit:start` on Toughbubble itself, with your confirmations) to feed the M6 usage review around 2026-10-13.

Inputs for the M3 explore (agreed with the user, 2026-10-06; all built in `quality-gates` except the two marked later):
- **Flow recommendation:** a short risk checklist checked at proposal time: payments, auth, personal data, data migration; hard to undo or wide reach; vague spec or open questions in the PRD. It recommends plain OpenSpec or SuperSpec with the reason; the user decides. Tested with an eval set of example change descriptions, each labelled with the expected flow.
- **Remove the licensed-material `.gitignore` patterns** from this repo and from the block the kit writes into projects (with their tests, evals and the project-starter requirement). The material is no longer used (user, 2026-10-07).
- **Library-error hook (backstop for the docs rule):** after a build, type or test command fails with a library error, a kit hook adds one line telling the agent to look up current docs (`npx ctx7`) before retrying. It's deterministic and fires only on failure.
- **Later, edge case:** if context7's limits without a key are hit, tell the user and offer the one-time sign-in (free account), then register the key for the project.
- **SuperSpec re-test on a big or risky change:** an A/B on two project copies, comparing quality (bugs found afterwards, rework, verify-report coverage, decisions asked vs guessed), plus time and **token usage** (the user is on a subscription, so tokens matter more than dollars). Run it when a real risky change comes up. The 2026-10-01 trial was a small change only.

Open decisions:
- (Settled in M3: `/code-review` owns review; `/security-review` runs inside `/kit:verify`.)

## Drift rules

1. **Before starting work that isn't the current position or next actions above, stop.** Add a drift-log entry (date, what, why, the on-plan alternative, impact) and ask the user to decide.
2. **Only the user changes order or scope.** After a decision: update this file, then the OpenSpec change (`/opsx:update`), in the same commit.
3. **Start of every session:** read "Current position". End of a milestone: re-check the north-star table and update the statuses.
4. **Sub-work found mid-task** (a bug, a missing helper) is not drift if it serves the current task. Note it in the commit message. New capabilities *are* drift.

## Drift log

| Date | What changed | Why | Decided by | Impact |
|---|---|---|---|---|
| 2026-09-29 | Scope grew from one plugin (prd-pipeline) into a personal kit; prd-pipeline deferred | The user wanted fast project setup and evidence-based tool choices first | user (proposal) | The front of the workflow (stages 1–3) waits |
| 2026-09-29 | Added an A/B workflow trial (OpenSpec vs SuperSpec) before building | Settle the default workflow with evidence | user (proposal) | Result: OpenSpec default, SuperSpec trial |
| 2026-09-29 | Added one-command tool setup and per-project tool scoping | The user wants one command, and tools never active in repos that aren't theirs | user | New spec `tool-setup`, group 5 |
| 2026-10-01 | Feedback inbox moved to a private repo; secret scanning added early | The kit repo became public | user | gitleaks hook (1.6); inbox changes in M5 |
| 2026-10-01 | **Drift noticed by the user:** stages 1–3 (capture → PRD → Notion) had slipped behind kit plumbing (cockpit, feedback, harness review) | Those stages are the reason the project exists | user | Cockpit, feedback and harness review moved to `kit-overview-feedback` (M5); prd-pipeline is M2 right after M1; quality gates M3 |
| 2026-10-01 | Full re-review of the user's tool list (the earlier session only read summaries) | Choose tools from real docs | user | claude-mem dropped; Notion MCP, Impeccable, Emil, Playwright CLI, Context7 to trial; `evals/trials/tool-review-2026-10-01.md` |
| 2026-10-01 | Group 7 tests run only in throwaway folders and a Toughbubble copy | Never risk a real project | user | Tasks 7.6 and 7.7 reworded |
| 2026-10-06 | **Notion dropped as the PRD store; PRDs and notes move to Markdown in each project's `knowledge/` folder** (P5 revised, P6 dropped). Asana, Google Docs and Obsidian were checked and left out of v1 | Live spike: Notion's SQL query limit hit after ~10 calls on the free plan. Asana's MCP has no tool for project briefs, Google Docs needs a Cloud project and makes per-section edits clumsy, and Obsidian has no official MCP. Markdown in git needs no MCP and has no limits. Final home stays open (configurable path). On-plan alternative: keep Notion and use fetch only (untested) | user | Stage 3 and the M2 row reworded; v1 scope in `project-context.md` |
| 2026-10-06 | **`/kit:start` asks one question (project type); no opt-in questions.** Global and type tools install without asking; Superpowers (session-start hook) and MCP servers come on demand, when a change needs them. Plain skills, SuperSpec's schema and Impeccable are fine to keep present | Live trial: too many setup questions without context. Checked what costs context while idle: plain skills almost nothing; Superpowers' session-start hook and MCP servers do; Impeccable's hooks filter by file type (docs). A skill added mid-session works once the session touches its file (tested live) | user | Folded into `prd-pipeline-followups` (project-starter spec, tasks 5.3–5.4). Superpowers on demand goes with the M3 flow judge. README bookkeeping added (6.3) |
| 2026-10-07 | M3 built with two additions beyond the plan: a `/kit:judge` skill (the routing rules needed an entry point for the flow judge), and recorded review status (`ran` / `substitute` / `skipped`) after the live trial showed `/security-review` silently not running. Also fixed an M1 bug: `/kit:next` skipped changes whose tasks were all done | Found while building and in the live trial | user (live trial) | `quality-gates` spec and tasks updated; kit 0.4.0 |
