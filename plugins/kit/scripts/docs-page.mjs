// Docs page template (kit-docs design D4; spec: living-docs "Docs page build"). Pure: renderPage(model) -> one
// self-contained HTML string. Look: the three-panel docs style the user chose (.impeccable/mocks/decision/canon-v2.html).
// Every source string goes through esc(); the page script only moves and shows existing nodes. Zero dependencies.

export const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
/** Requirement text: escaped first, then paragraphs, `- ` lists, **bold** and `code`. Nothing else is interpreted. */
export function inlineMd(text) {
  const inline = s => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  const out = [];
  for (const block of String(text ?? '').replace(/\r\n?/g, '\n').split(/\n\s*\n/)) {
    let para = [], items = null;
    const flushP = () => { if (para.length) out.push(`<p>${inline(para.join(' '))}</p>`); para = []; };
    const flushL = () => { if (items) out.push(`<ul>${items.map(i => `<li>${inline(i)}</li>`).join('')}</ul>`); items = null; };
    for (const line of block.split('\n')) {
      const m = /^\s*[-*]\s+(.*)$/.exec(line);
      if (m) { flushP(); (items ??= []).push(m[1].trim()); }
      // An indented line continues the current list item.
      else if (line.trim()) { if (items && /^\s+/.test(line)) items[items.length - 1] += ` ${line.trim()}`; else { flushL(); para.push(line.trim()); } }
    }
    flushP(); flushL();
  }
  return out.join('');
}
const slugId = s => String(s ?? '').toLowerCase().replace(/[^a-z0-9/-]+/g, '-');

/** Tree order, shared by the build (default order) and the page script (re-sorting). Missing dates always sort last. */
export function compareNodes(key, dir) {
  return (a, b) => {
    const va = key === 'name' ? a.name : a[key], vb = key === 'name' ? b.name : b[key];
    if (!va && !vb) return 0;
    if (!va) return 1;
    if (!vb) return -1;
    const c = key === 'name' ? va.localeCompare(vb) : (va < vb ? -1 : va > vb ? 1 : 0);
    return (dir === 'desc' ? -c : c) || a.name.localeCompare(b.name);
  };
}
const sortTree = nodes => [...nodes].map(n => ({ ...n, children: sortTree(n.children ?? []) }))
  .sort(compareNodes('updated', 'desc'));

