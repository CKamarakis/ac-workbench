# Design trial (M4): Impeccable, Emil, Playwright CLI

Change: `design-trial`. Test bed: `Projects/temp/Toughbubble` (a copy with no remote), kit 0.5.0 from the working tree.

## Setup (tasks 2.1–2.3, 2026-10-07)

- **`.env.local`:** copied from the real Toughbubble into the copy (read-only on the real one). Checked: `APP_ENV=development`, and the copy's `.gitignore` covers it (`.env.*`). The six keys were present; no values were printed or recorded.
- **Trial user:** `kit-trial-2026-10-07@example.com`, created pre-confirmed through the admin API (`scripts/kit-trial-user.mjs`, untracked in the copy). The password is random (the dev project's policy needs lower, upper, digit and symbol). Credentials are in the copy's `.env.local` as `KIT_TRIAL_EMAIL` / `KIT_TRIAL_PASSWORD`. Login checked: ok.
- **How deletion works (for the cleanup):**
  - `items`, `item_content`, `attachments` and `user_settings` reference `auth.users` with `ON DELETE cascade`, so deleting the user removes them.
  - **Storage objects** in the `attachments` bucket (`<user-id>/<item-id>/…`) are **not** removed by the cascade. `--delete` removes them first, then counts what's left.
- **App:** `npm run dev` in the copy (port 3001). `/` redirects to `/sign-in`, which returns 200.
  - Side note: Next 16.4 generated an `AGENTS.md` in the copy (`agentRules`).

## Your trial session: script

In `Projects/temp/Toughbubble`, start a session with this repo's kit:
`claude --plugin-dir C:/Users/Chris/Documents/Projects/ac-workbench/plugins/kit`
Start the dev server first (`npm run dev`, port 3001), or let the agent start it at the browser check. (The one started during setup was stopped by Claude Code for low memory.)

Take a `/cost` snapshot at each **[cost N]** (a screenshot is fine).

| Phase | What you do | What to note |
|---|---|---|
| **[cost 0]** | start of the session | |
| **Warm-up: Impeccable** | `/impeccable init` (it writes `PRODUCT.md`; answer its questions briefly). Then: "`/impeccable critique` the sidebar collapse (`src/components/workspace/sidebar.tsx`, `workspace-shell.tsx`)". Don't mention the two known problems first. Then `/impeccable polish` on what it found | Did it find the `aria-expanded` issue and the expand bar pushing content down by itself? Anything else useful? Noise? Hook messages? |
| **[cost 1]** | | |
| **Build the lightbox** | `/kit:judge` on `knowledge/prds/image-lightbox.md`, then `/opsx:propose`, then `/opsx:apply` | (the build itself; not charged to the design tools) |
| **[cost 2]** | | |
| **Impeccable on the lightbox** | `/impeccable critique`, then `/impeccable audit` on the lightbox, then `/impeccable polish`. Try its live browser mode once | Findings, fixes, noise; did live mode work on Windows? |
| **[cost 3]** | | |
| **Verify + browser check** | `/kit:verify`, then: "run a browser check: log in as the trial user, open a note with two images (upload two if needed), open the lightbox, use the arrow keys and Escape, take screenshots" | Did Playwright log in and use protected pages on Windows? What did it catch that the reviews didn't? |
| **[cost 4]** | end | |

Afterwards, answer per tool: **would you want it in your next project?** (yes / maybe / no, and why)

**Emil (user decision, 2026-10-08):** not part of this session. It's on demand only, for motion-specific work, and its 14 skills were removed from the copy. Whether Impeccable covers motion is checked during normal work.

## Results

**Impeccable `init` (user session, 2026-10-08):**
- It wrote `PRODUCT.md` for the whole app (a one-time product context: users, purpose, positioning, stack, brand). Checked in the copy: accurate, including "gift cards are a workflow test only".
- It then offered a whole-app `DESIGN.md` and **asked before starting it**.
- First impression (user): "a cool tool".

**Impeccable warm-up (critique + polish on the sidebar; the user's `/cost` snapshots 0→1):**
- **Scope:** it did more than the plan.
  - `PRODUCT.md` (56 lines);
  - a whole-app `DESIGN.md` (290 lines) plus `.impeccable/design.json`, after asking;
  - a critique of the **whole sidebar** (tree, menus, mobile drawer), not just the collapse;
  - a polish of `sidebar.tsx` and `workspace-shell.tsx`.
- **Cost:** 28m00s wall, 11m52s API; 17.5k input and **69.0k output** tokens; 10.7M cache read, 325.4k cache write; 495 lines added. Plan usage at the start: 19% of the session limit, 39% of the week.
- **Critique quality:** 2 P1s and 3 P2s, each with file and line and a suggested follow-up command.
  - P1: tree roles without arrow keys or roving focus;
  - P1: the mobile drawer isn't modal (no focus move or trap, no Escape, no close button), and "⋯" is invisible on touch;
  - P2: trash with no Undo; a weak "you are here" marker; search that hides matches.
- **Noise:** 1 false positive (email truncation, intentional).
- **Live mode:** its browser detector ran on Windows (it reported 1 browser finding).
- **Polish result, checked in the browser below:**
  - `aria-expanded` is correct now (`false` collapsed, `true` open);
  - the full-width 37px expand bar is **still there**, so the M3 finding about content pushed down isn't fixed.
- **User:** "cool tool", "still happy with its behavior".

**Playwright browser check (run by this agent with `playwright-cli` 0.1.22 on Windows, 2026-10-08):**
- It reused the dev server already on port 3001. It logged in as the trial user, with credentials read from `.env.local` and command output suppressed, so nothing was printed, and reached the **protected workspace**. It took 5 screenshots: desktop open and collapsed, mobile, mobile drawer, mobile after Escape. They were never committed, and were deleted with the copy on 2026-10-08; the findings above are the record.
- **Confirmed fixed:** `aria-expanded` (measured).
- **Confirmed still broken:**
  - the collapsed desktop shows a full-width 37px bar (measured: `main` starts at y=37);
  - at 390px the drawer opens but focus stays on `BODY`, there's no `dialog` role, and **Escape doesn't close it** (screenshot 5).

  This confirms Impeccable's P1 in a real browser.
- **Friction:**
  - the first sign-in took about 20s while the dev server compiled;
  - an `eval` matched the hidden mobile button before the desktop one (fixed by matching the exact label);
  - otherwise smooth: snapshot → ref → click worked as documented.
- **Tokens:** not measured separately. It ran inside this long session, with about 12 tool calls and compact page snapshots (~1–2k tokens each). **Unverified**, but small next to Impeccable's phase.

**Cleanup (task 6.1, 2026-10-08):**
- trial user deleted, with leftovers `{"items":0,"item_content":0,"attachments":0,"user_settings":0,"storage":0,"user":0}`;
- the copy's `.env.local` and `scripts/kit-trial-user.mjs` deleted;
- the browser session closed.
- The dev server on 3001 was stopped, and the whole copy (`Projects/temp/Toughbubble`) was deleted on 2026-10-08 at the user's request. The real Toughbubble was untouched (checked: no changes).

## Proposed verdicts (the user confirms)

| Tool | Proposed | Why |
|---|---|---|
| **Impeccable** | **adopted** (`web-ui`, owner of `ui-polish`) | Real, specific findings (2 P1s that M3's code review missed or under-rated), low noise, asks before big steps, works on Windows. **Watch:** it widens scope (`DESIGN.md`, whole sidebar) and cost ~69k output tokens for one warm-up. Name the target and the scope in the prompt |
| **Playwright CLI** | **adopted** (`web-ui`, on-demand browser checks) | Worked on Windows behind login. It measured and confirmed real issues (the 37px bar, the drawer ignoring Escape) that the code reviews could only suspect. Cheap per check, and on demand by design |
| **Emil** | trial, **on demand** (recorded 2026-10-08) | User decision: specialist for motion-specific missions; not loaded by default |
