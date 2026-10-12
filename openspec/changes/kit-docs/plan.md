# kit-docs (M8) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/kit:docs` drafts a project's curated docs notes on a yes and builds one committed, offline docs page from specs, archive, decision records and those notes; the rest of the kit knows about it.

**Architecture:** Two zero-dependency modules: `docs.mjs` (parse sources, `scan`, build the model, write the page) and `docs-page.mjs` (pure `renderPage(model) → string`, the Impeccable-designed template). A skill does the judgment (drafting notes); scripts do everything mechanical. Archive gate, `/kit:next`, `/kit:ready`, `/kit:verify` and `/kit:start` get small additions.

**Tech Stack:** Node ≥ 20 ESM, `node:test`, no runtime dependencies; OpenSpec 1.13.2; Impeccable (project-scoped, this repo only).

**Spec:** `openspec/changes/kit-docs/` — `design.md` (D1–D7), `specs/living-docs/spec.md`, and the deltas in `specs/{quality-gates,skill-routing,build-readiness,docs-sync,project-starter}/spec.md`. `tasks.md` numbers are given per task.

## Global Constraints

- Runtime scripts in `plugins/kit/` use **no dependencies** (Node built-ins only).
- CLI style as the other scripts: `node docs.mjs <command> --dir <project> [--json]`; on error print `error: <message>` and exit 1; main guard `process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)`.
- Paths in output are POSIX (`storms/stickies`), project-relative.
- Page: `knowledge/docs/index.html`, one file, inline CSS/JS, **no network requests**, **byte-identical for the same sources** (no timestamps, sorted inputs).
- Every source string is HTML-escaped; the page JS never assigns source text through `innerHTML`.
- Curated files: `knowledge/docs/<capability-path>.md`, `knowledge/docs/tools.md`, `knowledge/foundations/<slug>.md`, `knowledge/foundations/<product>/<slug>.md`.
- The skill and docs sync write only on the user's yes; nothing in this change commits on its own.
- Tests on throwaway folders and the Toughbubble **copy** only (`Projects/temp/Toughbubble`), never a real project.
- Impeccable runs with its target (`knowledge/docs/index.html` / the template) and scope named in every prompt.
- Kit version `0.7.0`.

## Review Focus

1. **Windows line endings** (`\r\n`) in `spec.md`, notes and cards → parsed the same as `\n`. Test in Task 2.
2. **A requirement name with markup or quotes** (`<b>`, `"`, `&`) → shown literally in tree, middle panel and search. Test in Task 5.
3. **A capability note naming a requirement that no longer exists** → its "why" entry is shown under "Notes without a requirement" for that sub-feature, not dropped silently. Test in Task 5.
4. **A spec folder with both its own `spec.md` and child folders** (`storms/spec.md` and `storms/stickies/spec.md`) → the parent node shows its own requirements and its children. Test in Task 2.
5. **An archive folder name not starting with a date** → sorted after dated ones by name, history still shown. Test in Task 3.

---

### Task 1: Checks before building (tasks 1.1–1.3)

**Files:**
- Create: `evals/trials/kit-docs.md`
- Modify: `plugins/kit/.claude-plugin/plugin.json` (version), `openspec/changes/kit-docs/design.md` (only if a check changes a decision)

- [ ] **Step 1: Nested archive check.** In a temp folder (`mktemp -d`): `openspec init --tools none` (or the equivalent non-interactive flags), write `openspec/specs/a/b/spec.md` with one requirement, a change `x` with a delta at `openspec/changes/x/specs/a/b/spec.md` adding a second requirement plus proposal and tasks, run `openspec archive x --yes`.
  Expected: `openspec/specs/a/b/spec.md` has both requirements. Record the commands and result under "1.1 Nested archive" in `evals/trials/kit-docs.md`. If it fails: add the fallback (flat paths plus a hand-made nested fixture) to `design.md` Risks.
