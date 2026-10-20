## Why

M13 (release prep) needs three basics before strangers can install and trust the kit:
- **T1, a license:** none exists, so nobody may legally reuse the code.
- **T3, issue templates:** without them, bug reports come in without the facts needed to reproduce them.
- **T4, honest descriptions:** the plugin's description still says "feedback inbox, harness review". The feedback inbox was dropped long ago, and the description omits what the kit does today and its limits.

## What Changes

- **`LICENSE`:** MIT, "Copyright (c) 2026 CKamarakis". The handle, because the surname stays out of the repo (repo-privacy).
- **`.github/ISSUE_TEMPLATE/`:**
  - `bug.yml`: kit version (from `/kit:ping`), OS, Claude Code version, what you ran, what you expected, what happened;
  - `idea.yml`: the problem, what you'd like, what you do today;
  - `config.yml`: blank issues allowed.
  - Both templates warn not to paste secrets or private project details.
- **Descriptions** (`plugin.json`, the marketplace entry, the GitHub repo "About"): what the kit does today, in one or two sentences (the user: no platform line).
  - `plugin.json` also gets `license`, `repository`, `homepage` and `keywords`.
  - The user reads the exact text before it's written.

## Capabilities

### New Capabilities
- `repo-release`: what the public repo provides to strangers (license, issue templates, honest descriptions).

### Modified Capabilities

## Impact

- New: `LICENSE`, `.github/ISSUE_TEMPLATE/*.yml`.
- Changed: `plugins/kit/.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, the GitHub repo description (an outward-facing `gh repo edit`, run only on the user's yes).
- Checked with `claude plugin validate` and the tests.