const CSS = `
:root{color-scheme:light dark;--bg:#fff;--nav:#f5f6f8;--line:#e1e5eb;--ink:#1f2430;--mute:#5b6271;--accent:#1d4ed8;--accent-soft:#e6eefc;
--aside:#eef2f8;--row:#f6f8fb;--und-bg:#fff4d6;--und-line:#e9c46a;--und-ink:#6b4100;--warn:#9a3412}
@media (prefers-color-scheme:dark){:root{--bg:#14171c;--nav:#1a1e25;--line:#2b313b;--ink:#e6e8ec;--mute:#a6aebb;--accent:#93b4ff;--accent-soft:#22304d;
--aside:#1a2130;--row:#1d222b;--und-bg:#3a2e10;--und-line:#7a5d1c;--und-ink:#ffdf99;--warn:#fdba74}}
*{box-sizing:border-box}
html,body{margin:0;height:100%}
body{font:16px/1.6 system-ui,"Segoe UI",sans-serif;color:var(--ink);background:var(--bg);display:grid;grid-template-columns:290px 1fr;min-height:100vh}
::selection{background:var(--accent-soft)}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:4px}
a{color:var(--accent);text-underline-offset:3px}
nav{background:var(--nav);border-right:1px solid var(--line);padding:22px 14px;position:sticky;top:0;height:100vh;overflow-y:auto}
nav h1{font-size:17px;margin:0 0 2px 10px}
nav .built{font-size:13px;color:var(--mute);margin:0 0 14px 10px}
.sort{display:flex;gap:6px;margin:0 0 16px 10px;align-items:center;font-size:13px}
.sort label{color:var(--mute)}
.sort select,.sort button{font:inherit;color:var(--ink);background:var(--bg);border:1px solid var(--line);border-radius:6px;padding:3px 8px;cursor:pointer}
.grp{font-size:12px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--mute);margin:16px 0 4px 10px}
nav ul{list-style:none;margin:0;padding:0}
nav ul ul{padding-left:16px}
nav a{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:5px 10px;border-radius:6px;font-size:14px;color:var(--ink);text-decoration:none}
nav a:hover{background:var(--accent-soft)}
nav a[aria-current=page]{background:var(--accent-soft);color:var(--accent);font-weight:600}
nav summary{display:flex;align-items:center;gap:8px;padding:5px 10px;border-radius:6px;font-size:14px;font-weight:600;cursor:pointer;list-style:none}
nav summary::-webkit-details-marker{display:none}
nav summary::before{content:"";width:6px;height:6px;border-right:1.5px solid var(--mute);border-bottom:1.5px solid var(--mute);transform:rotate(-45deg);transition:transform .15s ease-out;flex:none}
nav details[open]>summary::before{transform:rotate(45deg)}
nav summary:hover{background:var(--accent-soft)}
nav summary a{padding:0;display:inline;font-weight:600}
nav summary .badge{margin-left:auto}
.req ul{margin:4px 0 8px;padding-left:20px}
.req p{margin:0 0 6px}
code{font:13px ui-monospace,Consolas,monospace;background:var(--row);border-radius:4px;padding:1px 4px}
.badge{background:var(--und-bg);color:var(--und-ink);border:1px solid var(--und-line);border-radius:999px;padding:0 7px;font-size:12px;font-weight:600}
.page{display:none;grid-template-columns:minmax(0,1fr) 360px;min-height:100vh}
.page.on{display:grid}
.page.wide{grid-template-columns:minmax(0,1fr)}
.main{padding:32px 48px 64px;max-width:860px}
.crumb{font-size:13px;color:var(--mute)}
h2{font-size:28px;line-height:1.2;margin:4px 0 8px}
h3{font-size:18px;margin:0 0 4px}
.purpose{color:var(--mute);margin:0 0 16px}
.how{background:var(--row);border-radius:8px;padding:12px 16px;margin:0 0 8px}
.how b{display:block;font-size:14px;margin-bottom:2px}
.req{border:1px solid var(--line);border-radius:10px;padding:18px 20px;margin-top:20px}
.req>p{margin:0 0 6px}
.changed{font-size:13px;color:var(--mute)}
.stories{list-style:none;margin:12px 0 0;padding:0}
.story{padding:12px 0 4px;border-top:1px solid var(--line)}
.story-t{font-size:14px;font-weight:600;margin-bottom:6px;display:flex;gap:8px;align-items:center}
.story-n{display:inline-grid;place-items:center;min-width:22px;height:22px;border-radius:50%;background:var(--accent-soft);color:var(--accent);font-size:12px;font-variant-numeric:tabular-nums}
.row{display:grid;grid-template-columns:72px 1fr;background:var(--row);padding:3px 12px}
.row:first-of-type{border-radius:6px 6px 0 0}.row:last-child{border-radius:0 0 6px 6px}
.kw{font-size:12px;font-weight:700;color:var(--accent);line-height:1.9;letter-spacing:.03em}
.warn{color:var(--warn);font-size:14px;margin:8px 0}
aside{background:var(--aside);border-left:1px solid var(--line);padding:30px 24px;font-size:15px}
aside .sh{font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--mute);margin:0 0 6px}
aside section{margin-bottom:24px}
aside p{margin:0 0 10px}
aside .for{font-size:13px;font-weight:600;margin:0}
.und{background:var(--und-bg);border:1px solid var(--und-line);color:var(--und-ink);border-radius:8px;padding:8px 12px;margin:0 0 8px;font-size:15px}
.und small{display:block;font-size:13px}
.history{margin-top:32px}
.history ol{padding-left:18px}
.history li{margin-bottom:6px}
.card{border:1px solid var(--line);border-radius:10px;padding:16px 20px;margin-top:16px}
.card.replaced{opacity:.75}
.card dl{margin:8px 0 0;display:grid;grid-template-columns:150px 1fr;gap:4px 16px}
.card dt{font-size:14px;font-weight:600;color:var(--mute)}
.card dd{margin:0}
.tag{font-size:12px;border:1px solid var(--line);border-radius:999px;padding:0 8px;color:var(--mute);margin-left:6px;font-weight:500}
.tool{display:grid;grid-template-columns:180px 1fr;gap:4px 16px;padding:10px 0;border-top:1px solid var(--line)}
.tool .pk{font-size:13px;color:var(--mute);font-family:ui-monospace,Consolas,monospace}
.tool.dev{font-size:14px;color:var(--mute)}
.empty{color:var(--mute)}
@media (max-width:1100px){.page.on{grid-template-columns:minmax(0,1fr)}aside{border-left:0;border-top:1px solid var(--line)}}
@media (max-width:760px){body{grid-template-columns:1fr}nav{position:static;height:auto}.main{padding:24px 20px 48px}}
`;

