# Notion live spike (2026-10-06)

Hosted Notion MCP on a **free** workspace. Read-only: nothing was written to Notion. Test page "Notes test" (text + 2 images) and a "Notes" database (title-only schema, 2 rows).

**Goal:** decide whether Notion can be the PRD and context store for prd-pipeline (M2).

## Results

| Check | Result |
|---|---|
| Text (`notion-fetch`) | Clean: headings, bold, link and quote intact, not truncated. Quirks: pipes escaped (`\|`), blank lines as `<empty-block/>`. Returns `page_last_edited_at` |
| Images | Fetch gives stable `notion-file-block://` refs. `notion-get-file-download-urls` returns signed S3 URLs with `X-Amz-Expires=300` (**5 minutes**). Both PNGs downloaded (1458×780, 1290×799) and viewed: large text readable, fine print blurry |
| `get_tool_access` | `query_data_sources`: `available_with_limit`. `ai_search`: plan required. `query_multiple_data_sources`: full version required. Search filters and non-relevance sort: Business only |
| Query limit | SQL mode: 9 OK + 1 invalid (my query), plus rows mode 1 OK and view mode 1 OK; then `usage_limit_reached` (retryability "later"). Calls ran in parallel batches, so the cutoff is somewhere between call 10 and 12. Reset window unknown |
| After the limit | rows mode, view mode and `notion-fetch` all failed: the MCP asked to sign in again. Cause unknown; whether view/rows mode are metered is **unverified** |

## Verdict

- Notion works for reading text and images, but **SQL queries are capped at about 10 on the free plan**, so a query-based index is unusable.
- Fetch-only use (no SQL) stayed untested after the sign-out.
- **Decision (user):** Notion dropped as the PRD store; v1 keeps notes and PRDs as Markdown in each project's `knowledge/` folder. `notion-mcp` moves to `later`. See the roadmap drift log (2026-10-06) and `docs/project-context.md`.
