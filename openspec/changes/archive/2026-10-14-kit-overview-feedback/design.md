# Design

## Context

Split out of `kit-local-mvp` on 2026-10-01 so the core kit (registry, setup, routing, starter, next) can ship first and prd-pipeline can follow (see `docs/roadmap.md`). These decisions were written in kit-local-mvp's design and are moved here unchanged. They build on that change's registry (`plugins/kit/data/toolkit.json`), lane map (`scripts/lanes.mjs`) and project stamp (`.claude/kit.json`).

## Goals / Non-Goals

**Goals:** see the three specs in this change.

**Non-Goals:** live data in the cockpit; automating the harness review.

## Decisions

### D7. Cockpit: static HTML built by one command

- `node tools/build-cockpit.mjs` validates the registry, reads `toolkit.json`, `projects.json` and each project stamp, and writes one self-contained `cockpit/index.html` (inline CSS/JS, gitignored). Filters (status, tier) are client-side JS.
- If validation fails, the build exits non-zero and writes nothing.
- **Why:** this decides the proposal's open item. The spec requires offline use, no account and no network, which rules out a published artifact for v0. An artifact can come later as an optional share view.
- The situation-to-skill guide comes from a `situations` list in `toolkit.yaml`, so no guidance is written by hand in the page.

### D9. Feedback: `gh` first, local pending file as fallback

- The skill drafts the issue and scrubs it: paths only; drop anything matching key/token/`=`-secret patterns and env values. The user confirms the text.
- Then `gh issue create --label feedback` runs on the **inbox repo** (`ac-workbench-inbox`, private). Its slug is read from plugin data. Before filing, the skill checks that the repo is private (`gh repo view --json visibility`), because the kit repo itself is public and project details must not leak.
- On any failure (no `gh`, not signed in, offline) the draft is saved to `~/.claude/kit/feedback-pending/<timestamp>.md` and the user gets the install and retry steps. A later `/kit:feedback --flush` files the pending items.
- **Why:** feedback must never be lost, and no kit files are ever written from a project.

### D10. Harness review: skill-only checklist

- `skills/harness-review/SKILL.md` plus `checklist.md` (questions per layer, memory types, scorecard template).
- The skill uses read-only tools only, and says so in its instructions. The overlap check calls `scripts/lanes.mjs` against the project's enabled plugins.
- **Why:** the spec says checklist-only for the MVP. Automation is out of scope.

- Since the split: the feedback inbox is a **private** repo (`ac-workbench-inbox`), because the kit repo is public (decided 2026-10-01).

## Risks / Trade-offs

- [The secret scrub misses a pattern] → The user confirms the text before filing, and file contents are never included (paths only).
- [Rubric evals for the harness review are subjective] → Named criteria with a reason each.
