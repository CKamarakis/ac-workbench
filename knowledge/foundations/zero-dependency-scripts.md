---
title: The kit's scripts use no dependencies
status: current
---

## In short
Everything under `plugins/kit/` runs on Node's built-ins only. The one package the repo has (`yaml`) is dev-only.

## Why (evidence)
The kit is installed once per machine and must work in every project with nothing to install. The registry is YAML for people and JSON for scripts (kit-local-mvp D2); PRD frontmatter uses a small parser instead of a YAML library (prd-pipeline D3).

## Gives you
Install and update with no `npm install`.

## Limits you
The kit's own small parsers (frontmatter, `spec.md`, the tools inventory) read only simple shapes; anything else is reported, not guessed.

## Affects
toolkit-registry, prd-authoring, knowledge-capture, the docs page.

## History
2026-09-29 kit-local-mvp: chosen with the registry design.
