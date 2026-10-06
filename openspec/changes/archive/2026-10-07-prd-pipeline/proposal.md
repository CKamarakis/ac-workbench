# Proposal

## Why

The kit covers planning, tasks and building (stages 4–6 of the north star). It doesn't cover the front of the workflow: capturing an idea, shaping it into a PRD, and handing that PRD to planning. That front end is the reason this project exists (roadmap drift entry 2026-10-01).

The 2026-10-06 explore and Notion spike settled where PRDs live:
- **Notion is out.** On the free plan, `query_data_sources` hit its limit after about 10 SQL calls.
- **Asana, Google Docs and Obsidian were checked and left out of v1.**
- **v1 keeps notes and PRDs as Markdown in a `knowledge/` folder in each project's repo.** No MCP, no quota, no links that expire, and Claude reads images directly.
- Details: `docs/project-context.md`, "prd-pipeline (M2)".

## What Changes

- **New skill `/kit:capture`:**
  - saves a note (typed text, `/voice` dictation, or a pointer to another source) as `knowledge/notes/<date>-<slug>.md`, with a title and frontmatter;
  - archives or moves notes on request, and updates the source paths of any PRD that cites them.
- **New skill `/kit:prd`:**
  - drafts a PRD in `knowledge/prds/<slug>.md` from a template;
  - builds it from notes you pick off a shortlist, and cites them as sources;
  - tracks status Draft → Review → Ready → Building → Shipped;
  - when re-run on an existing PRD, proposes changes per section and never overwrites your edits.
- **`/kit:start` update:**
  - creates the `knowledge/` folders;
  - adds a routing rule so `/opsx:propose` reads the Ready PRD and records the PRD path and commit in the proposal.
- **`/kit:next` update.** It suggests:
  - drafting a PRD when notes exist but no PRD does;
  - proposing a change when a PRD is Ready and no change uses it;
  - re-checking the plan when a PRD changed after its change was planned;
  - marking a PRD Shipped after its change is archived.
- **Registry:**
  - new phases `capture` and `prd`, both owned by `kit`;
  - `notion-mcp` moves from trial to later, with the spike as evidence.
- **Templates:** the starter `CLAUDE.md` and `project-context.md` point to `knowledge/` instead of Notion.

```
 /voice or typing
      |
 /kit:capture ----> knowledge/notes/<date>-<slug>.md   (+ knowledge/assets/)
      |
 /kit:prd "<idea>"  shortlist -> you pick -> knowledge/prds/<slug>.md  (status, sources)
      |                re-run = per-section proposals, you approve each
      | status: Ready
 /opsx:propose  ----> proposal records: PRD path + commit
      |
 /kit:next  ------> "PRD Ready, no change" | "PRD changed since planning" | "archived: mark Shipped"
```

Out of scope for v1:
- Notion, Asana, Google Docs, or any MCP.
- A PRD review panel.
- Sharing notes across projects.
- Notes that expire.
- Writing status back automatically: the kit suggests, and you or the skill change the file only after a yes.

## Capabilities

### New Capabilities
- `knowledge-capture`: the `knowledge/` folder layout, the note format, `/kit:capture`, and archiving or moving notes (keeping PRD sources in sync).
- `prd-authoring`: the PRD format and status, `/kit:prd` drafting from the notes you pick, per-section updates, and how a Ready PRD is handed to `/opsx:propose`.

### Modified Capabilities
- `project-starter`: the starter also creates `knowledge/`, and the routing rules include the PRD handoff to `/opsx:propose`. Added requirements. This capability's base spec is still in the unarchived `kit-local-mvp` change.
- `skill-routing`: the next-step suggestion takes PRD status into account, and the lane map gets the `capture` and `prd` phases. Added requirements, with the same base-spec note as `project-starter`.

## Impact

- **New:**
  - `plugins/kit/skills/capture/`, `plugins/kit/skills/prd/`;
  - a PRD template and a note template under `plugins/kit/templates/`;
  - a small zero-dependency helper script (`knowledge.mjs`) for paths, frontmatter and listing;
  - `evals/capture/`, `evals/prd/`.
- **Changed:**
  - `plugins/kit/scripts/start-plan.mjs` and `start-apply.mjs` (the `knowledge/` folders);
  - `next.mjs` (PRD checks);
  - `lanes.mjs` is unchanged: the new phases come from registry data;
  - `toolkit.yaml` and the generated `plugins/kit/data/toolkit.json`;
  - the `CLAUDE.md` and `project-context.md` templates;
  - `evals/start/`, `evals/next/`.
- **Consuming projects:** after a `/kit:start` re-sync, they get a `knowledge/` folder and an updated routing block. Re-runs show diffs only, as today.
- **No new dependencies or services.** Testing happens in throwaway folders or a copy of Toughbubble, never the real repo.
- **Unverified:** whether `/opsx:propose` reliably follows a CLAUDE.md routing rule to read the PRD. That's the riskiest assumption, and a live trial checks it.
