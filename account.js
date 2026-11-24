/* Account, cloud projects, sharing & groups UI */
(() => {
  const q = s => document.querySelector(s);
  const used = () => { const u = new Set(JSON.stringify(S).match(/i_[a-z0-9]+/g) || []), o = {}; u.forEach(k => IMG[k] && (o[k] = IMG[k])); return o; };
  const pack = () => ({ state: { ...S, cloud: undefined }, images: used() });
  const ago = t => new Date(t).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  const bAcct = Object.assign(document.createElement('button'), { id: 'btnAcct' }), bCloud = Object.assign(document.createElement('button'), { id: 'btnCloud', textContent: '☁ Projects', title: 'Cloud projects, sharing and groups' });
  q('#btnCust').before(bCloud, bAcct);
  const M = document.createElement('div'); M.className = 'modal'; M.hidden = true; M.innerHTML = '<div class="mbox"></div>'; document.body.append(M);
  const box = M.firstChild, show = h => { box.innerHTML = h; M.hidden = false; }, close = () => { M.hidden = true; }, val = id => (box.querySelector('#' + id) || {}).value || '';
  M.addEventListener('mousedown', e => { if (e.target === M) close(); });
  const refresh = () => { const u = FB.user(); bAcct.textContent = u ? '👤 ' + u.name : 'Log in / Sign up'; bAcct.className = u ? '' : 'primary'; };
  const modeNote = () => FB.remote ? '' : '<p class="note">Local mode: accounts, sharing and groups work inside this browser only. Add your Supabase keys in <code>config.js</code> for real cloud accounts across devices.</p>';
  const err = (m) => `<p class="err" role="alert">${esc(m)}</p>`;

  function authView(tab = 'in', msg = '') {
    show(`<div class="mh"><h3>${tab === 'in' ? 'Welcome back' : 'Create your account'}</h3><button class="x" data-act="close">✕</button></div>
    <div class="tabs"><button data-act="tab" data-t="in" class="${tab === 'in' ? 'on' : ''}">Log in</button><button data-act="tab" data-t="up" class="${tab === 'up' ? 'on' : ''}">Sign up</button></div>
    <form id="authForm" data-tab="${tab}">${tab === 'up' ? '<label>Name</label><input id="aName" autocomplete="name">' : ''}
    <label>Email</label><input id="aMail" type="email" required autocomplete="email"><label>Password</label><input id="aPw" type="password" required minlength="6" autocomplete="${tab === 'in' ? 'current-password' : 'new-password'}">
    ${msg ? err(msg) : ''}<button class="primary wide" type="submit">${tab === 'in' ? 'Log in' : 'Create account'}</button></form>${modeNote()}`);
  }
  async function switchUser() {
    try { const t = JSON.parse(localStorage.getItem(lsKey())); S = t && t.tree && t.book ? t : demo(); } catch (e) { S = demo(); }
    load(true); refresh();
  }
  box.addEventListener('submit', async e => {
    e.preventDefault(); const f = e.target, tab = f.dataset.tab; saveNow();
    try { tab === 'in' ? await FB.signIn(val('aMail'), val('aPw')) : await FB.signUp(val('aMail'), val('aPw'), val('aName')); }
    catch (x) { return authView(tab, x.message); }
    await switchUser(); toast('Welcome, ' + FB.user().name); cloudView();
  });
  function acctView() { const u = FB.user(); show(`<div class="mh"><h3>Account</h3><button class="x" data-act="close">✕</button></div><p><b>${esc(u.name)}</b><br>${esc(u.email)}</p><p class="note">Storage: ${FB.remote ? 'Supabase cloud' : 'this browser (local mode)'}</p><div class="acts"><button data-act="cloud">Open Projects</button><button data-act="out" class="danger">Sign out</button></div>${modeNote()}`); }

  async function cloudView() {
    if (!FB.user()) return authView();
    show('<p class="note">Loading…</p>'); let P, G;
    try { P = await FB.list(); G = await FB.groups(); } catch (x) { return show(`<div class="mh"><h3>Projects</h3><button class="x" data-act="close">✕</button></div>${err(x.message)}`); }
    const c = S.cloud, canSave = !c || c.role === 'owner' || c.role === 'edit', row = p => `<div class="prow"><div><b>${esc(p.title || 'Untitled')}</b><br><small>${p.role === 'owner' ? '' : 'by ' + esc(p.owner) + ' · '}${esc(p.role)} · ${ago(p.updated)}</small></div><div class="acts"><button data-act="open" data-id="${p.id}">Open</button>${p.role === 'owner' ? `<button class="danger" data-act="del" data-id="${p.id}">Delete</button>` : ''}</div></div>`;
    show(`<div class="mh"><h3>☁ Projects</h3><button class="x" data-act="close">✕</button></div>
    <div class="cur"><b>Current: ${esc(S.title)}</b><br><small>${c ? 'Cloud-linked · your role: ' + esc(c.role) + (c.role === 'view' ? ' (read-only on the cloud)' : '') : 'Not saved to the cloud yet'}</small>
    <div class="acts">${canSave ? '<button class="primary" data-act="save">Save to cloud</button>' : ''}<button data-act="saveNew">Save as new cloud copy</button>${c && c.role === 'owner' ? '<button data-act="share">Share…</button>' : ''}</div></div>
    <h4>My projects</h4>${P.filter(p => p.role === 'owner').map(row).join('') || '<p class="note">None yet.</p>'}
    <h4>Shared with me</h4>${P.filter(p => p.role !== 'owner').map(row).join('') || '<p class="note">Nothing shared with you yet.</p>'}
    <h4>Groups</h4>${G.map(g => `<div class="prow col"><div><b>${esc(g.name)}</b> <small>owner: ${esc(g.owner)}</small></div><div>${g.members.map(m => `<span class="tag">${esc(m)}${g.owner === FB.user().email ? ` <a data-act="grm" data-g="${g.id}" data-e="${esc(m)}">✕</a>` : ''}</span>`).join('') || '<small>No members yet</small>'}</div>${g.owner === FB.user().email ? `<div class="row"><input id="gm_${g.id}" type="email" placeholder="member@email.com"><button data-act="gadd" data-g="${g.id}">Add</button><button class="danger" data-act="gdel" data-g="${g.id}">Delete</button></div>` : ''}</div>`).join('')}
    <div class="row" style="margin-top:8px"><input id="gName" placeholder="New group name (e.g. Whitfield cousins)"><button data-act="gnew">Create group</button></div>`);
  }
  async function shareView() {
    if (!S.cloud) return; show('<p class="note">Loading…</p>'); let sh, G;
    try { sh = await FB.shares(S.cloud.id); G = await FB.groups(); } catch (x) { return show(err(x.message)); }
    show(`<div class="mh"><h3>Share “${esc(S.title)}”</h3><button class="x" data-act="close">✕</button></div>
    <label>Share with a person (by email)</label><div class="row"><input id="sMail" type="email" placeholder="name@email.com"><select id="sRole"><option value="view">Can view</option><option value="edit">Can edit</option></select><button data-act="shareAdd">Share</button></div>
    <label>Share with a group</label><div class="row"><select id="sGroup">${G.map(g => `<option value="${g.id}">${esc(g.name)}</option>`).join('') || '<option value="">(create a group first)</option>'}</select><select id="gRole"><option value="view">Can view</option><option value="edit">Can edit</option></select><button data-act="shareGroup">Share</button></div>
    <h4>Who has access</h4>${sh.map(s => `<div class="prow"><div>${s.group_id ? '👥 ' + esc(s.group || 'Group') : '👤 ' + esc(s.email)} <small>· ${s.role}</small></div><button class="danger" data-act="unshare" data-id="${s.id}">Remove</button></div>`).join('') || '<p class="note">Not shared yet.</p>'}
    <div class="acts"><button data-act="cloud">← Back</button></div>`);
  }
  async function doSave(asNew, silent) {
    try {
      const r = await FB.save({ id: asNew ? null : S.cloud && S.cloud.id, title: S.title, data: pack() });
      S.cloud = { id: r.id, role: r.role }; saveNow(); if (!silent) toast('Saved to cloud'); else $('#status').textContent = '☁ Synced ' + new Date().toLocaleTimeString([], { timeStyle: 'short' });
    } catch (x) { toast('Cloud save failed: ' + x.message); }
  }
  let ct; window.cloudAuto = () => { if (!FB.user() || !S.cloud || S.cloud.role === 'view') return; clearTimeout(ct); ct = setTimeout(() => doSave(false, true), 2500); };
  q('#btnSave').addEventListener('click', () => { if (FB.user() && S.cloud && S.cloud.role !== 'view') doSave(false); });

  const act = {
    close, cloud: cloudView, tab: b => authView(b.dataset.t), share: shareView,
    async out() { saveNow(); await FB.signOut(); close(); await switchUser(); toast('Signed out'); },
    async save() { await doSave(false); cloudView(); }, async saveNew() { await doSave(true); cloudView(); },
    async open(b) { try { const p = await FB.load(b.dataset.id); IMG = { ...IMG, ...(p.data.images || {}) }; Object.entries(p.data.images || {}).forEach(([k, v]) => idbPut(k, v)); S = p.data.state; S.cloud = { id: p.id, role: p.role }; load(true); close(); toast(p.role === 'view' ? 'Opened read-only. Use “Save as new cloud copy” to keep your own edits.' : 'Project opened'); } catch (x) { toast(x.message); } },
    async del(b) { if (!confirm('Delete this cloud project for everyone it is shared with?')) return; try { await FB.remove(b.dataset.id); if (S.cloud && S.cloud.id === b.dataset.id) delete S.cloud; cloudView(); } catch (x) { toast(x.message); } },
    async shareAdd() { const e = val('sMail'); if (!/^\S+@\S+\.\S+$/.test(e)) return toast('Enter a valid email'); try { await FB.share(S.cloud.id, { email: e, role: val('sRole') }); shareView(); } catch (x) { toast(x.message); } },
    async shareGroup() { if (!val('sGroup')) return toast('Create a group first'); try { await FB.share(S.cloud.id, { group_id: val('sGroup'), role: val('gRole') }); shareView(); } catch (x) { toast(x.message); } },
    async unshare(b) { try { await FB.unshare(b.dataset.id); shareView(); } catch (x) { toast(x.message); } },
    async gnew() { const n = val('gName').trim(); if (!n) return toast('Name the group'); try { await FB.createGroup(n); cloudView(); } catch (x) { toast(x.message); } },
    async gadd(b) { const e = val('gm_' + b.dataset.g); if (!/^\S+@\S+\.\S+$/.test(e)) return toast('Enter a valid email'); try { await FB.addMember(b.dataset.g, e); cloudView(); } catch (x) { toast(x.message); } },
    async grm(b) { try { await FB.rmMember(b.dataset.g, b.dataset.e); cloudView(); } catch (x) { toast(x.message); } },
    async gdel(b) { if (!confirm('Delete this group?')) return; try { await FB.delGroup(b.dataset.g); cloudView(); } catch (x) { toast(x.message); } }
  };
  box.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b && act[b.dataset.act]) act[b.dataset.act](b); });
  bAcct.onclick = () => FB.user() ? acctView() : authView('in');
  bCloud.onclick = cloudView;
  addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  FB.ready.then(refresh); refresh();
})();
