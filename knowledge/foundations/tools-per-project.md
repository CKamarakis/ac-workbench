---
title: Tools are enabled per project, never globally
status: current
---

## In short
Only the kit, CLIs and marketplaces are global. Workflow plugins, MCP servers and tool configs are switched on per project.

## Why (evidence)
You work in repos you don't own; tools must be active only where the kit set the project up. Decided 2026-09-29, after a Superpowers install defaulted to user scope (kit-local-mvp D14).

## Gives you
Nothing the kit adds leaks into other repos.

## Limits you
Each project installs its own tools. `claude plugin install` defaults to user scope, so the kit always passes `--scope project`.

## Affects
project-starter, tool-setup, quality-gates (the hooks do nothing outside kit projects).

## History
2026-09-29 kit-local-mvp: decided by the user.
