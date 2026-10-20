## 1. License and templates

- [x] 1.1 `LICENSE` (MIT, CKamarakis) and `"license": "MIT"` in `plugin.json`; test in `tests/repo/release-basics.test.mjs` for "License present"
- [x] 1.2 `.github/ISSUE_TEMPLATE/bug.yml`, `idea.yml`, `config.yml` (valid YAML issue forms); test for "Bug report fields"

## 2. Descriptions

- [x] 2.1 Show the user the exact texts (plugin, marketplace, GitHub About) and write them only on a yes; `plugin.json` gets `repository`, `homepage`, `keywords`; test for "No dropped features"; `claude plugin validate` passes
- [x] 2.2 GitHub repo description set with `gh repo edit` only after the user's yes

## 3. Release

- [x] 3.1 Roadmap M13 T1, T3, T4 ticked; kit 0.21.1; `npm test`, `npm run evals`, `npm run smoke` pass
