// Optional sign-in (js/online/auth.js) against a fake account server: checks what is sent, and that bad replies,
// bad input and injection attempts are refused.   node tests/auth.test.js
global.window = global; const store = {}, sstore = {}; const calls = [];
global.localStorage = { getItem: k => k in store ? store[k] : null, setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
global.sessionStorage = { getItem: k => k in sstore ? sstore[k] : null, setItem: (k, v) => { sstore[k] = String(v); }, removeItem: k => { delete sstore[k]; } };
global.location = { protocol: 'https:', origin: 'https://normansrule.github.io', pathname: '/pixel-arcade/', search: '', hash: '', assign(u) { this.went = u; } };
global.history = { replaceState() {} };
const URL0 = 'https://abcdefghijklmnopqrst.supabase.co', ID = '11111111-2222-4333-8444-555555555555';
let reply = () => ({ ok: true, body: null });
global.fetch = async (u, o) => { calls.push({ u, o }); const r = reply(u, o); return { ok: r.ok, status: r.ok ? 200 : 400, text: async () => r.body === null ? '' : JSON.stringify(r.body) }; };
require('../js/engine/00-core.js'); require('../js/online/safe.js');
global.PX_ONLINE = { accounts: { url: URL0, anonKey: 'sb_publishable_TESTKEY1234567890abc' } };
A.profile = { user: '', tokens: 50, played: 3, wins: 1 }; A.saveProfile = () => {};
require('../js/online/auth.js');
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const rejects = async (p, re, m) => { try { await p; ok(false, m + ' (no error)'); } catch (e) { ok(re.test(e.message), m + ': ' + e.message); } };
(async () => {
  const au = A.auth; await au.ready; ok(au.enabled, 'accounts switched on by config');
  await rejects(au.emailCode('not an email'), /email address/, 'bad email refused before any request');
  await rejects(au.emailCode('a@b.co"><script>'), /email address/, 'email with markup refused');
  ok(calls.length === 0, 'no request made for bad input');
  await au.emailCode('Player@Example.com'); const c0 = calls.pop();
  ok(c0.u === URL0 + '/auth/v1/otp' && JSON.parse(c0.o.body).email === 'player@example.com' && c0.o.credentials === 'omit', 'email code request');
  await rejects(au.verify('player@example.com', '12ab'), /6 digits/, 'non-numeric code refused');
  reply = u => /verify/.test(u) ? { ok: true, body: { access_token: 'aaa', refresh_token: 'rrr', expires_in: 3600, user: { id: 'x;drop table', email: 'p@e.co' } } } : { ok: true, body: [] };
  await rejects(au.verify('player@example.com', '123456'), /Unexpected reply/, 'reply with a bad user id refused');
  reply = u => /verify/.test(u) ? { ok: true, body: { access_token: 'aaa', refresh_token: 'rrr', expires_in: 3600, user: { id: ID, email: 'p@e.co', user_metadata: { name: '<img onerror=x>Pat' } } } }
    : /profiles\?select/.test(u) ? { ok: true, body: [] } : { ok: true, body: null };
  calls.length = 0; await au.verify('player@example.com', '123 456');
  ok(au.user && au.user.id === ID, 'signed in');
  const sel = calls.find(c => /profiles\?select/.test(c.u)), up = calls.find(c => /on_conflict/.test(c.u));
  ok(sel && sel.u.endsWith('&id=eq.' + ID) && sel.o.headers.Authorization === 'Bearer aaa', 'profile read uses the checked user id and the session token');
  const body = up && JSON.parse(up.o.body);
  ok(body && body.id === ID && body.name === 'img onerrorxPat' && body.tokens === 50, 'new profile row written with a cleaned name: ' + (body && body.name));
  ok(JSON.parse(store.pxd_auth).user.id === ID, 'session kept in this browser');
  await rejects(au.rename('<>'), /Names use/, 'empty-after-cleaning name refused');
  calls.length = 0; await au.rename("Robert'); DROP TABLE profiles;--"); const r2 = JSON.parse(calls.pop().o.body);
  ok(r2.name === 'Robert DROP TABL', 'rename sends a cleaned name as JSON data: ' + r2.name);
  await rejects(au.emailCode('p@e.co'), /Too many tries/, 'account calls are rate limited');
  await new Promise(r => setTimeout(r, 2100));
  reply = () => ({ ok: false, body: { msg: '<b>Token has expired</b>' } }); await rejects(au.emailCode('p@e.co'), /<b>Token has expired<\/b>/, 'server errors come back as plain text (shown with textContent)');
  await au.signOut(); ok(!au.user && !store.pxd_auth, 'signed out and session removed');
  console.log(fails ? fails + ' auth checks failed' : 'auth test passed'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
