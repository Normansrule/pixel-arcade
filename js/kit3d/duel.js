// Online score duel for the full-3D worlds. The worlds run their own engines, so they cannot share a simulation the
// way the canvas cabinets do; instead two players link up, each plays a round of the same world in their own browser,
// and every finished round's score (the one handed to saveBest in score.js) is sent to the other player. When both
// have finished the same round, a banner names the winner.
//
// How to start one: press DUEL ONLINE on the world's menu (create a room, or type a friend's code), or pick the world
// in the arcade's online lobby; the hub then hands the room to the world through sessionStorage. A link or URL can
// never start a connection by itself.
//
// Security: the connection is js/online/link.js (strict schemas, size limits, rate limits); names are cleaned by
// PXSafe.cleanName and every piece of text from the other player is shown with textContent, never as HTML.
import '../online/safe.js';
import '../online/config.js';
import '../online/link.js';

const S = window.PXSafe, PX = window.PXLink, CFG = window.PX_ONLINE;
const ready = !!(S && PX && CFG && typeof document !== 'undefined');
const MAX_ROUNDS = 200;
const st = { link: null, rival: '', world: '', theirWorld: '', mine: [], theirs: [], told: 0, open: false };
const folder = () => { const m = /\/([a-z0-9]{2,16})\/(?:index\.html)?$/.exec(location.pathname); return m ? m[1] : ''; };
const $ = id => document.getElementById(id);

/* ---------- tiny DOM helper: text only, never HTML ---------- */
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const k of Object.keys(attrs || {})) {
    const v = attrs[k]; if (v === null || v === undefined || v === false) continue;
    if (k === 'class') el.className = v; else if (k === 'text') el.textContent = v;
    else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v); else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of kids.flat()) { if (c === null || c === undefined || c === false) continue; el.append(c instanceof Node ? c : document.createTextNode(String(c))); }
  return el;
}
const clear = n => { while (n.firstChild) n.removeChild(n.firstChild); };

const CSS = `
.pxd{position:fixed;right:16px;top:16px;z-index:2147483000;font:600 12px/1.4 "JetBrains Mono",ui-monospace,Menlo,Consolas,monospace;color:#f4f2ec;letter-spacing:.02em}
.pxd button{font:inherit;color:inherit;cursor:pointer;border:1px solid rgba(244,242,236,.35);background:rgba(8,8,8,.82);padding:7px 12px;border-radius:2px}
.pxd button:hover,.pxd button:focus-visible{border-color:#ff4d00;outline:none}
.pxd .hot{background:#ff4d00;border-color:#ff4d00;color:#0a0a0a;font-weight:700}
.pxd-btn{box-shadow:0 6px 24px rgba(0,0,0,.35)}
.pxd-btn::before{content:"";display:inline-block;width:7px;height:7px;margin-right:8px;border-radius:50%;background:#ff4d00;vertical-align:1px}
.pxd-p{width:min(330px,calc(100vw - 32px));background:rgba(10,10,10,.94);border:1px solid rgba(244,242,236,.2);border-top:2px solid #ff4d00;padding:14px;box-shadow:0 18px 50px rgba(0,0,0,.5)}
.pxd-p h4{margin:0 0 10px;font-size:13px;letter-spacing:.14em}
.pxd-p p{margin:8px 0}
.pxd-p small{opacity:.65;font-weight:400}
.pxd-p input{font:inherit;color:#f4f2ec;background:#000;border:1px solid rgba(244,242,236,.3);padding:7px 8px;width:100%;box-sizing:border-box;border-radius:2px}
.pxd-p input:focus{border-color:#ff4d00;outline:none}
.pxd-row{display:flex;gap:8px;margin-top:8px}.pxd-row>*{flex:1}
.pxd-code{font:700 34px/1.1 "JetBrains Mono",ui-monospace,monospace;letter-spacing:.18em;color:#ff4d00;text-align:center;margin:10px 0}
.pxd-err{color:#ff8a5c}
.pxd-chip{position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:2147483000;pointer-events:none;background:rgba(8,8,8,.78);border-left:2px solid #ff4d00;padding:4px 10px;font:700 11px/1.4 "JetBrains Mono",ui-monospace,monospace;color:#f4f2ec;white-space:nowrap;max-width:calc(100vw - 32px);overflow:hidden;text-overflow:ellipsis}
.pxd-ban{position:fixed;top:44px;left:50%;transform:translateX(-50%);z-index:2147483000;pointer-events:none;text-align:center;background:rgba(8,8,8,.9);border:1px solid #ff4d00;padding:10px 22px;font:700 13px/1.4 "JetBrains Mono",ui-monospace,monospace;color:#f4f2ec}
.pxd-ban b{display:block;font-size:26px;letter-spacing:.08em;color:#ff4d00}
[hidden].pxd,.pxd [hidden],.pxd-chip[hidden],.pxd-ban[hidden]{display:none!important}`;

