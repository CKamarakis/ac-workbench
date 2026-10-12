import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseSpec, findSpecs, specTree } from '../../plugins/kit/scripts/docs.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const FIX = path.join(here, 'fixtures', 'docs');
const DOCS_SYNC = fs.readFileSync(path.join(FIX, 'docs-sync.spec.md'), 'utf8').replace(/\r\n/g, '\n');
const w = (d, rel, t) => { fs.mkdirSync(path.dirname(path.join(d, rel)), { recursive: true }); fs.writeFileSync(path.join(d, rel), t); };
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'kit-docs-'));
const SPEC = name => `# ${name}\n\n## Purpose\nP.\n\n## Requirements\n\n### Requirement: R\nThe app SHALL r.\n\n#### Scenario: s\n- **WHEN** a\n- **THEN** b\n`;
const kinds = sc => sc.rows.map(r => r.kw);

// 2.1
test('parseSpec keeps requirement names and splits scenario rows', () => {
  const s = parseSpec(DOCS_SYNC);
  assert.equal(s.requirements[0].name, 'Docs sync sources');
  assert.deepEqual(kinds(s.requirements[0].scenarios[0]), ['GIVEN', 'WHEN', 'THEN']);
  const sc = s.requirements[1].scenarios.find(x => x.name === 'Behavior found in the receipt');
  assert.equal(sc.rows.length, 3);
  assert.match(s.purpose, /^Brings a change's specs/);
  assert.match(s.requirements[0].text, /^The docs sync SHALL run/);
  assert.deepEqual(s.warnings, []);
});

test('scenario without GIVEN has two rows; AND is its own row', () => {
  const s = parseSpec('### Requirement: A\nThe app SHALL a.\n\n#### Scenario: s\n- **WHEN** a\n- **THEN** b\n- **AND** c\n');
  assert.deepEqual(kinds(s.requirements[0].scenarios[0]), ['WHEN', 'THEN', 'AND']);
  assert.equal(s.requirements[0].scenarios[0].rows[2].text, 'c');
});

test('CRLF parses like LF', () => {
  assert.deepEqual(parseSpec(DOCS_SYNC.replace(/\n/g, '\r\n')), parseSpec(DOCS_SYNC));
});

test('malformed spec warns, never throws', () => {
  const s = parseSpec('### Requirement:\nno name\n\n#### Scenario: empty\njust text\n');
  assert.ok(s.warnings.length > 0);
});

// 2.2
test('nested specs become one product with children; flat spec is one level', () => {
  const d = tmp();
  w(d, 'openspec/specs/storms/stickies/spec.md', SPEC('stickies'));
  w(d, 'openspec/specs/storms/saving/spec.md', SPEC('saving'));
  w(d, 'openspec/specs/docs-sync/spec.md', SPEC('docs-sync'));
  const specs = findSpecs(d);
  assert.deepEqual(specs.map(s => s.path), ['docs-sync', 'storms/saving', 'storms/stickies']);
  const tree = specTree(specs);
  assert.deepEqual(tree.map(n => n.name), ['Docs sync', 'Storms']);
  const storms = tree[1];
  assert.equal(storms.hasSpec, false);
  assert.deepEqual(storms.children.map(n => [n.name, n.path, n.hasSpec]), [['Saving', 'storms/saving', true], ['Stickies', 'storms/stickies', true]]);
  assert.deepEqual(tree[0].children, []);
});

test('parent with its own spec and children', () => {
  const d = tmp();
  w(d, 'openspec/specs/storms/spec.md', SPEC('storms'));
  w(d, 'openspec/specs/storms/stickies/spec.md', SPEC('stickies'));
  const [storms] = specTree(findSpecs(d));
  assert.equal(storms.hasSpec, true);
  assert.equal(storms.children.length, 1);
});

test('names from segments: moving-around -> Moving around', () => {
  const d = tmp();
  w(d, 'openspec/specs/storms/moving-around/spec.md', SPEC('m'));
  assert.equal(specTree(findSpecs(d))[0].children[0].name, 'Moving around');
});

test('no openspec/specs -> no specs, no throw', () => {
  assert.deepEqual(findSpecs(tmp()), []);
});
