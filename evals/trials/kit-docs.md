# Trial: kit-docs (M8)

Evidence for the `kit-docs` change. Sections follow `openspec/changes/kit-docs/tasks.md`.

## 1.1 Nested archive (2026-10-12, OpenSpec 1.13.2)

Throwaway folder (`mktemp -d`, `git init`, `openspec init --tools none`):
- `openspec/specs/a/b/spec.md` with requirement "One";
- change `x` with a delta at `openspec/changes/x/specs/a/b/spec.md` adding "Two", plus proposal and tasks;
- `openspec validate x --strict` → valid; `openspec archive x --yes` → "Specs to update: a/b: update … + 1 added".

Result: `openspec/specs/a/b/spec.md` holds both requirements; the archive keeps `2026-10-12-x/specs/a/b/spec.md`. **Nested paths merge at archive** — no fallback needed (design Open Questions resolved).

## 1.2 Impeccable out of git

`.claude/skills/impeccable/` and `.claude/agents/impeccable-*.md` gitignored (design D8). Installed engine v0.1.14.

## 3.1 Impeccable shape (2026-10-12)

- `impeccable context` asked for `PRODUCT.md` first: one 3-question init round, then `PRODUCT.md` written.
- `concept-seed --scope direction --mode read` (seed `fcd32029`) assigned my candidate 5 (patent document); my pick was the architect's drawing set; 6 catalog challengers, all declined (two donated raises).
- The decision page (`serve-question --start`) hung with no URL on this machine (Windows, Git Bash); stopped after 120 s. Fallback: the sketches opened in the browser and discussed in chat.
- The user chose the **category standard** with changes (light right panel, sort instead of search, no numbers, numbered user stories, PRD link) → `canon-v2.html`, then `docs-page.mjs`.
- Detector on the rendered fixture: one finding (skipped heading level, aside h4 after h2), fixed; then clean.
- Token use: not measured precisely (no per-skill counter); the round cost an interview, 4 HTML sketches and two rounds of feedback.

## 3.5 Impeccable critique and audit (2026-10-12)

Method: dual-agent (A design review, B detector + technical audit), isolated; no browser automation (judged from HTML/CSS/JS).

- **Heuristics (A):** 21/36 (error prevention n/a). Strengths: story blocks, amber "undecided" used only for that, solid fallbacks and escaping.
- **Audit (B):** accessibility 3, performance 4, theming 4, responsive 2, implementation 3. All main text pairs pass AA in both themes (ink 15.5/14.6, muted 5.5–8.0).
- **Detector:** fixture page clean; this repo's page 1 `aphoristic-cadence` hit from spec text (false positive: content, not template).
- **Findings:** P1 requirement text shows raw Markdown; P1 undecided items fall below everything on narrow screens; P1 blank page without JS; P2 card links from a product card don't scroll (slug mismatch, a bug); P2 why far from its requirement; P2 PRD shown as text, not a link; P2 no `<main>`/skip link, no focus move on navigation; P2 control borders 1.17:1; P2 tap targets < 44 px and cramped grids at 390 px; P2 replaced cards via opacity drop to 3.5:1; P2 malformed hash throws; P3 duplicate "Changed by", Name sort keeps "Z–A", badge reads as a bare number, title acronyms ("Prd authoring"), story row corners.
- **User's pick (one batch):** readable text only, plus open/close per product in the left list; "enough" — no further polishing. Fixed: basic Markdown in requirement text (escaped first), acronyms in titles, card-link anchor bug, collapsible products. Other findings stay as recorded above (not fixed, by the user's choice). Remaining detector hit: `aphoristic-cadence` from spec text (false positive).

## 6.1 This repo, full /kit:docs run (2026-10-12)

- Scan: 11 specs, 11 notes missing, `yaml` not in the inventory, 0 cards.
- 15 drafts (11 capability notes, `tools.md`, 3 app-wide cards: tools-per-project, markdown-in-the-repo, zero-dependency-scripts), every reason sourced from the archived designs or the roadmap drift log. Asked in 4 batches; the user said yes to all 15.
- Scan after: nothing missing or stale, inventory complete, 3 cards. Build: 11 specs, 72 requirements, 3 cards, 1 tool, 0 undecided; all 15 "why" entries matched a requirement (no orphans); 5 card links.
- Checks: `npm test` 288/288; `npm run evals` 0 failures (pending judgment cases only); `npm run registry:check` exit 0.

## 6.2 Toughbubble copy: skipped (user, 2026-10-12)

The user dropped the Toughbubble trial from M8 ("I do not want to build another Toughbubble here"). The nested-path archive merge was still checked (1.1); nested trees are covered by unit tests.

## Opt-in (user, 2026-10-12)

The living docs are optional per project: nothing docs-related happens until `/kit:docs` creates `knowledge/docs/`; `/kit:start` mentions it under Later as optional and usable mid-project. Spec: living-docs "Living docs are optional".
