## How it works, roughly
`npm run smoke` runs every kit script and the archive gate in a throwaway project in `../temp`, with the real OpenSpec and no AI, in about 20 seconds. `npm run smoke:check` compares kit files with the last passing run.

## Why

- **End-to-end smoke test without AI**: tests the whole kit from this machine at no cost; GitHub CI on three systems was moved to later.
- **Smoke test runs only on request**: keeps `npm test` fast; the judge says when a run is due instead.
- **Smoke-test judge**: file-based rather than a risk judgment, so it is predictable and free.
