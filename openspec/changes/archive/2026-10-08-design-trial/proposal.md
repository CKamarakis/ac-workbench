# Proposal

## Why

M4 on the roadmap: three design tools (**Impeccable**, **Emil's skills** and **Playwright CLI**) have been in trial since 2026-10-01. Each has only been read about and installed, never used on real UI work. The kit's rule is evidence before adoption, so each needs a real job and a recorded verdict.

Decisions from the 2026-10-07 explore:
- the trial runs on the `Projects/temp/Toughbubble` copy;
- Playwright is tested on protected pages too;
- the app logs into the Supabase **dev** project with one dedicated trial user, cleaned up afterwards;
- browser checks run **on demand**, not on every verify.

## What Changes

- **The trial itself,** on the Toughbubble copy:
  - **warm-up:** fix the two medium findings from the M3 trial (`aria-expanded` always true; the expand bar pushing content down) with Impeccable;
  - **main task:** build the Ready `image-lightbox` PRD through the normal flow (`/kit:judge`, `/opsx:propose`, `/opsx:apply`, `/kit:verify`), with:
    - **Impeccable:** `/impeccable init`, critique and audit, then polish;
    - **Playwright:** log in, open a note with images, use the lightbox (click, arrow keys, Escape), take screenshots.
  - Per tool, record: real issues found vs noise, tokens and time, Windows friction, overlap, and whether the user wants it in the next project.
- **Verdicts:** each tool gets a new verdict in `toolkit.yaml` (adopted, trial, later or dropped), citing the trial note as evidence.
- **Emil (user decision, 2026-10-08, before the session):** not trialled now and not loaded by default. It moves from the `web-ui` type tools to on-demand (`project` tier, recommended no), for motion-specific work. Whether Impeccable already covers motion is checked during normal work. Its 14 skills were removed from the copy.
- **Kit change (user decision): on-demand browser check.**
  - The `web-ui` test policy no longer lists a browser check in every verify report.
  - `/kit:verify` gets a browser check that runs **only when the user asks** (e.g. before a release, or after a big UI change). Its results are recorded in the report as advisory items, with screenshot paths.
- **Trial setup and cleanup:**
  - `.env.local` is copied from the real Toughbubble into the copy, and never printed or committed;
  - one trial user is created through Supabase's admin API;
  - afterwards, the user, its data and the copied `.env.local` are removed.
- Kit 0.4.0 → 0.5.0.

```
 Toughbubble copy (dev Supabase, trial user)
   warm-up: 2 findings --> Impeccable critique/polish --> fixed?
   image-lightbox PRD --> /kit:judge --> /opsx:propose --> /opsx:apply
        |                     Impeccable: init, critique, audit, polish
        v
   /kit:verify (+ browser check on request: Playwright on protected pages)
        |
   evals/trials/design-trial.md  -->  toolkit.yaml verdicts (adopt / trial / later / drop)
   cleanup: trial user + data + copied .env.local removed
```

Out of scope:
- Figma or Miro MCP;
- design work on the real Toughbubble. Results only reach it if the user later redoes the change there;
- a browser check in CI.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `quality-gates`: an on-demand browser check, recorded in the verify report (ADDED).
- `toolkit-registry`: the test policy no longer carries a per-verify browser check (MODIFIED "Test policy per project type").

## Impact

- **Kit:**
  - `toolkit.yaml`: the `web-ui` policy, three verdicts, and the Impeccable, Emil and Playwright entries;
  - `plugins/kit/scripts/verify.mjs` (a `browser` subcommand);
  - the `/kit:verify` skill;
  - tests and evals;
  - kit version.
- **The Toughbubble copy:** a temporary `.env.local`, a running `next dev`, a `PRODUCT.md` (Impeccable init), the lightbox code. None of it touches the real Toughbubble repo.
- **Supabase dev project:** one trial user and its test notes and images for the length of the trial, then deleted.
- **Unverified:**
  - whether Impeccable's live browser mode works on Windows;
  - Playwright's token cost per check (measured in this trial).
