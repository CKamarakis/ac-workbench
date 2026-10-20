# Roadmap

Kept by `/kit:roadmap`; checked with `node <kit>/scripts/roadmap.mjs check`. Prose between the headings is yours; the lists under Order, Now and Waiting on you have a fixed shape.

## North star

In the user's words (2026-10-01): *"I create context, it is formatted in a PRD or proper requirements, we make a plan, we make the task lists and development starts until delivery, while I am in the
guiding position providing information, context, making decisions and testing. I want to know the code is solid, without over-engineering for each project's needs, but with test coverage and security.
... a pipeline of cool tools to help me build faster, with high quality and reliably, as a product builder with a mind for business and design."*

| # | Stage | Your role | Tool(s) | Milestone | Status |
|---|---|---|---|---|---|
| 1 | Capture an idea (voice / text) | talk, type | `/voice` + `/kit:capture` | M2 | ✅ |
| 2 | Shape into a PRD / requirements | decide, correct | `/kit:prd` | M2 | ✅ |
| 3 | Store and retrieve context | review | Markdown in the project repo (`knowledge/`); Notion dropped 2026-10-06 | M2 | ✅ |
| 4 | Plan: proposal, specs, design | review, decide | OpenSpec (adopted) | M1 | ✅ |
| 5 | Task list | approve | OpenSpec tasks | M1 | ✅ |
| 5b | Ready to build? (gaps, differences, decisions) | decide | `/kit:ready` | M7 | ✅ |
| 6 | Build | answer, test | `/opsx:apply`; SuperSpec for big or risky changes; Context7 | M1 | ✅ |
| 7 | Design | direct, judge | Impeccable (adopted, owner of ui-polish); Playwright CLI (adopted, browser checks on request); Emil (on demand, motion); Figma/Miro MCP per project, later | M4 | ✅ |
| 8 | Tests, right-sized per project | set the bar | test policy per project type (registry); `/kit:verify`; Playwright CLI (web UI, advisory) | M3 | ✅ |
| 9 | Security | — | gitleaks ✅; `/security-review` in `/kit:verify` (high blocks; a substitute review is recorded when it can't run); ECC AgentShield (candidate) | M3 | ✅ |
| 10 | Code review | — | `/code-review` (owner of review; advisory in `/kit:verify`) | M3 | ✅ |
| 11 | Delivery | test, accept | `/opsx:archive`; deploys out of scope for now | M1 | ◐ |
| 12 | See everything in one place | look | cockpit | M5 | ⬜ |
| 13 | Living product docs (what's built, and why) | look | docs sync in `/kit:verify` (M7); `/kit:docs` page (M8), optional per project | M7, M8 | ✅ |

Kit plumbing that makes it repeatable: registry (`toolkit.yaml`), `/kit:setup`, `/kit:start`, `/kit:next`, lane map, evals.

**Road to v1** (decided 2026-10-12):
- **v1 means:** someone who isn't the user installs the kit on a clean machine, goes from an idea to an archived change with a docs page, and knows where to send feedback.
- **Target user:** a solo product builder (PM, designer, founder) who builds web apps with Claude Code, from notes and PRDs to shipped features, and stays in the decision seat.
- **v1 supports:** JS/TS web apps; Windows (tested here), macOS (checked by the Mac tester), Linux (install commands only, untested); the planning and docs parts work with any stack.

**After v1 ("coming next"):**
- Python
- a Node backend type
- native mobile testing
- the cockpit
- backfill from code
- a deploy-and-share proposal (the kit looks at the project and suggests how the user can deploy and share it themselves, e.g. on Vercel; it doesn't deploy)
- a prototype lane (only if wanted later)
- GitHub CI on three systems
- a "what's waiting" list in `/kit:next`
- a notes service, on request: new, orphaned or old notes, and what they could add to a PRD (the user, 2026-10-20; `/kit:next` and capture stay quiet about notes in v1)
- small teams (2+ people in one repo: `decisions.md` and the committed docs page conflict across branches; `/kit:next` assumes one person; untested)

## Principles

Every decision is checked against these.

1. **The user guides; the agent proposes.** Reorders, scope changes and tool verdicts are the user's decisions.
2. **Kit and tools per project.** Only CLIs and marketplaces are global; the kit is installed per project (2026-10-14). Workflow plugins, MCPs and tool configs are per project, and never touch repos the user doesn't own.
3. **Right-sized quality.** Every project gets tests and security checks, sized to its needs. No over-engineering.
4. **Evidence before adoption.** Read the full docs; trial a tool before it becomes a default; record the verdict with its evidence in `toolkit.yaml`.
5. **Free to run** beyond the Claude plan.

## Order

<!-- One milestone ID per line, in the order you want them. Finished ones stay listed. -->
- M1
- M2
- M3
- M4
- M5
- M7
- M8
- M6
- M9
- M10
- M11
- M12a
- M15
- M16
- M12
- M13
- M14

## Now

<!-- Up to 5 lines: what's being worked on and where it stopped. -->
Kit 0.21.1 (2026-10-20). M12 done (T2 closed without time and tokens; findings fixed in 0.20.1). The repo restarted public with one commit; a word-list guard blocks real names at commit.
M13: T1 license, T3 issue templates, T4 descriptions, T7 privacy done. Left: T6 (the user runs docs/test-sheet.md on an Acme copy, recording time and /cost), T2 README (needs the user's screenshot), T5 CHANGELOG and the v1.0.0-rc.1 tag (asked before it goes public).

## Waiting on you

<!-- - [M1|general] <question> (proposed YYYY-MM-DD) -->
- [general] How to keep loose notes manageable (parked: decide after real use) (proposed 2026-10-07)
