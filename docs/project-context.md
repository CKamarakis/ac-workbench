# prd-pipeline — Project Context

Living context doc. Input for OpenSpec (`/opsx:explore`, `/opsx:propose`). Last updated: 2026-09-29.

## Goal

A reusable Claude Code plugin: voice idea -> transcript -> PRD in Notion -> repo copy -> fed into any project's OpenSpec workflow.
Constraints: free to run (beyond the existing paid Claude plan), set up once, available in every project.

Pipeline: capture (voice) -> transcribe -> shape into PRD -> store in Notion -> consume via `/opsx:explore`, `/opsx:propose`.

## Decided

- **Store:** Notion free plan, official hosted Notion MCP (`https://mcp.notion.com/mcp`, OAuth). Scope the agent to a dedicated workspace or page, because it inherits full Notion permissions.
- **Transcription:** free, outside Notion (phone dictation, Win+H, Claude Code `/voice`, local Whisper).
  - Verified 2026-09-29: Notion AI Meeting Notes is Business-plan only (about $20/user/mo) and not on Free or Plus.
- **Packaging:** a Claude Code plugin in its own GitHub repo that doubles as its own marketplace:
  - `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`, with plugin source `"."`.
  - Install once with `claude plugin marketplace add <owner>/prd-pipeline`, then install the plugin.
  - Verified against code.claude.com plugin docs on 2026-09-29.
- **Plugin layout (verified):**
  - `skills/<name>/SKILL.md`, `.mcp.json` at the plugin root, `templates/`.
  - Skills are namespaced (`/prd-pipeline:<skill>`), so use short skill names.
  - `userConfig` in `plugin.json` is available for user-level settings.
  - Per-project settings go in `.claude/prd-pipeline.json`.
- **OpenSpec** in consuming projects stays untouched. The plugin only feeds it context.
- **First test consumer:** Toughbubble (Next.js notes/boards app, already on OpenSpec).

## Proposed (still to be confirmed in OpenSpec)

- **PRD storage: both places, one owner at a time.**
  - Notion owns Inbox + Draft (mobile capture and editing).
  - At `Ready`, the PRD is exported to `docs/prd/<slug>.md` in the target repo. From then on the repo copy is the source of truth, and OpenSpec reads it.
  - Status and links are written back to Notion (In progress / Done + link to the OpenSpec change or commit).
  - No true two-way sync, to avoid conflicts.
  - User priority: communication in both directions, transparent, free.
- **v1 scope:** `capture` -> `shape` -> `next`. `init` can come later.

## PM framework: PM-OS v1.1 (Aakash Gupta)

- The user bought a license, so personal use and modification are fine. Redistribution is not.
- **Never commit PM-OS files to this repo.** It lives in the repo folder (currently `PM-OS-v1.1/`) as a local reference only. The `.gitignore` pattern skips any version or spelling (e.g. `PM-OS-v2.1`, `pm_os`, `PMOS`), so a new version needs no changes.
- Format: a Claude Code workspace with 41 skills (`.claude/skills/*/SKILL.md`), 7 reviewer sub-agents, templates, a context library and strategy frameworks.
- Key pieces for us: `/prd-draft`, `/prd-review-panel`, `templates/prd-template.md`, `/create-tickets`.
- **Approach:** learn from it and adapt its tested logic to our needs; don't build from scratch.
  - Rewrite the logic in our own words rather than copying text into the repo.
- It is aimed at company PMs (stakeholders, exec voice, rollout). Too heavy for solo work as-is.

## Ideas to discuss (user requests, 2026-09-29)

1. **Modes:** `solo` (lean PRD, no stakeholders) vs `team/client` (stakeholders, reviews, tickets). The project may grow into ticket creation and more.
2. **Explore PM-OS for more to reuse:** review panel, tickets, metrics, meeting notes, strategy frameworks, and so on.
3. **Visual discussion:** design discussions should use visual aids and explanations (diagrams, overviews), not only text.
4. **Visual library / product overview.** A PRD alone gives no overview of the product, so the user wants one place that shows:
   - which features/PRDs exist and their status (idea / draft / ready / building / done)
   - what has been built
   - links to each project (repo, Notion, deployments)
   - a detailed view of each component

   Goal: stop hunting across tools.
5. **Tools coming from the user:** a couple of tools for keeping memory between conversations, running multiple agents, and similar. Evaluate them when they're shared.

## Next steps

1. ~~Move PM-OS out, `git init`, install OpenSpec 1.13.2, `openspec init --tools claude`~~ (done 2026-09-29).
   - `openspec/config.yaml` points to this doc and requires visual aids in proposals.
   - The `openspec` CLI lives in `%APPDATA%\npm`, which is not on the Git Bash PATH. Use `"$(npm prefix -g)/openspec"` from Git Bash.
2. The user shares memory and multi-agent tools inside the OpenSpec flow. Evaluate them there.
3. `/opsx:explore` using this doc, with visual aids, then `/opsx:propose`.
