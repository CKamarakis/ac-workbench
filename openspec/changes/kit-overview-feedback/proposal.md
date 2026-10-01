# Proposal: kit-overview-feedback

## Why

Split out of `kit-local-mvp` on 2026-10-01. The user's workflow needs the core kit (starter, routing) and the capture → PRD → Notion pipeline first. The overview page, the feedback loop and the harness review make the kit easier to run and improve, but they block nothing. Motivation for each piece: `kit-local-mvp/proposal.md` (Why, update and feedback model). Order: `docs/roadmap.md`.

## What Changes

```
 registry + project stamps ──> cockpit (one offline page: projects, tools, lanes, situation guide)
 any project ──/kit:feedback──> PRIVATE inbox repo (issues) ──> triage in the kit repo
 /kit:harness-review ──> 8-layer scorecard + top 3 fixes (read-only)
```

- **Cockpit v0:** a static HTML page built by one command from the registry, the project list and the stamps. Offline and read-only.
- **Kit feedback:** `/kit:feedback` drafts an issue with context (paths only, secrets scrubbed). After you confirm, it files the issue in the **private** inbox `ac-workbench-inbox`. The kit repo is public, so if the inbox isn't private, nothing is filed. Fallback: a local pending file.
- **Harness review:** a guided checklist review across 8 layers. Diagram first, read-only, max 3 fixes with reasons.

## Capabilities

### New Capabilities
- `cockpit`: local read-only overview of projects, toolkit and best practices, built from registry data
- `kit-feedback`: capture of improvement requests from consuming projects into the private kit inbox, with context
- `harness-review`: checklist-based review of an agent system across 8 layers, producing a scorecard and top fixes

### Modified Capabilities
- None.

## Impact

- **Depends on** `kit-local-mvp`: `toolkit.json`, `lanes.mjs`, `.claude/kit.json` stamps, `~/.claude/kit/projects.json`.
- **New private GitHub repo:** `CKamarakis/ac-workbench-inbox`.
- **Harness review:** adapts PM-OS reviewer logic in our own words only. The kit repo is public.
