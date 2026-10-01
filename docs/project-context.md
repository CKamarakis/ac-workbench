# ac-workbench — Project Context

Living context doc. Input for OpenSpec (`/opsx:explore`, `/opsx:propose`). Last updated: 2026-09-29.

Formerly `prd-pipeline`. Renamed on 2026-09-29, when the scope grew from one plugin into a personal kit.

## Goal

A **personal Claude Code kit**. It sets up projects with good defaults in minutes, records what each tool is worth (backed by evidence), and shows everything in one place.

Constraints:
- Free to run beyond the existing paid Claude plan.
- Set up once, and it works in every project.
- The MVP is local only.

**Order of work, current position and drift log: [`docs/roadmap.md`](roadmap.md). Read it first.**

Active changes: [`kit-local-mvp`](../openspec/changes/kit-local-mvp/) (core kit, M1) and [`kit-overview-feedback`](../openspec/changes/kit-overview-feedback/) (cockpit, feedback, harness review, M5). prd-pipeline (M2) is next after M1.

```
 ac-workbench (marketplace repo)
  |-- toolkit.yaml ........ registry: tools, tiers, verdicts, lanes
  +-- plugins/kit
       |-- /kit:start ..... project starter (Tier 2 basics + type add-ons)
       |-- /kit:next ...... next-step suggestion from OpenSpec status + lane map
       |-- /kit:feedback .. capture feedback -> GitHub Issues inbox
       +-- /kit:harness-review  8-layer checklist review
  tools/ ... validator, cockpit build, eval runner (dev only)
```

## Decided (design D1–D12, kit-local-mvp)

- **D1 Layout:** one marketplace containing one `kit` plugin under `plugins/kit/`. prd-pipeline will be added later as a second plugin.
- **D2 Registry:**
  - `toolkit.yaml` is the source you edit by hand.
  - The validator writes a generated copy, `plugins/kit/data/toolkit.json`, which is committed.
  - The runtime reads only the JSON, so it needs no dependencies.
- **D3 Projects:**
  - The project list is kept per machine, in `~/.claude/kit/projects.json`.
  - Each project gets a stamp file, `<project>/.claude/kit.json`.
- **D4 Starter:** the starter plans before it applies, so it is idempotent and never overwrites a file without confirmation.
- **D5 Managed sections:** the kit only edits text between its own markers in CLAUDE.md and `.gitignore`.
- **D6 Lanes:** the lane map is built from registry data. `/kit:next` maps the OpenSpec status to a phase, then looks up the owner of that phase.
- **D7 Cockpit:** a static HTML page built offline by a single command.
- **D8 Evals:**
  - The kit owns the eval case and run format.
  - The engine that runs the cases can be swapped.
- **D9 Feedback:**
  - Items are filed as GitHub issues with `gh`.
  - If that fails, they go to a local pending folder and are never lost.
- **D10 Harness review:** a read-only checklist skill.
- **D11 Build order:**
  1. Sandbox smoke test.
  2. A/B trial of the registry and validator: plain OpenSpec vs SuperSpec.
  3. The remaining pieces.
- **D12:** this rename.

Earlier decisions that still hold:
- **Packaging:** the repo doubles as its own marketplace (`.claude-plugin/marketplace.json`). Skills are namespaced, e.g. `/kit:<skill>`. Verified against the code.claude.com plugin docs on 2026-09-29.
- **OpenSpec:** consuming projects keep their own OpenSpec. The kit sets it up and feeds it context.
- **First test consumer:** Toughbubble (Next.js, already on OpenSpec).

## Later: prd-pipeline plugin

The original idea: voice idea -> transcript -> PRD in Notion -> repo copy -> OpenSpec. It is out of scope for the MVP. Notes so far:
- **Store:** Notion free plan, via the official hosted Notion MCP (`https://mcp.notion.com/mcp`, OAuth). Scope it to a dedicated page, because the agent inherits full Notion permissions.
- **Transcription:** free, outside Notion (phone dictation, Win+H, `/voice`, local Whisper). Notion AI Meeting Notes needs the Business plan (verified 2026-09-29).
- **PRD ownership (proposed):**
  - Notion owns Inbox and Draft.
  - At `Ready`, the PRD is exported to `docs/prd/<slug>.md`, and the repo copy becomes the source of truth.
  - Status is written back to Notion. There is no two-way sync.
- **Modes idea:** `solo` (lean) vs `team/client` (stakeholders, reviews, tickets).

## PM framework: PM-OS v1.1 (Aakash Gupta)

- Licensed for personal use and modification. **Never commit or redistribute it.**
- It lives in the repo folder (`PM-OS-v1.1/`) as a local reference only. The `.gitignore` patterns match any version or spelling.
- Useful pieces: `/prd-draft`, `/prd-review-panel`, the PRD template, `/create-tickets`, and the reviewer sub-agents (input for harness-review, adapted in our own words).

## Open ideas

- A visual product overview (features/PRDs and their status, links, components). The cockpit is the first step towards this.
- Tools from the user (memory between conversations, multi-agent, harness/evals): evaluate them through the registry and evals.
- Adopt pieces of ECC one at a time, never as a bulk install.

## Environment notes

- The `openspec` CLI lives in `%APPDATA%\npm`, which is not on the agent shell's PATH.
  - Git Bash: use `"$(npm prefix -g)/openspec"`.
  - PowerShell: prepend `$env:APPDATA\npm` to `$env:PATH`.
- `gh` 2.101.0 is installed at `C:/Program Files/GitHub CLI/gh.exe` and signed in (checked 2026-09-29), but it is not on the Git Bash PATH. `jq` 1.8.2 and gitleaks 8.30.1 were installed via winget on 2026-09-29 (`winget install --id jqlang.jq -e`, `winget install --id Gitleaks.Gitleaks -e`). winget adds them to the user PATH, so shells opened before the install need the full path under `%LOCALAPPDATA%MicrosoftWinGetPackages`.
- **Secret scan (D15):** `.githooks/pre-commit` runs gitleaks on staged changes. Enable it once per clone with `git config core.hooksPath .githooks`. Full history scan: `gitleaks git --redact .`
- GitHub remote: https://github.com/CKamarakis/ac-workbench (public since 2026-09-29).
