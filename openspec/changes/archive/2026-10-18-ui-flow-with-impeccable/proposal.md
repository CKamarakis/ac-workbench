# Proposal

PRD: `knowledge/prds/ui-flow-with-impeccable.md @ c0cac8d`
Milestone: M16 (T2-T4)

## Why

In web-ui projects the kit installs Impeccable but only routes it to polish after building (lane `ui-polish`). Its planning and review commands (`shape`, `harden`/`clarify`, `critique`, `audit`) are never called, so UI work reaches apply with thin UX decisions and nothing reviews the result as UI; during apply only Impeccable's own hooks run, flagging after an edit. The user decided on 2026-10-18 (explore record `knowledge/explore/impeccable-in-flow.md`) to call single Impeccable commands at the kit's own stages, not run Impeccable's flow next to OpenSpec.

## What Changes

- **Web-ui project** (one rule for all three steps): `.claude/kit.json` says `project_type: web-ui`, or the project has Impeccable installed (`.claude/skills/impeccable`) or a `next.config.*` file. A new `ready.mjs web-ui` command answers it.
- **`/kit:prd`** offers `/impeccable shape` once, for a web-ui PRD that touches a screen; on a yes, the confirmed brief goes into the PRD's UX notes (per section, on the user's yes). It never runs `shape` on its own.
- **`/kit:ready`**:
  - a new **`ui-review`** safeguard, recommended when the change's `design.md` or `tasks.md` names UI files (pages, components, styles) in a web-ui project, with the reason; words alone never add it;
  - its gap check in web-ui projects also covers empty, loading, error, permission and overflow states and unclear copy (Impeccable's `harden` and `clarify` points).
- **`/kit:verify`**: when `ui-review` is chosen, run `/impeccable critique` and `/impeccable audit` on the change's UI and record each finding in `verify.md` as advisory, with a link to Impeccable's report in `.impeccable/critique/`; when PRODUCT.md or DESIGN.md is missing, offer `/impeccable init` or `document` first. Not chosen: the report says so.
- Unchanged: Impeccable's hooks; `live`/`generate` only on request; Impeccable's finish reviewer isn't used.

```
 /kit:prd ---- web-ui + screen? --> offer /impeccable shape --> brief in PRD "UX notes"
     |
 /opsx:propose --> /kit:ready ---- names UI files? --> recommend ui-review  (+ states/copy gaps)
                        |
 /opsx:apply (Impeccable hooks as today)
                        |
 /kit:verify ---- ui-review chosen? --> critique + audit --> verify.md (advisory) + link
                        |               (PRODUCT.md / DESIGN.md missing -> offer init/document)
 /opsx:archive
```

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `build-readiness`: web-ui project rule; `ui-review` safeguard; UI states and copy in the gap check.
- `prd-authoring`: `shape` offered for web-ui PRDs that touch a screen.
- `quality-gates`: UI review at verify when chosen.

## Impact

- **Changed:** `plugins/kit/scripts/ready.mjs` (`web-ui` command, `ui-review` in `recommend`/`SAFEGUARDS`, `--ui-why`), `plugins/kit/scripts/verify.mjs` (`ui` review row and `ui` findings, missing PRODUCT.md/DESIGN.md item), `plugins/kit/skills/{prd,ready,verify}/SKILL.md`, tests and evals for them.
- **No new dependency.** Impeccable is already a `web-ui` type tool; the kit only calls its commands. Cost: a `critique`/`audit` run used about 69k output tokens in the M4 trial (unverified for this change; M12 measures it), so it runs only when chosen.
- **Unverified:** whether Impeccable's hooks run on Windows (registry note); M12 on Acme checks it.
