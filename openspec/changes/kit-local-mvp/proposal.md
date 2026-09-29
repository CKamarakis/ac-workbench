# Proposal: kit-local-mvp

## Why

Every new project costs about half a day of setup. Tool choices are made from guesswork rather than evidence, and there is no single place to see which projects exist, which tools are in use, or which practices to follow. The original prd-pipeline idea is one part of a bigger need: a **personal Claude Code kit** that bootstraps projects with good defaults, records what each tool is worth, and makes that visible. The first version is local-only and free, so we can learn before expanding.

## What Changes

The repo becomes a personal kit: a marketplace repo that holds several plugins. The MVP adds five local pieces:

```
 you/claude-kit (marketplace repo)
  |-- toolkit.yaml ........ registry: tools, tiers, verdicts
  |-- project-starter ..... reads the registry, sets up a project in minutes
  |-- cockpit v0 .......... local page: projects + toolkit + best practices
  |-- evals ............... test cases + scoring for each kit skill
  +-- harness-review ...... checklist review of an agent system (8 layers)
```

How the pieces connect:

```
             toolkit.yaml  <------------------ verdicts ---------+
            /     |      \                                       |
           v      v       v                                      |
  project-starter  cockpit v0   harness-review --> evals --> VERDICT
     (installs)    (shows)       (reviews)        (proves)
```

- **Toolkit registry:** one file listing each tool with its tier (global / per project / by project type), the reason it's there, rubric notes (problem fit, overlap, context cost, run cost, trust, reversibility, license), cost, and status (trial / adopted / dropped / later).
- **Project starter:** one command in an empty folder sets up the Tier 2 basics (git, `.gitignore` incl. licensed-folder patterns, OpenSpec init + config context, CLAUDE.md starter, project-context doc) and optional Tier 3 add-ons by project type.
- **Cockpit v0:** a local, read-only overview built from the registry and a project list. It shows no live data.
- **Skill evals:** every kit skill ships with fixed test cases and automatic checks. Results feed registry verdicts.
- **Harness review (checklist only):** a guided review of an agent system across 8 layers (context, tools, memory, loops, verification, guardrails, feedback, observability), giving a scorecard and the top 3 fixes. It is kept simple on purpose and will grow with experience.

- **Kit feedback:** a `/kit:feedback` skill, used inside any consuming project, that captures what happened (project, files, context, suggestion) at the moment it happens and files it to a kit inbox (GitHub Issues, label `feedback`). Triage happens later in the kit repo.
- **Skill routing:** a lane map (one owner per phase) stored in the registry and written into each project's routing rules, plus a `/kit:next` skill that suggests the next step based on the current OpenSpec change status.

### Update and feedback model

```
  PROJECT X                                  KIT REPO
  /kit:feedback --> KIT INBOX (GitHub Issues) --> triage --> /opsx:explore
                                                             --> change --> release (tag)
  project updates plugin <------------------------------------------------+
```

Rules:
1. **Add on top, never edit their files.** Third-party tools install from their own sources and update themselves. The kit only records them (reviewed version, verdict). Custom behavior lives in kit skills that wrap or combine theirs. A copied-in piece (e.g. from ECC) records its source and version.
2. **Projects report; only the kit repo changes the kit.** No committing to the kit from consuming projects.
3. **Capture feedback when it happens,** with context, so nothing needs re-explaining later.
4. **Dev mode vs stable mode.** On the main PC, the kit clone is added as a local-directory marketplace, so edits apply immediately (verified: in-place local plugins are not version-pinned). Elsewhere, install from GitHub pinned to a release. Exact update commands are **unverified**.
5. **Drift is visible.** Each project stores `.claude/kit.json` (kit version, setup date). The cockpit shows projects that are behind. Starter re-runs suggest changes as a diff and never overwrite files.

- `gh` CLI is required for the inbox and is **not installed** yet.

### Skill routing and overlap

Several tools claim the same phase (e.g. Superpowers and OpenSpec both plan). Overlapping skill descriptions make Claude's choice unpredictable, and too many skills get silently cut from the skill list. Each phase therefore gets one owner:

```
 PHASE        OWNER (default candidate)
 Brainstorm   Superpowers brainstorming  (inside the OpenSpec flow, per SuperSpec)
 Artifacts    OpenSpec (proposal, specs, design, tasks)
 Plan         Superpowers writing-plans, built from OpenSpec tasks (one task list)
 Build        Superpowers subagent-driven TDD, in a git worktree
 Verify       OpenSpec verify + Playwright
 Review       built-in /code-review, /security-review
 UI polish    Emil review/improve-animations
 Close        OpenSpec archive
 Kit issues   /kit:feedback
```