const ui = {};
let root, btn, panel, body, chip, ban, banT = 0;
function build() {
  document.head.appendChild(h('style', { text: CSS }));
  btn = h('button', { type: 'button', class: 'pxd-btn', text: 'DUEL ONLINE', title: 'Play this world against a friend anywhere', onclick: () => ui.show(true) });
  body = h('div');
  panel = h('div', { class: 'pxd-p', role: 'dialog', 'aria-label': 'Online duel', hidden: true }, h('h4', { text: 'ONLINE DUEL' }), body);
  root = h('div', { class: 'pxd' }, btn, panel);
  // keep clicks and keys inside the panel away from the world (pointer lock, hotkeys, menus)
  for (const ev of ['pointerdown', 'mousedown', 'mouseup', 'click', 'dblclick', 'wheel', 'touchstart', 'touchend', 'keydown', 'keyup', 'keypress', 'contextmenu'])
    root.addEventListener(ev, e => { e.stopPropagation(); if (ev === 'keydown' && e.key === 'Escape') ui.show(false); });
  chip = h('div', { class: 'pxd-chip', hidden: true, 'aria-live': 'polite' });
  ban = h('div', { class: 'pxd-ban', hidden: true, role: 'status' });
  document.body.append(root, chip, ban);
  setInterval(watch, 400);
}
/* the button only shows on the world's own menu and results screens, never over the game */
const shown = el => { if (!el || el.hidden) return false; const c = getComputedStyle(el); return c.display !== 'none' && c.visibility !== 'hidden' && +c.opacity > .05; };
function watch() {
  const menu = shown($('menu')) || shown($('over')) || shown($('results'));
  root.hidden = !menu && !st.open; if (!menu && st.open && !linking()) ui.show(false);
  btn.hidden = st.open;
  if (st.open) btn.textContent = 'DUEL ONLINE';
  else btn.textContent = linked() ? 'DUEL · ' + st.rival.toUpperCase() : 'DUEL ONLINE';
}
const linked = () => !!(st.link && st.link.st.phase === 'linked');
const linking = () => !!(st.link && ['opening', 'waiting', 'joining', 'answering'].includes(st.link.st.phase));

