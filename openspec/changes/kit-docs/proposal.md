## Why

M7 keeps each change's specs and design true to what was built, but the record is scattered across spec files and archived change folders, written for the agent. The user can't browse what a product does, how it roughly works and why it is that way. Toughbubble's Storms already has more behaviors than anyone can track. M8 turns the record into one page the user reads, rebuilt at each archive at no token cost.

## What Changes

```
 /opsx:apply ─▶ /kit:verify (docs sync) ─▶ /opsx:archive
                     │                         │ spec sync
                     │ may propose a           ▼
                     │ foundation card    "rebuild docs page?" ── yes ─▶ docs.mjs build
                     ▼                                                       │
 knowledge/foundations/*.md ──┐                                              ▼
 knowledge/docs/<path>.md   ──┼──▶ /kit:docs (draft missing notes, ──▶ knowledge/docs/index.html
 knowledge/docs/tools.md    ──┤     you confirm per item)                (committed, offline,
 openspec/specs/**  archive ──┤                                            in the archive commit)
 decisions.md  package.json ──┘
```

- **New skill `/kit:docs`.** Scans the project, drafts only the missing or stale curated notes (per sub-feature "how it works, roughly" and "why"; the tools inventory; foundation cards), asks the user per item, then builds the page.
- **New script `docs.mjs`** (zero dependencies): `scan` and `build`. Rebuilds are deterministic and cost no tokens.
- **The page** (`knowledge/docs/index.html`, one offline file, committed): three panels: tree (foundations, tools, products › sub-features) / behavior (requirements and GIVEN/WHEN/THEN scenarios) / why (reasons, cards, the change behind it, open decisions as "undecided"). History per sub-feature. Look designed with Impeccable.
- **Rebuild during archive.** After the spec sync, the agent asks to rebuild the page and puts it in the archive commit. The archive gate carries the reminder.
- **Links into the kit:**
  - `/kit:next` suggests `/kit:docs` when the page is older than the newest archived change;
  - `/kit:ready` checks planned tools against the tools inventory;
  - the docs sync may propose a foundation card for a decision that shapes more than one sub-feature;
  - `/kit:start` mentions `/kit:docs` under Later;
  - a `docs` phase after `close` in the lane map, owned by `/kit:docs`.
- **Not in this change:** backfill of an already-built project; planned sub-features from PRD non-goals (deferred); the M5 cockpit.

## Capabilities

### New Capabilities
- `living-docs`: the `/kit:docs` skill, the curated notes (capability notes, tools inventory, foundation cards), `docs.mjs scan` and `build`, and the page.

### Modified Capabilities
- `quality-gates`: the archive gate reminds the agent to rebuild the docs page into the archive commit.
- `skill-routing`: `/kit:next` suggests `/kit:docs` when the page is stale; a `docs` phase in the lane map.
- `build-readiness`: the new-tool check also reads the tools inventory.
- `docs-sync`: a decision with depth may be proposed as a foundation card.
- `project-starter`: the setup summary mentions `/kit:docs` under Later.

## Impact

- New: `plugins/kit/skills/docs/`, `plugins/kit/scripts/docs.mjs` and its tests, `evals/docs/`, `evals/trials/kit-docs.md`.
- Changed: `plugins/kit/hooks/archive-gate.mjs`, `plugins/kit/scripts/next.mjs`, the `ready`, `verify` and `start` skills, `toolkit.yaml` (phase), README, kit version 0.7.0.
- Projects get `knowledge/docs/` and `knowledge/foundations/` only when they run `/kit:docs`.
- This repo: Impeccable installed per project (engine v0.1.14; the registry reviewed v0.1.9).
- **Unverified:** whether `/opsx:archive` merges into nested spec paths (`specs/storms/stickies/`). Tested first, in a throwaway folder.
