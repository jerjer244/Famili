'use strict';
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uid = p => p + Math.random().toString(36).slice(2, 9);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const LS = 'famili.state.v1', lsKey = () => LS + (window.FAMILI_USER ? ':' + window.FAMILI_USER : ''), CW = 170, CH = 104, GX = 36, GY = 86;
let S, IMG = {}, db = null, sel = null, pageIdx = 0, view = { x: 40, y: 60, k: 1 }, saveT;

/* ---------- storage ---------- */
const idbOpen = () => new Promise((res, rej) => { const r = indexedDB.open('famili', 1); r.onupgradeneeded = () => r.result.createObjectStore('img'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const idbAll = () => new Promise(res => { const o = {}, q = db.transaction('img').objectStore('img').openCursor(); q.onsuccess = e => { const c = e.target.result; if (c) { o[c.key] = c.value; c.continue(); } else res(o); }; q.onerror = () => res(o); });
const idbPut = (k, v) => { try { db && db.transaction('img', 'readwrite').objectStore('img').put(v, k); } catch (e) { } };
const idbClear = () => { try { db && db.transaction('img', 'readwrite').objectStore('img').clear(); } catch (e) { } };
const src = id => IMG[id] || '';
const putImg = d => { const id = uid('i_'); IMG[id] = d; idbPut(id, d); return id; };
const compress = f => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => { const i = new Image(); i.onload = () => { const k = Math.min(1, 1400 / i.width), c = document.createElement('canvas'); c.width = Math.round(i.width * k); c.height = Math.round(i.height * k); const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(i, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', .82)); }; i.onerror = rej; i.src = r.result; };
  r.onerror = rej; r.readAsDataURL(f);
});
const addFile = async f => putImg(await compress(f));
const toast = t => { const e = $('#toast'); e.textContent = t; e.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove('show'), 2400); };
const stamp = () => new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
function saveNow() {
  try { S.savedAt = Date.now(); localStorage.setItem(lsKey(), JSON.stringify(S)); $('#status').textContent = 'Saved ' + stamp(); window.cloudAuto && cloudAuto(); }
  catch (e) { $('#status').textContent = 'Save failed (storage full)'; toast('Storage full — export a backup'); }
}
const save = () => { clearTimeout(saveT); $('#status').textContent = 'Saving…'; saveT = setTimeout(saveNow, 500); };

/* ---------- data ---------- */
const mk = (id, name, o = {}) => ({ id, name, nick: '', gender: '', birth: '', birthPlace: '', living: true, death: '', deathPlace: '', bio: '', avatar: '', gallery: [], parents: [], partners: [], ...o });
const blank = () => ({ title: 'My Family', tree: { members: {}, tpl: 'classic', bg: '', overlay: 30, line: 'curve', accent: '' }, book: { pages: [{ id: uid('p'), tpl: 'cover', title: 'Our Family Story', sub: 'A history in words and pictures', text: '', memberId: '', photos: [] }], paper: 'ivory', paperImg: '', font: 'serif', ratio: 'a4' } });
function swatch(txt, h) {
  const c = document.createElement('canvas'); c.width = 480; c.height = 360; const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 480, 360);
  g.addColorStop(0, `hsl(${h},45%,62%)`); g.addColorStop(1, `hsl(${h + 40},40%,35%)`); x.fillStyle = g; x.fillRect(0, 0, 480, 360);
  x.fillStyle = '#fff9'; x.font = 'bold 34px Georgia'; x.textAlign = 'center'; x.fillText(txt, 240, 190); return putImg(c.toDataURL('image/jpeg', .8));
}
function demo() {
  const d = blank(); d.title = 'Demo Family — The Whitfields';
  const A = [
    mk('h', 'Henry Whitfield', { nick: 'Grandpa Hank', gender: 'Grandfather', birth: '1938-04-12', birthPlace: 'Leeds, England', living: false, death: '2015-09-03', deathPlace: 'Toronto, Canada', partners: ['p'], bio: 'Henry left Leeds at twenty to work on the railways of Canada. He was a carpenter by trade and a storyteller by nature.\nEvery summer he built something new for the garden.' }),
    mk('p', 'Margaret Whitfield', { nick: 'Peggy', gender: 'Grandmother', birth: '1941-07-22', birthPlace: 'York, England', partners: ['h'], bio: 'Peggy taught primary school for 35 years and still keeps every handwritten letter she was ever sent.' }),
    mk('r', 'Robert Whitfield', { gender: 'Father', birth: '1966-02-14', birthPlace: 'Toronto, Canada', parents: ['h', 'p'], partners: ['e'], bio: 'An engineer who inherited his father\'s love of building things.' }),
    mk('s', 'Susan Chen', { nick: 'Sue', gender: 'Aunt', birth: '1969-11-30', birthPlace: 'Toronto, Canada', parents: ['h', 'p'], partners: ['d'], bio: 'A pediatric nurse and keen amateur painter.' }),
    mk('e', 'Elena Whitfield', { gender: 'Mother', birth: '1968-05-09', birthPlace: 'Madrid, Spain', partners: ['r'], bio: 'Elena moved to Canada in 1990 and brought paella and a very loud laugh with her.' }),
    mk('d', 'David Chen', { gender: 'Uncle', birth: '1967-01-18', birthPlace: 'Vancouver, Canada', partners: ['s'] }),
    mk('m', 'Maya Whitfield', { gender: 'Daughter', birth: '1996-08-03', birthPlace: 'Toronto, Canada', parents: ['r', 'e'], bio: 'Maya studies marine biology and loves sailing.' }),
    mk('l', 'Lucas Whitfield', { gender: 'Son', birth: '1999-12-25', birthPlace: 'Toronto, Canada', parents: ['r', 'e'] }),
    mk('o', 'Oliver Chen', { gender: 'Son', birth: '2001-03-16', birthPlace: 'Toronto, Canada', parents: ['s', 'd'] })
  ];
  A.forEach(m => d.tree.members[m.id] = m);
  const m = d.tree.members; m.h.avatar = swatch('Henry', 30); m.p.avatar = swatch('Peggy', 330);
  m.h.gallery = [{ id: swatch('The garden, 1982', 120), cap: 'The garden he built', year: '1982' }, { id: swatch('Leeds station', 210), cap: 'Leeds railway station', year: '1958' }];
  const gal = m.h.gallery;
  d.book.pages = [
    { id: uid('p'), tpl: 'cover', title: 'The Whitfield Family', sub: 'Leeds → Toronto, 1938 – today', text: 'Stories, faces and places gathered by the family.', memberId: '', photos: [{ id: gal[0].id, cap: '' }] },
    { id: uid('p'), tpl: 'story', title: 'A New Beginning', sub: 'Chapter One', text: 'In 1958 a young carpenter boarded a ship in Liverpool with a toolbox, a suitcase and very little else.\n\nWithin a year he had met Peggy, and the two began building a life, one board at a time.', memberId: 'h', photos: [{ id: gal[1].id, cap: 'Leeds railway station' }] },
    { id: uid('p'), tpl: 'grid', title: 'Photo Memories', sub: 'Gathered over the years', text: '', memberId: '', photos: gal.map(g => ({ id: g.id, cap: g.cap + ' (' + g.year + ')' })) },
    { id: uid('p'), tpl: 'bio', title: 'Meet Peggy', sub: 'Member spotlight', text: '', memberId: 'p', photos: [] }
  ];
  return d;
}

/* ---------- layout & tree ---------- */
let pos = {};
function layout() {
  const by = S.tree.members, M = Object.values(by), g = {}; pos = {};
  M.forEach(m => g[m.id] = 0);
  for (let n = 0; n < M.length + 2; n++) {
    let ch = false;
    for (const m of M) {
      let v = g[m.id];
      m.parents.forEach(p => { if (by[p] && g[p] + 1 > v) v = g[p] + 1; });
      m.partners.forEach(p => { if (by[p] && g[p] > v) v = g[p]; });
      if (v !== g[m.id]) { g[m.id] = v; ch = true; }
    }
    if (!ch) break;
  }
  const rows = []; M.forEach(m => (rows[g[m.id]] = rows[g[m.id]] || []).push(m));
  const maxN = Math.max(1, ...rows.filter(Boolean).map(r => r.length));
  rows.forEach((row, r) => {
    if (!row) return;
    const key = m => { const xs = m.parents.map(p => pos[p] && pos[p].x).filter(x => x != null); return xs.length ? xs.reduce((a, b) => a + b) / xs.length : 1e9; };
    row.sort((a, b) => key(a) - key(b));
    const out = [], seen = new Set();
    const add = m => { if (seen.has(m.id)) return; seen.add(m.id); out.push(m); m.partners.forEach(p => by[p] && g[p] === r && add(by[p])); };
    row.forEach(add);
    const off = (maxN - out.length) * (CW + GX) / 2;
    out.forEach((m, i) => pos[m.id] = { x: off + i * (CW + GX), y: r * (CH + GY) });
  });
}
const yr = d => d ? String(d).slice(0, 4) : '';
const lifeShort = m => m.living ? (yr(m.birth) ? 'b. ' + yr(m.birth) : '') : `${yr(m.birth) || '?'} – ${yr(m.death) || '?'}`;
const initials = n => (n || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
function renderTree() {
  const T = S.tree, by = T.members, M = Object.values(by), cv = $('#canvas');
  cv.className = (cv.classList.contains('pan') ? 'pan ' : '') + 't-' + T.tpl;
  cv.style.setProperty('--acc', T.accent || '');
  if (!T.accent) cv.style.removeProperty('--acc');
  cv.style.backgroundImage = T.bg ? `url(${src(T.bg)})` : '';
  $('#tint').style.opacity = T.bg ? T.overlay / 100 : 0;
  $('#emptyTree').hidden = M.length > 0;
  layout();
  $('#cards').innerHTML = M.map(m => { const p = pos[m.id], a = m.avatar && src(m.avatar);
    return `<div class="card ${sel === m.id ? 'sel' : ''}" data-id="${m.id}" style="left:${p.x}px;top:${p.y}px" title="Click to edit ${esc(m.name)}">
      ${a ? `<img class="av" src="${a}" alt="">` : `<div class="av">${esc(initials(m.name))}</div>`}
      <div><div class="badge">${esc(m.gender)}</div><div class="cn">${esc(m.nick || m.name)}</div><div class="cd">${esc(lifeShort(m))}</div></div></div>`; }).join('');
  const L = [], elbow = T.line === 'elbow';
  M.forEach(m => m.partners.forEach(q => { if (m.id < q && pos[q]) { const a = pos[m.id], b = pos[q], y = a.y + CH / 2; L.push(`<path class="pt" d="M${Math.min(a.x, b.x) + CW} ${y}H${Math.max(a.x, b.x)}"/>`); } }));
  M.forEach(c => {
    const ps = c.parents.filter(p => pos[p]); if (!ps.length || !pos[c.id]) return;
    let sx, sy; const a = pos[ps[0]], b = ps[1] && pos[ps[1]];
    if (b && by[ps[0]].partners.includes(ps[1])) { sx = (Math.min(a.x, b.x) + CW + Math.max(a.x, b.x)) / 2; sy = a.y + CH / 2; }
    else { sx = ps.reduce((s, p) => s + pos[p].x + CW / 2, 0) / ps.length; sy = a.y + CH; }
    const cx = pos[c.id].x + CW / 2, cy = pos[c.id].y, my = cy - GY / 2 + 10;
    L.push(`<path class="pc" d="${elbow ? `M${sx} ${sy}V${my}H${cx}V${cy}` : `M${sx} ${sy}C${sx} ${(sy + cy) / 2 + 20},${cx} ${(sy + cy) / 2 - 20},${cx} ${cy}`}"/>`);
  });
  $('#lines').innerHTML = L.join('');
}
function applyView() { $('#world').style.transform = `translate(${view.x}px,${view.y}px) scale(${view.k})`; $('#zLbl').textContent = Math.round(view.k * 100) + '%'; }
function zoomAt(f, cx, cy) {
  const k = Math.min(2.5, Math.max(.25, view.k * f)), r = k / view.k;
  view.x = cx - (cx - view.x) * r; view.y = cy - (cy - view.y) * r; view.k = k; applyView();
}
function fit() {
  const cd = $('#cards'); cd.classList.add('intro'); setTimeout(() => cd.classList.remove('intro'), 900);
  const P = Object.values(pos); const cv = $('#canvas'), w = cv.clientWidth, h = cv.clientHeight;
  if (!P.length) { view = { x: w / 2, y: h / 2, k: 1 }; return applyView(); }
  const bw = Math.max(...P.map(p => p.x)) + CW, bh = Math.max(...P.map(p => p.y)) + CH;
  const k = Math.min(2.5, Math.max(.25, Math.min((w - 80) / bw, (h - 140) / bh)));
  view = { k, x: (w - bw * k) / 2, y: (h - bh * k) / 2 + 20 }; applyView();
}
/* pan / zoom / click */
(() => {
  const cv = $('#canvas'); let d = null, moved = 0;
  cv.addEventListener('pointerdown', e => { if (e.target.closest('.zoom')) return; d = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y }; moved = 0; });
  addEventListener('pointermove', e => { if (!d) return; const dx = e.clientX - d.x, dy = e.clientY - d.y; moved = Math.max(moved, Math.abs(dx) + Math.abs(dy)); if (moved > 4) { cv.classList.add('pan'); view.x = d.vx + dx; view.y = d.vy + dy; applyView(); } });
  addEventListener('pointerup', () => { d = null; cv.classList.remove('pan'); });
  cv.addEventListener('click', e => { if (moved > 4) return; const c = e.target.closest('.card'); if (c) openInsp(c.dataset.id); });
  cv.addEventListener('wheel', e => { e.preventDefault(); const r = cv.getBoundingClientRect(); zoomAt(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - r.left, e.clientY - r.top); }, { passive: false });
  const c = () => [cv.clientWidth / 2, cv.clientHeight / 2];
  $('#zIn').onclick = () => zoomAt(1.25, ...c()); $('#zOut').onclick = () => zoomAt(.8, ...c()); $('#zFit').onclick = fit;
})();

/* ---------- inspector ---------- */
const GEND = ['', 'Female', 'Male', 'Non-binary', 'Grandmother', 'Grandfather', 'Mother', 'Father', 'Daughter', 'Son', 'Aunt', 'Uncle', 'Other'];
function openInsp(id) {
  const m = S.tree.members[id]; if (!m) return closeInsp(); sel = id; $('#cust').classList.remove('open');
  const f = (k, l, t = 'text') => `<label>${l}</label><input type="${t}" data-f="${k}" value="${esc(m[k])}">`;
  $('#insp').innerHTML = `<div class="dh"><h3>Member Profile</h3><button class="x" data-close="insp">✕</button></div>
  <div class="row" style="margin-top:12px">${m.avatar ? `<img class="big" src="${src(m.avatar)}">` : `<div class="big av" style="display:grid;place-items:center;font-size:32px;background:var(--brand);color:#fff">${esc(initials(m.name))}</div>`}
    <div><label style="margin-top:0">Profile photo</label><input type="file" accept="image/*" id="avFile">${m.avatar ? '<button data-a="rmAv" style="margin-top:6px">Remove photo</button>' : ''}</div></div>
  ${f('name', 'Full name')}${f('nick', 'Preferred name / nickname')}
  <label>Gender / role tag</label><select data-f="gender">${GEND.map(g => `<option ${g === m.gender ? 'selected' : ''}>${g}</option>`).join('')}</select>
  <div class="g2"><div>${f('birth', 'Birth date', 'date')}</div><div>${f('birthPlace', 'Birthplace')}</div></div>
  <label><input type="checkbox" id="dead" ${m.living ? '' : 'checked'} style="width:auto"> Deceased</label>
  <div class="g2" id="deadRows" ${m.living ? 'hidden' : ''}><div>${f('death', 'Death date', 'date')}</div><div>${f('deathPlace', 'Place of death')}</div></div>
  <label>Biography / life notes</label><textarea data-f="bio">${esc(m.bio)}</textarea>
  <label>Gallery photos</label><input type="file" accept="image/*" multiple id="galFile">
  <div class="gal">${m.gallery.map((g, i) => `<figure><img src="${src(g.id)}"><input data-g="cap" data-i="${i}" placeholder="Caption" value="${esc(g.cap)}"><input data-g="year" data-i="${i}" placeholder="Year" value="${esc(g.year)}"><button data-a="rmG" data-i="${i}" style="width:100%;margin-top:4px">Remove</button></figure>`).join('')}</div>
  <div class="acts"><button data-a="spouse">+ Add Spouse/Partner</button><button data-a="child">+ Add Child</button><button data-a="parent">+ Add Parent</button><button data-a="del" class="danger">Delete member</button></div>`;
  $('#insp').classList.add('open'); renderTree();
}
function closeInsp() { $('#insp').classList.remove('open'); sel = null; renderTree(); }
function newMember(o) { const m = mk(uid('m_'), 'New Person', o); S.tree.members[m.id] = m; return m; }
(() => {
  const I = $('#insp');
  I.addEventListener('input', e => {
    const t = e.target, m = S.tree.members[sel]; if (!m) return;
    if (t.dataset.f) { m[t.dataset.f] = t.value; renderTree(); }
    else if (t.dataset.g) m.gallery[t.dataset.i][t.dataset.g] = t.value;
    else if (t.id === 'dead') { m.living = !t.checked; $('#deadRows').hidden = !t.checked; renderTree(); }
    save();
  });
  I.addEventListener('change', async e => {
    const t = e.target, m = S.tree.members[sel]; if (!m || t.type !== 'file' || !t.files.length) return;
    try {
      if (t.id === 'avFile') m.avatar = await addFile(t.files[0]);
      else for (const f of t.files) m.gallery.push({ id: await addFile(f), cap: '', year: '' });
    } catch (x) { toast('Could not read that image'); }
    save(); openInsp(sel);
  });
  I.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return; if (b.dataset.close) return closeInsp();
    const m = S.tree.members[sel], a = b.dataset.a; if (!m || !a) return;
    if (a === 'rmAv') m.avatar = '';
    else if (a === 'rmG') m.gallery.splice(b.dataset.i, 1);
    else if (a === 'spouse') { const n = newMember({ partners: [m.id], living: true }); m.partners.push(n.id); sel = n.id; }
    else if (a === 'child') { const ps = [m.id, ...m.partners.slice(0, 1)]; const n = newMember({ parents: ps }); sel = n.id; }
    else if (a === 'parent') { const n = newMember({}); m.parents.push(n.id); sel = n.id; }
    else if (a === 'del') {
      if (!confirm(`Delete ${m.name}? This cannot be undone.`)) return;
      delete S.tree.members[m.id]; Object.values(S.tree.members).forEach(o => { o.parents = o.parents.filter(x => x !== m.id); o.partners = o.partners.filter(x => x !== m.id); });
      save(); return closeInsp();
    }
    save(); openInsp(sel);
  });
})();

