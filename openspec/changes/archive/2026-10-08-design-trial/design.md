# Design

## Context

See proposal.md (Why). What exists:
- **The Toughbubble copy** (`Projects/temp/Toughbubble`, no remote):
  - kit 0.4.0 synced as `web-ui`, with Impeccable (skill, agents, `SessionStart`/`PostToolUse`/`Stop` hooks checked on Windows), Emil's 13 skills and the Playwright CLI skill installed;
  - `npm install` done;
  - a Ready PRD, `knowledge/prds/image-lightbox.md`;
  - no `.env.local`.
- **The app:** Next.js 16 with Supabase auth (email and password, email confirmation) and Postgres through Drizzle. `.env.example` lists `APP_ENV`, the public URL and publishable key, `SUPABASE_SECRET_KEY`, `DATABASE_URL` and `DATABASE_ADMIN_URL`.
- **Integration tests** already create and delete real users in the dev project, guarded by `APP_ENV=development`.
- **`/kit:verify`** writes `verify.md` through `verify.mjs`. The `web-ui` policy lists "browser check for UI flows the change touches" as an advisory reminder on every run.

## Goals / Non-Goals

**Goals:**
- A verdict per tool, backed by what happened on real UI work: issues found, noise, tokens, time and friction.
- Browser checks become an explicit, on-demand step.
- Nothing of the trial is left behind in the dev project or the copy's secrets.

**Non-Goals:**
- Shipping the lightbox to the real Toughbubble.
- Benchmarking the three tools against each other on the same task. Each does its own job.
- Automating Impeccable's live mode. It's tried once; a failure there is recorded, not fixed.

## Decisions

**D1. The user runs the trial session; the agent here prepares and records.**
- The trial session runs in the copy, as in M3, so "would you want it next time" is the user's own experience.
- The agent in this repo:
  - prepares the setup (env, trial user, dev server);
  - writes a step-by-step trial script;
  - reads results back from the copy (files, reports, screenshots);
  - records tokens and time from the user's `/cost` snapshots between phases.

**D2. The trial user goes through the Supabase admin API.**
- A one-off Node script in the copy (`scripts/kit-trial-user.mjs`, untracked) uses `@supabase/supabase-js` (already a dependency) with `SUPABASE_SECRET_KEY` from `.env.local` to create `kit-trial-<date>@example.com`, pre-confirmed, with a random password.
- The credentials go into the copy's `.env.local` as `KIT_TRIAL_EMAIL` and `KIT_TRIAL_PASSWORD`. That file is gitignored in the copy and never printed.
- `--delete` removes the user. Before relying on a cascade, the cleanup task checks the copy's migrations to see whether notes and attachments are removed with it (**unverified**). Otherwise it deletes the trial user's rows and storage objects explicitly.

**D3. Phases with a usage snapshot between each:**
```
 setup -> [cost 0] warm-up (Impeccable) -> [cost 1] lightbox build (propose/apply)
       -> [cost 2] Impeccable init/critique/audit/polish
       -> [cost 3] verify + browser check (Playwright) -> [cost 4] -> cleanup
 (Emil dropped from the session by the user, 2026-10-08: on demand only.)
```
- Each tool's cost is the difference between two snapshots. The build phase itself is reported separately, so it isn't charged to the design tools.

**D4. Scoring per tool,** written into `evals/trials/design-trial.md`. One table per tool:
- issues found (kept or fixed / noise);
- tokens (output, cache);
- wall and API time;
- Windows friction;
- overlap with the other tools;
- the user's answer to "next project?".

The verdict follows:
- **adopted:** found real issues, low noise, no blocking friction, and the user says yes;
- **trial:** mixed;
- **later** or **dropped:** little value, or too costly.

**D5. The browser check is recorded through `verify.mjs browser`.**
- `verify.mjs browser --change <name> --result pass|issues [--issue "<text>"]... [--shots <path,path>]` adds a "Browser check" section with each issue as an ADVISORY item (`B1`, `B2`…), the screenshot paths and the date.
- The `/kit:verify` skill gets a "Browser check (on request)" section. The agent uses the Playwright CLI skill to start or reuse `npm run dev`, log in with the trial or test credentials from `.env.local`, walk the flows the change touches, and take screenshots into the change folder (`browser/`).
- It never runs unless the user asks.
- The `web-ui` policy drops its `advisory` browser entry.

**D6. Cleanup is a task of its own, run even if the trial stops early:**
- delete the trial user and its data;
- delete the copy's `.env.local`;
- stop the dev server;
- record what was removed.

## Risks / Trade-offs

- [**Trial data stays in dev**] → Task 6 runs regardless of the trial outcome, checks with a count query that nothing of the trial user is left, and records the result.
- [**Secrets leak via logs or commits**] → `.env.local` exists only in the copy (gitignored there, and the copy has no remote). Scripts never echo values. Reports reference variable names only.
- [**Email confirmation or rate limits block login**] → The user is created pre-confirmed through the admin API, so no email is sent.
- [**Playwright's token cost is high**] → That's exactly what's measured. It's on demand anyway.
- [**The Impeccable hooks are noisy during the build**] → Their output is counted under Impeccable's noise.

## Migration Plan

- Kit 0.4.0 → 0.5.0.
  - Re-synced projects: the `web-ui` policy no longer lists the browser reminder.
  - `/kit:verify` gains the on-request browser check.
- After the trial, `claude plugin update kit@ac-workbench` brings 0.5.0 into daily use.
