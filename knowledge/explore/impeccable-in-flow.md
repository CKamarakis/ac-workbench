---
title: Impeccable in the kit flow
sources:
  - notes/kit-workflow/2026-10-18-impeccable-in-the-kit-flow-which-skills-at-which-stage.md
prd: prds/ui-flow-with-impeccable.md
---

# Impeccable in the kit flow

Written by the kit (`explore.mjs`) at the end of `/opsx:explore`; saves only add.

## Decisions

- Impeccable's own flow (shape -> new-work -> build -> finish review) is not run next to ours; the kit calls single Impeccable commands at its own stages (same lesson as SuperSpec)
- shape runs during /kit:prd: in a web-ui project whose PRD touches a screen, the PRD skill offers /impeccable shape once (never runs it on its own); the confirmed brief goes into the PRD's UX notes section
- ui-review is a safeguard: /kit:ready recommends it when the change touches UI in a web-ui project (from the files design.md and tasks.md name: pages, components, styles; not from words); the user can drop it
- ui-review at /kit:verify runs /impeccable critique and /impeccable audit; findings are advisory, like code review; Impeccable's finish reviewer is not used (it expects its own direction contract and comps)
- /kit:ready in web-ui projects uses Impeccable's state list (empty, loading, error, permission, overflow) and clarify's copy points as part of its gap check (skill text, no extra command)
- Apply: Impeccable's hooks stay as they are; live and generate (visual variants) only on the user's request
- If PRODUCT.md or DESIGN.md is missing when ui-review runs, verify offers /impeccable init or document first
- Roadmap: a new milestone before M12, so the Acme proof tests the full UI flow

## Open questions

