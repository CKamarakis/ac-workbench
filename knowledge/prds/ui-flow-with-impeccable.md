---
title: UI flow with Impeccable
status: Shipped
sources:
  - notes/kit-workflow/2026-10-18-impeccable-in-the-kit-flow-which-skills-at-which-stage.md
change: ui-flow-with-impeccable
---

<!-- Keep it to one or two pages. Every section should help someone decide or build. Write "Unknown" or move it to Open questions rather than guessing. -->

## Problem

In web-ui projects the kit installs Impeccable but only uses it to polish after building. Its planning and review commands sit unused: `shape` (UX before code), `harden` and `clarify` (states and copy), `critique` and `audit` (review). So UI work enters apply with thin UX decisions, and nothing reviews the result as UI. During apply, only Impeccable's own hooks run, and they flag problems after an edit rather than steer it.

**Bet:** if the PRD carries a `shape` brief and verify can run a UI review when a change touches UI, UI changes get decided before code and checked after, at a cost you choose per change, because single Impeccable commands are called at the kit's own stages instead of running a second flow.

## Users

The kit's owner, building web-ui projects (first: Acme) with an AI agent.

## Goals and success measures

- **Goal:** UI work is shaped before code and reviewed after, when it matters.
- **Measure:** in a web-ui project, a PRD that touches a screen gets the `shape` offer; a change that touches UI files gets `ui-review` recommended at ready; when chosen, verify records `critique` and `audit` findings. Checked on Acme (M12).
- **Must not get worse:** non-UI and non-web-ui work. Nothing changes for them.

## Scope

**In:**
- `/kit:prd` offers `/impeccable shape` once, for a web-ui PRD that touches a screen; the confirmed brief goes into the PRD's UX notes.
- `/kit:ready`: a `ui-review` safeguard ("touches UI" from the files `design.md` and `tasks.md` name), plus Impeccable's state list and copy points in the gap check.
- `/kit:verify`: when `ui-review` is chosen, run `critique` and `audit` and record their findings (advisory); offer `init` or `document` when PRODUCT.md or DESIGN.md is missing.

**Out (and why):**
- Impeccable's own flow and finish reviewer: a second flow next to ours; the finish reviewer expects its own direction contract.
- Running `shape` without asking: it's an interview and it costs tokens.
- `live` and `generate` in the flow: only on your request.
- Changing Impeccable's hooks.

## Requirements

- A project counts as web-ui when `.claude/kit.json` says `project_type: web-ui`, **or** when it has Impeccable installed (`.claude/skills/impeccable`) or a `next.config.*` file.

**PRD: shape**
- Given a web-ui project and a PRD that touches a screen, when I draft or update the PRD, then I'm offered `/impeccable shape` once; on a yes, its confirmed brief is written into UX notes (per section, on my yes).
- Given a project that isn't web-ui, or a PRD with no screen, then no `shape` offer is made.

**Ready: ui-review**
- Given a web-ui project and a change whose `design.md` or `tasks.md` names pages, components, styles or code that generates pages users see, when I run `/kit:ready`, then `ui-review` is in the recommended safeguards, with that reason.
- Words alone ("button", "screen" in a sentence) never add `ui-review`.
- Given a web-ui project, when ready looks for gaps, then it checks the change for empty, loading, error, permission and overflow states and for unclear copy.

**Verify: ui-review**
- Given `ui-review` is chosen, when I run `/kit:verify`, then `/impeccable critique` and `/impeccable audit` run on the change's UI; each finding is recorded in `verify.md` as advisory, with a link to Impeccable's own report in `.impeccable/critique/`.
- Given `ui-review` is chosen and PRODUCT.md or DESIGN.md is missing, then verify offers `/impeccable init` or `document` first.
- Given `ui-review` isn't chosen, then verify doesn't run it and says so.

## UX notes and assets

Flow: PRD (+ `shape` brief) -> propose -> ready (`ui-review`?) -> apply (Impeccable's hooks) -> verify (`critique` + `audit` when chosen) -> archive.

## Risks

| Risk | How we'd notice | What we'd do |
|---|---|---|
| Review cost (about 69k tokens in the trial) | Token use on Acme | Name target and scope in the call; drop `ui-review` for small changes |
| "Touches a screen" judged wrongly | Missing or unwanted offers | Use named files, as with the other ratings |
| Impeccable's hooks don't run on Windows | M12 on Acme | Report it; the flow doesn't depend on them |

## Open questions

-