- [ ] **Step 2: Keep Impeccable out of git** (design D8, decided by the user). Add to `.gitignore` under a comment "Impeccable (tool; reinstall per clone: npx -y impeccable install --providers=claude --scope=project)": `.claude/skills/impeccable/` and `.claude/agents/impeccable-*.md`. Check: `git status --short` lists neither; files Impeccable creates (`PRODUCT.md`, `DESIGN.md`) are not ignored.
- [ ] **Step 3: Version.** Set `"version": "0.7.0"`. Run `node plugins/kit/scripts/ping.mjs`; expected output names `0.7.0`.
- [ ] **Step 4: Commit** with the roadmap update (M8 "in progress"), one commit:
  `git add evals/trials/kit-docs.md plugins/kit/.claude-plugin/plugin.json openspec/changes/kit-docs docs/roadmap.md .gitignore` → `git commit -m "kit-docs 1: checks, version 0.7.0"`

### Task 2: Spec parser and tree (tasks 2.1–2.2)

**Files:**
- Create: `plugins/kit/scripts/docs.mjs`, `tests/kit/docs.test.mjs`, `tests/kit/fixtures/docs/` (copied real specs: `docs-sync/spec.md`, one nested pair)

**Interfaces:**
- Produces:
  - `parseSpec(text: string) → { purpose: string, requirements: Req[], warnings: string[] }`, `Req = { name, text, scenarios: { name, rows: { kw: 'GIVEN'|'WHEN'|'THEN'|'AND', text }[] }[] }`
  - `findSpecs(dir) → { path: string, file: string }[]` sorted by `path`; `path` is the folder under `openspec/specs/` (POSIX)
  - `specTree(specs) → Node[]`, `Node = { name: string, path: string, hasSpec: boolean, children: Node[] }`; `name` from the last segment: `moving-around` → `Moving around`

- [ ] **Step 1: Write the failing tests** in `tests/kit/docs.test.mjs`:
  - `parseSpec keeps requirement names and splits scenario rows`: on the `docs-sync` fixture, `requirements[0].name === 'Docs sync sources'`; its first scenario's rows are `['GIVEN','WHEN','THEN']`; the second requirement's scenario "Behavior found in the receipt" has 3 rows.
  - `scenario without GIVEN has two rows`: `- **WHEN** a\n- **THEN** b` → rows `['WHEN','THEN']`.
  - `CRLF parses like LF` (Review Focus 1): same fixture with `\r\n` → deep-equal result.
  - `malformed spec warns, never throws`: text `### Requirement:` with no name and a scenario with no keyword lines → `warnings.length > 0`, no throw.
  - `nested specs become one product with children`: fixture `storms/stickies`, `storms/saving` → one root `Storms` with children `Saving`, `Stickies` (sorted); flat `docs-sync` → root node, no children.
  - `parent with own spec and children` (Review Focus 4): `storms/spec.md` + `storms/stickies/spec.md` → `Storms.hasSpec === true` and one child.
