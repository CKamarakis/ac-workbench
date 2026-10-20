## Design Summary

`/kit:docs` gives each kit project one living docs page: what the product does (behaviors) and why (decisions with depth), for the user, not for engineers.

- **Sources (committed):** `openspec/specs/**/spec.md`, archived changes, `decisions.md` of active changes, `package.json`, and curated notes the skill drafts and the user confirms:
  - `knowledge/docs/<capability-path>.md`: "How it works, roughly" and "Why" entries, each naming a requirement;
  - `knowledge/docs/tools.md`: the tools inventory (groups, purpose, features using it, change that added it);
  - `knowledge/foundations/*.md`: foundation cards (per product and app-wide).
- **Script `docs.mjs` (zero dependencies):** `scan` (what's missing or stale) and `build` (renders `knowledge/docs/index.html`, one offline file, committed).
- **Page:** three panels: tree (foundations, tools, products › sub-features) / behavior (how it works, requirements, scenarios as GIVEN/WHEN/THEN) / why (reasons, cards, the change behind it, open decisions). History per sub-feature. Open decisions show as "undecided".
- **Rebuild point:** during archive, after spec sync, the agent asks to rebuild the page and puts it in the archive commit. The archive gate hook carries the reminder; `/kit:next` suggests `/kit:docs` when the page is older than the newest archive.
- **Links to M7:** `/kit:ready` checks new tools against `tools.md`; the docs sync in `/kit:verify` can propose a foundation card for a decision with depth.
- **Page look:** designed with Impeccable during the build (installed in this repo per project).

## Alternatives Considered

### Alternative A: Curated notes + deterministic script (chosen)
- **Approach**: the agent drafts small living Markdown files once, the user confirms per item; a script renders the page from them plus specs, archive and decisions.
- **Pros**: rebuilds cost no tokens and give the same output each time; content is written for the user; testable with fixtures.
- **Cons**: curated notes can go stale.
- **Why chosen**: the only option that is both user-centric and cheap to rebuild. Staleness is caught by `scan`.

### Alternative B: Pure script
- **Approach**: render specs, archived `design.md` Decisions verbatim and raw `package.json`.
- **Pros**: zero tokens, never stale.
- **Cons**: "why" is engineering text tied to changes, not to sub-features; tools have no grouping or purpose.
- **Why not chosen**: misses the confirmed audience (the user, not engineers).

### Alternative C: The agent writes the HTML each run
- **Approach**: read all sources and write the page from scratch every time.
- **Pros**: most flexible.
- **Cons**: tokens on every rebuild, output varies run to run, hard to test.
- **Why not chosen**: cost and no repeatability.

## Agreed Approach

Alternative A. The page is committed and rebuilt inside the archive, after spec sync, so the archive commit carries the updated docs. Rebuilding earlier (in `/kit:verify`) was rejected: main specs only get the change's behaviors at archive, so the script would have to imitate OpenSpec's merge.

## Key Decisions

1. **Exit criteria:** the page builds for this kit repo (flat specs) and for the Acme copy (nested Canvas specs, real dependencies, the canvas foundation card).
2. **Approach A** (above).
3. **Page committed**, rebuilt during archive after spec sync, asked as a yes/no; it goes into the archive commit.
4. **`docs.mjs` parses `spec.md` itself**: `openspec show --json` (1.13.2) drops requirement names (checked 2026-10-12).
5. **Tree from spec folder paths** (`canvas/stickies` → Canvas › Stickies); flat specs show as one level.
6. **Planned sub-features from the PRD non-goals: deferred** (user, 2026-10-12).
7. **M8 also links `/kit:ready` (tools inventory) and `/kit:verify` (foundation cards)** (user, 2026-10-12).
8. **Impeccable designs the page** (user, 2026-10-12): `/impeccable shape` with target and scope named, then `critique` and `audit` on the built page.
9. Carried from the explore and the roadmap: three panels; Given/When/Then; "why" only where a decision has depth; "how it works, roughly" only where it matters; cards with in short / why / gives you / limits you / revisit if / affects / history, kept when replaced; backfill out of M8; cockpit stays separate.

## Open Questions

- **Unverified:** whether `/opsx:archive` merges a delta into a nested spec path (`specs/canvas/stickies/`). Tested first in the build, in a throwaway folder.
- **Unverified:** whether Impeccable's bash-syntax hooks run on Windows in this repo (they did on the Acme copy in M4).
