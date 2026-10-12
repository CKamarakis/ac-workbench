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
