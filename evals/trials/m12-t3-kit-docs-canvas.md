# M12 T3: /kit:docs on a real project (Acme)

A throwaway copy of Acme, the test app (kit 0.18.3). Nothing committed, nothing installed. About 4 minutes and ~22 tool calls. The detailed notes stay private (repo-privacy); this file keeps the kit findings.

## What was produced
- Two feature notes (How it works plus 10 Why entries in total), one foundation card, a tools inventory covering all of the project's packages, and the page (`index.html`): 12 specs, 117 requirements, no warnings, every Why entry matched to a requirement.

## Spot checks (page vs sources)
- 7 claims checked against specs, archived changes, the PRD frontmatter, design decisions and `decisions.md`: all correct. Requirement counts matched the scan's per-spec sum.
- Weak spots (the agent's, not the script's): some tools-inventory "for:" lines were guessed from package names (**unverified**); "added by" was filled only where a proposal or decision named it.
- Source drift the page doesn't surface: a PRD line and its spec disagreed; the page shows the spec only (correct by the skill's rules; nothing flags the PRD gap).

## Friction / bugs / unclear text
- **No product grouping for flat specs** (`<feature>-board`, `<feature>-saving`): `specTree` (docs.mjs:84) makes no product heading. Loose end L31.
- **No scope option:** `scan` always reports every missing note and package; "docs for one feature" has no path. Loose end L32.
- **Tools inventory is the costly part:** "used by"/"added by" aren't derivable by script, and the skill doesn't say to omit a field the sources don't give. Loose end L33.
- Card link slug form (`[[slug]]` vs `[[folder/slug]]`) unclear in the skill; both work through the page's suffix match (docs-page.mjs:140).
- Orphan Why entries show only on the page, never as a `build` warning.
- No `error:` output, no script failures; Windows CRLF files parsed fine.

## Verdict
**Yes, partly polished.** On a real project the scripts ran clean first time and the page was right on every claim checked. Gaps: per-feature scoping, grouping for flat spec folders, and guidance for the tools inventory.
