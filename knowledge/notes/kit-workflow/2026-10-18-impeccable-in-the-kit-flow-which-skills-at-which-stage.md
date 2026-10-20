---
title: "Impeccable in the kit flow: which skills at which stage"
date: 2026-10-18
tags:
  - kit-workflow
  - impeccable
  - ui
source: voice
---

**Question (user, 2026-10-18):** Impeccable has strong skills for design, UX planning and copy. We install it for web-ui projects, but are we really using it, when planning and when `/opsx:apply` runs? How should it fit our process, so UI/UX work is defined in more detail and with more control? What do others do with OpenSpec plus Impeccable or similar design assistants?

**Found so far (2026-10-18):**
- Installed per project for type `web-ui`. The kit routes it only to `ui-polish` (critique, audit, polish). Explore, PRD, propose, ready, apply and verify never mention it; during apply only its own edit hooks run.
- Its planning and review commands are unused by the kit: `shape` (UX before code), `init`/`document` (PRODUCT.md, DESIGN.md), `harden` (states, edge cases), `clarify` (copy), `critique`/`audit`, and the finish-reviewer agent.
- Possible fit: `shape` at explore/propose -> a UI section in `design.md`; `harden`/`clarify` as a `/kit:ready` checklist; `critique` + `audit` at `/kit:verify`; "touches UI" as a fourth safeguard in `/kit:ready`.
- No documented OpenSpec + Impeccable integration; community guides use them in sequence (plan, then polish). Thin evidence.

**Pasted flow (source unknown, 2026-10-18):** explore + `shape` -> propose with Impeccable terms in `design.md` -> apply with Impeccable's hooks -> `audit` + verify + archive. Checked: the order matches; the claim that hooks "forbid shortcuts" is overstated (they run after edits and at end of turn, and flag rather than block); `/opsx:verify` is `/kit:verify` here.
