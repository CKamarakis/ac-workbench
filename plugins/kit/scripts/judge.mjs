// Flow judge: recommends plain OpenSpec or SuperSpec for a change from a risk checklist, with reasons
// (quality-gates design D7; spec: flow-recommendation). Deterministic keyword matching; the user decides.
// Zero dependencies.
// Usage: node judge.mjs (--file <prd-or-proposal.md> | --text "<description>") [--json]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const CHECKLIST = [
  { id: 'payments', label: 'touches payments, money or billing', strong: true,
    words: ['payment', 'payments', 'pay', 'checkout', 'stripe', 'paypal', 'billing', 'invoice', 'invoices', 'subscription', 'subscriptions', 'refund', 'refunds', 'charge', 'charges', 'price', 'pricing', 'wallet'] },
  { id: 'auth', label: 'touches authentication, sessions or permissions', strong: true,
    words: ['auth', 'authentication', 'login', 'logout', 'sign-in', 'signin', 'signup', 'sign-up', 'password', 'passwords', 'session', 'sessions', 'token', 'tokens', 'oauth', 'permission', 'permissions', 'role', 'roles', 'rbac', '2fa', 'mfa'] },
  { id: 'personal-data', label: 'touches personal data',
    words: ['personal data', 'pii', 'gdpr', 'email address', 'email addresses', 'phone number', 'address book', 'date of birth', 'medical', 'health data', 'user data', 'customer data', 'export my data'] },
  { id: 'migration', label: 'includes a data migration or a schema change', strong: true,
    words: ['migration', 'migrations', 'migrate', 'schema change', 'alter table', 'drop column', 'rename column', 'backfill', 'new table', 'data model change'] },
  { id: 'irreversible', label: 'is hard to undo',
    words: ['delete all', 'hard delete', 'permanently', 'irreversible', 'cannot be undone', 'purge', 'wipe', 'drop table', 'truncate'] },
];

// "Wide reach": five or more distinct areas named.
export const AREAS = {
  ui: ['ui', 'page', 'pages', 'screen', 'component', 'components', 'frontend'],
  api: ['api', 'endpoint', 'endpoints', 'route handler', 'server action', 'server actions'],
  database: ['database', 'db', 'table', 'tables', 'query', 'queries'],
  auth: ['auth', 'login', 'session'],
  payments: ['payment', 'payments', 'billing', 'checkout'],
  email: ['email', 'emails', 'notification', 'notifications'],
  jobs: ['job', 'jobs', 'cron', 'queue', 'worker', 'background'],
  search: ['search', 'index', 'indexing'],
  files: ['upload', 'uploads', 'storage', 'files'],
  analytics: ['analytics', 'tracking', 'metrics'],
  integrations: ['webhook', 'webhooks', 'integration', 'third-party'],
  settings: ['settings', 'preferences', 'config'],
};

const norm = s => ` ${String(s).toLowerCase().replace(/[^a-z0-9@\s-]/g, ' ').replace(/\s+/g, ' ')} `;
const has = (text, w) => text.includes(` ${w.toLowerCase()} `);

/** The "Open questions" section's items, plus unknown/TBD markers. */
function vagueness(raw) {
  const reasons = [];
  const m = /^##\s+Open questions\s*\n([\s\S]*?)(?=^##\s|$(?![\s\S]))/im.exec(raw);
  const items = m ? m[1].split('\n').filter(l => /^\s*[-*]\s*\S/.test(l) && !/^\s*[-*]\s*(none|n\/a)\.?\s*$/i.test(l)) : [];
  if (items.length) reasons.push(`${items.length} open question(s)`);
  const marks = raw.match(/\b(TBD|unknown)\b/gi) ?? [];
  if (marks.length) reasons.push(`"${[...new Set(marks.map(x => x.toLowerCase()))].join('", "')}" in the text`);
  return reasons;
}

export function judge(raw) {
  const text = norm(raw);
  const matched = [];
  for (const c of CHECKLIST) {
    const hits = c.words.filter(w => has(text, w));
    if (hits.length) matched.push({ id: c.id, label: c.label, strong: !!c.strong, words: hits });
  }
  const areas = Object.entries(AREAS).filter(([, ws]) => ws.some(w => has(text, w))).map(([a]) => a);
  if (areas.length >= 5) matched.push({ id: 'wide-reach', label: 'has a wide reach', strong: false, words: areas });
  const vague = vagueness(String(raw));
  if (vague.length) matched.push({ id: 'vague', label: 'is vague', strong: false, words: vague });
  const strong = matched.filter(m => m.strong);
  const superspec = matched.length >= 2 || strong.length > 0;
  const reasons = !matched.length ? ['no risk items matched']
    : matched.map(m => `${m.label} (${m.words.join(', ')})`);
  return { flow: superspec ? 'superspec' : 'openspec', matched, reasons,
    why: superspec ? (strong.length ? `${strong.map(s => s.id).join(' + ')} is a high-risk area` : `${matched.length} risk items matched`) : (matched.length ? 'only one minor risk item' : 'no risk items matched') };
}

export function format(r) {
  const name = r.flow === 'superspec' ? 'SuperSpec (big or risky change)' : 'plain OpenSpec';
  return [`Recommended flow: ${name}`, `  why: ${r.why}`, ...r.reasons.map(x => `  - ${x}`), '  You decide; SuperSpec tools are added only if you choose it.'].join('\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2);
  const fi = a.indexOf('--file'), ti = a.indexOf('--text');
  try {
    const raw = fi >= 0 ? fs.readFileSync(a[fi + 1], 'utf8') : ti >= 0 ? a[ti + 1] : null;
    if (raw == null) throw new Error('pass --file <path> or --text "<description>"');
    const r = judge(raw);
    console.log(a.includes('--json') ? JSON.stringify(r, null, 2) : format(r));
  } catch (e) { console.error(`error: ${e.message}`); process.exitCode = 1; }
}