// Page script: hash navigation and tree sorting. Moves existing nodes only; never writes markup.
const SCRIPT = (cmp) => `
(function(){
var compareNodes=${cmp};
function show(){
  var raw=location.hash.slice(1),h;
  try{h=decodeURIComponent(raw)}catch(e){h=raw}
  h=h||'overview';
  // Spec pages live under spec/ so a spec named tools, foundations or overview can't collide with those views.
  var view=h.indexOf('foundations/')===0?'foundations':h.indexOf('spec/')===0?'spec:'+h.slice(5):h;
  var pages=document.querySelectorAll('.page'),found=false;
  for(var i=0;i<pages.length;i++){var on=pages[i].getAttribute('data-page')===view;pages[i].classList.toggle('on',on);if(on)found=true;}
  if(!found){document.querySelector('.page[data-page="overview"]').classList.add('on');view='overview';}
  var links=document.querySelectorAll('nav a[href]');
  for(var j=0;j<links.length;j++){if(links[j].getAttribute('href')==='#'+(view.indexOf('spec:')===0?'spec/'+view.slice(5):view))links[j].setAttribute('aria-current','page');else links[j].removeAttribute('aria-current');}
  if(h.indexOf('foundations/')===0){var cards=document.querySelectorAll('[data-card]');for(var k=0;k<cards.length;k++)if(cards[k].getAttribute('data-card')===h.slice(12))cards[k].scrollIntoView();}
  else window.scrollTo(0,0);
}
function sort(){
  var key=document.getElementById('sort-by').value,btn=document.getElementById('sort-dir'),dir=btn.getAttribute('data-dir');
  btn.textContent=key==='name'?(dir==='desc'?'Z\\u2013A':'A\\u2013Z'):(dir==='desc'?'Newest first':'Oldest first');
  var lists=document.querySelectorAll('nav ul[data-tree]');
  for(var i=0;i<lists.length;i++){
    var items=Array.prototype.slice.call(lists[i].children);
    var data=items.map(function(li){return{li:li,name:li.getAttribute('data-name'),created:li.getAttribute('data-created'),updated:li.getAttribute('data-updated')};});
    data.sort(compareNodes(key,dir)).forEach(function(d){lists[i].appendChild(d.li);});
  }
}
document.getElementById('sort-by').addEventListener('change',sort);
document.getElementById('sort-dir').addEventListener('click',function(){this.setAttribute('data-dir',this.getAttribute('data-dir')==='desc'?'asc':'desc');sort();});
window.addEventListener('hashchange',show);show();
})();`;

const dateAttr = d => esc(d ?? '');
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

function treeItems(nodes) {
  return nodes.map(n => {
    const kids = n.children?.length ? `<ul data-tree>${treeItems(n.children)}</ul>` : '';
    const attrs = `data-path="${esc(n.path)}" data-name="${esc(n.name.toLowerCase())}" data-created="${dateAttr(n.created)}" data-updated="${dateAttr(n.updated)}"`;
    const badge = n.undecided ? ` <span class="badge" title="${n.undecided} undecided">${n.undecided}</span>` : '';
    // A product opens and closes; its own spec (if any) is a link inside the summary.
    if (kids) return `<li class="prod" ${attrs}><details open><summary>${n.hasSpec ? `<a href="#spec/${esc(n.path)}">${esc(n.name)}</a>` : esc(n.name)}${badge}</summary>${kids}</details></li>`;
    return `<li ${attrs}><a href="#spec/${esc(n.path)}">${esc(n.name)}${badge}</a></li>`;
  }).join('');
}

