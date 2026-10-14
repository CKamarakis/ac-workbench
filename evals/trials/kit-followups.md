# kit-followups: build evidence

## 6.2 Re-sync on the Toughbubble copy (2026-10-14, kit 0.9.0)

- Copy at `../temp/Toughbubble`, stamped kit 0.5.3, type `web-ui`.
- `start-plan --type web-ui`: `CHANGE CLAUDE.md` (routing block), `CHANGE .claude/kit.json`; tools playwright-cli, context7 and impeccable all `ok`. No `INSTALL` line, so `/kit:start` asks nothing about tools (spec: "Re-sync with nothing to install").
- `start-apply --files-only --accept CLAUDE.md,.claude/kit.json`: wrote both files (CLAUDE.md +5/-1 lines, stamp 0.5.3 -> 0.9.0), ran no install command. The usage-review blocker (finding 2: "routing only" meant Cancel) is gone.
- Both files were restored afterwards (`git checkout`), so M12's T1 "upgrade to the current kit" starts from 0.5.3.
- Not tried on the copy: a re-sync with a missing tool (the copy has none); covered by `tests/kit/start-apply.test.mjs` "files-only re-sync".

## 5.2 Collapsed product (2026-10-14)

- Built a throwaway page with `storms/stickies`, `storms/saving` and `board` in `../temp`, served it locally, opened it with playwright-cli, closed every product, then set the hash to `#spec/storms/stickies`: Storms went from closed to open and Stickies was the current link. (`file://` pages wouldn't open in playwright-cli, so a local server was used.)

## 1.2 Test folders

- Before: every `npm test` left ~20 `kit-*` folders in `%TEMP%` (11,558 found on 2026-10-13, 185 more on 2026-10-14; all deleted).
- After: `npm test` leaves none in `../temp` or `%TEMP%`. Two leaks found while switching: the eval runner's own tests (`makeSandbox`) and a docs test writing a file next to its folder; both now cleaned up.

## 8.1 Full run (2026-10-14, Windows 11, kit 0.9.0)

- `npm test`: 339 pass, 0 fail (was 327).
- `npm run registry:check`: passes.
- `npm run evals`: no script case failed; judgment cases unscored, as before (M13).
- `npm run smoke`: 36 steps pass (3 new: the `/kit:next` line for an archived decision, deciding it after archive, the page count dropping to 0). `npm run smoke:check` right after: "not needed".
- Leftover folders: none in `../temp` or `%TEMP%` after the runs (15 old `kit-docs-*-secret.md` files from earlier days removed).
- Tokens: not measured.
- Changed while building (in the design): sort with a fixed `'en'` locale instead of a plain `<` (keeps names in human order, still the same on every machine); approval questions show drafts in full in the message (added by the user after the previews cut drafts off).
