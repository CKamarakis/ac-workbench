# ac-workbench — Project Context

Living context doc. Input for OpenSpec (`/opsx:explore`, `/opsx:propose`). Last updated: 2026-10-06.

Formerly `prd-pipeline`. Renamed on 2026-09-29, when the scope grew from one plugin into a personal kit.

## Goal

A **personal Claude Code kit**. It sets up projects with good defaults in minutes, records what each tool is worth (backed by evidence), and shows everything in one place.

Constraints:
- Free to run beyond the existing paid Claude plan.
- Set up once, and it works in every project.
- The MVP is local only.

**Order of work, current position and drift log: [`docs/roadmap.md`](roadmap.md). Read it first.**

Active changes: [`kit-overview-feedback`](../openspec/changes/kit-overview-feedback/) (cockpit, feedback, harness review, M5). M1 (`kit-local-mvp`) and M2 (`prd-pipeline`, `prd-pipeline-followups`) are archived (2026-10-07); current specs are in [`openspec/specs/`](../openspec/specs/). Next: M3 quality gates.

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

## prd-pipeline (M2): explore notes

Explored 2026-10-02 to 2026-10-06 (`/opsx:explore`). **Built 2026-10-06** as change [`prd-pipeline`](../openspec/changes/archive/2026-10-07-prd-pipeline/) (kit 0.2.0; trial: `evals/trials/prd-pipeline-live.md`). On 2026-10-06 the Notion model was dropped after a live spike: PRDs and notes now live as Markdown in a `knowledge/` folder in each project's repo (see the drift log in [`roadmap.md`](roadmap.md)).

### Research so far

