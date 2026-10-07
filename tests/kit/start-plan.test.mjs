import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { planProject, selectTools, managedBlock, lineDiff, configAction, formatPlan, projectTypes, GI_START, GI_END } from '../../plugins/kit/scripts/start-plan.mjs';
import { BLOCK_START, BLOCK_END } from '../../plugins/kit/scripts/lanes.mjs';

import { registry } from './fixtures/start-registry.mjs';
const deps = (present = []) => ({ platform: 'win32', run: cmd => (present.includes(cmd.split(' ')[1]) ? { status: 0, stdout: 'ok', stderr: '' } : { status: 1, stdout: '', stderr: '' }) });
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'kit-start-'));
const plan = (dir, o = {}) => planProject({ dir, registry, version: '9.9.9', today: '2026-10-01', deps: deps(o.present), ...o });
const act = (p, id) => p.actions.find(a => a.id === id);

test('empty folder: creates every Tier 2 basic and plans git + openspec init', () => {
  const p = plan(tmp());
  for (const id of ['.gitignore', 'CLAUDE.md', 'docs/project-context.md', '.claude/kit.json']) assert.equal(act(p, id).action, 'create', id);
  assert.equal(act(p, 'git').command, 'git init');
  assert.equal(act(p, 'openspec').command, 'openspec init --tools claude');
  assert.equal(act(p, 'openspec/config.yaml').action, 'after-init');
  assert.match(act(p, 'CLAUDE.md').content, /<!-- kit:routing:start -->[\s\S]*\/opsx:propose[\s\S]*<!-- kit:routing:end -->/);
  assert.match(act(p, '.gitignore').content, /^\.claude\/settings\.local\.json$/m);
  assert.ok(p.changes > 0);
});

