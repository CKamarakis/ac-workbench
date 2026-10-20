// build-safeguards 4.1 (spec: tool-review "Tool review", "The user decides each update"). Lookups are injected: no network.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { registryEntries, oldestReview, compare, scan, recordText, record } from '../../plugins/kit/scripts/tool-review.mjs';
import { validate } from '../../tools/validate-registry.mjs';
import { tmpDir } from '../../tools/test-root.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const REAL = fs.readFileSync(path.join(repo, 'toolkit.yaml'), 'utf8');

const YAMLTEXT = [
  'phases: [build]',
  'tools:',
  '  - name: superpowers',
  '    source: github:obra/superpowers-marketplace',
  '    status: trial',
  '    plugin: superpowers@superpowers-marketplace',
  '    reviewed_version: 6.4.2',
  '    reviewed_on: 2026-09-01',
  '    verdicts:',
  '      - date: 2026-10-01',
  '        status: trial',
  '        rationale: smoke passed',
  '',
  '  - name: openspec',
  '    source: npm:@fission-ai/openspec',
  '    status: adopted',
  '    reviewed_version: 1.13.2',
  '    reviewed_on: 2026-10-01',
  '    verdicts:',
  '      - date: 2026-10-01',
  '        status: adopted',
  '        rationale: default',
  '',
  '  - name: gone-tool',
  '    source: github:someone/deleted',
  '    status: trial',
  '    reviewed_version: 1.0.0',
  '    reviewed_on: 2026-10-10',
  '    verdicts: []',
  '',
  '  - name: old',
  '    source: npm:old',
  '    status: dropped',
  '    reviewed_version: 1.0.0',
  '    reviewed_on: 2020-01-01',
  '',
  'workflow: []',
  '',
].join('\n');

function kitRepo(text = YAMLTEXT) {
  const d = tmpDir('kit-tr-');
  fs.writeFileSync(path.join(d, 'toolkit.yaml'), text);
  return d;
}

const lookups = {
  plugin: () => ({ unknown: 'catalog pins a commit' }),
  github: repo => (repo === 'someone/deleted' ? { gone: 'GitHub repository someone/deleted not found' } : { version: '7.0.0' }),
  npm: () => ({ version: '1.13.2' }),
  winget: () => ({ unknown: 'n/a' }),
};

test('registryEntries reads the tools list; oldestReview skips dropped tools', () => {
  const e = registryEntries(YAMLTEXT);
  assert.deepEqual(e.map(x => [x.name, x.status, x.reviewed_on]), [['superpowers', 'trial', '2026-09-01'], ['openspec', 'adopted', '2026-10-01'], ['gone-tool', 'trial', '2026-10-10'], ['old', 'dropped', '2020-01-01']]);
  assert.equal(e[0].plugin, 'superpowers@superpowers-marketplace');
  assert.deepEqual(oldestReview(YAMLTEXT, Date.parse('2026-10-13')), { tool: 'superpowers', date: '2026-09-01', days: 42 });
  assert.ok(registryEntries(REAL).some(x => x.name === 'superpowers'), 'reads the real registry');
});

test('compare: major, behind, up to date, ahead, changed', () => {
  assert.equal(compare('6.4.2', '7.0.0'), 'major');
  assert.equal(compare('1.13.2', '1.14.0'), 'behind');
  assert.equal(compare('1.13.2', '1.13.2'), 'up-to-date');
  assert.equal(compare('2.0.0', '1.9.0'), 'ahead');
  assert.equal(compare('e1c8f41', 'a2b3c4d'), 'changed');
});

test('One tool behind: a major version is flagged; Source gone: listed as not found', () => {
  const list = scan({ dir: kitRepo(), lookups });
  const sp = list.find(t => t.name === 'superpowers');
  assert.equal(sp.state, 'major');
  assert.equal(sp.latest, '7.0.0', 'the catalog had no version, so the source repo was used');
  assert.equal(list.find(t => t.name === 'openspec').state, 'up-to-date');
  assert.equal(list.find(t => t.name === 'gone-tool').state, 'source-not-found');
  assert.equal(list.some(t => t.name === 'old'), false, 'dropped tools are not reviewed');
});

test('Version not found: unknown with the reason; the other tools are still checked', () => {
  const list = scan({ dir: kitRepo(), lookups: { ...lookups, npm: () => { throw new Error('rate limit'); }, github: () => ({ unknown: 'no network' }) } });
  assert.deepEqual(list.map(t => [t.name, t.state, t.reason]), [['superpowers', 'unknown', 'no network'], ['openspec', 'unknown', 'rate limit'], ['gone-tool', 'unknown', 'no network']]);
});

