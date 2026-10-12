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