test('edited CLAUDE.md without a block: user text kept, block appended, diff shown', () => {
  const d = tmp();
  fs.writeFileSync(path.join(d, 'CLAUDE.md'), '# Mine\n\nMy rules.\n');
  const a = act(plan(d), 'CLAUDE.md');
  assert.equal(a.action, 'differs');
  assert.match(a.content, /^# Mine\n\nMy rules\.\n\n<!-- kit:routing:start -->/);
  assert.match(a.diff, /^\+ <!-- kit:routing:start -->/m);
  assert.doesNotMatch(a.diff, /^- /m);
});

test('outdated block is replaced in place, text around it untouched', () => {
  const d = tmp();
  fs.writeFileSync(path.join(d, 'CLAUDE.md'), `# Mine\n\n${BLOCK_START}\nold rules\n${BLOCK_END}\n\nAfter.\n`);
  const a = act(plan(d), 'CLAUDE.md');
  assert.equal(a.action, 'differs');
  assert.match(a.content, /^# Mine\n\n<!-- kit:routing:start -->/);
  assert.match(a.content, /<!-- kit:routing:end -->\n\nAfter\.\n$/);
  assert.doesNotMatch(a.content, /old rules/);
});

test('damaged marker is a conflict, never a guess', () => {
  const d = tmp();
  fs.writeFileSync(path.join(d, 'CLAUDE.md'), `# Mine\n${BLOCK_START}\nno end marker\n`);
  fs.writeFileSync(path.join(d, '.gitignore'), 'node_modules/\n# kit:end\n');
  const p = plan(d);
  assert.equal(act(p, 'CLAUDE.md').action, 'conflict');
  assert.match(act(p, 'CLAUDE.md').reason, /end marker missing/);
  assert.equal(act(p, '.gitignore').action, 'conflict');
  assert.equal(p.conflicts, 2);
  assert.match(formatPlan(p), /2 conflict\(s\) need you/);
});

test('existing .gitignore gets the kit block appended, its lines kept', () => {
  const d = tmp();
  fs.writeFileSync(path.join(d, '.gitignore'), 'node_modules/\n.env\n');
  const a = act(plan(d), '.gitignore');
  assert.equal(a.action, 'differs');
  assert.match(a.content, /^node_modules\/\n\.env\n\n# kit:start/);
});

test('web-ui: global + web-ui tools applied; other types, dropped and later excluded; project tier only offered', () => {
  const { chosen, offered } = selectTools(registry, { type: 'web-ui' });
  assert.deepEqual(chosen.map(c => c.entry.name), ['ctx', 'imp']);
  assert.deepEqual(offered, ['sp', 'notion']);
  assert.match(chosen[1].why, /web-ui/);
  assert.deepEqual(projectTypes(registry), ['cli', 'web-ui']);
});

test('opt-in declined vs accepted', () => {
  const declined = plan(tmp(), { type: 'web-ui' });
  assert.ok(!declined.tools.some(x => x.name === 'sp'));
  const text = formatPlan(declined);
  assert.match(text, /Available on demand \(not installed now; added when a change needs them\):\n  sp [^\n]*\n  notion /);
  assert.doesNotMatch(text, /opt in|Optional for this project/i);
  const accepted = plan(tmp(), { type: 'web-ui', optIn: ['sp'] });
  const sp = accepted.tools.find(x => x.name === 'sp');
  assert.equal(sp.action, 'install');
  assert.equal(sp.command, 'claude plugin install sp@market --scope project --json');
  assert.equal(sp.kind, 'plugin');
});

test('interactive tool is pending with its note; present tool needs nothing', () => {
  const p = plan(tmp(), { type: 'web-ui', optIn: ['notion'], present: ['imp'] });
  const ctx = p.tools.find(x => x.name === 'ctx');
  assert.equal(ctx.action, 'pending');
  assert.match(ctx.note, /OAuth/);
  assert.equal(p.tools.find(x => x.name === 'notion').action, 'pending');
  assert.equal(p.tools.find(x => x.name === 'imp').action, 'present');
  assert.match(formatPlan(p), /YOU\s+ctx/);
});

test('openspec config: pointer added, existing block gets the pointer, one-line context is a conflict, pointer present is same', () => {
  assert.equal(configAction('schema: spec-driven\n').action, 'differs');
  assert.match(configAction('schema: spec-driven\n').content, /context: \|\n  Project context.*docs\/project-context\.md/);
  assert.equal(configAction('schema: spec-driven\ncontext: |\n  other\n').action, 'differs');
  assert.equal(configAction('schema: spec-driven\ncontext: one line\n').action, 'conflict');
  assert.equal(configAction('schema: x\ncontext: |\n  see docs/project-context.md\n').action, 'same');
});

test('existing project-context doc is kept, never edited', () => {
  const d = tmp();
  fs.mkdirSync(path.join(d, 'docs'));
  fs.writeFileSync(path.join(d, 'docs/project-context.md'), 'mine');
  assert.equal(act(plan(d), 'docs/project-context.md').action, 'keep');
});

test('managedBlock and lineDiff basics', () => {
  assert.equal(managedBlock('', '<a>', '</a>', '<a>x</a>').result, '<a>x</a>\n');
  assert.equal(managedBlock('k\n<a>x</a>\n', '<a>', '</a>', '<a>x</a>').action, 'same');
  assert.equal(managedBlock('# kit:start foo\nx\n# kit:end\n', GI_START, GI_END, '# kit:start foo\nx\n# kit:end').action, 'same');
  assert.equal(lineDiff('a\nb\nc', 'a\nB\nc'), '  a\n- b\n+ B\n  c');
});

test('installed but waiting on the user (check runs, match fails) is pending, not reinstalled', () => {
  const reg = { phases: [], tools: [{ name: 'mcpx', tier: 'project', status: 'trial', scope: 'project', check: 'check mcpx', check_match: 'Connected', install: { win32: 'install mcpx' }, install_note: 'run /mcp' }] };
  const p = planProject({ dir: tmp(), registry: reg, optIn: ['mcpx'], version: '9.9.9', today: '2026-10-01', deps: { platform: 'win32', run: () => ({ status: 0, stdout: 'Status: ! Needs authentication', stderr: '' }) } });
  assert.equal(p.tools[0].action, 'pending');
  assert.equal(p.tools.filter(x => x.action === 'install').length, 0);
});

// prd-pipeline 5.1: knowledge folder

test('empty folder: plans the four knowledge subfolders and records knowledge_dir', () => {
  const p = plan(tmp());
  for (const sub of ['notes', 'prds', 'assets', 'archive']) assert.equal(act(p, `knowledge/${sub}/.gitkeep`).action, 'create', sub);
  assert.equal(JSON.parse(act(p, '.claude/kit.json').content).knowledge_dir, 'knowledge');
  assert.match(act(p, 'CLAUDE.md').content, /### Knowledge and PRDs[\s\S]*PRD: knowledge\/prds\/<slug>\.md @ <commit>/);
});

test('existing notes untouched: only missing subfolders are planned', () => {
  const d = tmp();
  fs.mkdirSync(path.join(d, 'knowledge', 'notes'), { recursive: true });
  fs.writeFileSync(path.join(d, 'knowledge', 'notes', 'a.md'), 'mine');
  const p = plan(d);
  assert.equal(act(p, 'knowledge/notes/').action, 'same');
  assert.equal(act(p, 'knowledge/notes/.gitkeep'), undefined);
  for (const sub of ['prds', 'assets', 'archive']) assert.equal(act(p, `knowledge/${sub}/.gitkeep`).action, 'create');
  assert.ok(!p.actions.some(a => a.id.startsWith('knowledge/notes/a')));
});

test('configured knowledge_dir is used for folders and the routing block', () => {
  const d = tmp();
  fs.mkdirSync(path.join(d, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(d, '.claude', 'kit.json'), JSON.stringify({ knowledge_dir: 'docs/knowledge' }));
  const p = plan(d);
  assert.equal(act(p, 'docs/knowledge/prds/.gitkeep').action, 'create');
  assert.match(act(p, 'CLAUDE.md').content, /`docs\/knowledge\/prds\/`/);
});

test('re-sync of an older routing block shows the knowledge section as a CHANGE diff', async () => {
  const { routingBlock, laneMap } = await import('../../plugins/kit/scripts/lanes.mjs');
  const d = tmp();
  fs.writeFileSync(path.join(d, 'CLAUDE.md'), `# Mine\n\n${routingBlock(laneMap(registry), { kitVersion: '9.9.9' })}\n`);
  const a = act(plan(d), 'CLAUDE.md');
  assert.equal(a.action, 'differs');
  assert.match(a.diff, /\+ ### Knowledge and PRDs/);
  assert.match(a.content, /^# Mine\n/);
});

// ---------- prd-pipeline-followups 5.1: question context ----------
import { typeOptions, offeredTools, DEFAULT_RECOMMEND } from '../../plugins/kit/scripts/start-plan.mjs';

const ctxRegistry = {
  phases: [],
  tools: [
    { name: 'pw', tier: 'project-type:web-ui', status: 'trial', scope: 'project' },
    { name: 'old', tier: 'project-type:web-ui', status: 'dropped', scope: 'project' },
    { name: 'ss', tier: 'project', status: 'trial', scope: 'project', reason: 'Heavy flow for risky changes', recommend: 'no', recommend_why: 'plain flow covers most' },
    { name: 'x', tier: 'project', status: 'trial', scope: 'project', reason: 'Something optional' },
  ],
};

test('Next.js folder recommends web-ui with its reason; empty folder recommends nothing', () => {
  const d = tmp();
  assert.deepEqual(typeOptions(ctxRegistry, d), [{ name: 'web-ui', tools: ['pw'], about: 'adds pw', recommended: false, why: null }]);
  fs.writeFileSync(path.join(d, 'next.config.ts'), '');
  const [t] = typeOptions(ctxRegistry, d);
  assert.equal(t.recommended, true);
  assert.equal(t.why, 'found next.config.ts: this is a web app');
  fs.rmSync(path.join(d, 'next.config.ts'));
  fs.writeFileSync(path.join(d, 'nextXconfigXts'), '');
  assert.equal(typeOptions(ctxRegistry, d)[0].recommended, false);
});

test('opt-in tools carry the registry recommendation, or default to no with a reason', () => {
  assert.deepEqual(offeredTools(ctxRegistry, ['ss', 'x']), [
    { name: 'ss', about: 'Heavy flow for risky changes', recommend: 'no', why: 'plain flow covers most' },
    { name: 'x', about: 'Something optional', ...DEFAULT_RECOMMEND },
  ]);
  assert.equal(DEFAULT_RECOMMEND.why, 'optional; add it later when a change needs it');
});

test('CLAUDE.md CHANGE carries about and a yes recommendation; plan lists them', () => {
  const d = tmp();
  fs.writeFileSync(path.join(d, 'CLAUDE.md'), '# Mine\n');
  const p = plan(d);
  const a = act(p, 'CLAUDE.md');
  assert.equal(a.action, 'differs');
  assert.match(a.about, /routing section/);
  assert.equal(a.recommend, 'yes');
  assert.ok(a.why);
  assert.equal(act(p, 'knowledge/prds/.gitkeep').recommend, 'yes');
  assert.ok(Array.isArray(p.offeredTools) && Array.isArray(p.typeOptions));
});

test('followups 5.6: an existing context block gets the pointer appended as a CHANGE', () => {
  const cfg = 'schema: spec-driven\n# comment\ncontext: |\n  Product: X\n\n  - detail\nrules:\n  proposal: []\n';
  const a = configAction(cfg);
  assert.equal(a.action, 'differs');
  assert.equal(a.content, 'schema: spec-driven\n# comment\ncontext: |\n  Product: X\n\n  - detail\n  Project context, decisions and open ideas: docs/project-context.md. Read it before any proposal.\nrules:\n  proposal: []\n');
  assert.match(a.diff, /\+   Project context, decisions and open ideas/);
  assert.equal(configAction('schema: spec-driven\ncontext: one line\n').action, 'conflict');
});

test('followups 5.5: first_use goes under Later; install notes hidden for INSTALL, shown for YOU steps', () => {
  const reg = structuredClone(registry);
  const t = reg.tools.find(x => x.tier === 'project-type:web-ui' && !x.interactive && ['adopted', 'trial'].includes(x.status));
  t.first_use = 'When you first do UI polish, run /x init once';
  t.install_note = 'INTERNAL NOTE unverified on Windows';
  const text = formatPlan(planProject({ dir: tmp(), registry: reg, type: 'web-ui', version: '9.9.9', today: '2026-10-01', deps: deps() }));
  assert.match(text, /Later \(when you first use it\):\n  \S+\s+When you first do UI polish, run \/x init once/);
  assert.doesNotMatch(text, /INTERNAL NOTE/);
});