/* ---------- book ---------- */
const fmtD = d => { if (!d) return ''; const x = new Date(d + 'T00:00'); return isNaN(x) ? d : x.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' }); };
function dates(m) { const b = [fmtD(m.birth), m.birthPlace].filter(Boolean).join(' · '), d = [fmtD(m.death), m.deathPlace].filter(Boolean).join(' · '); return (b ? `Born ${esc(b)}` : '') + (!m.living && d ? `<br>Died ${esc(d)}` : ''); }
const paras = t => (t || '').split(/\n+/).filter(s => s.trim()).map(s => `<p>${esc(s)}</p>`).join('');
function pageHTML(p, i) {
  const B = S.book, m = S.tree.members[p.memberId], ph = p.photos || [], im = x => `<img src="${src(x.id)}" alt="">`;
  let h = '';
  if (p.tpl === 'cover') h = `<div class="cv"><small>${esc(S.title)}</small>${ph[0] ? `<img class="hero" src="${src(ph[0].id)}">` : ''}<h1>${esc(p.title)}</h1><h2>${esc(p.sub)}</h2><div class="orn">❦</div>${paras(p.text)}</div>`;
  else if (p.tpl === 'grid') h = `<h1>${esc(p.title)}</h1><h2>${esc(p.sub)}</h2><div class="grid">${ph.length ? ph.map(x => `<figure>${im(x)}<figcaption>${esc(x.cap)}</figcaption></figure>`).join('') : '<div class="ph">Add photos</div><div class="ph">Add photos</div>'}</div>${paras(p.text)}`;
  else if (p.tpl === 'bio') h = m ? `<div class="bio"><small>${esc(m.gender)}</small><h1>${esc(m.name)}</h1>${m.nick ? `<h2>“${esc(m.nick)}”</h2>` : ''}${m.avatar ? `<img class="av2" src="${src(m.avatar)}">` : ''}<div class="dt">${dates(m)}</div></div>${paras(m.bio)}${paras(p.text)}` : `<h1>${esc(p.title)}</h1><p>Choose a family member in the editor to fill this spotlight automatically.</p>`;
  else h = `${ph[0] ? `<img class="hero" src="${src(ph[0].id)}">` : ''}<h1>${esc(p.title)}</h1><h2>${esc(p.sub)}</h2><div class="drop">${paras(p.text)}</div>${m ? `<div class="box">${m.avatar ? `<img src="${src(m.avatar)}">` : ''}<div><b>${esc(m.name)}</b><br><small>${dates(m)}</small>${paras(m.bio.split('\n')[0])}</div></div>` : ''}${ph.length > 1 ? `<div class="grid" style="margin-top:1em;flex:none">${ph.slice(1, 3).map(x => `<figure>${im(x)}<figcaption>${esc(x.cap)}</figcaption></figure>`).join('')}</div>` : ''}`;
  return `<div class="pw ${B.ratio}"><div class="page ${B.font} paper-${B.paper}" style="${B.paperImg ? `background-image:url(${src(B.paperImg)})` : ''}">${h}${p.tpl === 'cover' ? '' : `<div class="pg">${i + 1}</div>`}</div></div>`;
}
function renderPreview() {
  const P = S.book.pages; pageIdx = Math.min(Math.max(0, pageIdx), P.length - 1);
  $('#pagePrev').innerHTML = P[pageIdx] ? pageHTML(P[pageIdx], pageIdx) : '<div class="empty" style="position:static;padding:40px">No pages yet</div>';
  $('#pNum').textContent = P.length ? `Page ${pageIdx + 1} of ${P.length}` : '';
  $('#pPrev').disabled = pageIdx <= 0; $('#pNext').disabled = pageIdx >= P.length - 1;
}
const TPLS = { cover: 'Cover / Title Page', story: 'Classic Story Spread', grid: 'Photo Memory Grid', bio: 'Member Biography Spotlight' };
function renderEditor() {
  const B = S.book, P = B.pages, p = P[pageIdx], M = Object.values(S.tree.members);
  const treePhotos = M.flatMap(m => [m.avatar && { id: m.avatar, t: `${m.name} — profile photo`, cap: '' }, ...m.gallery.map(g => ({ id: g.id, t: `${m.name} — ${g.cap || 'photo'}${g.year ? ' (' + g.year + ')' : ''}`, cap: g.cap }))].filter(Boolean));
  $('#editor').innerHTML = `<div class="chips">${P.map((q, i) => `<button class="chip ${i === pageIdx ? 'on' : ''}" data-pg="${i}">${i + 1}. ${esc(q.title || 'Untitled')}</button>`).join('')}<button class="chip" data-a="add">+ Add Page</button></div>` + (!p ? '<p>No pages. Add one to start your book.</p>' : `
  <div class="acts"><button data-a="up">↑ Move up</button><button data-a="down">↓ Move down</button><button data-a="del" class="danger">Delete page</button></div>
  <label>Page template</label><select data-k="tpl">${Object.entries(TPLS).map(([k, v]) => `<option value="${k}" ${p.tpl === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
  <label>Chapter title</label><input data-k="title" value="${esc(p.title)}">
  <label>Subtitle</label><input data-k="sub" value="${esc(p.sub)}">
  <label>Story / narrative (blank line = new paragraph)</label><textarea data-k="text" style="min-height:190px">${esc(p.text)}</textarea>
  <label>Insert linked family member (bio &amp; dates from tree)</label><select data-k="memberId"><option value="">— none —</option>${M.map(m => `<option value="${m.id}" ${p.memberId === m.id ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</select>
  <label>Photos (first photo is the hero image)</label>
  <div class="row"><select id="treePh"><option value="">Insert photo from family tree…</option>${treePhotos.map((x, i) => `<option value="${i}">${esc(x.t)}</option>`).join('')}</select><button data-a="addTreePh">Add</button></div>
  <div style="margin-top:6px"><input type="file" accept="image/*" multiple id="pgFile"></div>
  ${(p.photos || []).map((x, i) => `<div class="pl"><img src="${src(x.id)}"><input data-pc="${i}" placeholder="Caption" value="${esc(x.cap)}"><button data-a="rmPh" data-i="${i}">✕</button></div>`).join('')}`);
  renderEditor.tp = treePhotos;
}
(() => {
  const E = $('#editor');
  E.addEventListener('input', e => { const t = e.target, p = S.book.pages[pageIdx]; if (!p) return; if (t.dataset.k) p[t.dataset.k] = t.value; else if (t.dataset.pc) p.photos[t.dataset.pc].cap = t.value; else return; if (t.dataset.k === 'title') $$('.chip.on', E)[0].textContent = (pageIdx + 1) + '. ' + (t.value || 'Untitled'); renderPreview(); save(); });
  E.addEventListener('change', async e => { const t = e.target, p = S.book.pages[pageIdx]; if (t.id !== 'pgFile' || !t.files.length) return; try { for (const f of t.files) p.photos.push({ id: await addFile(f), cap: '' }); } catch (x) { toast('Could not read that image'); } renderEditor(); renderPreview(); save(); });
  E.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return; const P = S.book.pages, a = b.dataset.a, p = P[pageIdx];
    if (b.dataset.pg != null) pageIdx = +b.dataset.pg;
    else if (a === 'add') { P.splice(pageIdx + 1, 0, { id: uid('p'), tpl: 'story', title: 'New Chapter', sub: '', text: '', memberId: '', photos: [] }); pageIdx = Math.min(pageIdx + 1, P.length - 1); if (P.length === 1) pageIdx = 0; }
    else if (a === 'del') { if (!confirm('Delete this page?')) return; P.splice(pageIdx, 1); pageIdx = Math.max(0, pageIdx - 1); }
    else if (a === 'up' && pageIdx > 0) { [P[pageIdx - 1], P[pageIdx]] = [P[pageIdx], P[pageIdx - 1]]; pageIdx--; }
    else if (a === 'down' && pageIdx < P.length - 1) { [P[pageIdx + 1], P[pageIdx]] = [P[pageIdx], P[pageIdx + 1]]; pageIdx++; }
    else if (a === 'rmPh') p.photos.splice(b.dataset.i, 1);
    else if (a === 'addTreePh') { const v = $('#treePh').value; if (v === '') return toast('Pick a photo first'); const x = renderEditor.tp[+v]; p.photos.push({ id: x.id, cap: x.cap }); }
    else return;
    renderEditor(); renderPreview(); save();
  });
  $('#pPrev').onclick = () => { pageIdx--; renderPreview(); renderEditor(); };
  $('#pNext').onclick = () => { pageIdx++; renderPreview(); renderEditor(); };
})();
/* print */
addEventListener('beforeprint', () => {
  const sq = S.book.ratio === 'sq', r = $('#printRoot'); r.style.setProperty('--pw', sq ? '200mm' : '210mm'); r.style.setProperty('--ph', sq ? '200mm' : '297mm');
  $('#pageStyle').textContent = `@page{size:${sq ? '200mm 200mm' : 'A4'};margin:0}`;
  r.innerHTML = S.book.pages.map(pageHTML).join('');
});
addEventListener('afterprint', () => { $('#printRoot').innerHTML = ''; });
$('#btnPrint').onclick = () => print();

/* ---------- customize ---------- */
function syncCust() {
  const T = S.tree, B = S.book;
  $$('#tplOpts button').forEach(b => b.classList.toggle('on', b.dataset.tpl === T.tpl));
  $$('#paperOpts button').forEach(b => b.classList.toggle('on', b.dataset.paper === B.paper && !B.paperImg));
  $('#ovRange').value = T.overlay; $('#ovOut').textContent = T.overlay + '%'; $('#lineStyle').value = T.line;
  $('#accent').value = T.accent || getComputedStyle($('#canvas')).getPropertyValue('--acc').trim() || '#8a5a2b';
  $('#bookFont').value = B.font; $('#bookRatio').value = B.ratio;
}
(() => {
  const C = $('#cust'), up = () => { renderTree(); renderPreview(); syncCust(); save(); };
  C.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.close) C.classList.remove('open');
    if (b.dataset.tpl) { S.tree.tpl = b.dataset.tpl; S.tree.accent = ''; up(); }
    if (b.dataset.paper) { S.book.paper = b.dataset.paper; S.book.paperImg = ''; up(); }
    if (b.id === 'bgClear') { S.tree.bg = ''; up(); }
    if (b.id === 'paperClear') { S.book.paperImg = ''; up(); }
    if (b.id === 'accentReset') { S.tree.accent = ''; up(); }
  });
  C.addEventListener('input', e => {
    const t = e.target;
    if (t.id === 'ovRange') { S.tree.overlay = +t.value; $('#ovOut').textContent = t.value + '%'; renderTree(); save(); }
    if (t.id === 'accent') { S.tree.accent = t.value; renderTree(); save(); }
    if (t.id === 'lineStyle') { S.tree.line = t.value; up(); }
    if (t.id === 'bookFont') { S.book.font = t.value; up(); }
    if (t.id === 'bookRatio') { S.book.ratio = t.value; up(); }
  });
  C.addEventListener('change', async e => {
    const t = e.target; if (t.type !== 'file' || !t.files.length) return;
    try { const id = await addFile(t.files[0]); if (t.id === 'bgFile') S.tree.bg = id; else S.book.paperImg = id; } catch (x) { toast('Could not read that image'); }
    t.value = ''; up();
  });
})();