ui.show = on => { st.open = on; panel.hidden = !on; btn.hidden = on; if (on) { if (linked()) ui.lobby(); else if (!linking()) ui.home(); const f = panel.querySelector('input,button.hot'); if (f) f.focus(); } };
ui.err = t => { let e = body.querySelector('.pxd-err'); if (!e) { e = h('p', { class: 'pxd-err', role: 'alert' }); body.appendChild(e); } e.textContent = t; };
ui.status = t => { clear(body); body.append(h('p', { text: t }), h('div', { class: 'pxd-row' }, h('button', { type: 'button', text: 'Cancel', onclick: () => { st.link.close(); ui.home(); } }))); };
function nameInput() {
  const inp = h('input', { type: 'text', maxlength: S.NAME_MAX, autocomplete: 'nickname', spellcheck: 'false', 'aria-label': 'Your name' });
  inp.value = PX.myName(); inp.addEventListener('change', () => { inp.value = PX.setName(inp.value) || PX.myName(); });
  return h('label', null, h('small', { text: 'Your name' }), inp);
}
ui.home = msg => {
  clear(body);
  const code = h('input', { type: 'text', maxlength: 9, autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', placeholder: 'K7QF2M', 'aria-label': 'Room code' });
  const join = () => { if (!S.cleanRoom(code.value)) { ui.err('Room codes are 6 letters and numbers, like K7QF2M.'); return; } reset(); st.link.join(PX.myName(), code.value); };
  code.addEventListener('keydown', e => { if (e.key === 'Enter') join(); });
  body.append(
    h('p', { text: 'Race a friend anywhere: you each play a round of this world and your scores are compared.' }),
    nameInput(),
    h('div', { class: 'pxd-row' }, h('button', { type: 'button', class: 'hot', text: 'CREATE ROOM', onclick: () => { reset(); st.link.host(PX.myName()); } })),
    h('p', null, h('small', { text: 'Or type your friend\'s room code:' })),
    h('div', { class: 'pxd-row' }, code, h('button', { type: 'button', text: 'JOIN', onclick: join })),
    h('p', null, h('small', { text: 'A free public server introduces your browsers once; after that only scores pass, directly between you. Your rival\'s browser can see your internet address, so play with people you know.' })),
    h('div', { class: 'pxd-row' }, h('button', { type: 'button', text: 'Close', onclick: () => ui.show(false) })));
  if (msg) ui.err(msg);
};
ui.room = note => {
  const c = st.link.st.room; clear(body);
  body.append(h('p', { text: 'Send this code to your friend. They open this world, press DUEL ONLINE and type it:' }),
    h('div', { class: 'pxd-code', text: c.slice(0, 3) + ' ' + c.slice(3) }),
    h('p', null, h('small', { text: note || 'Waiting for your friend…' })),
    h('div', { class: 'pxd-row' }, h('button', { type: 'button', text: 'Close room', onclick: () => { st.link.close(); ui.home(); } })));
};
ui.lobby = () => {
  if (!st.open) return; clear(body);
  const rows = [];
  for (let n = st.mine.length; n >= 1 && rows.length < 4; n--) {
    const a = st.mine[n - 1], b = st.theirs[n - 1];
    rows.push(h('p', null, 'Round ' + n + ': you ' + a + ' · ' + st.rival + ' ' + (b === undefined ? 'playing…' : b)));
  }
  body.append(h('p', null, h('b', { text: PX.myName() }), ' vs ', h('b', { text: st.rival || '…' })),
    h('p', { text: other() ? st.rival + ' is in another world (' + st.theirWorld + '). Scores only compare when you play the same world.' : 'Start a round. When you have both finished it, the winner is shown here and at the top of the screen.' }),
    rows,
    h('div', { class: 'pxd-row' }, h('button', { type: 'button', text: 'Leave duel', onclick: () => { st.link.leave(); reset(); ui.home(); } }), h('button', { type: 'button', class: 'hot', text: 'Play', onclick: () => ui.show(false) })));
};
const other = () => !!(st.theirWorld && st.world && st.theirWorld !== st.world);

function updateChip() {
  if (!linked()) { chip.hidden = true; return; }
  const n = Math.max(st.mine.length, st.theirs.length), a = st.mine[n - 1], b = st.theirs[n - 1];
  chip.textContent = 'ONLINE DUEL · VS ' + st.rival.toUpperCase() + (n ? ' · ROUND ' + n + ' · YOU ' + (a === undefined ? '…' : a) + ' · ' + st.rival.toUpperCase() + ' ' + (b === undefined ? '…' : b) : '');
  chip.hidden = false;
}
function banner(head, line) { clear(ban); ban.append(h('b', { text: head }), line); ban.hidden = false; clearTimeout(banT); banT = setTimeout(() => { ban.hidden = true; }, 7000); }
function judge() {
  updateChip(); if (st.open && linked()) ui.lobby(); if (other()) return;
  const n = Math.min(st.mine.length, st.theirs.length);
  if (n > st.told) {
    st.told = n; const a = st.mine[n - 1], b = st.theirs[n - 1];
    banner(a === b ? 'DRAW!' : a > b ? 'YOU WIN!' : st.rival.toUpperCase() + ' WINS', 'Round ' + n + ': you ' + a + ' · ' + st.rival + ' ' + b);
  }
}
function reset() { Object.assign(st, { rival: '', theirWorld: '', mine: [], theirs: [], told: 0 }); updateChip(); }

function message(m) {
  switch (m.t) {
    case 'hi': st.rival = S.cleanName(m.name, 'Rival'); if (st.open) ui.lobby(); updateChip(); break;
    case 'wh': st.theirWorld = m.world; judge(); break;
    case 'sc': if (m.done && m.n >= 1 && m.n <= MAX_ROUNDS && m.n === st.theirs.length + 1) { const s = S.cleanScore(m.s); if (s !== null) { st.theirs.push(s); judge(); } } else st.link.strike(); break;
    case 'pong': break;
    default: st.link.strike();
  }
}

/** Called by score.js for every finished round (the score passed to saveBest). */
export function duelScore(id, pts) {
  if (!linked() || st.mine.length >= MAX_ROUNDS) return;
  const s = S.cleanScore(+pts); if (s === null) return;
  st.mine.push(s); st.link.send({ t: 'sc', n: st.mine.length, s, done: true }); judge();
}

/* the arcade hub hands a room to this world through sessionStorage (same site only); a link can never start a duel */
function handoff() {
  let o = null; try { o = JSON.parse(sessionStorage.getItem('pxd_duel')); sessionStorage.removeItem('pxd_duel'); } catch (_) { return; }
  if (!o || typeof o !== 'object' || typeof o.t !== 'number' || Math.abs(Date.now() - o.t) > 60000) return;
  const room = S.cleanRoom(o.room); if (!room || (o.role !== 'host' && o.role !== 'guest')) return;
  ui.show(true);
  if (o.role === 'host') st.link.host(PX.myName(), room); else st.link.join(PX.myName(), room, 30000);
}

if (ready) {
  st.world = folder();
  st.link = PX.make({
    status: t => { if (st.open) ui.status(t); },
    room: () => { ui.show(true); ui.room(); },
    waiting: t => ui.room(t),
    linked: () => {
      st.link.send({ t: 'hi', v: 1, name: PX.myName(), app: CFG.app });
      if (st.world) st.link.send({ t: 'wh', world: st.world });
      ui.show(true); ui.lobby(); updateChip(); banner('LINKED', 'Duel on. Play a round!');
    },
    message,
    fail: msg => { reset(); ui.show(true); ui.home(msg); },
    lost: msg => { reset(); banner('DUEL OVER', msg); if (st.open) ui.home(msg); },
  });
  addEventListener('pagehide', () => { if (linked()) st.link.leave(); });
  build(); handoff();
  window.PXDuel = Object.freeze({ state: () => ({ phase: st.link.st.phase, rival: st.rival, mine: st.mine.slice(), theirs: st.theirs.slice(), told: st.told, world: st.world, strikes: st.link.st.strikes }), dc: () => st.link.st.dc });
}