- **Enforcement, strongest first:**
  1. An OpenSpec custom schema that calls the right skill at each step (SuperSpec, https://github.com/danielhanold/superspec, MIT).
  2. Enabling plugins per project (`enabledPlugins`; per-project behavior **unverified**).
  3. Routing rules in the project's CLAUDE.md.
- **Registry lane fields:** `phases`, `skip_skills`, `overlaps`, `reviewed_version`. harness-review flags new overlaps.
- **When a tool updates:** read its changelog. New lane claims get an owner decision; behavior changes trigger an eval re-run.
- **SuperSpec is a trial candidate, not a decision.** Its schema has no OS-specific commands (checked 2026-09-29). It needs git worktrees and `realpath` (both work here) plus `gh` and `jq` (missing). It also needs the OpenSpec custom profile with the verify step.

**Out of scope (later):** prd-pipeline + Notion, CI deploys and previews, Sentry/PostHog, cockpit with live data, task-observer trial, harness-review automation, adopting ECC pieces (read and adapt one at a time, never a bulk install).

**Proposed default tools (not confirmed; the registry will record the decision):**
- Tier 1 (global): OpenSpec, Superpowers, Playwright CLI + skill, Context7.
- First always-on checks: lint + secret-scan hooks.
- awesome-design is kept as a human bookmark list, not agent input.

## Capabilities

### New Capabilities
- `toolkit-registry`: schema and rules for the tool registry (entries, tiers, rubric fields, status lifecycle, verdict history)
- `project-starter`: bootstrap of a new or empty project from the registry (Tier 2 basics, Tier 3 by project type), safe to re-run
- `cockpit`: local read-only overview of projects, toolkit and best practices, built from registry data
- `skill-evals`: how kit skills declare eval cases, run them, and record results as verdicts
- `harness-review`: checklist-based review of an agent system across 8 layers, producing a scorecard and top fixes
- `kit-feedback`: capture of improvement requests from consuming projects into the kit inbox, with context
- `skill-routing`: lane map (one owner per phase), overlap detection, and `/kit:next` step suggestions

### Modified Capabilities
- None (no existing specs).

## Impact

- **Repo identity:** the repo becomes a kit rather than a single plugin. A rename (e.g. `claude-kit`) and restructure are needed.
  - `openspec/config.yaml` context still describes only prd-pipeline and needs an update.
  - `docs/project-context.md` needs the kit framing.
- **Plugin structure:** `.claude-plugin/marketplace.json` listing several plugins, each with its own `.claude-plugin/plugin.json` and `skills/`. Verified against the plugin docs on 2026-09-29.
- **Evals tooling:** built-in `claude plugin eval` is a candidate. It is **unverified** (docs not read yet) and must be compared with the harness/evals tool the user will share.
- **Dependencies:** Node/npm (present). Playwright CLI and Context7 are only added if adopted. No paid services.
- **Platform:** Windows 11 + Git Bash. The `openspec` CLI is not on the Git Bash PATH, and the starter must handle that.
- **Open items:**
  - Review the user's harness/evals tool.
  - Cockpit tech choice (static HTML vs. published artifact), to be decided in design.

## Validation Plan

The proposal is tested by building its first slice with it, not by debate.

```
 STEP 1  SMOKE TEST (throwaway kit-sandbox repo, Superpowers enabled there only)
         session starts fast? input not frozen? skills listed?
            | fail --> try WSL2 or drop Superpowers; record verdict
            v
 STEP 2  SAME TASK, TWO SETUPS
         A: OpenSpec spec-driven (current)
         B: SuperSpec (OpenSpec + Superpowers)
         task: first kit slice = toolkit.yaml + a validator
            v
 STEP 3  SCORE: manual interventions, time, tests written first,
         tests pass, Claude usage spent, Windows glitches,
         artifact quality (harness-review checklist)
            v
 STEP 4  VERDICT --> first toolkit.yaml entries
            v
 STEP 5  the winning setup becomes project-starter's default workflow
```

**Known Windows risks for Superpowers:** its session-start hook has had bugs on Windows:
- hang: https://github.com/obra/superpowers/issues/413 (closed)
- frozen input: https://github.com/obra/superpowers/issues/419
- per-user Git not found: https://github.com/obra/superpowers/issues/1863 (doesn't apply here; Git is at the standard path)
- update lost skills: https://github.com/obra/superpowers/issues/1082

Workaround suggested in those issues: WSL2. The fix status of each issue in the current version is **unverified**, so the smoke test comes first. A hook installed for the whole user profile would affect every session, so the trial stays isolated in the sandbox.

**Prerequisites for the trial:**
- `gh` and `jq` (e.g. via winget; commands **unverified**)
- OpenSpec custom profile with verify
- Superpowers installed for the sandbox project only
