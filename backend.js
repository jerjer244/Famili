/* Unified backend: Supabase (cloud) when configured, otherwise a browser-local emulation with identical API. */
(() => {
  const cfg = window.FAMILI_CONFIG || {}, remote = !!(cfg.supabaseUrl && cfg.supabaseKey && window.supabase);
  const em = s => String(s || '').trim().toLowerCase();
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2));
  const J = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } }, W = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const hash = async (pw, salt) => { const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits']); const b = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 150000, hash: 'SHA-256' }, k, 256); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); };
  let cur = null;

  /* ---- local emulation ---- */
  const D = () => J('famili.cloud', { projects: [], shares: [], groups: [], members: [] }), WD = d => W('famili.cloud', d);
  const gids = (d, me) => d.members.filter(m => m.email === me).map(m => m.group_id).concat(d.groups.filter(g => g.owner === me).map(g => g.id));
  const roleOf = (d, p, me) => p.owner === me ? 'owner' : (() => { const g = gids(d, me), s = d.shares.filter(x => x.project_id === p.id && (x.email === me || g.includes(x.group_id))); return s.length ? (s.some(x => x.role === 'edit') ? 'edit' : 'view') : null; })();
  const L = {
    async init() { const e = localStorage.getItem('famili.session'), u = J('famili.users', {})[e]; return u ? { email: e, name: u.name } : null; },
    async signUp(e, p, n) { e = em(e); const U = J('famili.users', {}); if (!/^\S+@\S+\.\S+$/.test(e)) throw Error('Enter a valid email'); if (U[e]) throw Error('An account with this email already exists'); if (p.length < 6) throw Error('Password must be at least 6 characters'); const salt = uuid(); U[e] = { salt, hash: await hash(p, salt), name: n || e.split('@')[0] }; W('famili.users', U); localStorage.setItem('famili.session', e); return { email: e, name: U[e].name }; },
    async signIn(e, p) { e = em(e); const u = J('famili.users', {})[e]; if (!u || u.hash !== await hash(p, u.salt)) throw Error('Wrong email or password'); localStorage.setItem('famili.session', e); return { email: e, name: u.name }; },
    async signOut() { localStorage.removeItem('famili.session'); },
    async list() { const d = D(); return d.projects.map(p => ({ id: p.id, title: p.title, owner: p.owner, updated: p.updated, role: roleOf(d, p, cur.email) })).filter(p => p.role).sort((a, b) => b.updated - a.updated); },
    async save(r) {
      const d = D(); let p = r.id && d.projects.find(x => x.id === r.id);
      if (p) { const role = roleOf(d, p, cur.email); if (role !== 'owner' && role !== 'edit') throw Error('You do not have edit access'); Object.assign(p, { title: r.title, data: r.data, updated: Date.now() }); }
      else { p = { id: uuid(), owner: cur.email, title: r.title, data: r.data, updated: Date.now() }; d.projects.push(p); }
      WD(d); return { id: p.id, role: roleOf(d, p, cur.email) };
    },
    async load(id) { const d = D(), p = d.projects.find(x => x.id === id), role = p && roleOf(d, p, cur.email); if (!role) throw Error('Project not found or no access'); return { id, title: p.title, data: p.data, role }; },
    async remove(id) { const d = D(); d.projects = d.projects.filter(p => !(p.id === id && p.owner === cur.email)); d.shares = d.shares.filter(s => s.project_id !== id); WD(d); },
    async shares(pid) { const d = D(); return d.shares.filter(s => s.project_id === pid).map(s => ({ id: s.id, email: s.email, group_id: s.group_id, group: s.group_id ? (d.groups.find(g => g.id === s.group_id) || {}).name : '', role: s.role })); },
    async share(pid, o) { const d = D(); d.shares = d.shares.filter(s => !(s.project_id === pid && s.email === o.email && s.group_id === o.group_id)); d.shares.push({ id: uuid(), project_id: pid, email: o.email || null, group_id: o.group_id || null, role: o.role }); WD(d); },
    async unshare(id) { const d = D(); d.shares = d.shares.filter(s => s.id !== id); WD(d); },
    async groups() { const d = D(), g = gids(d, cur.email); return d.groups.filter(x => g.includes(x.id)).map(x => ({ id: x.id, name: x.name, owner: x.owner, members: d.members.filter(m => m.group_id === x.id).map(m => m.email) })); },
    async createGroup(name) { const d = D(); d.groups.push({ id: uuid(), name, owner: cur.email }); WD(d); },
    async addMember(g, e) { const d = D(); if (!d.members.some(m => m.group_id === g && m.email === e)) d.members.push({ group_id: g, email: e }); WD(d); },
    async rmMember(g, e) { const d = D(); d.members = d.members.filter(m => !(m.group_id === g && m.email === e)); WD(d); },
    async delGroup(g) { const d = D(); d.groups = d.groups.filter(x => x.id !== g); d.members = d.members.filter(m => m.group_id !== g); d.shares = d.shares.filter(s => s.group_id !== g); WD(d); }
  };

  /* ---- Supabase ---- */
  const sb = remote ? supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey) : null;
  const ck = r => { if (r.error) throw Error(r.error.message); return r.data; };
  const uinfo = u => ({ email: em(u.email), name: (u.user_metadata && u.user_metadata.name) || u.email.split('@')[0] });
  const R = {
    async init() { const { data } = await sb.auth.getSession(); return data.session ? uinfo(data.session.user) : null; },
    async signUp(e, p, n) { const { data, error } = await sb.auth.signUp({ email: em(e), password: p, options: { data: { name: n } } }); if (error) throw error; if (!data.session) throw Error('Account created. Check your email to confirm it, then log in.'); return uinfo(data.user); },
    async signIn(e, p) { const { data, error } = await sb.auth.signInWithPassword({ email: em(e), password: p }); if (error) throw error; return uinfo(data.user); },
    async signOut() { await sb.auth.signOut(); },
    async list() {
      const rows = ck(await sb.from('projects').select('id,title,owner_email,updated_at').order('updated_at', { ascending: false }));
      const sh = ck(await sb.from('shares').select('project_id,email,group_id,role')), gm = ck(await sb.from('group_members').select('group_id').eq('email', cur.email)).map(x => x.group_id);
      return rows.map(p => { if (p.owner_email === cur.email) return { id: p.id, title: p.title, owner: p.owner_email, updated: p.updated_at, role: 'owner' }; const s = sh.filter(x => x.project_id === p.id && (x.email === cur.email || gm.includes(x.group_id))); return { id: p.id, title: p.title, owner: p.owner_email, updated: p.updated_at, role: s.some(x => x.role === 'edit') ? 'edit' : 'view' }; });
    },
    async save(r) {
      if (r.id) { const d = ck(await sb.from('projects').update({ title: r.title, data: r.data, updated_at: new Date().toISOString() }).eq('id', r.id).select('id,owner_email')); if (!d.length) throw Error('You do not have edit access'); return { id: r.id, role: d[0].owner_email === cur.email ? 'owner' : 'edit' }; }
      const d = ck(await sb.from('projects').insert({ title: r.title, data: r.data }).select('id').single()); return { id: d.id, role: 'owner' };
    },
    async load(id) { const p = ck(await sb.from('projects').select('id,title,data,owner_email').eq('id', id).single()); return { id, title: p.title, data: p.data, role: p.owner_email === cur.email ? 'owner' : ((await R.list()).find(x => x.id === id) || {}).role }; },
    async remove(id) { ck(await sb.from('projects').delete().eq('id', id)); },
    async shares(pid) { return ck(await sb.from('shares').select('id,email,group_id,role,groups(name)').eq('project_id', pid)).map(s => ({ ...s, group: s.groups && s.groups.name })); },
    async share(pid, o) { ck(await sb.from('shares').insert({ project_id: pid, email: o.email || null, group_id: o.group_id || null, role: o.role })); },
    async unshare(id) { ck(await sb.from('shares').delete().eq('id', id)); },
    async groups() { return ck(await sb.from('groups').select('id,name,owner_email,group_members(email)')).map(g => ({ id: g.id, name: g.name, owner: g.owner_email, members: g.group_members.map(m => m.email) })); },
    async createGroup(name) { ck(await sb.from('groups').insert({ name })); },
    async addMember(g, e) { ck(await sb.from('group_members').insert({ group_id: g, email: e })); },
    async rmMember(g, e) { ck(await sb.from('group_members').delete().eq('group_id', g).eq('email', e)); },
    async delGroup(g) { ck(await sb.from('groups').delete().eq('id', g)); }
  };

  const I = remote ? R : L, set = u => { cur = u; window.FAMILI_USER = u ? u.email : null; return u; };
  window.FB = { remote, user: () => cur, em,
    ready: (async () => { try { set(await I.init()); } catch (e) { set(null); } })(),
    signUp: async (e, p, n) => set(await I.signUp(e, p, n)), signIn: async (e, p) => set(await I.signIn(e, p)), signOut: async () => { await I.signOut(); set(null); },
    list: () => I.list(), save: r => I.save(r), load: id => I.load(id), remove: id => I.remove(id), shares: id => I.shares(id),
    share: (id, o) => I.share(id, { ...o, email: o.email ? em(o.email) : null }), unshare: id => I.unshare(id), groups: () => I.groups(), createGroup: n => I.createGroup(n),
    addMember: (g, e) => I.addMember(g, em(e)), rmMember: (g, e) => I.rmMember(g, e), delGroup: g => I.delGroup(g) };
})();