/* ---------- global UI ---------- */
function setMode(m) {
  $$('.modes button').forEach(b => b.classList.toggle('on', b.dataset.mode === m));
  $('#treeView').hidden = m !== 'tree'; $('#bookView').hidden = m !== 'book';
  if (m === 'book') { closeInsp(); renderEditor(); renderPreview(); } else setTimeout(() => { renderTree(); }, 0);
}
$$('.modes button').forEach(b => b.onclick = () => setMode(b.dataset.mode));
$('#btnCust').onclick = () => { closeInsp(); syncCust(); $('#cust').classList.toggle('open'); };
$('#btnSave').onclick = () => { saveNow(); toast('Snapshot saved'); };
$('#title').oninput = e => { S.title = e.target.value; renderPreview(); save(); };
$('#addMember').onclick = () => { const n = newMember({}); save(); openInsp(n.id); setTimeout(fit, 0); };
$('#newBlank').onclick = () => { if (!confirm('Start a new blank tree? Your current tree and book will be replaced. Export a backup first if you want to keep it.')) return; S = blank(); S.title = 'Untitled Family'; load(true); };
$('#loadDemo').onclick = () => { if (!confirm('Replace the current project with the Demo Family?')) return; S = demo(); load(true); };
$('#btnExport').onclick = () => {
  saveNow();
  const used = new Set(JSON.stringify(S).match(/i_[a-z0-9]+/g) || []), images = {}; used.forEach(k => { if (IMG[k]) images[k] = IMG[k]; });
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify({ format: 'famili', version: 1, exportedAt: new Date().toISOString(), state: { ...S, cloud: undefined }, images })], { type: 'application/json' }));
  a.download = (S.title || 'family').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') + '.famili.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); toast('Project exported');
};
$('#btnImport').onclick = () => $('#fileImport').click();
$('#fileImport').onchange = async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try {
    const j = JSON.parse(await f.text()); if (j.format !== 'famili' || !j.state || !j.state.tree) throw 0;
    if (!confirm('Import this project? It replaces the current one.')) return;
    S = j.state; delete S.cloud; IMG = j.images || {}; idbClear(); Object.entries(IMG).forEach(([k, v]) => idbPut(k, v)); load(true); toast('Project imported');
  } catch (x) { toast('That is not a valid .famili.json file'); }
};
addEventListener('keydown', e => { if (e.key === 'Escape') { $('#cust').classList.remove('open'); if ($('#insp').classList.contains('open')) closeInsp(); } });
function load(doFit) {
  S.book.pages = S.book.pages || []; pageIdx = 0; sel = null; $('#insp').classList.remove('open');
  $('#title').value = S.title; renderTree(); renderEditor(); renderPreview(); syncCust(); if (doFit) fit(); save();
}
(async () => {
  if (window.FB) await FB.ready;
  try { db = await idbOpen(); IMG = await idbAll(); } catch (e) { db = null; }
  try { S = JSON.parse(localStorage.getItem(lsKey())); } catch (e) { S = null; }
  if (!S || !S.tree || !S.book) S = demo();
  $('#title').value = S.title; renderTree(); renderEditor(); renderPreview(); syncCust(); fit();
  $('#status').textContent = S.savedAt ? 'Saved ' + new Date(S.savedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Not saved yet';
  save();
})();
addEventListener('resize', () => { if (!$('#treeView').hidden) applyView(); });