const linkCards = text => esc(text).replace(/\[\[([^\]]+)\]\]/g, (_, s) => `<a href="#foundations/${slugId(s)}">${s}</a>`);
const undItem = u => `<div class="und">${esc(u.text)}<small>${esc(u.change)} · ${u.status === 'later' ? 'put off' : 'open'} since ${esc(u.date)}</small></div>`;

function story(sc, i) {
  const rows = sc.rows.map(r => `<div class="row"><span class="kw">${esc(r.kw)}</span><span>${esc(r.text)}</span></div>`).join('');
  return `<li class="story"><div class="story-t"><span class="story-n">${i + 1}</span>${esc(sc.name)}</div>${rows}</li>`;
}

function subPage(p, path) {
  const reqs = p.requirements.map(r => `<article class="req"><h3>${esc(r.name)}</h3>${r.text ? inlineMd(r.text) : ''}${r.change ? `<div class="changed">Changed by ${esc(r.change.change)}${r.change.date ? ` · ${esc(r.change.date)}` : ''}</div>` : ''}${r.scenarios.length ? `<ol class="stories">${r.scenarios.map(story).join('')}</ol>` : ''}</article>`).join('');
  const why = p.requirements.filter(r => r.why?.length).map(r => `<p class="for">${esc(r.name)}</p>${r.why.map(w => `<p>${linkCards(w.text)}</p>`).join('')}`).join('');
  const orphan = p.orphanWhy?.length ? `<section><h3 class="sh">Notes without a requirement</h3>${p.orphanWhy.map(o => `<p class="for">${esc(o.requirement)}</p><p>${linkCards(o.text)}</p>`).join('')}</section>` : '';
  const last = p.history?.[0];
  const history = p.history?.length ? `<section class="history"><h3>History</h3><ol>${p.history.map(h => `<li><b>${esc(h.change)}</b>${h.date ? ` · ${esc(h.date)}` : ''}${h.why ? ` — ${esc(h.why)}` : ''}</li>`).join('')}</ol></section>` : '';
  return `<section class="page" data-page="spec:${esc(path)}"><div class="main">
<div class="crumb">${p.crumb.map(esc).join(' › ')}</div><h2>${esc(p.title)}</h2>${p.purpose ? `<p class="purpose">${esc(p.purpose)}</p>` : ''}
${p.warnings.map(w => `<p class="warn">${esc(w)}</p>`).join('')}${p.how ? `<div class="how"><b>How it works, roughly</b>${esc(p.how)}</div>` : ''}
${reqs || '<p class="empty">No requirements yet.</p>'}${history}</div>
<aside>${p.undecided.length ? `<section><h3 class="sh">Undecided</h3>${p.undecided.map(undItem).join('')}</section>` : ''}
${why ? `<section><h3 class="sh">Why</h3>${why}</section>` : ''}${orphan}
${last ? `<section><h3 class="sh">Changed by</h3><p>${esc(last.change)}${last.date ? ` · ${esc(last.date)}` : ''}</p></section>` : ''}
${p.prd ? `<section><h3 class="sh">From PRD</h3><p>${esc(p.prd.title)} · ${esc(p.prd.status)}<br><small>${esc(p.prd.path)}</small></p></section>` : ''}</aside></section>`;
}

