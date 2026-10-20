// release-basics (spec: repo-release): license, issue templates and honest descriptions for the public repo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const plugin = () => JSON.parse(read('plugins/kit/.claude-plugin/plugin.json'));

test('repo-release: License present', () => {
  const lic = read('LICENSE');
  assert.match(lic, /^MIT License/);
  assert.match(lic, /Copyright \(c\) 2026 CKamarakis/);
  assert.equal(plugin().license, 'MIT');
});

test('repo-release: Bug report fields', () => {
  const bug = YAML.parse(read('.github/ISSUE_TEMPLATE/bug.yml'));
  const ids = bug.body.filter(b => b.id).map(b => b.id);
  assert.deepEqual(ids, ['kit-version', 'os', 'claude-version', 'steps', 'expected', 'actual']);
  for (const f of ['bug.yml', 'idea.yml']) assert.match(read(`.github/ISSUE_TEMPLATE/${f}`), /Don't paste secrets/);
});

test('repo-release: No dropped features', () => {
  const market = JSON.parse(read('.claude-plugin/marketplace.json'));
  const texts = [plugin().description, market.description, market.plugins[0].description];
  for (const t of texts) {
    assert.ok(t && t.length > 40, 'description present');
    assert.doesNotMatch(t, /feedback inbox|personal/i);
  }
  assert.equal(market.plugins[0].description, plugin().description);
  assert.equal(plugin().repository, 'https://github.com/CKamarakis/ac-workbench');
});
