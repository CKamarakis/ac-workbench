# Design

## Context

See proposal.md - Why. The signals were checked on Acme's history (`temp/acme-upgrade`, 2026-10-20): the canvas input commit (3b29ebc "canvas: board input") adds `onPointerDown`, `onKeyDown`, `onWheel` and `addEventListener("wheel", ...)`; image-lightbox adds 15 handler lines; phase-0-foundation and phase-1-sidebar-tree add 5 and 3 pages; phone-comfort (15 UI files, no later bugs) adds none. Known miss: canvas-sticky-style's bug (Enter on a colour swatch) came from a button's default behaviour, not a new handler.

## Decisions

### D1 Two signals, no size threshold

A new page or route file, or new input handling. A line or file count would be a guess from about six changes (the T5 report) and phone-comfort shows size alone finds nothing; the user chose no threshold.

### D2 Read from the diff, not commit names

Signals come from `git diff` between the change's base commit (`baseCommit`, as for untested files) and the working tree, plus untracked files, so how commits are named doesn't matter (the first measurement by commit message missed the canvas work for that reason).

### D3 Patterns

- **Page or route (added files):** Next.js `app/**/page.*` and `pages/**` (not `_app`, `_document`, `api/`), SvelteKit `+page.svelte`, and `src/routes/**`.
- **Input handling (added lines in `.ts .tsx .js .jsx .vue .svelte`, not tests):** a handler named `on` + Pointer, Touch, Key, Wheel, Gesture, Paste, Mouse, Drag or Drop followed by `=`, `:` or `(`; or `addEventListener` with one of those event families. Click and change handlers are left out: nearly every UI change has them, so they would make the hint constant noise.
- **Pages** exclude API routes, `+server`/`+layout` files and files or folders starting with `_`.
- **A recorded browser check** counts for the commit it was recorded at; new commits after it bring the hint back (code review).
- Both are heuristics; the item says what matched (up to 3 files) so the user can judge.

### D4 One advisory item, and never when already checked

`H:browser`, ADVISORY, only in a web-ui project (`webUi`), and not when a browser check is recorded at the current commit. It never runs anything and never becomes HARD.
