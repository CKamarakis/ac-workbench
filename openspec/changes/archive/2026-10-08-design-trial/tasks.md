# Tasks

## 1. Kit: on-demand browser check

- [x] 1.1 Remove the browser entry from the `web-ui` policy's `advisory` list in `toolkit.yaml`, so no browser reminder appears in default reports. Verify that `npm run registry` passes, and with a `tests/kit/verify.test.mjs` case that a `web-ui` run lists no browser item
- [x] 1.2 `verify.mjs browser --change <name> --result pass|issues [--issue "..."]... [--shots a,b]` (design D5): a "Browser check" section in the report, issues as ADVISORY items `B1…`, screenshot paths, date; never HARD; a re-run replaces the previous browser check. Verify with tests: pass with no issues; issues listed as advisory with the result unchanged; screenshots listed; repeated `--issue` flags kept in order
- [x] 1.3 Add a "Browser check (on request)" section to the `/kit:verify` skill: only when the user asks; start or reuse `npm run dev`; log in with the credentials from `.env.local`; walk the flows the change touches; screenshots into `openspec/changes/<name>/browser/`; record through `verify.mjs browser`. Verify with `evals/verify/cases.yaml` content checks (only on request; never HARD) and a deterministic `browser` case
- [x] 1.4 Bump the kit to `0.5.0`. Verify with `ping.mjs`

## 2. Trial setup (on the Toughbubble copy)

- [x] 2.1 Copy `.env.local` from the real Toughbubble into the copy (read-only on the real one). Confirm the copy's `.gitignore` covers it and that `APP_ENV=development`, by checking the variable name and value only; nothing else is printed. Record the check (not the values) in the trial note
- [x] 2.2 Write `scripts/kit-trial-user.mjs` in the copy (untracked): create a pre-confirmed `kit-trial-<date>@example.com` with a random password through the admin API, and store `KIT_TRIAL_EMAIL`/`KIT_TRIAL_PASSWORD` in the copy's `.env.local`; `--delete` removes it. Verify by running it, and check that the user can log in (a `signInWithPassword` call succeeds)
- [x] 2.3 Check that the app runs: `npm run dev` in the copy, and the sign-in page responds. Check the copy's migrations for how a user's notes and attachments are deleted (cascade or not) and record it for task 6. Write the user's trial script (phases, `/cost` points, prompts) into `evals/trials/design-trial.md`

## 3. Warm-up: Impeccable on the two M3 findings (user session)

- [x] 3.1 The user runs `/impeccable init` (writes `PRODUCT.md`), then a critique and polish on the sidebar collapse: `aria-expanded` always true, and the expand bar pushing content down. Record: did Impeccable find these two itself (before being told)? What else did it find? What got fixed? Hook noise? Tokens and time (`/cost` 0→1). Verify that the trial note has the table for this phase

## 4. Main task: image lightbox (user session)

- 4.1 **Dropped (user, 2026-10-08: shorter trial; the lightbox is real product work for the real Toughbubble).** Was: `/kit:judge` on the PRD, then `/opsx:propose`, then `/opsx:apply`. The build itself is recorded separately (`/cost` 1→2). Verify that the change exists in the copy and its tests pass
- 4.2 **Dropped (same reason; Impeccable was judged on the sidebar warm-up instead, task 3.1).** Was: Impeccable critique, audit and polish on the lightbox (`/cost` 2→3); try its live browser mode once (Windows support is unverified). Record findings, fixes, noise and friction
- [x] 4.3 (Changed by the user, 2026-10-08.) Emil is not trialled in this session. Move `emil-skills` to on-demand in `toolkit.yaml`: `tier: project`, `recommend: 'no'` with the reason, and a verdict citing the trial note. Remove its 14 skills from the copy. Verify that `npm run registry` passes, that a `web-ui` plan no longer installs Emil but lists it under "Available on demand", and that the copy has no Emil skills left
- [x] 4.4 **Done in a reduced form (user, 2026-10-08):** the agent ran the browser check with `playwright-cli` on the sidebar (protected workspace, desktop and 390px, collapse and expand, Escape), recorded in `evals/trials/design-trial.md`; no lightbox, so no `verify.md`. Was: `/kit:verify` plus a browser check on request (`/cost` 3→4): Playwright logs in as the trial user, opens a note with at least two images, clicks one, uses the arrow keys and Escape, takes screenshots, and records through `verify.mjs browser`. Record: did it work on Windows on protected pages, what did it catch that the reviews didn't, and token cost per check. Verify that `verify.md` in the copy has the Browser check section

## 5. Verdicts

- [x] 5.1 Complete `evals/trials/design-trial.md`: one table per tool (issues kept/fixed/noise, tokens, time, friction, overlap, the user's "next project?") and the proposed verdict per design D4. The user confirms or changes each verdict. Verify that the note has all three tables and the user's answers
- [x] 5.2 Add a verdict to each of `impeccable`, `emil-skills` and `playwright-cli` in `toolkit.yaml` (date, status, rationale, `evidence: evals/trials/design-trial.md`), and adjust each entry's status, `skills` and `skip_skills` to match. Verify that `npm run registry` passes and the lane map shows the expected `ui-polish` owner

## 6. Cleanup (runs even if the trial stops early)

- [x] 6.1 Delete the trial user and its notes, attachments and storage objects (cascade, or explicit deletes per task 2.3); confirm with a count query that nothing of the trial user is left; delete the copy's `.env.local` and `scripts/kit-trial-user.mjs`; stop the dev server. Record what was removed (no values) in the trial note

## 7. Integration and docs

- [x] 7.1 Run `npm test`, `npm run evals` and `npm run registry`, all green. Then update `README.md` (the on-demand browser check), `docs/roadmap.md` (M4 status, north-star stage 7) and `docs/project-context.md`, in the same commit as the task checkoffs
