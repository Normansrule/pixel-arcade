// Online lockstep guard: every 2-player cabinet that js/net.js offers online must be deterministic. Each game runs
// twice in two-player mode from the same seed with the same scripted buttons, while draw() gets a DIFFERENT random
// stream each time (rendering may use Math.random freely). The state hash must match on every frame, or the two
// players' screens would drift apart. Also checks the online mode list.   node tests/net.test.js
global.window = global;
const ctx = new Proxy({}, { get: (t, k) => k in t ? t[k] : () => ({}), set: (t, k, v) => { t[k] = v; return true; } });
require('./lib/load.js')();
for (const f of ['js/online/safe.js', 'js/online/config.js', 'js/net.js']) require('../' + f);
const A = global.A, S = global.PXSafe; A.c = ctx; A.silent = true; const NR = Math.random, N = ['l', 'r', 'u', 'd', 'a', 'b'];
let fails = 0; const bad = [];
const lock = A.games.filter(g => A.onlineMode(g) === 'lock'), duel = A.games.filter(g => A.onlineMode(g) === 'duel');
const ONLY = (process.env.ONLY || '').split(',').filter(Boolean);
for (const gm of lock.filter(g => !ONLY.length || ONLY.includes(g.id))) {
  const run = drawSeed => { const hs = []; A.cpu = false; A.two = true; A.lvl = 1; A.ai = .75; A.t = 0; A.fx = []; const inR = S.mulberry(99), sim = S.mulberry(1234), dr = S.mulberry(drawSeed);
    A._set(0, {}); A._set(1, {}); Math.random = sim; let g = gm.make();
    for (let f = 0; f < 1500; f++) { A.t++; const i0 = {}, i1 = {}; for (const n of N) { i0[n] = inR() < .3; i1[n] = inR() < .3; } A._set(0, i0); A._set(1, i1);
      const ms = A.mouse; ms.x = inR() * 320 | 0; ms.y = inR() * 240 | 0; ms.dx = inR() < .1 ? 3 : 0; ms.dy = 0; ms.down = inR() < .1; ms.bdown = false; ms.t = ms.dx ? 60 : 0; // the host's mouse is part of the synced input
      Math.random = sim; g.update(); A.fxStep && A.fxStep(); Math.random = dr; try { g.draw(); A.fxDraw && A.fxDraw(); } catch (e) { /* headless canvas */ } hs.push(S.stateHash(g)); if (g.over) break; }
    Math.random = NR; return hs; };
  try { const a = run(5), b = run(77); const k = a.findIndex((v, i) => v !== b[i]); if (k >= 0 || a.length !== b.length) bad.push(gm.id + '@' + (k < 0 ? Math.min(a.length, b.length) : k)); }
  catch (e) { bad.push(gm.id + ' threw ' + e.message.slice(0, 60)); }
}
if (bad.length) { fails++; console.log('FAIL not deterministic, add to NO_LOCK in js/net.js or fix the game:', bad.join(' ')); }
const vs = A.games.filter(g => g.vs && !g.href).length, solo = A.games.filter(g => !g.vs && !g.href).length;
console.log('online: ' + lock.length + ' of ' + vs + ' 2-player cabinets in lockstep, ' + duel.length + ' of ' + solo + ' solo cabinets as score duels');
if (duel.length !== solo) { fails++; console.log('FAIL every solo cabinet should be a score duel'); }
if (lock.length !== vs) { fails++; console.log('FAIL every 2-player cabinet should be playable online'); }
if (A.games.some(g => g.href && A.onlineMode(g))) { fails++; console.log('FAIL 3D worlds are not online yet'); }
console.log(fails ? 'net test failed' : 'net test passed'); process.exit(fails ? 1 : 0);
