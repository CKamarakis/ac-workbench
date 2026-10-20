---
id: M3
title: Quality gates
status: done
---

Tests, security and review gates in /kit:verify; the flow judge.

## Tasks

## Notes

## Before 2026-10-17 (the old roadmap row, kept whole)

- **Change:** `quality-gates`
- **Delivers:** owners for review and security, a right-sized test policy per project type, a coverage check in verify
- **Exit criteria:** A project's verify step fails on missing tests or a security finding, at a level set per project
- **Status:** **done**, archived 2026-10-07 (kit 0.4.0; live trial on the Acme copy passed)

## From the old "Current position"

Inputs for the M3 explore (agreed with the user, 2026-10-06; all built in `quality-gates` except the two marked later):
- **Flow recommendation:** a short risk checklist checked at proposal time: payments, auth, personal data, data migration; hard to undo or wide reach; vague spec or open questions in the PRD. It recommends plain OpenSpec or SuperSpec with the reason; the user decides. Tested with an eval set of example change descriptions, each labelled with the expected flow.
- **Remove the licensed-material `.gitignore` patterns** from this repo and from the block the kit writes into projects (with their tests, evals and the project-starter requirement). The material is no longer used (user, 2026-10-07).
- **Library-error hook (backstop for the docs rule):** after a build, type or test command fails with a library error, a kit hook adds one line telling the agent to look up current docs (`npx ctx7`) before retrying. It's deterministic and fires only on failure.
- **Later, edge case:** if context7's limits without a key are hit, tell the user and offer the one-time sign-in (free account), then register the key for the project.
- **SuperSpec re-test on a big or risky change:** an A/B on two project copies, comparing quality (bugs found afterwards, rework, verify-report coverage, decisions asked vs guessed), plus time and **token usage** (the user is on a subscription, so tokens matter more than dollars). Run it when a real risky change comes up. The 2026-10-01 trial was a small change only.

Open decisions:
- (Settled in M3: `/code-review` owns review; `/security-review` runs inside `/kit:verify`.)

