import { test } from 'node:test';
import assert from 'node:assert/strict';
import { judge, format } from '../../plugins/kit/scripts/judge.mjs';

test('risky change: payments and migration matched with their words -> SuperSpec', () => {
  const r = judge('Add Stripe payments and migrate the orders table');
  assert.equal(r.flow, 'superspec');
  const ids = r.matched.map(m => m.id);
  assert.ok(ids.includes('payments') && ids.includes('migration'));
  assert.deepEqual(r.matched.find(m => m.id === 'payments').words, ['payments', 'stripe']);
  assert.ok(r.matched.find(m => m.id === 'migration').words.includes('migrate'));
});

test('small change -> OpenSpec with "no risk items matched"', () => {
  const r = judge('Add a dark mode toggle to settings');
  assert.equal(r.flow, 'openspec');
  assert.deepEqual(r.reasons, ['no risk items matched']);
  assert.match(format(r), /Recommended flow: plain OpenSpec[\s\S]*You decide/);
});

test('one minor item stays OpenSpec; two minor items go SuperSpec', () => {
  assert.equal(judge('Show the user email address on the profile page').flow, 'openspec');
  assert.equal(judge('Purge old exports permanently and include personal data in the audit').flow, 'superspec');
});

test('vague PRD: open questions and TBD count as an item', () => {
  const prd = '# X\n\n## Scope\n\nTBD\n\n## Open questions\n\n- Who are the users?\n- Which plan?\n';
  const r = judge(prd);
  assert.ok(r.matched.some(m => m.id === 'vague' && /2 open question/.test(m.words.join())));
  assert.equal(judge('# X\n\n## Open questions\n\n- None\n').matched.length, 0);
});

test('wide reach: five areas named', () => {
  const r = judge('Touches the UI, the API, the database queries, email notifications, a cron job and search');
  assert.ok(r.matched.some(m => m.id === 'wide-reach'));
});
