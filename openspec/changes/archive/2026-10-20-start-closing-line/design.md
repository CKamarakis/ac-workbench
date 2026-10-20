# Design

## Context

See proposal.md - Why. The link target was checked with `npm view @fission-ai/openspec homepage` (2026-10-20): `https://github.com/Fission-AI/OpenSpec`, the same page `README.md` links.

## Decisions

### D1 One line, not a section

The user's choice (2026-10-20): the start page already has a lot of text. One line names where `/opsx:` comes from and hands the "which one now" question to `/kit:next`; no per-command explanation.

### D2 A Markdown link, not the bare URL

The user asked for a link without the whole URL on the page. The skill writes `[OpenSpec](https://github.com/Fission-AI/OpenSpec)`; how a terminal shows a Markdown link (clickable text or text plus URL) depends on the terminal and is unverified.