- **2026-10-02: where teams keep the source of truth.**
  - Product teams keep intent in Notion.
  - Spec-driven teams keep specs in the repo ("or it rots").
  - Drift is the main unsolved problem.
  - The pattern that keeps appearing: **one home per layer**, with links between them.
  - Sources: [Atono](https://atono.io/blog/how-teams-manage-ai-product-context), [SparkFabrik SDD playbook](https://playbook.sparkfabrik.com/ai-development/spec-driven-development), [Thoughtworks Radar](https://www.thoughtworks.com/en-us/radar/techniques/spec-driven-development), [field study](https://github.com/ianhxu/agentic-engineering-field-study/blob/main/04-spec-driven-development.md).
  - Thin intel: mostly vendor or practitioner posts, no independent survey.
- **2026-10-04: tools.**
  - **`/voice`:** free, and it uses no tokens. One recording stops after 2 minutes, or after 15 seconds of silence.
  - **Paid voice apps** that have their own MCP (Voicenotes, Plaud, Wispr Flow) are skipped, because the kit must be free to run.
  - **Hosted Notion MCP:** on every plan it can create databases, views and pages, update properties and add comments. `notion-query-data-sources` is metered below the Business plan.
  - **Notion permissions:** OAuth can't limit the agent to certain pages.
  - **Linear:** it has an official hosted MCP.
  - Sources: [voice docs](https://code.claude.com/docs/en/voice-dictation), [Notion MCP tools](https://developers.notion.com/docs/mcp-supported-tools), [Linear MCP](https://linear.app/docs/mcp).
- **2026-10-06: Notion live spike** (free workspace, read-only, test page with text and 2 images).
  - **Text:** clean. Small quirks: pipes come back escaped (`\|`), blank lines as `<empty-block/>`. `notion-fetch` returns `page_last_edited_at`.
  - **Images:** fetch gives stable `notion-file-block://` refs. `notion-get-file-download-urls` turns them into signed S3 links that expire after 5 minutes. Downloaded and viewed both; large text readable, fine print blurry.
  - **Query limit:** `query_data_sources` in SQL mode hit `usage_limit_reached` after about 10 calls (cutoff between call 10 and 12; calls ran in parallel batches). Reset window unknown. After that, rows mode, view mode and fetch all failed because the MCP asked to sign in again (cause unknown).
  - `get_tool_access` also showed: AI search and multi-source queries need Business; search filters and sorting are Business only.
- **2026-10-06: alternatives.**
  - **Asana MCP (official V2, `mcp.asana.com/v2/mcp`):** free plan API limit 150 requests/min (search 60/min). Needs your own OAuth app in Asana's developer console. ~17 tools; the agent can read and write task descriptions and post HTML comments, but there is no tool for project briefs. Free-plan MCP access is only claimed by third parties (**unverified**). Sources: [MCP docs](https://developers.asana.com/docs/using-asanas-mcp-server), [tools reference](https://developers.asana.com/docs/mcp-tools-reference), [rate limits](https://developers.asana.com/docs/rate-limits), [connect guide](https://developers.asana.com/docs/connecting-mcp-clients-to-asanas-v2-server).
  - **Google Docs/Drive:** Claude's connector can read and upload; live Doc editing is a web/Desktop beta (Claude Code editing **unverified**). claude.ai connectors load in every session, which breaks per-project scoping. Community Workspace MCPs need your own Google Cloud project. Drive API: 12,000 queries/min per user. Per-section edits are clumsy. Sources: [Claude help](https://support.claude.com/en/articles/10166901-use-google-workspace-connectors), [Drive limits](https://developers.google.com/workspace/drive/api/guides/limits).
  - **Obsidian:** no official MCP (official CLI since v1.12); the community Local REST API plugin has an MCP endpoint and needs Obsidian running. Rejected by the user for having no official MCP. Sources: [mcp.directory](https://mcp.directory/blog/obsidian-mcp-complete-guide-2026), [affine](https://affine.pro/blog/obsidian-mcp-guide).
  - **Plain Markdown in git (chosen):** no MCP, no quota, no expiring links; Claude Code reads images directly; git history replaces "last edited".

### Decided (2026-10-06)

- **P1:** several notes can feed one PRD.
- **P2:** any PRD can reuse any note in the same project. Sharing across projects is out of v1.
- **P3:** a note can be a pointer to another source (Figma, Drive, web, ...). Content stays where it lives.
- **P4:** you edit PRDs by hand freely. The agent proposes changes per section and never overwrites your edits.
- **P5 (revised): the project repo is the source of truth.** PRDs and notes are Markdown in `knowledge/`. The OpenSpec change links the PRD file and the commit it was planned from. Was: Notion as source of truth.
- **P6: dropped** (separate Notion workspace). Notion, Asana and Google Docs are out of v1. The final home stays open, so the folder path is configurable.
- **P7: Linear and Asana are deferred, not rejected.** Later per-project add-ons for team or client work (status, not tasks). Tasks stay in OpenSpec.
- **P8: layout** (configurable per project):

```
 knowledge/
   notes/          one file per note: 2026-10-06-gift-card-flow.md
                   frontmatter: title, date, tags?, source?
                   optional topic folders (notes/checkout/) only when asked
   prds/           <slug>.md, status: Draft/Review/Ready/Building/Shipped, sources: [notes/...]
   assets/         images, screenshots
   archive/        old notes or dropped PRDs; moved on request; skills never read it
```

- **P9:** notes always have a title (suggested by `/kit:capture` if not given). No expiry: you archive by hand. Moving or archiving a note updates the source paths of any PRD that cites it.

### v1 scope (built 2026-10-06)

```
 /voice or typing
      |
 1 /kit:capture  --> knowledge/notes/<date>-<slug>.md (+ assets/)
      |
 2 /kit:prd "<idea>"  shortlist notes -> you tick -> knowledge/prds/<slug>.md
      |               re-run = per-section proposals (P4)
      | status: Ready
 3 /opsx:propose  (CLAUDE.md routing line: read the Ready PRD, link it + commit)
      |
 4 /kit:next  "PRD Ready, no change yet" / "PRD changed since planning" / "archived -> mark Shipped"
```

- `/kit:capture` and `/kit:prd` are new skills with evals. The PRD template adapts PM-OS ideas in our own words.
- `/kit:start` creates `knowledge/` and adds the routing line. `/kit:next` reads PRD status and git history.
- Out of v1: Notion, Asana, Google Docs, any MCP, review panel, cross-project sharing, automatic status write-back.
- Tests run in a throwaway folder or a Toughbubble copy.
- Added after the live trial: after saving a note, `/kit:capture` offers to update a matching PRD (late additions are normal).
- Follow-ups (change `prd-pipeline-followups`, kit 0.3.0, 2026-10-07):
  - PRDs listed newest-updated first;
  - `.txt` transcripts imported as notes;
  - `/kit:start` asks only the project type (opt-ins on demand; summary Done / Needs you / Later);
  - context7 used through `npx` with a routing rule, no sign-in;
  - registry fields `recommend` and `first_use`.
- Live trial: `/opsx:propose` followed the routing rule and wrote the `PRD:` line, so the `rules.proposal` fallback was not needed.

### Open

- Where PRDs finally live (team or client sharing, phone access). The path is configurable so this can change later.
- Whether the PRD skill only drafts, or also runs a review panel.
- **Modes idea:** `solo` (lean) vs `team/client` (stakeholders, reviews, Asana or Linear for status).
- A customer-facing MCP for Toughbubble is being explored in Toughbubble's own repo, not here.
- Transcription stays free: `/voice`, phone dictation, Win+H, or local Whisper.

## PM framework: PM-OS v1.1 (Aakash Gupta)

- Licensed for personal use and modification. **Never commit or redistribute it.**
- It lives in the repo folder (`PM-OS-v1.1/`) as a local reference only. The `.gitignore` patterns match any version or spelling.
- Useful pieces: `/prd-draft`, `/prd-review-panel`, the PRD template, `/create-tickets`, and the reviewer sub-agents (input for harness-review, adapted in our own words).

## Open ideas

- Flow recommendation (OpenSpec vs SuperSpec) from a risk checklist, plus a SuperSpec A/B re-test on a big or risky change, measured in quality and tokens. Input for M3, see the roadmap.
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
