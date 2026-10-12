# Tasks

## 1. Checks before building

- [x] 1.1 Nested-path archive check (design Open Questions). In a throwaway folder: `openspec init`, a spec at `specs/a/b/spec.md`, a change with a delta at `specs/a/b/spec.md`, then `openspec archive`. Record whether the delta merged into the nested path in `evals/trials/kit-docs.md`. If not, note the fallback (flat paths plus a hand-made nested fixture) in `design.md` before group 3
- [x] 1.2 Keep Impeccable out of git (design D8): gitignore `.claude/skills/impeccable/` and `.claude/agents/impeccable-*.md`; the files it creates (`PRODUCT.md`, `DESIGN.md`) stay committed. Verify with `git status --short`
- [x] 1.3 Bump the kit to `0.7.0` in `plugins/kit/.claude-plugin/plugin.json`. Verify with `node plugins/kit/scripts/ping.mjs`

## 2. Scan (`docs.mjs scan`)

- [x] 2.1 `spec.md` parser: requirement names, text, scenarios split into GIVEN/WHEN/THEN/AND rows (design D3). Verify with `tests/kit/docs.test.mjs` on fixtures copied from real specs: names kept; a scenario without GIVEN gives two rows; a malformed spec returns a warning, not a throw
- [x] 2.2 Spec discovery and tree from folder paths (flat and nested). Verify: `storms/stickies` and `storms/saving` → one Storms node with two children; a flat spec → one level
- [x] 2.3 History per capability from `openspec/changes/archive/*/specs/<path>/` with the first line of each proposal's Why; an archived change without specs is "no spec changes". Verify on a fixture archive
- [x] 2.4 `scan --json`: missing and stale capability notes (git date of the note vs the newest archive touching its capability), tools in `package.json` not in `tools.md` and the reverse, cards found, page older than the newest archive. Verify the "Stale note" and "Unlisted tool" scenarios; no `package.json` → reported, not an error

## 3. Page (`docs.mjs build`)

- [x] 3.1 Design the page with Impeccable (design D4): run `/impeccable init` if it asks, then `/impeccable shape` naming `knowledge/docs/index.html` as the only target and the three-panel layout, tree, scenario rows, "undecided" badge and history view as the scope. Keep its output as the HTML/CSS template inside `docs.mjs`. Note its token use in `evals/trials/kit-docs.md`
- [x] 3.2 `build`: one self-contained file, no network requests; tree with the sort control (name / last updated / created, ascending or descending, default last updated newest first), how it works, requirements with numbered and separated user stories, "why" entries and cards per requirement, change that added or last changed it, the PRD link, history view. Search deferred. Verify with tests: same sources → byte-identical output; a `<script>` in spec text is escaped; no `http` URLs in the output
- [x] 3.3 Open decisions on the page via the `decisions.mjs` reader; mapped by `from` path to a sub-feature, otherwise an "Undecided" list per change. Verify the "Undecided on a sub-feature" scenario
- [x] 3.4 Missing sources degrade (no specs, unparsable spec, unreadable decision record, no `package.json`). Verify each with a test; the build exits 0
- [x] 3.5 `/impeccable critique` and `/impeccable audit` on the built page for this repo, scope named. Fix what's accepted in the template; record findings and fixes in `evals/trials/kit-docs.md`

## 4. Skill (`/kit:docs`)

- [x] 4.1 Write `plugins/kit/skills/docs/SKILL.md`: scan; draft only missing or stale capability notes, inventory entries and cards in the formats of the living-docs spec; "why" only for decisions with depth; show each draft with its path; ask per item in one batch (yes / change / skip); write only yeses; build; never edit specs, archives or `decisions.md`; never commit
- [x] 4.2 Eval cases in `evals/docs/cases.yaml`: nothing missing → no questions, page rebuilt; a skipped draft writes nothing; a small preference choice gets no "why"; never commits. Run `npm run evals`

## 5. Links into the kit

- [x] 5.1 Archive gate (`hooks/archive-gate.mjs`): on allow, when `knowledge/docs/` exists, add the rebuild reminder to `additionalContext` (with the open-decisions text if both). Verify with tests for both scenarios of "Docs page rebuild at archive"
- [x] 5.2 `next.mjs`: the stale-page reminder line (never the next step itself). Verify the "Page behind the archive" and "No page yet" scenarios
- [x] 5.3 `toolkit.yaml`: `docs` phase after `close`, owned by the kit with `/kit:docs`; `npm run registry`; check the lane map and the routing block
- [x] 5.4 `/kit:ready` skill: the new-tool check also reads `knowledge/docs/tools.md` purposes; add an eval case for "Purpose found in the inventory"
- [x] 5.5 `/kit:verify` skill (docs sync): propose a foundation card for a decision shaping more than one sub-feature, and `replaced` for a contradicted card; add an eval case for both docs-sync scenarios
- [x] 5.6 `/kit:start` skill: `/kit:docs` once under Later; no docs folders created. Add or update an eval case
- [x] 5.7 README: `/kit:docs`, the curated files, the rebuild at archive

## 6. Trials and close

- [ ] 6.1 Trial on this repo: `/kit:docs`, confirm drafts, build; open the page and check tree, scenarios, history and search. Evidence in `evals/trials/kit-docs.md`
- [ ] 6.2 Trial on the Toughbubble copy (`Projects/temp/Toughbubble`, never the real repo): nested Storms specs (regroup in the copy), the canvas foundation card, the tools inventory from its `package.json`, an open decision shown as undecided. Evidence in the same file
- [ ] 6.3 `npm test`, `npm run evals`, `npm run registry:check` all pass
- [ ] 6.4 Roadmap: M8 status and exit criteria; north-star row 13
