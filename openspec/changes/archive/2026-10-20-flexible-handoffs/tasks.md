## 1. Quieter steps

- [x] 1.1 `/kit:capture`: remove step 6 (PRD offer) and its mentions; evals and tests that check the offer updated or removed; `npm test` and `npm run evals` pass
- [x] 1.2 `/kit:status`: `status.mjs` reports a plain notes count (no used/unused logic); skill text says "N notes" with no call to action; tests for "Notes as a plain count" and the no-roadmap case pass
- [x] 1.3 `/kit:next` skill text: drop "notes with no PRD yet" (the spec already says notes alone lead to no suggestion); eval text check passes

## 2. PRD handoff

- [x] 2.1 `lanes.mjs` routing text: propose takes one PRD (most recent by default, or the user's pick), a non-Ready PRD gets a one-line note, never a stop; the `PRD:` line and the yes-only `Building` offer stay; start-plan tests and the smoke routing check pass

## 3. Test sheet and roadmap

- [x] 3.1 `docs/test-sheet.md`: one page, handoffs in journey order (1–3 detailed, 4–7 one row each), columns "you type | good looks like | what went wrong", the how-to-run and privacy lines
- [x] 3.2 Roadmap: M13 T6 reworded to "test sheet run once on a real project"; M13 notes record the 36 cases as parked with the batch decisions; a v2 item "notes service (new, orphaned or old notes, on request)"; `roadmap.mjs check` clean

## 4. Release

- [x] 4.1 Kit 0.21.0; `npm test`, `npm run evals`, `npm run registry`, `npm run smoke` pass; `openspec validate flexible-handoffs --strict` passes