function cardsPage(cards) {
  const body = cards.length ? cards.map(c => `<article class="card${c.status === 'replaced' ? ' replaced' : ''}" data-card="${esc(slugId(c.slug))}" id="card-${esc(slugId(c.slug))}">
<h3>${esc(c.title)}<span class="tag">${c.product ? esc(c.product) : 'app-wide'}</span>${c.status === 'replaced' ? '<span class="tag">replaced</span>' : ''}</h3>
${c.status === 'replaced' && c.replacedBy ? `<p>Replaced by <a href="#foundations/${esc(slugId(c.replacedBy))}">${esc(c.replacedBy)}</a></p>` : ''}
<dl>${Object.entries(c.sections).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${linkCards(v)}</dd>`).join('')}</dl></article>`).join('') : '<p class="empty">No foundation cards yet.</p>';
  return `<section class="page wide" data-page="foundations"><div class="main"><h2>Foundations</h2><p class="purpose">Technical choices that shape more than one sub-feature, in plain language.</p>${body}</div></section>`;
}

function toolsPage(tools, note) {
  const body = tools ? (tools.length ? tools.map(g => `<h3 style="margin-top:24px">${esc(g.group)}</h3>${g.tools.map(t => `<div class="tool${t.dev ? ' dev' : ''}"><div><b>${esc(t.name)}</b>${t.dev ? '<span class="tag">dev</span>' : ''}<div class="pk">${t.packages.map(esc).join(', ')}</div></div><div>${esc(t.purpose)}${t.usedBy ? `<div class="changed">Used by ${esc(t.usedBy)}</div>` : ''}${t.addedBy ? `<div class="changed">Added by ${esc(t.addedBy)}</div>` : ''}</div></div>`).join('')}`).join('') : '<p class="empty">No tools inventory yet.</p>') : `<p class="empty">${esc(note ?? 'No package.json in this project.')}</p>`;
  return `<section class="page wide" data-page="tools"><div class="main"><h2>Tools</h2><p class="purpose">What the project depends on, grouped by purpose.</p>${body}</div></section>`;
}

function overview(m) {
  const all = Object.entries(m.undecidedByChange ?? {}).flatMap(([, list]) => list);
  const pageUnd = Object.entries(m.pages).flatMap(([p, pg]) => pg.undecided.map(u => ({ ...u, path: p })));
  const count = all.length + pageUnd.length;
  const list = pageUnd.map(u => `<div class="und"><a href="#spec/${esc(u.path)}">${esc(m.pages[u.path].title)}</a>: ${esc(u.text)}<small>${esc(u.change)} · since ${esc(u.date)}</small></div>`).join('')
    + all.map(undItem).join('');
  return `<section class="page wide" data-page="overview"><div class="main"><h2>${esc(m.title)}</h2>
${m.empty ? '<p class="purpose">No specs yet. Behaviors appear here once a change is archived.</p>' : `<p class="purpose">${plural(Object.keys(m.pages).length, 'sub-feature')}. Pick one on the left.</p>`}
${m.warnings.map(w => `<p class="warn">${esc(w)}</p>`).join('')}
<h3 style="margin-top:28px">Undecided${count ? ` (${count})` : ''}</h3>${count ? list : '<p class="empty">Nothing undecided.</p>'}
${m.noSpecChanges?.length ? `<section class="history"><h3>Other archived changes</h3><ol>${m.noSpecChanges.map(h => `<li><b>${esc(h.change)}</b>${h.date ? ` · ${esc(h.date)}` : ''} · no spec changes${h.why ? ` — ${esc(h.why)}` : ''}</li>`).join('')}</ol></section>` : ''}</div></section>`;
}

export function renderPage(m) {
  const tree = sortTree(m.tree ?? []);
  const pages = Object.keys(m.pages).sort().map(p => subPage(m.pages[p], p)).join('\n');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="${'kit-docs-archive'}" content="${esc(m.builtFrom ?? '')}">
<title>${esc(m.title)} · docs</title><style>${CSS}</style></head><body>
<nav aria-label="Docs"><h1><a href="#overview" style="padding:0;display:inline">${esc(m.title)}</a></h1><p class="built">Living docs${m.builtFrom ? ` · built from ${esc(m.builtFrom)}` : ''}</p>
<div class="sort"><label for="sort-by">Sort</label><select id="sort-by"><option value="updated" selected>Last updated</option><option value="created">Created</option><option value="name">Name</option></select><button type="button" id="sort-dir" data-dir="desc">Newest first</button></div>
<div class="grp">App</div><ul><li><a href="#foundations">Foundations</a></li><li><a href="#tools">Tools</a></li></ul>
<div class="grp">Products</div>${tree.length ? `<ul data-tree>${treeItems(tree)}</ul>` : '<p class="empty" style="margin-left:10px">No specs yet.</p>'}
</nav><div>
${overview(m)}
${pages}
${cardsPage(m.cards ?? [])}
${toolsPage(m.tools, m.toolsNote)}
</div><script>${SCRIPT(compareNodes.toString())}</script></body></html>
`;
}