test('security: an npm source with shell characters never reaches the command line', async () => {
  const { defaultLookups, NPM_NAME } = await import('../../plugins/kit/scripts/tool-review.mjs');
  assert.ok(NPM_NAME.test('@fission-ai/openspec') && NPM_NAME.test('playwright-cli'));
  assert.deepEqual(defaultLookups().npm('x" & calc & "'), { unknown: 'invalid npm package name "x" & calc & ""' });
});

test('Hold: only reviewed_on changes', () => {
  const out = recordText(YAMLTEXT, { name: 'openspec', action: 'hold', date: '2026-10-18' });
  const diff = out.split('\n').filter((l, i) => l !== YAMLTEXT.split('\n')[i]);
  assert.deepEqual(diff, ['    reviewed_on: 2026-10-18']);
});

test('update sets reviewed_version and reviewed_on; it needs a version', () => {
  const out = recordText(YAMLTEXT, { name: 'superpowers', action: 'update', version: '7.0.0', date: '2026-10-18' });
  const sp = YAML.parse(out).tools.find(t => t.name === 'superpowers');
  assert.equal(String(sp.reviewed_version), '7.0.0');
  assert.equal(String(sp.reviewed_on), '2026-10-18');
  assert.throws(() => recordText(YAMLTEXT, { name: 'superpowers', action: 'update' }), /--version is required/);
});

test('Drop: status dropped and a dropped verdict with the reason; it needs a reason', () => {
  const out = recordText(YAMLTEXT, { name: 'superpowers', action: 'drop', reason: 'no longer used', date: '2026-10-18' });
  const sp = YAML.parse(out).tools.find(t => t.name === 'superpowers');
  assert.equal(sp.status, 'dropped');
  assert.deepEqual(sp.verdicts.at(-1), { date: '2026-10-18', status: 'dropped', rationale: 'no longer used' });
  assert.equal(YAML.parse(out).tools.find(t => t.name === 'openspec').status, 'adopted', 'other entries untouched');
  assert.throws(() => recordText(YAMLTEXT, { name: 'superpowers', action: 'drop' }), /--reason is required/);
  assert.throws(() => recordText(YAMLTEXT, { name: 'nope', action: 'hold' }), /no tool "nope"/);
});

test('L21: drop adds the verdict after the last one, past blank and comment lines inside the list', () => {
  const text = YAMLTEXT.replace(
    "        rationale: smoke passed\n",
    "        rationale: smoke passed\n\n      # a second look\n      - date: 2026-10-05\n        status: trial\n        rationale: still on trial\n",
  );
  assert.equal(YAML.parse(text).tools.find(t => t.name === 'superpowers').verdicts.length, 2, 'fixture has two verdicts');
  const sp = YAML.parse(recordText(text, { name: 'superpowers', action: 'drop', reason: 'no longer used', date: '2026-10-19' })).tools.find(t => t.name === 'superpowers');
  assert.deepEqual(sp.verdicts.map(v => v.date), ['2026-10-01', '2026-10-05', '2026-10-19']);
  assert.equal(sp.verdicts.at(-1).status, 'dropped');
});

test('record output on the real registry still validates (npm run registry)', () => {
  const d = kitRepo(REAL);
  record({ dir: d, name: 'superpowers', action: 'hold', date: '2026-10-18' });
  record({ dir: d, name: 'context7', action: 'drop', reason: 'test drop', date: '2026-10-18' });
  const doc = YAML.parse(fs.readFileSync(path.join(d, 'toolkit.yaml'), 'utf8'));
  assert.deepEqual(validate(doc).errors, []);
  assert.equal(doc.tools.find(t => t.name === 'context7').verdicts.at(-1).status, 'dropped');
});

// verify of build-safeguards: probes and code-review findings
test('a column-0 comment inside tools: does not end the list; a missing reviewed_on makes the review due', () => {
  const text = YAMLTEXT.replace('  - name: openspec', '# planning tools\n  - name: openspec');
  assert.deepEqual(registryEntries(text).map(e => e.name), ['superpowers', 'openspec', 'gone-tool', 'old']);
  const noDate = YAMLTEXT.replace('    reviewed_on: 2026-10-01\n', '');
  assert.deepEqual(oldestReview(noDate, Date.parse('2026-10-13')), { tool: 'openspec', date: null, days: Infinity });
});

test('0.x minor bumps count as major; the highest tag wins over the first one', async () => {
  const { highestTag } = await import('../../plugins/kit/scripts/tool-review.mjs');
  assert.equal(compare('0.16.0', '0.17.0'), 'major');
  assert.equal(compare('0.16.0', '0.16.2'), 'behind');
  assert.equal(highestTag(['v9.0.0', 'v10.0.0', 'v9.5.1']), 'v10.0.0');
  assert.equal(highestTag(['nightly', 'edge']), 'nightly');
});