- [ ] **Step 2: Run** `node --test tests/kit/docs.test.mjs` — expected FAIL (module not found).
- [ ] **Step 3: Implement** `parseSpec`, `findSpecs`, `specTree` in `docs.mjs`. Parse only `## Purpose`, `### Requirement: `, `#### Scenario: ` headings and `- **KW**` lines (design Risks: stay close to OpenSpec's format). `**AND**` continues the previous row kind as its own row.
- [ ] **Step 4: Run** the tests — expected PASS. Also `npm test` — all PASS.
- [ ] **Step 5: Commit** `git commit -m "kit-docs 2: spec parser and tree"`

### Task 3: Archive history and `scan` (tasks 2.3–2.4)

**Files:**
- Modify: `plugins/kit/scripts/docs.mjs`, `tests/kit/docs.test.mjs`

**Interfaces:**
- Consumes: `findSpecs`, `parseSpec` (Task 2)
- Produces:
  - `archivedChanges(dir) → Arch[]` newest first, `Arch = { folder, date: string|null, change, why: string, specPaths: string[] }`; `why` = first non-empty line under `## Why` of its `proposal.md`, `''` if none.
  - `lastChangedBy(archives, specPath, reqName) → Arch|null` — newest archive whose delta `specs/<specPath>/spec.md` has `### Requirement: <reqName>`.
  - `parseNote(text) → { how: string|null, why: { requirement: string, text: string, cards: string[] }[] }` — `why` entries are list items under `## Why` starting `**<requirement>**:`; `[[slug]]` collected into `cards`.
  - `parseTools(text) → { group: string, tools: { name, packages: string[], purpose, usedBy, addedBy, dev: boolean }[] }[]` — format: `## <group>`, `### <tool>`, bullets `- packages:`, `- for:`, `- used by:`, `- added by:`, `- dev: yes|no`. Default `packages = [name]`.
  - `parseCard(text, rel) → { slug, product: string|null, title, status: 'current'|'replaced', replacedBy: string|null, sections: Record<string,string> }` from frontmatter + `## ` sections.
  - `PAGE_MARK = 'kit-docs-archive'` — the page stores the newest archive folder it was built from in `<meta name="kit-docs-archive" content="...">`.
  - `scan({ dir }) → { specs: { path, requirements: number }[], notes: { missing: string[], stale: { path, since: string }[] }, tools: { unlisted: string[], gone: string[] } | null, cards: string[], page: { exists: boolean, builtFrom: string|null, stale: boolean } }`

- [ ] **Step 1: Write the failing tests:**
  - `history newest first with the proposal why`: fixture archive with `2026-10-07-a` and `2026-10-12-b` touching `storms/stickies` → `['2026-10-12-b','2026-10-07-a']`, `why` = first line.
  - `archive without specs`: `specPaths` is `[]`.
  - `undated archive folder sorts after dated ones` (Review Focus 5).
  - `stale note` (spec scenario): note dated 2026-10-10 (set with `git -c user.name=t -c user.email=t@t commit --date`, temp repo) and archive `2026-10-12-x` touching `storms/stickies` → `notes.stale` has `{ path: 'storms/stickies', since: '2026-10-12-x' }`. An uncommitted note uses its file mtime date.
  - `unlisted tool` (spec scenario): `package.json` devDependencies `fake-indexeddb`, `tools.md` without it → `tools.unlisted` includes it; a tool in `tools.md` whose packages are all absent → in `tools.gone`.
  - `no package.json → tools null, no throw`.
  - `page stale when built from an older archive`: page with `<meta name="kit-docs-archive" content="2026-10-07-a">` and newest archive `2026-10-12-b` → `page.stale === true`.
  - `parseNote`, `parseTools`, `parseCard` each on one fixture: `[[storms-canvas]]` ends in `cards`; `TipTap` with 10 packages is one tool; a `replaced` card keeps `replacedBy`.
- [ ] **Step 2: Run** — expected FAIL.
- [ ] **Step 3: Implement** the functions above plus the `scan` CLI command (`--json` prints the object; plain prints one summary line per section). Note date: `git log -1 --format=%cs -- <file>` via `spawnSync`, fallback to mtime.
- [ ] **Step 4: Run** — expected PASS; `npm test` PASS.
- [ ] **Step 5: Commit** `git commit -m "kit-docs 3: archive history and scan"`

### Task 4: Page design with Impeccable (task 3.1)

**Files:**
- Create: `plugins/kit/scripts/docs-page.mjs`, `tests/kit/docs-page.test.mjs`, `tests/kit/fixtures/docs/model.json` (a hand-written model: Storms › Stickies, Saving; one card; two tools; one undecided)
- Modify: `evals/trials/kit-docs.md`

**Interfaces:**
- Produces: `renderPage(model: Model) → string` (pure, no I/O). Search is deferred (user, 2026-10-12). `Model = { title, builtFrom: string|null, tree: (Node & { created: string|null, updated: string|null })[], pages: Record<path, { prd: { title, status, path } | null, how: string|null, requirements: { name, text, scenarios, why: {text, cards}[], change: string|null }[], orphanWhy: {requirement,text}[], history: Arch[], undecided: Undecided[], warnings: string[] }>, cards: Card[], tools: Tools|null, undecidedByChange: Record<change, Undecided[]>, empty: boolean }`, `Undecided = { change, id, text, date, status }`.

- [x] **Step 1:** Direction chosen with the user (2026-10-12): the category-standard three-panel style, adjusted — light right panel, sort control instead of search, no item numbers, no margin line numbers, numbered and separated user stories, PRD link. Reference sketch: `.impeccable/mocks/decision/canon-v2.html`. `PRODUCT.md` written by Impeccable's init.
- [ ] **Step 2:** Write the failing tests in `tests/kit/docs-page.test.mjs` against `model.json`: stories numbered `1`, `2` with a separator element between them; the tree carries `data-updated` / `data-created` / `data-name` per node and the sort control defaults to "Last updated", descending; the `From PRD` line renders title and status; `renderPage` is pure (same model → same string).
- [ ] **Step 3:** Implement `renderPage` matching `canon-v2.html`. Inline CSS/JS; tree navigation by hash (`#storms/stickies`); sorting client-side by re-ordering existing nodes (no `innerHTML` from source text); text set via escaping at build time only.
- [ ] **Step 4:** Open `renderPage(model.json)` in a browser and compare with `canon-v2.html`. Note Impeccable's token use under "3.1 Impeccable shape" in `evals/trials/kit-docs.md`.
- [ ] **Step 5: Commit** `git commit -m "kit-docs 4: page template (Impeccable shape)"`

### Task 5: `build` (tasks 3.2–3.4)

**Files:**
- Modify: `plugins/kit/scripts/docs.mjs`, `tests/kit/docs.test.mjs`

**Interfaces:**
- Consumes: Task 2–3 functions, `renderPage` (Task 4), `readDecisions(file)` from `decisions.mjs`
- Produces: `undecided(dir) → Undecided & { specPath: string|null }[]` (open/later items of `openspec/changes/*/decisions.md`, not `archive`; `specPath` = the longest spec path that `from` contains as `specs/<path>/`); `buildModel({ dir }) → Model`; `build({ dir }) → { file, counts: { specs, requirements, cards, tools, undecided }, warnings: string[] }`; CLI `build` prints counts and warnings, exit 0.

- [ ] **Step 1: Write the failing tests:**
  - `same sources, byte-identical page`: build twice → equal strings.
  - `markup in spec text is escaped` (spec scenario + Review Focus 2): requirement name `A <b>"x"</b> & y` and text `<script>alert(1)</script>` → page contains `&lt;script&gt;` and no `<script>alert`.
  - `no network`: page has no `http://` or `https://` substring and no `<link`/`src=` to external files.
  - `undecided on a sub-feature` (spec scenario): open decision `from: 'openspec/changes/x/specs/storms/saving/spec.md:40'` → `model.pages['storms/saving'].undecided.length === 1`; tree count 1. A `from` with no spec path → in `undecidedByChange.x`.
  - `orphan why entry kept` (Review Focus 3): note `**Gone requirement**: because` → in `orphanWhy`.
  - `project without specs` (spec scenario): only a card → `model.empty === true`, page contains "no specs yet" and the card title, exit 0.
  - `unparsable spec and unreadable decisions.md` → warnings, build still writes the file.
  - `no package.json` → `model.tools === null`, page says "no package.json".
  - `sub-feature dates and PRD link` (spec scenarios "Default sort", "PRD link"): archives `2026-10-07-a` and `2026-10-12-b` touch `storms/stickies` → node `created: '2026-10-07'`, `updated: '2026-10-12'`; product `storms` takes newest updated / oldest created; proposal of `b` with `PRD: knowledge/prds/storms-canvas.md @ abc1234` and that PRD (`title: Storms canvas`, `status: Shipped`) → `pages['storms/stickies'].prd` = `{ title: 'Storms canvas', status: 'Shipped', path: 'knowledge/prds/storms-canvas.md' }`; page contains `From PRD`.
  - `page stores the newest archive`: `<meta name="kit-docs-archive" content="2026-10-12-b">`.
- [ ] **Step 2: Run** — expected FAIL.
- [ ] **Step 3: Implement** `undecided`, `buildModel`, `build` and the `build` CLI command. Write the file with `\n` endings.
- [ ] **Step 4: Run** — expected PASS; `npm test` PASS.
- [ ] **Step 5: Commit** `git commit -m "kit-docs 5: build the docs page"`

### Task 6: Impeccable critique and audit (task 3.5)

**Files:**
- Modify: `plugins/kit/scripts/docs-page.mjs`, `evals/trials/kit-docs.md`

- [ ] **Step 1:** `node plugins/kit/scripts/docs.mjs build --dir .` on this repo (no notes yet: specs, history, decisions only).
- [ ] **Step 2:** `/impeccable critique` then `/impeccable audit`, target `knowledge/docs/index.html` only. List findings with severity in `evals/trials/kit-docs.md`.
- [ ] **Step 3:** Ask the user which findings to fix (one batch). Fix the accepted ones in `docs-page.mjs`; rerun `npm test` — PASS (byte-identical and escaping tests still hold).
- [ ] **Step 4: Commit** `git commit -m "kit-docs 6: page fixes from Impeccable review"` (do not commit the trial build of `knowledge/docs/index.html` yet; Task 10 does).

### Task 7: `/kit:docs` skill and evals (tasks 4.1–4.2)

**Files:**
- Create: `plugins/kit/skills/docs/SKILL.md`, `evals/docs/cases.yaml`

**Interfaces:**
- Consumes: `docs.mjs scan --json`, `docs.mjs build` (Tasks 3, 5); formats from `parseNote`, `parseTools`, `parseCard`.

- [ ] **Step 1: Write `evals/docs/cases.yaml`** (format as `evals/ready/cases.yaml`, `vars: { d: '{{kit}}/scripts/docs.mjs' }`):
  - `scan-stale-note` (command-exit, `stdout_match` on the stale path);
  - `build-no-specs` (command-exit 0, page contains `no specs yet`);
  - judgment cases with rubric: `nothing-missing-no-questions` (no question asked, page rebuilt); `skip-writes-nothing`; `preference-choice-no-why` (a colour decision gets no "why"); `never-commits` (no `git commit` in the transcript).
- [ ] **Step 2: Run** `npm run evals -- docs` — command cases PASS (the scripts exist from Tasks 3 and 5); judgment cases show as pending.
- [ ] **Step 3: Write `SKILL.md`** (frontmatter `name: docs`, a description that names "docs page", "what's built", "foundation card", "tools inventory"). Steps: scan → read sources for each missing/stale item → draft in the living-docs formats ("why" only for decisions with depth; empty is fine) → show the list first with a count and each target path → AskUserQuestion, up to 4 per call, back to back, options yes / change / skip → write yeses → `docs.mjs build` → one-line summary. Rules: never edit specs, archives, `decisions.md`; never commit.
- [ ] **Step 4: Run** `npm run evals -- docs` — script cases PASS.
- [ ] **Step 5: Commit** `git commit -m "kit-docs 7: /kit:docs skill and evals"`

### Task 8: Archive gate reminder (task 5.1)

**Files:**
- Modify: `plugins/kit/hooks/archive-gate.mjs` (`reminder`), `tests/kit/hooks.test.mjs`

**Interfaces:**
- Produces: `reminder(event, projectDir)` returns the open-decisions line, the docs line, both joined with a space, or `null`. Docs line text: `Kit reminder: this project has a docs page. After the archive (spec sync), ask the user whether to rebuild it (node "<kit>/scripts/docs.mjs" build --dir .) and include knowledge/docs/index.html in the archive commit.` (`<kit>` = the plugin root from `CLAUDE_PLUGIN_ROOT`, else `${CLAUDE_PLUGIN_ROOT}` literally).

- [ ] **Step 1: Write the failing tests** in `hooks.test.mjs`:
  - `pass + knowledge/docs present → reminder names the docs page rebuild`;
  - `pass + no knowledge/docs → no docs text` (and `null` when no open decisions either);
  - `pass + 2 open decisions + knowledge/docs → both texts`.
- [ ] **Step 2: Run** `node --test tests/kit/hooks.test.mjs` — FAIL.
- [ ] **Step 3: Implement** in `reminder()`; the docs line only when `knowledge/docs/` exists.
- [ ] **Step 4: Run** — PASS; the existing "pass + 2 open decisions" test still passes.
- [ ] **Step 5: Commit** `git commit -m "kit-docs 8: archive gate reminds to rebuild the docs page"`

### Task 9: `/kit:next` stale-page reminder (task 5.2)

**Files:**
- Modify: `plugins/kit/scripts/next.mjs` (`suggest`, `format`, CLI), `tests/kit/next.test.mjs`

**Interfaces:**
- Consumes: `scan({ dir }).page` from `docs.mjs`
- Produces: `docsLine(page: { exists, stale }) → string|null` = `'docs page is older than the last archive; run /kit:docs'` when `exists && stale`; `suggest({ ..., docs = null })` adds `docs` to every suggestion like `questions`; `format` prints it on its own line.

- [ ] **Step 1: Write the failing tests:** `docsLine({exists:true,stale:true})` gives the exact text; `{exists:false}` → `null`; `suggest({... , docs: '<line>'})` with no active change still has `phase: 'brainstorm'` and carries `docs`.
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement**; the CLI passes `docsLine(scan({dir}).page)` (wrapped in try → `null`).
- [ ] **Step 4: Run** `npm test` — PASS.
- [ ] **Step 5: Commit** `git commit -m "kit-docs 9: /kit:next reminds about a stale docs page"`

### Task 10: Registry, linked skills, README (tasks 5.3–5.7)

**Files:**
- Modify: `toolkit.yaml` (`phases` + kit entry), `plugins/kit/data/toolkit.json` (generated), `plugins/kit/skills/ready/SKILL.md`, `plugins/kit/skills/verify/SKILL.md`, `plugins/kit/skills/start/SKILL.md`, `evals/ready/cases.yaml`, `evals/verify/cases.yaml`, `evals/start/cases.yaml`, `README.md`, `tests/kit/lanes.test.mjs`

- [ ] **Step 1: Failing test** in `lanes.test.mjs`: `docs phase after close, owned by kit with /kit:docs` — `phases.indexOf('docs') === phases.indexOf('close') + 1` and lane `docs` owner skill `/kit:docs`. Run — FAIL.
- [ ] **Step 2:** `toolkit.yaml`: insert `docs` after `close` in `phases`; kit entry `phases` + `docs`, `skills.docs: /kit:docs`. Run `npm run registry` — prints the lane map with `docs → kit (/kit:docs)`; test PASS.
- [ ] **Step 3:** `ready/SKILL.md` step 3 `new-tool`: also read `knowledge/docs/tools.md` when present and match on its "for:" purposes. Eval case `inventory-purpose-reuse` (judgment; rubric: names TipTap, says the inventory has it for rich text, recommends reuse).
- [ ] **Step 4:** `verify/SKILL.md` docs sync: a decision with depth shaping more than one sub-feature → also propose a card (living-docs format), a contradicted card → propose `status: replaced`. Eval cases `card-for-cross-feature-decision`, `no-card-for-single-feature`.
- [ ] **Step 5:** `start/SKILL.md` summary: Later line "when you want a browsable page of what's built, run /kit:docs"; no docs folders. Update the `start` eval case for the summary.
- [ ] **Step 6:** README: `/kit:docs`, the curated files and where they live, the rebuild at archive.
- [ ] **Step 7: Run** `npm test`, `npm run registry:check`, `npm run evals` — PASS (judgment cases pending).
- [ ] **Step 8: Commit** `git commit -m "kit-docs 10: docs phase, linked skills, README"`

### Task 11: Trials and close (tasks 6.1–6.4)

**Files:**
- Create: `knowledge/docs/index.html` and the confirmed notes/cards for this repo
- Modify: `evals/trials/kit-docs.md`, `docs/roadmap.md`, `openspec/changes/kit-docs/tasks.md`

- [ ] **Step 1: This repo.** Run `/kit:docs` live; confirm drafts with the user; open the page; check tree (11 flat specs), scenario rows, history (6 archives), the sort control, the `kit-docs` open decisions if any. Evidence under "6.1".
- [ ] **Step 2: Toughbubble copy** (`Projects/temp/Toughbubble`; reinstall the kit per project if needed). In the copy only: regroup Storms specs into `openspec/specs/storms/<sub>/`; run `/kit:docs`; confirm the "Storms draws on a canvas" card (evidence from the explore note), the tools inventory from its `package.json` (TipTap as one tool), and one open decision shown as undecided. Evidence under "6.2" with screenshots or page excerpts.
- [ ] **Step 3:** `npm test`, `npm run evals`, `npm run registry:check` — all PASS; paste the summary lines into the trial file.
- [ ] **Step 4:** Roadmap: M8 status and exit criteria met (both pages build), north-star row 13; tick `tasks.md`.
- [ ] **Step 5: Commit** `git commit -m "kit-docs 11: trials, docs page for the kit, roadmap"`
