# Trial: build-readiness live on the Toughbubble copy (build-readiness 7.1)

Date: 2026-10-12. Claude Code CLI in VS Code, Windows 11, Opus 5.5. Kit 0.6.0 loaded from the local marketplace (`/kit:ping`: plugin root `ac-workbench/plugins/kit`). Note: `installed_plugins.json` still says 0.5.3; the directory marketplace loads the working tree anyway.

Test bed: `Projects/temp/Toughbubble` (clone on `feat/storms-canvas`, `3b2f403`, no remote). One session, run by the user: `/kit:start`, `/kit:ping`, `/kit:verify storms-canvas`, `/opsx:propose`, `/kit:ready`.

User verdict: "The experience was fine."

## 1. `/kit:start` re-sync

- Asked one question (type, web-ui recommended from `next.config.ts`), then showed the diff: routing 0.5.3 → 0.6.0 (adds the `ready` phase and the two quality-gate rules), `.claude/kit.json`, install playwright-cli.
- **The user chose Cancel.** Nothing changed; the copy's `CLAUDE.md` still says kit 0.5.3 with no `ready` row. The agent said how to apply later (`/kit:start web-ui`).
- So the routing re-sync is **not tested** in this trial. `/kit:ready` still ran, because it was called by name.

## 2. `/kit:verify storms-canvas`: docs sync against the dry run

| Dry run (note, 2026-10-12) | Live result | Match |
|---|---|---|
| docs last changed 2026-10-10 (`ccb7873`), 29 code commits | `ccb7873` 2026-10-10, **31** code commits | date yes; count differs by 2 (counting rule differs; not checked which is right) |
| behavior: corrupt board loads as empty (**flag**) | D2, asked as "is this what you want?"; user: keep | yes |
| behavior: wheel/pinch over the toolbar zooms the board | D5, spec scenario | yes |
| behavior: undo ends an open text edit | D7, spec scenario | yes |
| behavior: fit on one sticky zooms to ~350% | **not found** | **miss** |
| decision: shadows only at ≥50% zoom | D1 (sorted as behavior), asked; user: keep | yes (other kind) |
| decision: split saves, deletes first, 5,000 per chunk | D8 | yes |
| decision: full undo history each save (revisit in storms-arrange) | D9 | yes |
| decision: speed bar ≤33 ms kept (**flag**: sign-off) | D3, asked; user confirmed | yes |
| `fake-indexeddb` unplanned | D4, listed under unplanned dependencies | yes |
| 10 of 16 rulings left out | **6** left out | wrote 2 more than the dry run |

- Extras written beyond the dry run: D6 dot grid thins below 50% (a real visible behavior, reasonable); D10 mixed-case UUIDs count as different ids (borderline: closer to "how the build ran").
- Score: 9 of 10 dry-run items found, both flags asked, one behavior missed, slightly over-documents.
- Writes went through two batched yes/no questions (3 spec scenarios, 7 design notes); `openspec validate` passed after; all 10 recorded in `decisions.md`.

Other findings during verify:
- **`verify.md` overwritten.** The copy had a SuperSpec verify report (task 10.4 open, drift warnings, speed-bar sign-off note). The kit report replaced it; the old content survives only in git. Open task 10.4 (the user's testing-plan run) isn't mentioned in the new report.
- The first `/code-review` run covered only one commit (`6fbd524`, a `.gitignore` line). The agent noticed and re-ran it on the full range.
- Git Bash rewrote `/code-review` in a note into a Windows path (MSYS path conversion). The agent caught and re-recorded it.
- Expected in a copy: `node_modules` missing (agent ran `npm ci`), integration tests need `.env.local` (advisory), `/security-review` needs `origin/HEAD` (recorded as substitute), no `python` (fell back to Edit).
- Result: pass. 1 low security finding, 10 code-review findings (4 medium), all advisory.

## 3. `/opsx:propose` + `/kit:ready` on a fresh change

- Propose found that `image-lightbox` was already archived (2026-10-09). It asked one question and scoped the change down to `image-viewer-single-click`: one click opens the viewer, and an Edit button selects the image. `/kit:judge`: plain OpenSpec.
- `/kit:ready` asked 3 items in one batch, each with a recommended option. The user took all three recommendations:
  - D1 confirm: no note is read-only today, so drop the untestable read-only scenario and keep the code guard;
  - D2 gap: Edit button only on ready images (not uploading or failed);
  - D3 gap: a click on an already-selected image opens the viewer.
- It wrote the answers into the spec and design, fixed a wrong test tool in task 2.1 (jsdom → happy-dom, as the project uses), and passed strict validation. `decisions.md`: open 0, readiness check recorded at `3b2f403`.
- All 3 were real gaps that `/opsx:apply` would otherwise have decided on its own. No noise.

## Usage

The user's `/cost` snapshots (subscription, so tokens matter more than dollars):

| Step | API time | Wall | Output | Input | Cache read | Cache write | Session limit |
|---|---|---|---|---|---|---|---|
| start (cancelled) + ping + verify | 7m45s | 9m56s | 42.1k | 41.2k | 5.5M | 241.6k | 42% → 52% |
| propose | +3m10s | +5m17s | +18.3k | +0.1k | +4.0M | +53.8k | → 56% |
| ready | +1m00s | +3m28s | +6.1k | +0.5k | +1.6M | +13.8k | → 57% |

- Verify is the expensive step: about 10% of a session limit. Most of that is the code review on a ~30-commit build and the docs sync. It's not split further (**unverified** split).
- `/kit:ready` is cheap: about 1 minute and 6k output tokens.

## Verdict

- **Docs sync:** works on real data. 9 of 10 dry-run items found and both flags asked. Fix candidates: the missed "fit zoom" behavior (it is in `apply.md` "Visible changes", line 67, so the scan listed it and the agent dropped it when sorting: every visible change should end up written or declined, never silently left out), and not overwriting a verify report the kit didn't write.
- **`/kit:ready`:** works. It found real gaps, asked them in one batch and wrote the answers back.
- **Not covered:** the `/kit:start` routing re-sync (cancelled), and Given/When/Then PRD drafting (6.1; `/kit:prd` wasn't run).
