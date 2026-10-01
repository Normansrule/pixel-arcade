/* Pixel Arcade Builder — editor */
(function () {
'use strict';
const PX = window.PXB, R = PX.R, T = PX.T;
let A = PX.ASSETS, CO = PX.COMPS;
const is3D = () => !!(E.P && E.P.dim === '3d');
let E3P = null;
const load3D = () => E3P || (E3P = import('./three3d.js').then(m => (PX.E3 = m.default)).catch(err => { E3P = null; log('Could not load the 3D engine: ' + err.message, 'err'); throw err; }));
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const LS = { proj: 'pxd_builder_projects', games: 'pxd_mygames', last: 'pxd_builder_last', tour: 'pxd_builder_tour', ui: 'pxd_builder_ui' };
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { log('Storage error: ' + e.message, 'err'); toast('Could not save — browser storage is full or blocked', 'err'); return false; } };
const ISSUE_URL = 'https://github.com/Normansrule/pixel-arcade/issues/new';

/* ================================================================ icons + dom helpers */
const IC = {
  select: 'M4 3l7 17 2.5-7.5L21 10z', place: 'M5 21h14M7 17h10l-1-4H8zM9 13V9a3 3 0 1 1 6 0v4',
  pan: 'M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20',
  erase: 'M20 20H8.5L4 15.5a2 2 0 0 1 0-2.8L13.2 3.5a2 2 0 0 1 2.8 0l4.5 4.5a2 2 0 0 1 0 2.8L11 20M9 9l6 6',
  undo: 'M9 14L4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11', redo: 'M15 14l5-5-5-5M20 9H9.5a5.5 5.5 0 0 0 0 11H13',
  magnet: 'M6 3v8a6 6 0 0 0 12 0V3h-4v8a2 2 0 0 1-4 0V3zM6 7h4M14 7h4',
  help: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  eyeoff: 'M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a10 10 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2',
  lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4', unlock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 7.5-2',
  copy: 'M8 8h12v12H8zM16 8V4H4v12h4', trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6',
  target: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v3M12 19v3M2 12h3M19 12h3',
  brush: 'M9.06 11.9l8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z',
  x: 'M18 6L6 18M6 6l12 12', plus: 'M12 5v14M5 12h14', down: 'M12 3v12M7 10l5 5 5-5M5 21h14', up: 'M12 15V3M7 8l5-5 5 5M5 21h14',
  menu: 'M3 6h18M3 12h18M3 18h18', sliders: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
  front: 'M4 12h9v9H4zM11 3h9v9h-9z', back: 'M11 3h9v9h-9zM4 12h9v9H4z',
  bucket: 'M19 11L11 3 3 11l8 8zM5 11h14M20 14s2 2.5 2 4a2 2 0 0 1-4 0c0-1.5 2-4 2-4z',
  pipette: 'M2 22l1-1h3l9-9M3 21v-3l9-9M15 6l3-3a2.1 2.1 0 0 1 3 3l-3 3 1 1-2 2-6-6 2-2z',
  flip: 'M12 3v18M16 7l4 5-4 5zM8 7l-4 5 4 5z', pencil: 'M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z',
  link: 'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7',
  external: 'M15 3h6v6M10 14L21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6',
  power: 'M18.4 6.6a9 9 0 1 1-12.8 0M12 2v10', panel: 'M3 3h18v18H3zM9 3v18', panelr: 'M3 3h18v18H3zM15 3v18',
  mirror: 'M12 2v20M4 6l5 6-5 6zM20 6l-5 6 5 6', clear: 'M4 4h16v16H4zM4 4l16 16',
  move: 'M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20', rotate: 'M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5', scale: 'M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7', cube: 'M12 2l9 5v10l-9 5-9-5V7zM12 22V12M21 7l-9 5-9-5', ground: 'M2 20h20M12 4v12M8 12l4 4 4-4'
};
const ic = n => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="${IC[n] || ''}"/></svg>`;
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    const v = attrs[k]; if (v == null || v === false) continue;
    if (k === 'class') el.className = v; else if (k === 'style') el.style.cssText = v; else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'value') el.value = v; else if (k === 'checked') el.checked = !!v; else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(String(c)));
  return el;
}
function toast(msg, kind) {
  const t = h('div', { class: 'toast ' + (kind || '') }, msg); $('#toasts').append(t);
  setTimeout(() => { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 320); }, 2200);
}

/* ================================================================ console */
const LOG = []; let conT = 0;
function log(m, lvl = 'info') {
  const last = LOG[LOG.length - 1];
  if (last && last.m === m && last.lvl === lvl) { last.n++; last.t = new Date(); } else LOG.push({ m, lvl, t: new Date(), n: 1 });
  if (LOG.length > 500) LOG.shift();
  if (!conT) conT = setTimeout(() => { conT = 0; renderConsole(); }, 80);
}
window.addEventListener('error', ev => log('Error: ' + ev.message + (ev.lineno ? ' (line ' + ev.lineno + ')' : ''), 'err'));

/* ================================================================ state */
const E = PX.editor = {
  P: null, sel: new Set(), tool: 'select', asset: 'coin', cat: 'All', cam: { x: 0, y: 0, z: 1 }, snap: true, grid: 32,
  hist: [], hi: -1, playing: false, game: null, hover: null, drag: null, clip: null, mouse: { x: 0, y: 0, wx: 0, wy: 0, in: false },
  space: false, saved: true, hopen: {}, secOpen: { Transform: true, Appearance: true, Physics: false, Properties: true, Components: true }, tab: 'settings',
  anim: true, t: 0, lastResult: null, tf: {}, tf3: {}, ruleFire: {}, grid3: 1, dimPick: '2d'
};
const ui = lsGet(LS.ui, {}); if (ui.snap != null) E.snap = ui.snap; if (ui.grid) E.grid = ui.grid; if (ui.grid3) E.grid3 = ui.grid3; if (ui.bcol) $('#app').classList.add('bcol');
const saveUI = () => lsSet(LS.ui, { snap: E.snap, grid: E.grid, grid3: E.grid3, bcol: $('#app').classList.contains('bcol') });

/* ---------------------------------------------------------------- projects storage */
function readProjects() { const l = lsGet(LS.proj, []); return Array.isArray(l) ? l : []; }
function saveProject(quiet) {
  if (!E.P) return; clearTimeout(E.saveT);
  const P = E.P; P.updated = Date.now();
  const list = readProjects().filter(r => r && r.id);
  const rec = { id: P.id, name: P.settings.title, updated: P.updated, data: P };
  const i = list.findIndex(r => r.id === P.id); if (i >= 0) list[i] = rec; else list.unshift(rec);
  if (lsSet(LS.proj, list)) { lsSet(LS.last, P.id); E.saved = true; updSaved(); if (!quiet) { /* noop */ } }
}
function updSaved() {
  const s = $('#saveState'); s.classList.toggle('dirty', !E.saved); s.textContent = E.saved ? 'Saved' : 'Saving…';
  $('#stSave').innerHTML = E.saved ? 'Autosaved <b>' + new Date(E.P.updated || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '</b>' : 'Unsaved changes';
}
function markDirty() { E.saved = false; updSaved(); clearTimeout(E.saveT); E.saveT = setTimeout(() => saveProject(true), 700); }

/* ---------------------------------------------------------------- history */
const snapState = () => JSON.stringify({ s: E.P.settings, e: E.P.entities, r: E.P.rules, sp: E.P.sprites, n: E.P.nextId });
function resetHistory() { E.hist = [snapState()]; E.hi = 0; updUndo(); }
function commit(label) {
  const s = snapState(); if (s === E.hist[E.hi]) return;
  E.hist.length = E.hi + 1; E.hist.push(s); if (E.hist.length > 200) E.hist.shift(); E.hi = E.hist.length - 1;
  E.histLabel = label; markDirty(); updUndo(); updStatus(); E.miniDirty = true; sync3D();
}
function restore(s) {
  const o = JSON.parse(s); Object.assign(E.P, { settings: o.s, entities: o.e, rules: o.r, sprites: o.sp, nextId: o.n });
  for (const id of [...E.sel]) if (!E.P.entities.some(e => e.id === id)) E.sel.delete(id);
  refreshAll(); markDirty();
}
function undo() { if (E.hi <= 0) { toast('Nothing to undo'); return; } E.hi--; restore(E.hist[E.hi]); updUndo(); log('Undo'); }
function redo() { if (E.hi >= E.hist.length - 1) { toast('Nothing to redo'); return; } E.hi++; restore(E.hist[E.hi]); updUndo(); log('Redo'); }
function updUndo() { $('#undoBtn').disabled = E.hi <= 0; $('#redoBtn').disabled = E.hi >= E.hist.length - 1; }

/* ================================================================ share codec */
const b64u = {
  enc(bytes) { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); },
  dec(str) { str = str.replace(/-/g, '+').replace(/_/g, '/'); while (str.length % 4) str += '='; const s = atob(str), b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return b; }
};
function slim(P) {
  const o = PX.clone(P); delete o.updated;
  o.entities.forEach(e => { delete e.hidden; delete e.locked; if (!e.name) delete e.name; if (!e.sprite) delete e.sprite; if (!e.tint) delete e.tint; if (!e.flip) delete e.flip; if (e.layer === 'main') delete e.layer; if (e.props && !Object.keys(e.props).length) delete e.props; });
  return o;
}
async function encodeProject(P) {
  const bytes = new TextEncoder().encode(JSON.stringify(slim(P)));
  if (window.CompressionStream) {
    try { const buf = await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer(); return 'z' + b64u.enc(new Uint8Array(buf)); } catch (e) { /* fall back */ }
  }
  return 'b' + b64u.enc(bytes);
}
async function decodeProject(code) {
  code = decodeURIComponent(code.trim()); const kind = code[0]; let bytes = b64u.dec(code.slice(1));
  if (kind === 'z') {
    if (!window.DecompressionStream) throw new Error('This browser cannot open compressed links');
    bytes = new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
  } else if (kind !== 'b') throw new Error('Unknown link format');
  return PX.normalize(JSON.parse(new TextDecoder().decode(bytes)));
}
PX.share = { encodeProject, decodeProject };
const baseUrl = () => location.origin + location.pathname.replace(/index\.html$/, '');
async function shareUrl() { return baseUrl() + '?play#' + await encodeProject(E.P); }

/* ================================================================ sprite icons */
function spriteIcon(key, cls) { const c = h('canvas', { width: 16, height: 16, class: cls || '' }); const x = c.getContext('2d'); if (key === 'none') { x.fillStyle = '#ff4d00'; x.fillRect(2, 2, 12, 12); } else x.drawImage(R.sprite(key, E.P), 0, 0); return c; }
function entityIcon(e, cls) {
  if (is3D()) return assetIcon(e.type, cls);
  const c = h('canvas', { width: 16, height: 16, class: cls || '' }), x = c.getContext('2d'), key = R.spriteKeyOf(e);
  if (key === 'none') { x.fillStyle = e.color; x.fillRect(1, 1, 14, 14); } else x.drawImage(R.imgFor(e, E.P), 0, 0, 16, 16);
  return c;
}

function assetIcon(k, cls) {
  const a = A[k]; if (!is3D() || !a) return spriteIcon(a ? a.sprite : 'none', cls);
  const c = h('canvas', { width: 64, height: 64, class: (cls || '') + ' i3' }), x = c.getContext('2d');
  if (PX.E3) { try { x.drawImage(PX.E3.icon(k), 0, 0, 64, 64); } catch (e) { x.imageSmoothingEnabled = false; x.drawImage(R.sprite(a.sprite), 8, 8, 48, 48); } }
  else { x.imageSmoothingEnabled = false; x.drawImage(R.sprite(a.sprite), 8, 8, 48, 48); }
  return c;
}

/* ================================================================ refresh */
function refreshAll() { sync3D(); refreshHierarchy(); refreshInspector(); refreshSettings(); refreshRules(); updStatus(); $('#projName').value = E.P.settings.title; E.miniDirty = true; }
function updStatus() {
  if (!E.P) return; const S = E.P.settings;
  $('.stab').innerHTML = '<i></i>Scene' + (is3D() ? ' <b class="d3b">3D</b>' : '');
  if (is3D()) {
    $('#stTool').innerHTML = 'Tool <b>' + ({ move: 'Move (W)', rotate: 'Rotate (E)', scale: 'Scale (R)', place: 'Place · ' + ((A[E.asset] || {}).name || ''), erase: 'Erase' })[E.tool] + '</b>';
    $('#stObjs').innerHTML = '<b>' + E.P.entities.length + '</b> objects · <b>' + E.P.rules.length + '</b> rules';
    $('#stSel').innerHTML = E.sel.size ? '<b>' + E.sel.size + '</b> selected' : '';
    $('#stZoom').innerHTML = 'Grid <b>' + E.grid3 + ' m</b>'; $('#zoomVal').textContent = 'Fit';
    $('#sceneInfo').textContent = 'World ' + S.world + ' m · 3D · ' + (PX.CAMS3D[S.camera] || '') + ' · right-drag orbit · middle-drag pan · wheel zoom';
    return;
  }
  $('#stTool').innerHTML = 'Tool <b>' + ({ select: 'Select', place: 'Place · ' + A[E.asset].name, pan: 'Pan', erase: 'Erase' })[E.tool] + '</b>';
  $('#stObjs').innerHTML = '<b>' + E.P.entities.length + '</b> objects · <b>' + E.P.rules.length + '</b> rules';
  $('#stSel').innerHTML = E.sel.size ? '<b>' + E.sel.size + '</b> selected' : '';
  $('#stZoom').innerHTML = 'Zoom <b>' + Math.round(E.cam.z * 100) + '%</b>';
  $('#zoomVal').textContent = Math.round(E.cam.z * 100) + '%';
  $('#sceneInfo').textContent = S.levelW + '×' + S.levelH + ' tiles · ' + (S.levelW * T) + '×' + (S.levelH * T) + 'px · ' + (() => { const pl = E.P.entities.find(e => e.comps.player); const m = pl ? pl.comps.player.mode : 'platformer'; return m === 'ship' ? 'ship · free flight' : m === 'topdown' ? 'top-down' : 'side view'; })();
}
function selected() { return E.P.entities.filter(e => E.sel.has(e.id)); }
function setSel(ids, keepInspector) { E.sel = new Set(ids); if (is3D() && E.ed3) E.ed3.setSelection(E.sel); refreshHierarchy(); if (!keepInspector) refreshInspector(); updStatus(); }

/* ================================================================ tools + toolbar */
const TOOLS2 = [['select', 'Select & move — click, Shift-click, drag a box', 'V'], ['place', 'Place the chosen asset — click, or drag to paint', 'B'], ['pan', 'Pan the view (or hold Space / middle mouse)', 'H'], ['erase', 'Erase — click or drag over objects', 'E']];
const TOOLS3 = [['move', 'Move gizmo — click to select, drag the arrows', 'W'], ['rotate', 'Rotate gizmo (15° snap)', 'E'], ['scale', 'Scale gizmo', 'R'], ['place', 'Place the chosen asset on any surface — click or drag to paint', 'B'], ['erase', 'Erase — click objects', 'X']];
function renderTools() {
  const g = $('.tb-group.tools'); g.innerHTML = '';
  for (const [t, tip, k] of (is3D() ? TOOLS3 : TOOLS2)) g.append(h('button', { type: 'button', class: 'tbtn icon' + (E.tool === t ? ' on' : ''), 'data-tool': t, 'data-tip': tip, 'data-key': k, 'aria-label': t + ' tool', html: ic(t === 'select' ? 'select' : t), onclick: () => setTool(t) }));
}
function renderGridSel() {
  const gs = $('#gridSel'); gs.innerHTML = '';
  (is3D() ? [[.25, '0.25 m'], [.5, '0.5 m'], [1, '1 m'], [2, '2 m']] : [[8, '8px'], [16, '16px'], [32, '32px'], [64, '64px']]).forEach(([v, l]) => gs.append(h('option', { value: v }, l)));
  gs.value = is3D() ? E.grid3 : E.grid; $('#snapBtn').setAttribute('aria-pressed', E.snap);
  if (E.ed3) E.ed3.setSnap(E.snap, E.grid3);
}
function setTool(t) {
  if (is3D() && !['move', 'rotate', 'scale', 'place', 'erase'].includes(t)) t = t === 'pan' ? 'move' : 'move';
  if (!is3D() && !['select', 'place', 'pan', 'erase'].includes(t)) t = t === 'move' || t === 'rotate' || t === 'scale' ? 'select' : 'select';
  E.tool = t; $$('[data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === t));
  if (is3D()) { if (E.ed3) { E.ed3.setAsset(E.asset); E.ed3.setTool(t); } }
  else { const v = $('#view'); v.className = t === 'pan' ? 'pan' : t === 'place' ? 'place' : t === 'erase' ? 'erase' : ''; }
  refreshAssetSel(); if (!E.P) return; updStatus(); if (!E.sel.size) refreshInspector();
}
function wireToolbar() {
  $('#undoBtn').innerHTML = ic('undo'); $('#redoBtn').innerHTML = ic('redo'); $('#helpBtn').innerHTML = ic('help');
  $('#snapBtn').innerHTML = ic('magnet'); $('#leftToggle').innerHTML = ic('panel'); $('#rightToggle').innerHTML = ic('panelr');
  renderTools();
  $('#undoBtn').onclick = undo; $('#redoBtn').onclick = redo;
  $('#snapBtn').onclick = () => { E.snap = !E.snap; renderGridSel(); saveUI(); toast('Snap ' + (E.snap ? 'on' : 'off')); };
  $('#gridSel').onchange = () => { if (is3D()) E.grid3 = +$('#gridSel').value; else E.grid = +$('#gridSel').value; renderGridSel(); saveUI(); updStatus(); };
  renderGridSel();
  $('#playBtn').onclick = togglePlay;
  $('#fileBtn').onclick = ev => fileMenu(ev.currentTarget);
  $('#shareBtn').onclick = openShare; $('#publishBtn').onclick = openPublish; $('#helpBtn').onclick = openHelp; $('#tourBtn').onclick = () => startTour();
  const pn = $('#projName');
  pn.oninput = () => { E.P.settings.title = pn.value; const t = $('#set-title'); if (t) t.value = pn.value; };
  pn.onchange = () => { if (!pn.value.trim()) { pn.value = E.P.settings.title = 'Untitled Game'; } commit('Rename game'); };
  pn.onkeydown = ev => { if (ev.key === 'Enter') pn.blur(); };
  $('#leftToggle').onclick = () => { $('#app').classList.toggle('showl'); $('#app').classList.remove('showr'); };
  $('#rightToggle').onclick = () => { $('#app').classList.toggle('showr'); $('#app').classList.remove('showl'); };
  $('#frameBtn').onclick = () => frameLevel();
  $('#zoomIn').onclick = () => zoomBy(1.25); $('#zoomOut').onclick = () => zoomBy(.8); $('#zoomVal').onclick = () => is3D() ? frameLevel() : zoomTo(1);
  $('#importFile').onchange = importFile;
}

/* ================================================================ assets panel */
function buildAssets() {
  const cats = $('#assetCats'); cats.innerHTML = '';
  (is3D() ? PX.CATS3D : PX.CATS).forEach(c => cats.append(h('button', { type: 'button', role: 'tab', class: c === E.cat ? 'on' : '', 'data-tip': c === 'All' ? 'Show every asset' : 'Show ' + c.toLowerCase(), onclick: () => { E.cat = c; buildAssets(); } }, c)));
  const g = $('#assetGrid'); g.innerHTML = '';
  for (const k in A) {
    const a = A[k]; if (E.cat !== 'All' && a.cat !== E.cat) continue;
    const t = h('div', { class: 'at', draggable: 'true', 'data-asset': k, 'data-tip': a.name + ' — ' + a.desc, role: 'button', tabindex: '0',
      onclick: () => { E.asset = k; setTool('place'); }, onkeydown: ev => { if (ev.key === 'Enter') { E.asset = k; setTool('place'); } } },
      assetIcon(k), h('span', null, a.name), h('i', { class: 'ac', style: 'background:' + catColor(a.cat) }));
    t.addEventListener('dragstart', ev => { ev.dataTransfer.setData('text/pxb-asset', k); ev.dataTransfer.effectAllowed = 'copy'; });
    g.append(t);
  }
  refreshAssetSel();
}
const catColor = c => ({ Characters: '#ff4d00', Building: '#6ee06e', Nature: '#9a9ab0', Terrain: '#6ee06e', Items: '#ffd84a', Hazards: '#ff3b3b', Logic: '#4ab4ff', Decor: '#9a9ab0' })[c] || '#777';
function refreshAssetSel() { $$('.at').forEach(t => t.classList.toggle('on', E.tool === 'place' && t.dataset.asset === E.asset)); $('#assetHint').textContent = E.tool === 'place' && A[E.asset] ? 'placing ' + A[E.asset].name : (is3D() ? 'click → place on a surface' : 'click → place'); }

/* ================================================================ hierarchy */
function refreshHierarchy() {
  const list = $('#hierList'), f = ($('#hierFilter').value || '').trim().toLowerCase(), P = E.P; list.innerHTML = '';
  $('#hierCount').textContent = P.entities.length + ' objects';
  if (!P.entities.length) { list.append(h('div', { class: 'hempty' }, 'Empty scene. Pick an asset below, then click in the Scene to place it.')); return; }
  const groups = new Map();
  for (const e of P.entities) {
    const nm = (e.name || A[e.type].name).toLowerCase();
    if (f && !nm.includes(f) && !e.type.includes(f) && !A[e.type].cat.toLowerCase().includes(f)) continue;
    if (!groups.has(e.type)) groups.set(e.type, []); groups.get(e.type).push(e);
  }
  const order = Object.keys(A), frag = document.createDocumentFragment();
  for (const k of [...groups.keys()].sort((a, b) => order.indexOf(a) - order.indexOf(b))) {
    const arr = groups.get(k);
    if (arr.length === 1) { frag.append(hrow(arr[0], true)); continue; }
    const hasSel = arr.some(e => E.sel.has(e.id)), open = E.hopen[k] != null ? E.hopen[k] || hasSel : (arr.length <= 6 || !!f || hasSel);
    frag.append(h('div', { class: 'hgrp' + (open ? ' open' : ''), role: 'treeitem', 'aria-expanded': open, onclick: ev => {
      if (ev.detail === 2) { setSel(arr.map(e => e.id)); return; }
      E.hopen[k] = !open; refreshHierarchy();
    }, 'data-tip': 'Click to expand · double-click to select all ' + A[k].name + 's' }, h('span', { class: 'tw' }, '▶'), assetIcon(k, 'ic'), h('span', null, A[k].name + 's'), h('span', { class: 'n' }, arr.length)));
    if (open) arr.forEach(e => frag.append(hrow(e, false)));
  }
  list.append(frag);
  const s = list.querySelector('.hrow.sel'); if (s && E.scrollHier) { s.scrollIntoView({ block: 'nearest' }); E.scrollHier = false; }
}
function hrow(e, top) {
  const r = h('div', { class: 'hrow' + (E.sel.has(e.id) ? ' sel' : '') + (e.hidden ? ' hid' : ''), role: 'treeitem', style: top ? 'padding-left:10px' : '',
    onclick: ev => {
      if (ev.shiftKey || ev.ctrlKey || ev.metaKey) { const s = new Set(E.sel); s.has(e.id) ? s.delete(e.id) : s.add(e.id); setSel(s); }
      else setSel([e.id]);
      if (ev.detail === 2) focusSel();
    } },
  entityIcon(e, 'ic'), h('span', { class: 'nm' }, e.name || A[e.type].name + (top ? '' : ' ' + e.id)),
  h('button', { type: 'button', class: 'hb' + (e.locked ? ' on' : ''), 'aria-label': 'Lock', 'data-tip': e.locked ? 'Unlock (selectable in scene)' : 'Lock (not selectable in scene)', html: ic(e.locked ? 'lock' : 'unlock'), onclick: ev => { ev.stopPropagation(); e.locked = !e.locked; commit('Lock'); refreshHierarchy(); } }),
  h('button', { type: 'button', class: 'hb' + (e.hidden ? ' on' : ''), 'aria-label': 'Visibility', 'data-tip': e.hidden ? 'Show in editor' : 'Hide in editor (still plays)', html: ic(e.hidden ? 'eyeoff' : 'eye'), onclick: ev => { ev.stopPropagation(); e.hidden = !e.hidden; commit('Visibility'); refreshHierarchy(); } }));
  return r;
}

/* ================================================================ inspector */
const fmtN = v => (Math.round(v * 1000) / 1000).toString();
function sel_(opts, val, onch, cls = 'sel') {
  const s = h('select', { class: cls });
  for (const o of opts) { if (o.group) { const g = h('optgroup', { label: o.group }); o.items.forEach(([v, l]) => g.append(h('option', { value: v }, l))); s.append(g); } else s.append(h('option', { value: o[0] }, o[1])); }
  s.value = val; s.onchange = () => onch(s.value); return s;
}
function chk(val, onch, label) { const i = h('input', { type: 'checkbox', checked: !!val }); i.onchange = () => onch(i.checked); return h('label', { class: 'chk' }, i, label ? h('span', null, label) : null); }
function numIn(val, onInput, onCommit, step = 1, cls = 'inp') {
  const i = h('input', { class: cls, type: 'number', step: String(step), value: fmtN(+val || 0) });
  i.addEventListener('input', () => { const v = parseFloat(i.value); if (!isNaN(v)) onInput(v); });
  i.addEventListener('change', () => onCommit && onCommit());
  i.addEventListener('keydown', ev => { if (ev.key === 'Enter') i.blur(); });
  return i;
}
function scrub(lbl, inp, step) {
  lbl.classList.add('scrub');
  lbl.addEventListener('pointerdown', ev => {
    ev.preventDefault(); const sx = ev.clientX, sv = parseFloat(inp.value) || 0; lbl.setPointerCapture(ev.pointerId);
    const mv = e2 => { const d = Math.round((e2.clientX - sx) / 3) * step; inp.value = fmtN(sv + d); inp.dispatchEvent(new Event('input')); };
    const up = () => { lbl.removeEventListener('pointermove', mv); lbl.removeEventListener('pointerup', up); inp.dispatchEvent(new Event('change')); };
    lbl.addEventListener('pointermove', mv); lbl.addEventListener('pointerup', up);
  });
}
function row(label, ctrl, tip, scrubInput, step) {
  const l = h('label', { 'data-tip': tip || null }, label);
  if (scrubInput) scrub(l, scrubInput, step || 1);
  return h('div', { class: 'row' }, l, ctrl);
}
function sec(box, name, build, extra) {
  const open = E.secOpen[name] !== false;
  const s = h('div', { class: 'sec' + (open ? ' open' : '') });
  const hd = h('h4', { onclick: () => { E.secOpen[name] = !s.classList.contains('open'); s.classList.toggle('open'); } }, h('span', { class: 'tw' }, '▶'), name, extra || null);
  const b = h('div', { class: 'body' }); build(b); s.append(hd, b); box.append(s); return s;
}
function ibtn(icon, tip, key, fn, label) { return h('button', { type: 'button', class: 'tbtn' + (label ? '' : ' icon'), 'data-tip': tip, 'data-key': key || null, 'aria-label': tip, onclick: fn, html: ic(icon) + (label ? '<span>' + label + '</span>' : '') }); }

function refreshInspector() {
  if (!E.P) return;
  const box = $('#insp'); box.innerHTML = ''; E.tf = {};
  const s = selected();
  if (is3D()) { $('#inspHint').textContent = s.length ? (s.length === 1 ? A[s[0].type].name : s.length + ' objects') : (E.tool === 'place' ? 'asset' : 'world'); return inspect3D(box, s); }
  $('#inspHint').textContent = s.length ? (s.length === 1 ? A[s[0].type].name : s.length + ' objects') : (E.tool === 'place' ? 'asset' : 'level');
  if (!s.length) return inspectNone(box);
  if (s.length > 1) return inspectMulti(box, s);
  inspectOne(box, s[0]);
}
function inspectNone(box) {
  const P = E.P, S = P.settings;
  if (E.tool === 'place') {
    const a = A[E.asset];
    box.append(h('div', { class: 'ihead' }, h('div', { class: 'big' }, spriteIcon(a.sprite)), h('div', { class: 'meta' }, h('b', null, a.name), h('div', { class: 'ty' }, h('span', null, a.cat), h('b', null, a.w + '×' + a.h)))));
    box.append(h('div', { class: 'empty-insp' }, h('p', { style: 'margin:0 0 8px' }, a.desc),
      h('ul', null, h('li', null, h('b', null, '→'), a.tile ? 'Click to place one tile, or drag to draw a big block.' : (a.paint ? 'Click to place, or drag to paint a row.' : 'Click in the Scene to place it.')),
        h('li', null, h('b', null, '→'), a.single ? 'Only one allowed — placing again moves it.' : 'Components: ' + (Object.keys(a.comps).map(k => PX.COMPS[k].label).join(', ') || 'none')),
        h('li', null, h('b', null, 'Esc'), 'Back to the Select tool.'))));
    return;
  }
  const coins = P.entities.filter(e => e.comps.collectible && e.comps.collectible.counts).length, enemies = P.entities.filter(e => A[e.type].group === 'enemy').length;
  box.append(h('div', { class: 'empty-insp' }, h('h3', null, 'Level'), h('div', null, 'Nothing selected. Click an object in the Scene or Hierarchy to edit it.'),
    h('div', { class: 'stats3' }, h('div', null, h('b', null, P.entities.length), h('span', null, 'objects')), h('div', null, h('b', null, coins), h('span', null, 'pickups')), h('div', null, h('b', null, enemies), h('span', null, 'enemies')))));
  sec(box, 'Level', b => {
    const w = numIn(S.levelW, v => { S.levelW = clamp(Math.round(v), 8, 400); }, () => { commit('Level size'); updStatus(); }, 1);
    const hh = numIn(S.levelH, v => { S.levelH = clamp(Math.round(v), 6, 200); }, () => { commit('Level size'); updStatus(); }, 1);
    b.append(row('Size (tiles)', h('div', { class: 'row2' }, xyWrap('W', 'cw', w, 1), xyWrap('H', 'ch', hh, 1)), 'Level width and height in 32px tiles'));
    const vh = numIn(S.viewH, v => { S.viewH = clamp(Math.round(v), 6, 60); }, () => commit('Camera height'), 1);
    b.append(row('Camera tiles', vh, 'How many tiles tall the camera sees', vh, 1));
    b.append(row('Background', sel_(Object.entries(PX.SKIES).map(([k, v]) => [k, v.name]), S.sky, v => { S.sky = v; commit('Background'); refreshSettings(); })));
  });
  box.append(h('div', { class: 'empty-insp' }, h('ul', null,
    h('li', null, h('b', null, '1'), 'Pick an asset (Assets panel) and click in the Scene.'),
    h('li', null, h('b', null, '2'), 'Select things to tweak size, look, physics and components.'),
    h('li', null, h('b', null, '3'), 'Add Rules in the bottom panel to make it a game.'),
    h('li', null, h('b', null, '4'), 'Press F5 to play. Share or Publish when ready.'))));
}
function xyWrap(lbl, cls, input, step) { const s = h('span', { class: cls }, lbl); scrub(s, input, step); return h('div', { class: 'xy' }, s, input); }
function tfField(e, key, lbl, cls) {
  const i = numIn(e[key], v => { if (key === 'w' || key === 'h') v = Math.max(4, v); e[key] = v; }, () => commit('Transform'), 1);
  E.tf[key] = i; return xyWrap(lbl, cls, i, E.snap ? 1 : 1);
}
function updTransformFields() { const s = selected(); if (s.length !== 1) return; const e = s[0]; for (const k in E.tf) if (document.activeElement !== E.tf[k]) E.tf[k].value = fmtN(e[k]); }

function spriteOptions() {
  const builtin = Object.keys(PX.MAPS).map(k => [k, PX.SPRITE_NAMES[k] || k]);
  const custom = Object.entries(E.P.sprites || {}).map(([id, s]) => ['c:' + id, s.name || 'Custom ' + id]);
  const o = [{ group: 'Built-in', items: [['', 'Default for this asset'], ...builtin] }];
  if (custom.length) o.push({ group: 'Your sprites', items: custom });
  o.push({ group: 'Other', items: [['none', 'Plain shape (uses Color)']] });
  return o;
}
function inspectOne(box, e) {
  const a = A[e.type];
  const nameIn = h('input', { class: 'inp', value: e.name || '', placeholder: a.name, 'aria-label': 'Object name' });
  nameIn.oninput = () => { e.name = nameIn.value; }; nameIn.onchange = () => { commit('Rename'); refreshHierarchy(); };
  box.append(h('div', { class: 'ihead' }, h('div', { class: 'big' }, entityIcon(e)), h('div', { class: 'meta' }, nameIn, h('div', { class: 'ty' }, h('span', null, a.name), h('b', null, '#' + e.id), h('span', null, a.cat)))));
  box.append(h('div', { class: 'iacts' },
    ibtn('copy', 'Duplicate', 'Ctrl+D', duplicate), ibtn('trash', 'Delete', 'Del', deleteSel), ibtn('target', 'Focus in Scene', 'F', focusSel),
    ibtn(e.locked ? 'lock' : 'unlock', e.locked ? 'Unlock' : 'Lock (not selectable in Scene)', null, () => { e.locked = !e.locked; commit('Lock'); refreshInspector(); refreshHierarchy(); }),
    ibtn('front', 'Bring to front', ']', () => reorder('front')), ibtn('back', 'Send to back', '[', () => reorder('back'))));
  sec(box, 'Transform', b => {
    b.append(row('Position', h('div', { class: 'row2' }, tfField(e, 'x', 'X', 'cx'), tfField(e, 'y', 'Y', 'cy')), 'World position of the top-left corner (px)'));
    b.append(row('Size', h('div', { class: 'row2' }, tfField(e, 'w', 'W', 'cw'), tfField(e, 'h', 'H', 'ch')), 'Width and height (px). Drag the handles in the Scene too.'));
    b.append(row('Layer', sel_([['back', 'Background'], ['main', 'Main'], ['front', 'Foreground']], e.layer || 'main', v => { e.layer = v; commit('Layer'); }), 'Draw order'));
  });
  sec(box, 'Appearance', b => {
    const pv = entityIcon(e);
    const ss = sel_(spriteOptions(), e.sprite || '', v => { e.sprite = v; commit('Sprite'); refreshInspector(); refreshHierarchy(); });
    b.append(row('Sprite', h('div', { class: 'sprow' }, pv, ss), 'Choose a built-in sprite or one you painted'));
    b.append(row('', h('button', { type: 'button', class: 'addbtn', onclick: () => openPainter(e), html: ic('brush').replace('class="i"', 'class="i" style="display:inline;vertical-align:-3px;margin-right:6px"') + 'Paint 16×16 sprite…' })));
    const ci = h('input', { type: 'color', value: /^#[0-9a-f]{6}$/i.test(e.color) ? e.color : '#ff4d00' }), ct = h('input', { class: 'inp', value: e.color || '' });
    ci.oninput = () => { e.color = ci.value; ct.value = ci.value; }; ci.onchange = () => { commit('Color'); refreshHierarchy(); };
    ct.onchange = () => { if (/^#[0-9a-f]{6}$/i.test(ct.value)) { e.color = ct.value; ci.value = ct.value; commit('Color'); } else ct.value = e.color; };
    b.append(row('Color', h('div', { class: 'colr' }, ci, ct), 'Used for particles, plain shapes and tinting'));
    b.append(row('Tint sprite', chk(e.tint, v => { e.tint = v; commit('Tint'); refreshHierarchy(); }), 'Multiply the sprite by Color'));
    b.append(row('Flip X', chk(e.flip, v => { e.flip = v; commit('Flip'); }), 'Mirror horizontally'));
  });
  sec(box, 'Physics', b => {
    const ph = e.phys;
    b.append(row('Body', sel_([['static', 'Static (never moves)'], ['dynamic', 'Dynamic (gravity, velocity)']], ph.body, v => { ph.body = v; commit('Physics'); }), 'Dynamic bodies fall with gravity'));
    b.append(row('Solid', chk(ph.solid, v => { ph.solid = v; commit('Physics'); }), 'Other things collide with it'));
    b.append(row('One-way', chk(ph.oneWay, v => { ph.oneWay = v; if (v) ph.solid = true; commit('Physics'); refreshInspector(); }), 'Jump up through, land on top'));
    const g = numIn(ph.gravity, v => { ph.gravity = v; }, () => commit('Physics'), .1); b.append(row('Gravity scale', g, '0 = floats, 1 = normal, 2 = heavy', g, .1));
    const f = numIn(ph.friction, v => { ph.friction = clamp(v, 0, 1); }, () => commit('Physics'), .05); b.append(row('Friction', f, 'Grip when standing on it (0 = ice, 1 = sticky)', f, .05));
    const bo = numIn(ph.bounce, v => { ph.bounce = clamp(v, 0, 1.2); }, () => commit('Physics'), .05); b.append(row('Bounciness', bo, 'How much it rebounds on impact', bo, .05));
  });
  const pk = Object.keys(e.props || {});
  if (pk.length) sec(box, 'Properties', b => {
    const p = e.props;
    if ('text' in p) { const ta = h('textarea', { class: 'ta', rows: 3 }); ta.value = p.text; ta.oninput = () => { p.text = ta.value; }; ta.onchange = () => commit('Sign text'); b.append(row('Message', ta, 'Shown when the player walks by')); }
    if (e.type === 'key' || e.type === 'door') b.append(row('Key color', sel_(Object.keys(PX.KEY_COLORS).map(k => [k, k[0].toUpperCase() + k.slice(1)]), p.color, v => { p.color = v; commit('Key color'); refreshHierarchy(); refreshInspector(); }), 'Keys open doors of the same color'));
    if ('what' in p) {
      b.append(row('Spawns', sel_(Object.keys(A).filter(k => k !== 'player').map(k => [k, A[k].name]), p.what, v => { p.what = v; commit('Spawner'); }), 'What comes out of the portal'));
      const ev = numIn(p.every, v => { p.every = Math.max(0, v); }, () => commit('Spawner'), .5); b.append(row('Every (s)', ev, '0 = only when a Rule says Spawn', ev, .5));
      const mx = numIn(p.max, v => { p.max = Math.max(1, Math.round(v)); }, () => commit('Spawner'), 1); b.append(row('Max alive', mx, 'Limit for timer spawns', mx, 1));
    }
    if ('kind' in p) {
      b.append(row('Power', sel_([['speed', 'Speed boost'], ['jump', 'Jump boost'], ['shield', 'Shield']], p.kind, v => { p.kind = v; e.sprite = e.sprite && !e.sprite.startsWith('pw_') ? e.sprite : 'pw_' + v; commit('Power-up'); refreshInspector(); refreshHierarchy(); })));
      const d = numIn(p.duration, v => { p.duration = Math.max(1, v); }, () => commit('Power-up'), .5); b.append(row('Duration (s)', d, 'How long it lasts', d, .5));
    }
  });
  const nComp = Object.keys(e.comps).length;
  sec(box, 'Components', b => {
    for (const ck of Object.keys(e.comps)) {
      const C = PX.COMPS[ck]; if (!C) continue; const c = e.comps[ck];
      const card = h('div', { class: 'comp' }, h('header', null, h('span', { class: 'g' }, C.glyph), C.label,
        h('button', { type: 'button', class: 'rm', 'data-tip': 'Remove component', 'aria-label': 'Remove ' + C.label, html: ic('x'), onclick: () => { delete e.comps[ck]; commit('Remove ' + C.label); refreshInspector(); } })));
      const cb = h('div', { class: 'cb' }, h('div', { class: 'cd' }, C.desc));
      for (const [k, type, label, a1, a2, a3] of C.params) {
        if (c[k] == null) c[k] = C.def[k];
        if (type === 'select') cb.append(row(label, sel_(a1.map(v => [v, v[0].toUpperCase() + v.slice(1)]), c[k], v => { c[k] = v; commit(C.label); if (ck === 'player') { updStatus(); } })));
        else if (type === 'bool') cb.append(row(label, chk(c[k], v => { c[k] = v; commit(C.label); })));
        else { const n = numIn(c[k], v => { c[k] = clamp(v, a1, a2); }, () => commit(C.label), a3); cb.append(row(label, n, a1 + ' … ' + a2, n, a3)); }
      }
      if (ck === 'mover') cb.append(h('p', { class: 'cd' }, 'Tip: drag the round B handle in the Scene to set the path.'));
      card.append(cb); b.append(card);
    }
    const free = Object.keys(PX.COMPS).filter(k => !e.comps[k]);
    if (free.length) {
      const s = h('select', { class: 'addbtn', 'aria-label': 'Add component' }, h('option', { value: '' }, '+ Add component…'), ...free.map(k => h('option', { value: k }, PX.COMPS[k].label + ' — ' + PX.COMPS[k].desc)));
      s.onchange = () => { if (!s.value) return; addComponent(e, s.value); };
      b.append(h('div', { class: 'addc' }, s));
    }
    if (e.comps.player && E.P.entities.filter(x => x.comps.player).length > 1) b.append(h('p', { class: 'warnline' }, '⚠ More than one Player Controller — only the first one is used.'));
  }, h('span', { class: 'x', style: 'color:var(--mut);letter-spacing:0;font-weight:400' }, nComp));
}
function addComponent(e, k) {
  e.comps[k] = PX.clone(PX.COMPS[k].def);
  if (k === 'player' || k === 'patrol' || k === 'chase') { if (e.phys.body === 'static' && k !== 'patrol' && k !== 'chase') e.phys.body = 'dynamic'; }
  commit('Add ' + PX.COMPS[k].label); refreshInspector(); log('Added ' + PX.COMPS[k].label + ' to ' + (e.name || A[e.type].name));
}
function inspectMulti(box, s) {
  box.append(h('div', { class: 'ihead' }, h('div', { class: 'big' }, entityIcon(s[0])), h('div', { class: 'meta' }, h('b', null, s.length + ' objects selected'), h('div', { class: 'ty' }, h('span', null, [...new Set(s.map(e => A[e.type].name))].slice(0, 3).join(', '))))));
  box.append(h('div', { class: 'iacts' }, ibtn('copy', 'Duplicate all', 'Ctrl+D', duplicate, 'Duplicate'), ibtn('trash', 'Delete all', 'Del', deleteSel, 'Delete'), ibtn('target', 'Focus', 'F', focusSel)));
  sec(box, 'Align', b => {
    const al = (fn, lbl, tip) => h('button', { type: 'button', 'data-tip': tip, onclick: () => { fn(); commit('Align'); } }, lbl);
    const minX = Math.min(...s.map(e => e.x)), maxX = Math.max(...s.map(e => e.x + e.w)), minY = Math.min(...s.map(e => e.y)), maxY = Math.max(...s.map(e => e.y + e.h));
    b.append(h('div', { class: 'aligns' }, al(() => s.forEach(e => e.x = minX), '⇤', 'Align left'), al(() => s.forEach(e => e.x = (minX + maxX) / 2 - e.w / 2), '↔', 'Align centers horizontally'), al(() => s.forEach(e => e.x = maxX - e.w), '⇥', 'Align right'),
      al(() => s.forEach(e => e.y = minY), '⤒', 'Align top'), al(() => s.forEach(e => e.y = (minY + maxY) / 2 - e.h / 2), '↕', 'Align middles'), al(() => s.forEach(e => e.y = maxY - e.h), '⤓', 'Align bottom')));
  });
  sec(box, 'Appearance', b => {
    const ci = h('input', { type: 'color', value: /^#[0-9a-f]{6}$/i.test(s[0].color) ? s[0].color : '#ff4d00' });
    ci.oninput = () => s.forEach(e => { e.color = ci.value; }); ci.onchange = () => commit('Color');
    b.append(row('Color', h('div', { class: 'colr' }, ci)));
    b.append(row('Tint sprite', chk(s.every(e => e.tint), v => { s.forEach(e => e.tint = v); commit('Tint'); })));
    b.append(row('Layer', sel_([['back', 'Background'], ['main', 'Main'], ['front', 'Foreground']], s[0].layer || 'main', v => { s.forEach(e => e.layer = v); commit('Layer'); })));
  });
  sec(box, 'Physics', b => {
    b.append(row('Solid', chk(s.every(e => e.phys.solid), v => { s.forEach(e => e.phys.solid = v); commit('Physics'); })));
    b.append(row('Body', sel_([['static', 'Static'], ['dynamic', 'Dynamic']], s[0].phys.body, v => { s.forEach(e => e.phys.body = v); commit('Physics'); })));
  });
}

/* ================================================================ settings tab */
function refreshSettings() {
  if (is3D()) return refreshSettings3D();
  const box = $('#tab-settings'), S = E.P.settings; box.innerHTML = '';
  const g = h('div', { class: 'setgrid' });
  const c1 = h('div', { class: 'setcol' }, h('h5', null, 'Game'));
  const ti = h('input', { class: 'inp', id: 'set-title', value: S.title, maxlength: 60 }); ti.oninput = () => { S.title = ti.value; $('#projName').value = ti.value; }; ti.onchange = () => commit('Title');
  c1.append(row('Title', ti));
  const de = h('textarea', { class: 'ta', rows: 2, maxlength: 240, placeholder: 'One line that sells your game' }); de.value = S.desc; de.oninput = () => { S.desc = de.value; }; de.onchange = () => commit('Description');
  c1.append(row('Description', de));
  c1.append(row('Category', sel_(PX.CATEGORIES.map(c => [c, c]), S.category, v => { S.category = v; commit('Category'); })));
  const ws = numIn(S.winScore, v => { S.winScore = Math.max(0, Math.round(v)); }, () => commit('Win score'), 10);
  const wrow = row('Target score', ws, 'Score needed to win', ws, 10); wrow.hidden = S.win !== 'score';
  c1.append(row('Win when', sel_(Object.entries(PX.WINS), S.win, v => { S.win = v; wrow.hidden = v !== 'score'; commit('Win condition'); validateHint(); }), 'Every game also has a time limit'));
  c1.append(wrow);
  const li = numIn(S.lives, v => { S.lives = clamp(Math.round(v), 1, 99); }, () => commit('Lives'), 1); c1.append(row('Lives', li, 'Lives at the start', li, 1));
  const tl = numIn(S.timeLimit, v => { S.timeLimit = clamp(Math.round(v), 10, 3600); }, () => commit('Time limit'), 5); c1.append(row('Time limit (s)', tl, 'Every game has a time limit (10–3600 s)', tl, 5));
  c1.append(h('p', { class: 'warnline', id: 'winWarn' }));
  const c2 = h('div', { class: 'setcol' }, h('h5', null, 'World'));
  const sw = h('div', { class: 'swatches' });
  for (const k in PX.SKIES) { const sk = PX.SKIES[k]; sw.append(h('button', { type: 'button', class: 'swatch' + (S.sky === k ? ' on' : ''), style: `background:linear-gradient(${sk.c[0]},${sk.c[1]},${sk.c[2]})`, 'data-tip': sk.name + (sk.floor ? ' (top-down floor)' : ''), 'aria-label': sk.name, onclick: () => { S.sky = k; commit('Background'); refreshSettings(); } })); }
  c2.append(row('Background', sw));
  const ch = h('div', { class: 'chips' });
  for (const k in PX.LAYERS) ch.append(h('button', { type: 'button', class: 'chip' + (S.parallax.includes(k) ? ' on' : ''), 'aria-pressed': S.parallax.includes(k), onclick: () => { S.parallax = S.parallax.includes(k) ? S.parallax.filter(x => x !== k) : [...S.parallax, k]; commit('Parallax'); refreshSettings(); } }, PX.LAYERS[k]));
  c2.append(row('Parallax', ch, 'Scrolling background layers (side-view games)'));
  const gr = h('input', { type: 'range', min: 0, max: 4000, step: 50, value: S.gravity }), gi = numIn(S.gravity, v => { S.gravity = clamp(v, 0, 6000); gr.value = S.gravity; }, () => commit('Gravity'), 50);
  gr.oninput = () => { S.gravity = +gr.value; gi.value = gr.value; }; gr.onchange = () => commit('Gravity');
  c2.append(row('Gravity', h('div', { class: 'rng' }, gr, gi), 'px/s² — side-view games only'));
  const lw = numIn(S.levelW, v => { S.levelW = clamp(Math.round(v), 8, 400); }, () => { commit('Level size'); updStatus(); }, 1), lh = numIn(S.levelH, v => { S.levelH = clamp(Math.round(v), 6, 200); }, () => { commit('Level size'); updStatus(); }, 1);
  c2.append(row('Level (tiles)', h('div', { class: 'row2' }, xyWrap('W', 'cw', lw, 1), xyWrap('H', 'ch', lh, 1)), '1 tile = 32px'));
  const vh = numIn(S.viewH, v => { S.viewH = clamp(Math.round(v), 6, 60); }, () => commit('Camera'), 1); c2.append(row('Camera tiles', vh, 'Tiles visible vertically', vh, 1));
  const c3 = h('div', { class: 'setcol' }, h('h5', null, 'Music & feel'));
  const mc = h('div', { class: 'chips' });
  for (const k in PX.MOODS) mc.append(h('button', { type: 'button', class: 'chip' + (S.music.mood === k ? ' on' : ''), onclick: () => { S.music.mood = k; commit('Music'); refreshSettings(); } }, PX.MOODS[k]));
  c3.append(row('Mood', mc));
  const tr = h('input', { type: 'range', min: 60, max: 200, step: 2, value: S.music.tempo }), tv = h('span', { class: 'tx', style: 'width:54px;color:var(--fg2)' }, S.music.tempo + ' bpm');
  tr.oninput = () => { S.music.tempo = +tr.value; tv.textContent = tr.value + ' bpm'; }; tr.onchange = () => commit('Tempo');
  c3.append(row('Tempo', h('div', { class: 'rng' }, tr, tv)));
  let prev = false; const pb = h('button', { type: 'button', class: 'btn', onclick: () => { if (prev) { PX.Audio.stopMusic(); pb.textContent = '▶ Preview music'; } else { PX.Audio.music(S.music.mood, S.music.tempo); pb.textContent = '■ Stop preview'; } prev = !prev; } }, '▶ Preview music');
  c3.append(row('', pb));
  c3.append(h('p', { class: 'note' }, 'Players move with ', h('kbd', null, '←→↑↓'), ' / ', h('kbd', null, 'WASD'), ', jump or shoot with ', h('kbd', null, 'Space'), ', shoot with ', h('kbd', null, 'X'), '. The game mode comes from the Player Controller (platformer, top-down or ship).'));
  g.append(c1, c2, c3); box.append(g); validateHint();
}
function validateHint() {
  const w = $('#winWarn'); if (!w) return; const P = E.P, S = P.settings, msgs = [];
  if (!P.entities.some(e => e.comps.player)) msgs.push('No Player yet — add one from Assets → Characters.');
  if (S.win === 'goal' && !P.entities.some(e => e.comps.goal)) msgs.push('Win = reach the goal, but there is no Goal Flag.');
  if (S.win === 'collect' && !P.entities.some(e => e.comps.collectible && e.comps.collectible.counts)) msgs.push('Win = collect everything, but there is nothing to collect.');
  w.textContent = msgs.length ? '⚠ ' + msgs.join(' ') : '';
}

/* ================================================================ rules tab */
const RULE_PRESETS = [
  ['Coin → score + sound', () => ({ ev: { type: 'touch', a: 'player', b: 't:coin' }, acts: [{ type: 'score', n: 10 }, { type: 'destroy', a: 'other' }, { type: 'sound', s: 'coin' }] })],
  ['Win at score 100', () => ({ ev: { type: 'compare', v: 'score', op: '>=', n: 100 }, acts: [{ type: 'win' }] })],
  ['Lose when time runs out', () => ({ ev: { type: 'timeup' }, acts: [{ type: 'lose' }] })],
  ['Spawn enemy every 3 s', () => ({ ev: { type: 'every', n: 3 }, acts: [{ type: 'spawn', s: 'enemy_patrol', b: 'spawner' }] })],
  ['Hazard → lose a life', () => ({ ev: { type: 'touch', a: 'player', b: 'hazard' }, acts: [{ type: 'loselife' }] })],
  ['Enemy defeated → +25', () => ({ ev: { type: 'destroyed', a: 'enemy' }, acts: [{ type: 'score', n: 25 }, { type: 'message', s: 'Gotcha!' }] })],
  ['Press Q → speed boost', () => ({ ev: { type: 'key', k: 'Q' }, acts: [{ type: 'speed', a: 'player', n: 1.2 }, { type: 'sound', s: 'power' }] })],
  ['Welcome message', () => ({ ev: { type: 'start' }, acts: [{ type: 'message', s: 'Good luck!' }] })],
  ['Fall → respawn at checkpoint (3D)', () => ({ ev: { type: 'fall', n: -3 }, acts: [{ type: 'respawn' }, { type: 'message', s: 'Back to the checkpoint!' }] }), '3d']
];
function fieldOpts(kind) {
  switch (kind) {
    case 'sel': return PX.selectorOptions(A);
    case 'v': return Object.entries(PX.VARS);
    case 'op': return Object.entries(PX.OPS);
    case 'k': return Object.keys(PX.KEYS).map(k => [k, k]);
    case 'target': return PX.TARGETS;
    case 'type': return Object.keys(A).filter(k => k !== 'player').map(k => [k, A[k].name]);
    case 'where': return PX.WHERE;
    case 'sound': return PX.SOUNDS.map(s => [s, s]);
    case 'who': return PX.WHO;
    case 'who2': return PX.WHO2;
    case 'dest': return PX.DEST;
  }
  return null;
}
function ruleField(obj, key, kind, def) {
  if (obj[key] == null) obj[key] = def;
  if (kind === 'num') { const i = h('input', { class: 'rinp num', type: 'number', value: obj[key], step: 'any', 'aria-label': key }); i.onchange = () => { obj[key] = +i.value || 0; commit('Rule'); }; return i; }
  if (kind === 'text') { const i = h('input', { class: 'rinp txt', type: 'text', value: obj[key], maxlength: 80, 'aria-label': 'text' }); i.onchange = () => { obj[key] = i.value; commit('Rule'); }; return i; }
  const opts = fieldOpts(kind) || [];
  const s = h('select', { class: 'rsel', 'aria-label': key }); opts.forEach(([v, l]) => s.append(h('option', { value: v }, l)));
  s.value = obj[key]; if (s.value !== String(obj[key])) { obj[key] = opts.length ? opts[0][0] : ''; s.value = obj[key]; }
  s.onchange = () => { obj[key] = s.value; commit('Rule'); }; return s;
}
const EV_KIND = { a: 'sel', b: 'sel', v: 'v', op: 'op', n: 'num', k: 'k' };
function ruleRow(r, i) {
  const P = E.P, evd = PX.EVENTS[r.ev.type] || PX.EVENTS.touch;
  const ev = h('div', { class: 'ev' });
  ev.append(h('select', { class: 'rsel', 'aria-label': 'Event type', onchange: function () { r.ev = Object.assign({ type: this.value }, PX.clone(PX.EVENTS[this.value].def)); commit('Rule event'); refreshRules(); } }, ...Object.entries(PX.EVENTS).filter(([k, v]) => !v.only || v.only === (is3D() ? '3d' : '2d') || k === r.ev.type).map(([k, v]) => h('option', { value: k, selected: k === r.ev.type }, v.label))));
  for (const f of evd.fmt) ev.append(f in evd.def ? ruleField(r.ev, f, EV_KIND[f] || 'text', evd.def[f]) : h('span', { class: 'tx' }, f));
  const main = h('div', { class: 'rmain' }, h('span', { class: 'kw' }, 'WHEN'), ev, h('span', { class: 'kw then' }, 'DO'));
  (r.acts || []).forEach((a, j) => {
    const ad = PX.ACTIONS[a.type] || PX.ACTIONS.score;
    const box = h('div', { class: 'act' });
    box.append(h('select', { class: 'rsel', 'aria-label': 'Action', onchange: function () { const nd = PX.ACTIONS[this.value]; const na = { type: this.value }; nd.f.forEach(([k, , d]) => na[k] = d); r.acts[j] = na; commit('Rule action'); refreshRules(); } }, ...Object.entries(PX.ACTIONS).map(([k, v]) => h('option', { value: k, selected: k === a.type }, v.label))));
    ad.f.forEach(([k, kind, d]) => box.append(ruleField(a, k, kind, d)));
    box.append(h('button', { type: 'button', class: 'ax', 'aria-label': 'Remove action', 'data-tip': 'Remove action', html: ic('x').replace('class="i"', 'class="i" style="width:12px;height:12px"'), onclick: () => { r.acts.splice(j, 1); commit('Remove action'); refreshRules(); } }));
    main.append(box);
    if (j < r.acts.length - 1) main.append(h('span', { class: 'tx' }, '+'));
  });
  main.append(h('button', { type: 'button', class: 'plus', 'data-tip': 'Add another action', onclick: () => { r.acts = r.acts || []; r.acts.push({ type: 'sound', s: 'coin' }); commit('Add action'); refreshRules(); } }, '+ action'));
  const el = h('div', { class: 'rule' + (r.off ? ' off' : ''), 'data-rule': i },
    h('span', { class: 'rn' }, String(i + 1).padStart(2, '0')), main,
    h('div', { class: 'rbtns' },
      h('button', { type: 'button', 'data-tip': r.off ? 'Enable rule' : 'Disable rule', 'aria-label': 'Toggle rule', html: ic('power'), style: r.off ? '' : 'color:var(--ok)', onclick: () => { r.off = !r.off; commit('Toggle rule'); refreshRules(); } }),
      h('button', { type: 'button', 'data-tip': 'Duplicate rule', 'aria-label': 'Duplicate rule', html: ic('copy'), onclick: () => { P.rules.splice(i + 1, 0, PX.clone(r)); commit('Duplicate rule'); refreshRules(); } }),
      h('button', { type: 'button', class: 'del', 'data-tip': 'Delete rule', 'aria-label': 'Delete rule', html: ic('trash'), onclick: () => { P.rules.splice(i, 1); commit('Delete rule'); refreshRules(); } })));
  return el;
}
function refreshRules() {
  const box = $('#tab-rules'), P = E.P; box.innerHTML = '';
  const wrap = h('div', { class: 'rules' });
  const addBtn = h('button', { type: 'button', class: 'btn primary', id: 'addRule', 'data-tip': 'Add a new rule', onclick: () => { P.rules.push({ ev: { type: 'touch', a: 'player', b: 't:coin' }, acts: [{ type: 'sound', s: 'coin' }], off: false }); commit('Add rule'); refreshRules(); log('Added rule ' + P.rules.length); } }, '+ New rule');
  const preBtn = h('button', { type: 'button', class: 'btn', id: 'rulePresets', 'data-tip': 'Start from a ready-made rule', onclick: ev => menu(ev.currentTarget, [{ head: 'Rule presets' }, ...RULE_PRESETS.filter(x => !x[2] || x[2] === (is3D() ? '3d' : '2d')).map(([l, f]) => ({ label: l, fn: () => { const r = f(); r.off = false; P.rules.push(r); commit('Add rule'); refreshRules(); log('Added rule: ' + l); } }))]) }, 'Presets ▾');
  wrap.append(h('div', { class: 'rtool' }, h('span', { class: 'lead' }, 'Rules make it a game — WHEN something happens, DO actions. Components handle the basics automatically.'), preBtn, addBtn));
  if (!P.rules.length) wrap.append(h('div', { class: 'rempty' }, 'No rules yet. Try a preset like “Coin → score + sound” or “Spawn enemy every 3 s”.'));
  P.rules.forEach((r, i) => { if (!r.ev) r.ev = { type: 'start' }; if (!r.acts) r.acts = []; wrap.append(ruleRow(r, i)); });
  box.append(wrap);
  $('#ruleCnt').textContent = P.rules.length || '';
}
function ruleFired(i) {
  const r = E.P.rules[i]; if (!r) return;
  const desc = describeEvent(r.ev);
  log('Rule ' + (i + 1) + ' fired — ' + desc);
  const el = document.querySelector('.rule[data-rule="' + i + '"]'); if (el) { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
}
function describeEvent(ev) {
  const nm = s => { const o = PX.selectorOptions(A).find(x => x[0] === s); return o ? o[1] : s; };
  switch (ev.type) {
    case 'touch': return 'when ' + nm(ev.a) + ' touches ' + nm(ev.b);
    case 'fall': return 'when the player falls below Y ' + ev.n;
    case 'compare': return 'when ' + (PX.VARS[ev.v] || ev.v) + ' ' + (PX.OPS[ev.op] || ev.op) + ' ' + ev.n;
    case 'timeup': return 'when the timer hits 0'; case 'every': return 'every ' + ev.n + 's'; case 'start': return 'at start';
    case 'key': return 'when ' + ev.k + ' is pressed'; case 'destroyed': return 'when ' + nm(ev.a) + ' is destroyed';
  }
  return ev.type;
}

/* ================================================================ console tab */
function renderConsole() {
  const errs = LOG.filter(l => l.lvl === 'err').length, c = $('#conCnt');
  c.textContent = errs ? errs : (LOG.length || ''); c.classList.toggle('err', !!errs);
  if (E.tab !== 'console') return;
  const box = $('#tab-console'); const atBottom = box.scrollTop + box.clientHeight >= box.scrollHeight - 30;
  box.innerHTML = '';
  box.append(h('div', { class: 'contool' }, h('button', { type: 'button', class: 'btn', onclick: () => { LOG.length = 0; renderConsole(); } }, 'Clear'), h('span', { class: 'tx', style: 'color:var(--mut);align-self:center' }, 'Editor actions, play events, rule firings and errors appear here.')));
  const con = h('div', { class: 'con' });
  for (const l of LOG) con.append(h('div', { class: 'cl ' + l.lvl }, h('time', null, l.t.toLocaleTimeString([], { hour12: false })), h('span', { class: 'm' }, l.m), l.n > 1 ? h('span', { class: 'x' }, '×' + l.n) : null));
  box.append(con); if (atBottom) box.scrollTop = box.scrollHeight;
}
function setTab(t) {
  E.tab = t; $$('.tabs [data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
  ['settings', 'rules', 'console'].forEach(k => { $('#tab-' + k).hidden = k !== t; });
  if ($('#app').classList.contains('bcol')) { $('#app').classList.remove('bcol'); saveUI(); }
  if (t === 'console') renderConsole();
}
function wireBottom() {
  $$('.tabs [data-tab]').forEach(b => b.onclick = () => setTab(b.dataset.tab));
  $('#bottomToggle').onclick = () => { $('#app').classList.toggle('bcol'); saveUI(); };
  $('#hierFilter').oninput = () => refreshHierarchy();
}

/* ================================================================ edit operations */
function nextId() { return E.P.nextId++; }
function positionEntity(e, wx, wy) {
  const a = A[e.type];
  if (!E.snap) { e.x = Math.round(wx - e.w / 2); e.y = Math.round(wy - e.h / 2); return; }
  const g = E.grid, cell = a.tile ? g : Math.max(g, T);
  const cx = Math.floor(wx / cell) * cell, cy = Math.floor(wy / cell) * cell;
  if (a.tile) { e.x = cx; e.y = (e.h < cell && a.align === 'bottom') ? cy + cell - e.h : cy; return; }
  e.x = Math.round(cx + (cell - e.w) / 2);
  e.y = Math.round(a.anchor === 'bottom' ? cy + cell - e.h : cy + (cell - e.h) / 2);
}
function placeAt(type, wx, wy) {
  const a = A[type];
  if (a.single) { const ex = E.P.entities.find(e => e.type === type); if (ex) { positionEntity(ex, wx, wy); return ex; } }
  const e = PX.newEntity(type); e.id = nextId(); positionEntity(e, wx, wy);
  E.P.entities.push(e); return e;
}
function deleteSel() {
  if (!E.sel.size) return; const n = E.sel.size;
  E.P.entities = E.P.entities.filter(e => !E.sel.has(e.id)); E.sel.clear(); commit('Delete'); refreshHierarchy(); refreshInspector(); log('Deleted ' + n + ' object' + (n > 1 ? 's' : ''));
}
function duplicate() {
  const s = selected(); if (!s.length) return; const off = E.snap ? E.grid : 16, ids = [];
  for (const e of s) { const c = PX.clone(e); c.id = nextId(); if (is3D()) c.p[0] = +(c.p[0] + (E.snap ? E.grid3 : .5) * Math.max(1, Math.ceil(PX.size3(c)[0] / (E.snap ? E.grid3 : .5)))).toFixed(3); else c.x += off; c.locked = false; if (A[c.type].single) continue; E.P.entities.push(c); ids.push(c.id); }
  if (!ids.length) { toast('There can only be one Player'); return; }
  setSel(ids); commit('Duplicate'); log('Duplicated ' + ids.length + ' object' + (ids.length > 1 ? 's' : ''));
}
function copySel() { const s = selected(); if (!s.length) return; E.clip = PX.clone(s); toast('Copied ' + s.length); }
function paste(at) {
  if (!E.clip || !E.clip.length) { toast('Clipboard is empty'); return; }
  if (is3D()) { const ids = []; for (const e of E.clip) { if (A[e.type].single && E.P.entities.some(x => x.type === e.type)) continue; const c = PX.clone(e); c.id = nextId(); c.p[0] += E.snap ? E.grid3 : .5; c.p[2] += E.snap ? E.grid3 : .5; E.P.entities.push(c); ids.push(c.id); } if (ids.length) { commit('Paste'); setSel(ids); } return; }
  const minX = Math.min(...E.clip.map(e => e.x)), minY = Math.min(...E.clip.map(e => e.y));
  const tx = at ? (E.snap ? Math.floor(at.x / E.grid) * E.grid : at.x) : minX + (E.snap ? E.grid : 16), ty = at ? (E.snap ? Math.floor(at.y / E.grid) * E.grid : at.y) : minY + (E.snap ? E.grid : 16);
  const ids = [];
  for (const e of E.clip) { if (A[e.type].single && E.P.entities.some(x => x.type === e.type)) continue; const c = PX.clone(e); c.id = nextId(); c.x = e.x - minX + tx; c.y = e.y - minY + ty; E.P.entities.push(c); ids.push(c.id); }
  if (ids.length) { setSel(ids); commit('Paste'); }
}
function reorder(where) {
  const s = selected(); if (!s.length) return;
  const rest = E.P.entities.filter(e => !E.sel.has(e.id));
  E.P.entities = where === 'front' ? [...rest, ...s] : [...s, ...rest]; commit(where === 'front' ? 'Bring to front' : 'Send to back');
}
function nudge(dx, dy, dz) { const s = selected(); if (!s.length) return; if (is3D()) { s.forEach(e => { e.p = [+(e.p[0] + dx).toFixed(3), +(e.p[1] + dy).toFixed(3), +(e.p[2] + dz).toFixed(3)]; }); sync3D(); updTransformFields3D(); clearTimeout(E.nudgeT); E.nudgeT = setTimeout(() => commit('Nudge'), 250); return; } s.forEach(e => { e.x += dx; e.y += dy; }); updTransformFields(); clearTimeout(E.nudgeT); E.nudgeT = setTimeout(() => commit('Nudge'), 250); }

/* ================================================================ scene view */
const V = { cv: null, ctx: null, W: 0, H: 0, dpr: 1 };
function sizeView() {
  const c = V.cv, r = c.getBoundingClientRect(); V.dpr = Math.min(2, window.devicePixelRatio || 1); V.W = r.width; V.H = r.height;
  const w = Math.max(1, Math.round(r.width * V.dpr)), hh = Math.max(1, Math.round(r.height * V.dpr)); if (c.width !== w || c.height !== hh) { c.width = w; c.height = hh; }
}
const toWorld = (mx, my) => ({ x: mx / E.cam.z + E.cam.x, y: my / E.cam.z + E.cam.y });
function zoomTo(z, mx, my) {
  if (mx == null) { mx = V.W / 2; my = V.H / 2; }
  const w = toWorld(mx, my); E.cam.z = clamp(z, .15, 5); E.cam.x = w.x - mx / E.cam.z; E.cam.y = w.y - my / E.cam.z; updStatus();
}
const zoomBy = f => { if (is3D()) { if (E.ed3) E.ed3.zoom(f > 1 ? .8 : 1.25); return; } zoomTo(E.cam.z * f); };
function frameLevel() {
  if (is3D()) { if (E.ed3) E.ed3.frame(null); return; }
  sizeView(); const S = E.P.settings, LW = S.levelW * T, LH = S.levelH * T;
  E.cam.z = clamp(Math.min((V.W - 60) / LW, (V.H - 60) / LH), .12, 2);
  E.cam.x = LW / 2 - V.W / 2 / E.cam.z; E.cam.y = LH / 2 - V.H / 2 / E.cam.z; updStatus();
}
function frameStart() {
  if (is3D()) { if (E.ed3) E.ed3.frame(null, true); return; }
  sizeView(); const S = E.P.settings, LW = S.levelW * T, LH = S.levelH * T;
  const z = clamp((V.H - 56) / LH, .3, 1.4); E.cam.z = z;
  const pl = E.P.entities.find(e => e.comps.player);
  if (LW * z <= V.W - 40) E.cam.x = LW / 2 - V.W / 2 / z; else E.cam.x = Math.max(-24 / z, Math.min(LW - V.W / z + 24 / z, (pl ? pl.x : 0) - V.W * .2 / z));
  E.cam.y = LH / 2 - V.H / 2 / z; updStatus();
}
function focusSel() {
  if (is3D()) { if (E.ed3) E.ed3.frame(E.sel.size ? E.sel : null); return; }
  const s = selected(); if (!s.length) { frameLevel(); return; }
  const x0 = Math.min(...s.map(e => e.x)), y0 = Math.min(...s.map(e => e.y)), x1 = Math.max(...s.map(e => e.x + e.w)), y1 = Math.max(...s.map(e => e.y + e.h));
  E.cam.z = clamp(Math.min((V.W - 120) / (x1 - x0 + 1), (V.H - 120) / (y1 - y0 + 1), 2), .2, 2);
  E.cam.x = (x0 + x1) / 2 - V.W / 2 / E.cam.z; E.cam.y = (y0 + y1) / 2 - V.H / 2 / E.cam.z; updStatus();
}
function pick(wx, wy) {
  const list = R.sorted(E.P.entities);
  for (let i = list.length - 1; i >= 0; i--) { const e = list[i]; if (e.hidden || e.locked) continue; if (wx >= e.x && wx <= e.x + e.w && wy >= e.y && wy <= e.y + e.h) return e; }
  return null;
}
const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
function handlePos(e, hd) { const x = hd.includes('w') ? e.x : hd.includes('e') ? e.x + e.w : e.x + e.w / 2, y = hd.includes('n') ? e.y : hd.includes('s') ? e.y + e.h : e.y + e.h / 2; return { x, y }; }
function hitHandle(wx, wy) {
  const s = selected(); if (s.length !== 1) return null; const e = s[0], r = 7 / E.cam.z;
  if (e.comps.mover) { const m = e.comps.mover, bx = e.x + e.w / 2 + m.dx, by = e.y + e.h / 2 + m.dy; if (Math.hypot(wx - bx, wy - by) < r * 1.4) return 'moverB'; }
  for (const hd of HANDLES) { const p = handlePos(e, hd); if (Math.abs(wx - p.x) < r && Math.abs(wy - p.y) < r) return hd; }
  return null;
}
const snapV = v => E.snap ? Math.round(v / E.grid) * E.grid : Math.round(v);

function drawScene() {
  sizeView();
  const ctx = V.ctx, z = E.cam.z, P = E.P, S = P.settings, LW = S.levelW * T, LH = S.levelH * T, t = E.anim ? E.t : 0;
  ctx.setTransform(V.dpr, 0, 0, V.dpr, 0, 0); ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, V.W, V.H);
  // outer dot grid
  ctx.fillStyle = '#151515'; const dg = 32 * z; if (dg > 6) { const ox = (-E.cam.x * z) % dg, oy = (-E.cam.y * z) % dg; for (let x = ox; x < V.W; x += dg) for (let y = oy; y < V.H; y += dg) ctx.fillRect(x, y, 1, 1); }
  ctx.save(); ctx.scale(z, z); ctx.translate(-E.cam.x, -E.cam.y);
  const td = R.isTopdown(P);
  if (td && R.skyOf(S).floor) R.drawFloor(ctx, S, LW, LH);
  else { const sk = R.skyOf(S), g = ctx.createLinearGradient(0, 0, 0, LH); g.addColorStop(0, sk.c[0]); g.addColorStop(.55, sk.c[1]); g.addColorStop(1, sk.c[2]); ctx.fillStyle = g; ctx.fillRect(0, 0, LW, LH); }
  // grid
  const vx0 = E.cam.x, vy0 = E.cam.y, vx1 = vx0 + V.W / z, vy1 = vy0 + V.H / z, gs = E.grid;
  if (gs * z >= 6) {
    ctx.lineWidth = 1 / z; ctx.beginPath(); ctx.strokeStyle = 'rgba(255,255,255,.07)';
    const gx0 = Math.max(0, Math.floor(vx0 / gs) * gs), gx1 = Math.min(LW, vx1), gy0 = Math.max(0, Math.floor(vy0 / gs) * gs), gy1 = Math.min(LH, vy1);
    for (let x = gx0; x <= gx1; x += gs) { ctx.moveTo(x, Math.max(0, vy0)); ctx.lineTo(x, Math.min(LH, vy1)); }
    for (let y = gy0; y <= gy1; y += gs) { ctx.moveTo(Math.max(0, vx0), y); ctx.lineTo(Math.min(LW, vx1), y); }
    ctx.stroke();
    const mg = gs * 4; if (mg * z > 20) { ctx.beginPath(); ctx.strokeStyle = 'rgba(255,255,255,.12)'; for (let x = Math.max(0, Math.floor(vx0 / mg) * mg); x <= gx1; x += mg) { ctx.moveTo(x, Math.max(0, vy0)); ctx.lineTo(x, Math.min(LH, vy1)); } for (let y = Math.max(0, Math.floor(vy0 / mg) * mg); y <= gy1; y += mg) { ctx.moveTo(Math.max(0, vx0), y); ctx.lineTo(Math.min(LW, vx1), y); } ctx.stroke(); }
  }
  // entities
  const ents = R.sorted(P.entities);
  for (const e of ents) {
    if (e.hidden || e.x > vx1 || e.x + e.w < vx0 || e.y > vy1 || e.y + e.h < vy0) continue;
    R.drawEntity(ctx, e, P, t, null);
    if (e.type === 'spawner' && z > .5) { ctx.font = '600 8px "JetBrains Mono",monospace'; ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.textAlign = 'center'; ctx.fillText('→ ' + (A[e.props.what] || {}).name, e.x + e.w / 2, e.y + e.h + 9); }
    if (e.type === 'sign' && z > .6) { ctx.font = '600 7px "JetBrains Mono",monospace'; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.textAlign = 'center'; const tx = (e.props.text || '').slice(0, 22) + ((e.props.text || '').length > 22 ? '…' : ''); ctx.fillText('“' + tx + '”', e.x + e.w / 2, e.y - 4); }
  }
  // gizmos
  ctx.lineWidth = 1.5 / z;
  for (const e of ents) {
    if (e.hidden) continue; const sel = E.sel.has(e.id), hov = E.hover === e, c = e.comps, cx = e.x + e.w / 2, cy = e.y + e.h / 2;
    const al = sel ? 1 : hov ? .7 : .28;
    if (c.patrol) {
      const d = +c.patrol.distance || 0; ctx.strokeStyle = `rgba(110,224,110,${al})`; ctx.setLineDash([4 / z, 3 / z]); ctx.beginPath();
      if (c.patrol.axis === 'y') { ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + d); } else { ctx.moveTo(cx, cy); ctx.lineTo(cx + d, cy); }
      ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = `rgba(110,224,110,${al})`; const ex = c.patrol.axis === 'y' ? cx : cx + d, ey = c.patrol.axis === 'y' ? cy + d : cy; ctx.beginPath(); ctx.arc(ex, ey, 3 / z, 0, 7); ctx.fill();
    }
    if (c.mover) {
      const m = c.mover, bx = e.x + m.dx, by = e.y + m.dy; ctx.strokeStyle = `rgba(74,180,255,${al})`; ctx.setLineDash([5 / z, 4 / z]);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(bx + e.w / 2, by + e.h / 2); ctx.stroke(); ctx.strokeRect(bx, by, e.w, e.h); ctx.setLineDash([]);
      if (sel) { ctx.fillStyle = '#4ab4ff'; ctx.beginPath(); ctx.arc(bx + e.w / 2, by + e.h / 2, 6 / z, 0, 7); ctx.fill(); ctx.fillStyle = '#000'; ctx.font = `700 ${8 / z}px "JetBrains Mono",monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('B', bx + e.w / 2, by + e.h / 2 + .5 / z); ctx.textBaseline = 'alphabetic'; }
    }
    if (sel && (c.chase || c.shooter)) { const rr = c.chase ? +c.chase.range : +c.shooter.range; ctx.strokeStyle = 'rgba(255,77,0,.35)'; ctx.setLineDash([3 / z, 4 / z]); ctx.beginPath(); ctx.arc(cx, cy, rr, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
  }
  // level bounds
  ctx.lineWidth = 1 / z; ctx.strokeStyle = '#ff4d00'; ctx.strokeRect(0, 0, LW, LH);
  // camera frame (16:9 at player start)
  const pl = P.entities.find(e => e.comps.player);
  if (pl) {
    const vh = Math.min(S.viewH * T, Math.max(LH, S.viewH * T)), vw = vh * 16 / 9;
    let cx = clamp(pl.x + pl.w / 2 - vw / 2, 0, Math.max(0, LW - vw)), cy = clamp(pl.y + pl.h / 2 - vh * .56, 0, Math.max(0, LH - vh));
    if (LW < vw) cx = (LW - vw) / 2; if (LH < vh) cy = (LH - vh) / 2;
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.setLineDash([8 / z, 6 / z]); ctx.strokeRect(cx, cy, vw, vh); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.font = `600 ${9 / z}px "JetBrains Mono",monospace`; ctx.textAlign = 'left'; ctx.fillText('CAMERA · ' + S.viewH + ' tiles tall', cx + 6 / z, cy + vh - 6 / z);
  }
  // hover + selection
  if (E.hover && !E.sel.has(E.hover.id) && E.tool !== 'place' && !E.drag) { ctx.strokeStyle = E.tool === 'erase' ? '#ff5050' : 'rgba(255,255,255,.6)'; ctx.lineWidth = 1 / z; ctx.strokeRect(E.hover.x, E.hover.y, E.hover.w, E.hover.h); }
  const s = selected();
  for (const e of s) { ctx.strokeStyle = '#ff4d00'; ctx.lineWidth = 2 / z; ctx.strokeRect(e.x - 1 / z, e.y - 1 / z, e.w + 2 / z, e.h + 2 / z); }
  if (s.length === 1) {
    const e = s[0], r = 3.5 / z;
    for (const hd of HANDLES) { const p = handlePos(e, hd); ctx.fillStyle = '#fff'; ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2); ctx.strokeStyle = '#ff4d00'; ctx.lineWidth = 1 / z; ctx.strokeRect(p.x - r, p.y - r, r * 2, r * 2); }
    ctx.fillStyle = '#ff4d00'; ctx.font = `700 ${9 / z}px "JetBrains Mono",monospace`; ctx.textAlign = 'left';
    const lbl = (e.name || A[e.type].name) + '  ' + Math.round(e.w) + '×' + Math.round(e.h); const tw = ctx.measureText(lbl).width;
    ctx.fillRect(e.x - 1 / z, e.y - 14 / z, tw + 8 / z, 12 / z); ctx.fillStyle = '#000'; ctx.fillText(lbl, e.x + 3 / z, e.y - 5 / z);
  }
  // drag previews
  const d = E.drag;
  if (d && d.kind === 'box') { const x = Math.min(d.x0, d.x1), y = Math.min(d.y0, d.y1); ctx.fillStyle = 'rgba(255,77,0,.08)'; ctx.fillRect(x, y, Math.abs(d.x1 - d.x0), Math.abs(d.y1 - d.y0)); ctx.strokeStyle = '#ff4d00'; ctx.lineWidth = 1 / z; ctx.setLineDash([4 / z, 3 / z]); ctx.strokeRect(x, y, Math.abs(d.x1 - d.x0), Math.abs(d.y1 - d.y0)); ctx.setLineDash([]); }
  if (d && d.kind === 'rect' && d.ghost) { ctx.globalAlpha = .7; R.drawEntity(ctx, d.ghost, P, t, null); ctx.globalAlpha = 1; ctx.strokeStyle = '#ff4d00'; ctx.lineWidth = 1 / z; ctx.strokeRect(d.ghost.x, d.ghost.y, d.ghost.w, d.ghost.h); }
  if (E.tool === 'place' && E.mouse.in && !d && !E.space) {
    const g = PX.newEntity(E.asset); positionEntity(g, E.mouse.wx, E.mouse.wy);
    ctx.globalAlpha = .55; R.drawEntity(ctx, g, P, t, null); ctx.globalAlpha = 1; ctx.strokeStyle = 'rgba(255,77,0,.9)'; ctx.lineWidth = 1 / z; ctx.strokeRect(g.x, g.y, g.w, g.h);
  }
  ctx.restore();
  // screen-space labels
  const lx = -E.cam.x * z, ly = -E.cam.y * z;
  ctx.font = '700 10px "JetBrains Mono",monospace'; ctx.textAlign = 'left';
  const lt = 'LEVEL ' + S.levelW + '×' + S.levelH + ' · ' + LW + '×' + LH + 'PX'; const lw2 = ctx.measureText(lt).width + 12;
  ctx.fillStyle = '#ff4d00'; ctx.fillRect(Math.max(4, lx), Math.max(4, ly - 18), lw2, 16); ctx.fillStyle = '#000'; ctx.fillText(lt, Math.max(4, lx) + 6, Math.max(4, ly - 18) + 11.5);
  if (E.tool === 'place') { const tip = 'PLACING ' + A[E.asset].name.toUpperCase() + ' · ' + (A[E.asset].tile ? 'click or drag a box' : A[E.asset].paint ? 'click or drag to paint' : 'click to place') + ' · Esc to stop'; ctx.font = '600 10px "JetBrains Mono",monospace'; const w = ctx.measureText(tip).width + 18; ctx.fillStyle = 'rgba(0,0,0,.75)'; ctx.fillRect(10, V.H - 34, w, 24); ctx.fillStyle = '#ff4d00'; ctx.fillRect(10, V.H - 34, 3, 24); ctx.fillStyle = '#f2f2f2'; ctx.fillText(tip, 20, V.H - 18); }
}

/* ---------------------------------------------------------------- minimap */
function drawMini() {
  const P = E.P, S = P.settings, LW = S.levelW * T, LH = S.levelH * T, c = $('#miniCv');
  let w = 180, hh = Math.round(w * LH / LW); if (hh > 110) { hh = 110; w = Math.round(hh * LW / LH); } if (hh < 28) hh = 28;
  if (c.width !== w * 2 || c.height !== hh * 2) { c.width = w * 2; c.height = hh * 2; c.style.width = w + 'px'; c.style.height = hh + 'px'; }
  const x = c.getContext('2d'), k = c.width / LW, ky = c.height / LH; const sk = R.skyOf(S);
  x.fillStyle = sk.c[1]; x.fillRect(0, 0, c.width, c.height); x.globalAlpha = .5; x.fillStyle = '#000'; x.fillRect(0, 0, c.width, c.height); x.globalAlpha = 1;
  for (const e of P.entities) {
    const g = A[e.type].group; if (g === 'decor') continue;
    x.fillStyle = e.comps.player ? '#ff4d00' : g === 'enemy' ? '#ff5050' : g === 'block' || g === 'platform' || g === 'door' ? '#d8d8e4' : g === 'hazard' ? '#ff8a2a' : g === 'goal' ? '#3ddc84' : e.color || '#fff';
    const s = e.comps.player ? 5 : 0; x.fillRect(e.x * k - s / 2, e.y * ky - s / 2, Math.max(2, e.w * k) + s, Math.max(2, e.h * ky) + s);
  }
  x.strokeStyle = '#fff'; x.lineWidth = 2; x.strokeRect(E.cam.x * k, E.cam.y * ky, V.W / E.cam.z * k, V.H / E.cam.z * ky);
}

/* ---------------------------------------------------------------- pointer input */
function wireScene() {
  V.cv = $('#view'); V.ctx = V.cv.getContext('2d');
  const cv = V.cv;
  const pos = ev => { const r = cv.getBoundingClientRect(); const mx = ev.clientX - r.left, my = ev.clientY - r.top, w = toWorld(mx, my); E.mouse = { x: mx, y: my, wx: w.x, wy: w.y, in: true }; return w; };
  cv.addEventListener('pointerdown', ev => {
    if (E.playing) return; cv.focus({ preventScroll: true }); closeMenus();
    const w = pos(ev);
    if (ev.button === 1 || (ev.button === 0 && (E.space || E.tool === 'pan'))) { ev.preventDefault(); E.drag = { kind: 'pan', sx: ev.clientX, sy: ev.clientY, cx: E.cam.x, cy: E.cam.y }; cv.classList.add('panning'); cv.setPointerCapture(ev.pointerId); return; }
    if (ev.button !== 0) return;
    cv.setPointerCapture(ev.pointerId);
    if (E.tool === 'select') {
      const hd = hitHandle(w.x, w.y);
      if (hd) { const e = selected()[0]; E.drag = { kind: hd === 'moverB' ? 'moverB' : 'resize', hd, e, o: { x: e.x, y: e.y, w: e.w, h: e.h } }; return; }
      const hit = pick(w.x, w.y);
      if (hit) {
        if (ev.shiftKey || ev.ctrlKey || ev.metaKey) { const s = new Set(E.sel); s.has(hit.id) ? s.delete(hit.id) : s.add(hit.id); setSel(s); }
        else if (!E.sel.has(hit.id)) { E.scrollHier = true; setSel([hit.id]); }
        if (ev.altKey) { duplicate(); }
        const o = {}; selected().forEach(e => o[e.id] = { x: e.x, y: e.y });
        E.drag = { kind: 'move', sx: w.x, sy: w.y, o, moved: false };
      } else {
        const base = (ev.shiftKey || ev.ctrlKey || ev.metaKey) ? new Set(E.sel) : new Set();
        if (!base.size && E.sel.size) setSel([]);
        E.drag = { kind: 'box', x0: w.x, y0: w.y, x1: w.x, y1: w.y, base };
      }
    } else if (E.tool === 'place') {
      const a = A[E.asset];
      if (a.tile) { const g = E.snap ? E.grid : 1; E.drag = { kind: 'rect', sx: Math.floor(w.x / g) * g, sy: Math.floor(w.y / g) * g }; updRect(w); }
      else { const e = placeAt(E.asset, w.x, w.y); E.drag = { kind: 'paint', placed: [e.id], keys: new Set([e.x + ',' + e.y]) }; refreshHierarchy(); }
    } else if (E.tool === 'erase') {
      E.drag = { kind: 'erase', n: 0 }; eraseAt(w);
    }
  });
  cv.addEventListener('pointermove', ev => {
    const w = pos(ev), d = E.drag;
    if (!d) { E.hover = E.tool === 'place' ? null : pick(w.x, w.y); const hh = E.tool === 'select' ? hitHandle(w.x, w.y) : null; cv.style.cursor = hh ? (hh === 'moverB' ? 'grab' : ({ n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize', nw: 'nwse-resize', se: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize' })[hh]) : (E.tool === 'select' && E.hover ? 'move' : ''); updPos(); return; }
    if (d.kind === 'pan') { E.cam.x = d.cx - (ev.clientX - d.sx) / E.cam.z; E.cam.y = d.cy - (ev.clientY - d.sy) / E.cam.z; return; }
    if (d.kind === 'move') {
      let dx = w.x - d.sx, dy = w.y - d.sy; if (E.snap) { dx = Math.round(dx / E.grid) * E.grid; dy = Math.round(dy / E.grid) * E.grid; }
      if (dx || dy) d.moved = true;
      for (const e of selected()) { const o = d.o[e.id]; if (o) { e.x = Math.round(o.x + dx); e.y = Math.round(o.y + dy); } }
      updTransformFields(); return;
    }
    if (d.kind === 'resize') {
      const e = d.e, o = d.o, mn = E.snap ? Math.min(E.grid, 8) : 4; let x0 = o.x, y0 = o.y, x1 = o.x + o.w, y1 = o.y + o.h;
      if (d.hd.includes('w')) x0 = Math.min(snapV(w.x), x1 - mn); if (d.hd.includes('e')) x1 = Math.max(snapV(w.x), x0 + mn);
      if (d.hd.includes('n')) y0 = Math.min(snapV(w.y), y1 - mn); if (d.hd.includes('s')) y1 = Math.max(snapV(w.y), y0 + mn);
      e.x = x0; e.y = y0; e.w = x1 - x0; e.h = y1 - y0; d.moved = true; updTransformFields(); return;
    }
    if (d.kind === 'moverB') { const e = d.e; e.comps.mover.dx = snapV(w.x - e.w / 2) - e.x; e.comps.mover.dy = snapV(w.y - e.h / 2) - e.y; if (E.snap) { e.comps.mover.dx = Math.round(e.comps.mover.dx / E.grid) * E.grid; e.comps.mover.dy = Math.round(e.comps.mover.dy / E.grid) * E.grid; } d.moved = true; return; }
    if (d.kind === 'box') {
      d.x1 = w.x; d.y1 = w.y; const x0 = Math.min(d.x0, d.x1), x1 = Math.max(d.x0, d.x1), y0 = Math.min(d.y0, d.y1), y1 = Math.max(d.y0, d.y1);
      const ids = new Set(d.base); for (const e of E.P.entities) if (!e.hidden && !e.locked && e.x < x1 && e.x + e.w > x0 && e.y < y1 && e.y + e.h > y0) ids.add(e.id);
      E.sel = ids; return;
    }
    if (d.kind === 'rect') { updRect(w); return; }
    if (d.kind === 'paint') {
      const a = A[E.asset]; if (!a.paint && !a.single) return;
      if (a.single) { placeAt(E.asset, w.x, w.y); return; }
      const g = PX.newEntity(E.asset); positionEntity(g, w.x, w.y); const k = g.x + ',' + g.y;
      if (!d.keys.has(k) && !E.P.entities.some(e => e.type === E.asset && e.x === g.x && e.y === g.y)) { const e = placeAt(E.asset, w.x, w.y); d.keys.add(k); d.placed.push(e.id); }
      return;
    }
    if (d.kind === 'erase') eraseAt(w);
  });
  const end = ev => {
    const d = E.drag; if (!d) return; E.drag = null; cv.classList.remove('panning');
    if (d.kind === 'move' && d.moved) commit('Move');
    else if (d.kind === 'resize' && d.moved) { commit('Resize'); refreshInspector(); }
    else if (d.kind === 'moverB' && d.moved) { commit('Mover path'); refreshInspector(); }
    else if (d.kind === 'box') { refreshHierarchy(); refreshInspector(); updStatus(); }
    else if (d.kind === 'rect' && d.ghost) { const e = d.ghost; e.id = nextId(); E.P.entities.push(e); commit('Place ' + A[e.type].name); refreshHierarchy(); log('Placed ' + A[e.type].name + ' (' + e.w + '×' + e.h + ')'); }
    else if (d.kind === 'paint') { commit('Place ' + A[E.asset].name); refreshHierarchy(); validateHint(); if (d.placed.length) log('Placed ' + d.placed.length + '× ' + A[E.asset].name); }
    else if (d.kind === 'erase' && d.n) { commit('Erase'); refreshHierarchy(); refreshInspector(); }
    updStatus();
  };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  cv.addEventListener('pointerleave', () => { E.mouse.in = false; E.hover = null; });
  cv.addEventListener('wheel', ev => {
    if (E.playing) return; ev.preventDefault(); const r = cv.getBoundingClientRect();
    if (ev.shiftKey && !ev.ctrlKey) { E.cam.x += ev.deltaY / E.cam.z; return; }
    zoomTo(E.cam.z * Math.exp(-ev.deltaY * (ev.ctrlKey ? .01 : .0015)), ev.clientX - r.left, ev.clientY - r.top);
  }, { passive: false });
  cv.addEventListener('contextmenu', ev => {
    ev.preventDefault(); if (E.playing) return; const w = pos(ev), hit = pick(w.x, w.y);
    if (hit && !E.sel.has(hit.id)) setSel([hit.id]);
    const items = hit ? [{ head: hit.name || A[hit.type].name }, { label: 'Duplicate', key: 'Ctrl+D', fn: duplicate }, { label: 'Copy', key: 'Ctrl+C', fn: copySel }, { label: 'Bring to front', key: ']', fn: () => reorder('front') }, { label: 'Send to back', key: '[', fn: () => reorder('back') }, { label: 'Focus', key: 'F', fn: focusSel }, { sep: 1 }, { label: 'Delete', key: 'Del', fn: deleteSel, danger: 1 }]
      : [{ head: 'Scene' }, { label: 'Paste here', key: 'Ctrl+V', fn: () => paste(w) }, { label: 'Select all', key: 'Ctrl+A', fn: () => setSel(E.P.entities.filter(e => !e.locked && !e.hidden).map(e => e.id)) }, { label: 'Frame level', key: 'F', fn: frameLevel }];
    menu({ x: ev.clientX, y: ev.clientY }, items);
  });
  // drag & drop from assets
  cv.addEventListener('dragover', ev => { if ([...ev.dataTransfer.types].includes('text/pxb-asset')) { ev.preventDefault(); ev.dataTransfer.dropEffect = 'copy'; pos(ev); } });
  cv.addEventListener('drop', ev => {
    const k = ev.dataTransfer.getData('text/pxb-asset'); if (!k || !A[k]) return; ev.preventDefault();
    const w = pos(ev), e = placeAt(k, w.x, w.y); E.asset = k; setSel([e.id]); commit('Place ' + A[k].name); log('Placed ' + A[k].name); validateHint();
  });
  // minimap
  const mc = $('#miniCv'); let md = false;
  const mmove = ev => { const r = mc.getBoundingClientRect(), S = E.P.settings; const wx = (ev.clientX - r.left) / r.width * S.levelW * T, wy = (ev.clientY - r.top) / r.height * S.levelH * T; E.cam.x = wx - V.W / 2 / E.cam.z; E.cam.y = wy - V.H / 2 / E.cam.z; };
  mc.addEventListener('pointerdown', ev => { md = true; mc.setPointerCapture(ev.pointerId); mmove(ev); });
  mc.addEventListener('pointermove', ev => { if (md) mmove(ev); });
  mc.addEventListener('pointerup', () => { md = false; });
  new ResizeObserver(() => { if (!E.playing && E.P && !is3D()) drawScene(); }).observe($('#sbody'));
}
function updRect(w) {
  const d = E.drag, a = A[E.asset], g = E.snap ? E.grid : 1;
  const cx = Math.floor(w.x / g) * g, cy = Math.floor(w.y / g) * g;
  const x0 = Math.min(d.sx, cx), x1 = Math.max(d.sx, cx) + g, y0 = Math.min(d.sy, cy), y1 = Math.max(d.sy, cy) + g;
  const e = PX.newEntity(E.asset);
  e.x = x0; e.w = Math.max(g, x1 - x0);
  if (a.h < T) { e.h = a.h; e.y = a.align === 'bottom' ? d.sy + g - a.h : d.sy; if (!E.snap) e.y = d.sy; }
  else { e.y = y0; e.h = Math.max(g, y1 - y0); }
  if (x1 - x0 <= g && y1 - y0 <= g) { e.w = Math.max(e.w, Math.min(a.w, Math.max(g, T))); if (a.h >= T) e.h = E.asset === 'door' ? 64 : Math.max(e.h, Math.min(a.h, Math.max(g, T))); }
  d.ghost = e;
}
function eraseAt(w) { const hit = pick(w.x, w.y); if (!hit) return; E.P.entities = E.P.entities.filter(e => e !== hit); E.sel.delete(hit.id); E.drag.n++; E.hover = null; }
function updPos() { const w = E.mouse; $('#stPos').innerHTML = 'X <b>' + Math.round(w.wx) + '</b> Y <b>' + Math.round(w.wy) + '</b> · tile <b>' + Math.floor(w.wx / T) + ',' + Math.floor(w.wy / T) + '</b>'; }

/* ---------------------------------------------------------------- render loop */
let frameN = 0;
function loop() {
  requestAnimationFrame(loop);
  if (E.playing || !E.P || is3D()) return;
  E.t = performance.now() / 1000; frameN++;
  if (E.cam.z !== E.lastZ) { E.lastZ = E.cam.z; updStatus(); }
  drawScene();
  if (E.miniDirty || frameN % 12 === 0) { drawMini(); E.miniDirty = false; }
}

/* ================================================================ play mode */
function togglePlay() { E.playing ? stopPlay() : startPlay(); }
function startPlay() {
  const P = E.P, pl = P.entities.find(e => e.comps.player);
  if (!pl) { log('Cannot play: add a Player (Assets → Characters → Player).', 'err'); toast('Add a Player first', 'err'); E.cat = 'Characters'; buildAssets(); return; }
  const S = P.settings;
  if (S.win === 'goal' && !P.entities.some(e => e.comps.goal)) log('Heads up: win condition is "reach the goal" but there is no Goal Flag.', 'warn');
  if (S.win === 'collect' && !P.entities.some(e => e.comps.collectible && e.comps.collectible.counts)) log('Heads up: nothing to collect for "collect everything".', 'warn');
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  closeMenus(); PX.Audio.init();
  E.playing = true; E.drag = null; $('#app').classList.add('playing'); $('#app').classList.remove('showl', 'showr');
  $('#playBtn').classList.add('on'); $('#playBtn').querySelector('.pl').textContent = 'Stop'; $('#playBtn').dataset.tip = 'Stop and return to editing';
  $('#gameCv').hidden = false; $('#view').style.visibility = 'hidden'; $('#playBar').hidden = false; $('#minimap').hidden = true;
  E.lastResult = null;
  $('#playBar .ph-keys').textContent = is3D() ? 'WASD move · click + mouse look · Space jump · Shift sprint · C camera · G gfx · Esc stop' : 'Arrows / WASD move · Space jump/shoot · X shoot · R restart · P pause · Esc stop';
  if (is3D()) {
    $('#gameCv').hidden = true; $('#view').style.visibility = '';
    load3D().then(E3 => {
      if (!E.playing) return; if (E.ed3) E.ed3.setVisible(false);
      const host = h('div', { class: 'g3host', id: 'g3host' }); $('#sbody').append(host);
      E.game = new E3.Game3D(host, P, { host: $('#playHost'), hint: false, log, onRule: ruleFired, onEnd: r => { E.lastResult = r; }, endButtons: [{ label: 'Back to editor', fn: stopPlay }] });
    }).catch(() => stopPlay());
    return;
  }
  E.game = new PX.Game($('#gameCv'), P, { host: $('#playHost'), log, onRule: ruleFired, onEnd: r => { E.lastResult = r; }, endButtons: [{ label: 'Back to editor', fn: stopPlay }] });
}
function stopPlay() {
  if (!E.playing) return; if (E.game) E.game.destroy(); E.game = null; E.playing = false;
  const g3 = $('#g3host'); if (g3) g3.remove(); if (is3D() && E.ed3) { E.ed3.setVisible(true); E.ed3.syncAll(); }
  $('#app').classList.remove('playing'); $('#playBtn').classList.remove('on'); $('#playBtn').querySelector('.pl').textContent = 'Play'; $('#playBtn').dataset.tip = 'Play your game in the scene';
  $('#gameCv').hidden = true; $('#view').style.visibility = ''; $('#playBar').hidden = true; $('#minimap').hidden = false; $('#playHost').innerHTML = '';
  log('■ Stopped'); if (is3D()) { if (E.ed3) E.ed3.renderer.domElement.focus({ preventScroll: true }); } else V.cv.focus({ preventScroll: true });
}

/* ================================================================ keyboard */
function wireKeys() {
  addEventListener('keydown', ev => {
    const k = ev.key, ctrl = ev.ctrlKey || ev.metaKey, inField = /INPUT|TEXTAREA|SELECT/.test((ev.target || {}).tagName || '');
    if (E.playing) { if (k === 'Escape' || k === 'F5') { ev.preventDefault(); stopPlay(); } return; }
    if (k === 'F5' || (ctrl && k === 'Enter')) { ev.preventDefault(); startPlay(); return; }
    if (ctrl && (k === 's' || k === 'S')) { ev.preventDefault(); saveProject(); toast('Saved', 'ok'); return; }
    if ($('.modal-bg')) { if (k === 'Escape') { const m = [...document.querySelectorAll('.modal-bg')].pop(); m && m._close && m._close(); } return; }
    if (E.tour) { if (k === 'Escape') endTour(); if (k === 'ArrowRight' || k === 'Enter') tourStep(1); if (k === 'ArrowLeft') tourStep(-1); return; }
    if (inField) { if (k === 'Escape') ev.target.blur(); return; }
    if (ctrl) {
      const kk = k.toLowerCase();
      if (kk === 'z' && !ev.shiftKey) { ev.preventDefault(); undo(); } else if (kk === 'y' || (kk === 'z' && ev.shiftKey)) { ev.preventDefault(); redo(); }
      else if (kk === 'd') { ev.preventDefault(); duplicate(); } else if (kk === 'c') { copySel(); } else if (kk === 'v') { ev.preventDefault(); paste(E.mouse.in ? { x: E.mouse.wx, y: E.mouse.wy } : null); }
      else if (kk === 'a') { ev.preventDefault(); setSel(E.P.entities.filter(e => !e.locked && !e.hidden).map(e => e.id)); }
      return;
    }
    if (k === ' ') { if (!E.space) { E.space = true; V.cv.classList.add('pan'); if (E.ed3) E.ed3.setNavMode('pan'); } ev.preventDefault(); return; }
    if (k === 'Alt' && E.ed3) { E.ed3.setNavMode('orbit'); ev.preventDefault(); return; }
    if (is3D()) {
      switch (k.toLowerCase()) {
        case 'q': case 'w': case 'v': setTool('move'); return; case 'e': setTool('rotate'); return; case 'r': setTool('scale'); return;
        case 'b': setTool('place'); return; case 'x': setTool('erase'); return;
        case 'g': $('#snapBtn').click(); return; case 'f': focusSel(); return;
        case 'delete': case 'backspace': ev.preventDefault(); deleteSel(); return;
        case 'escape': closeMenus(); if (E.tool === 'place' || E.tool === 'erase') setTool('move'); else if (E.sel.size) setSel([]); return;
        case '?': openHelp(); return;
        case '+': case '=': zoomBy(1.25); return; case '-': case '_': zoomBy(.8); return;
        case 'arrowleft': case 'arrowright': case 'arrowup': case 'arrowdown': {
          if (!E.sel.size) return; ev.preventDefault(); const st = E.snap ? E.grid3 : .1;
          if (ev.shiftKey && (k === 'ArrowUp' || k === 'ArrowDown')) nudge(0, k === 'ArrowUp' ? st : -st, 0);
          else nudge(k === 'ArrowLeft' ? -st : k === 'ArrowRight' ? st : 0, 0, k === 'ArrowUp' ? -st : k === 'ArrowDown' ? st : 0);
          return;
        }
        case 'pageup': case 'pagedown': if (E.sel.size) { ev.preventDefault(); nudge(0, k === 'PageUp' ? (E.snap ? E.grid3 : .1) : -(E.snap ? E.grid3 : .1), 0); } return;
      }
      return;
    }
    switch (k) {
      case 'v': case 'V': setTool('select'); break; case 'b': case 'B': setTool('place'); break; case 'h': case 'H': setTool('pan'); break; case 'e': case 'E': setTool('erase'); break;
      case 'g': case 'G': $('#snapBtn').click(); break;
      case 'f': case 'F': focusSel(); break;
      case 'Delete': case 'Backspace': ev.preventDefault(); deleteSel(); break;
      case 'Escape': closeMenus(); if (E.tool !== 'select') setTool('select'); else if (E.sel.size) setSel([]); break;
      case '?': openHelp(); break;
      case '+': case '=': zoomBy(1.25); break; case '-': case '_': zoomBy(.8); break; case '0': zoomTo(1); break;
      case '[': reorder('back'); break; case ']': reorder('front'); break;
      case 'ArrowLeft': case 'ArrowRight': case 'ArrowUp': case 'ArrowDown': {
        if (!E.sel.size) { const st = 64 / E.cam.z; if (k === 'ArrowLeft') E.cam.x -= st; if (k === 'ArrowRight') E.cam.x += st; if (k === 'ArrowUp') E.cam.y -= st; if (k === 'ArrowDown') E.cam.y += st; ev.preventDefault(); break; }
        const st = ev.shiftKey ? 1 : (E.snap ? E.grid : 4); ev.preventDefault();
        nudge(k === 'ArrowLeft' ? -st : k === 'ArrowRight' ? st : 0, k === 'ArrowUp' ? -st : k === 'ArrowDown' ? st : 0); break;
      }
    }
  });
  addEventListener('keyup', ev => { if (ev.key === ' ' || ev.key === 'Alt') { if (ev.key === ' ') E.space = false; V.cv && V.cv.classList.toggle('pan', E.tool === 'pan'); if (E.ed3) E.ed3.setNavMode(E.space ? 'pan' : 'none'); } });
  addEventListener('beforeunload', () => { if (!E.saved && E.P) saveProject(true); });
}

/* ================================================================ menus + modals */
function closeMenus() { $$('.menu').forEach(m => m.remove()); }
function menu(anchor, items) {
  closeMenus();
  const m = h('div', { class: 'menu', role: 'menu' });
  for (const it of items) {
    if (it.sep) m.append(h('hr')); else if (it.head) m.append(h('div', { class: 'mh' }, it.head));
    else m.append(h('button', { type: 'button', role: 'menuitem', class: it.danger ? 'danger' : '', onclick: () => { closeMenus(); it.fn(); }, html: (it.icon ? ic(it.icon) : '') + '<span>' + it.label + '</span>' + (it.key ? '<span class="k">' + it.key + '</span>' : '') }));
  }
  document.body.append(m);
  let x, y; if (anchor.getBoundingClientRect) { const r = anchor.getBoundingClientRect(); x = r.left; y = r.bottom + 4; } else { x = anchor.x; y = anchor.y; }
  const mr = m.getBoundingClientRect(); x = Math.min(x, innerWidth - mr.width - 8); y = Math.min(y, innerHeight - mr.height - 8);
  m.style.left = Math.max(8, x) + 'px'; m.style.top = Math.max(8, y) + 'px';
  setTimeout(() => addEventListener('pointerdown', function off(ev) { if (!m.contains(ev.target)) { m.remove(); removeEventListener('pointerdown', off, true); } }, true), 0);
  return m;
}
function modal(title, sub, body, foot, cls) {
  const bg = h('div', { class: 'modal-bg' });
  const close = () => { bg.remove(); if (bg._onclose) bg._onclose(); };
  bg._close = close;
  const m = h('div', { class: 'modal ' + (cls || ''), role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
    h('header', null, h('div', null, sub ? h('p', null, sub) : null, h('h2', null, title)), h('button', { type: 'button', class: 'mx', 'aria-label': 'Close', onclick: close }, '×')),
    h('div', { class: 'mb' }, body), foot && foot.length ? h('footer', null, ...foot) : null);
  bg.append(m); bg.addEventListener('pointerdown', ev => { if (ev.target === bg) close(); });
  document.body.append(bg); return bg;
}
function fileMenu(anchor) {
  menu(anchor, [{ head: 'Project' },
    { label: 'New from template…', icon: 'plus', fn: openTemplates }, { label: 'Open project…', icon: 'menu', key: lsGet(LS.proj, []).length + ' saved', fn: openProjects },
    { label: 'Save now', icon: 'down', key: 'Ctrl+S', fn: () => { saveProject(); toast('Saved', 'ok'); } }, { label: 'Duplicate project', icon: 'copy', fn: dupProject },
    { sep: 1 }, { label: 'Export JSON file', icon: 'down', fn: exportJSON }, { label: 'Import JSON file…', icon: 'up', fn: () => $('#importFile').click() },
    { sep: 1 }, { label: 'Delete this project', icon: 'trash', danger: 1, fn: deleteProject }]);
}
function setDim() {
  const d3 = is3D(), was = E.dimNow; E.dimNow = d3 ? '3d' : '2d';
  A = d3 ? PX.ASSETS3D : PX.ASSETS; CO = d3 ? PX.COMPS3D : PX.COMPS;
  $('#app').classList.toggle('d3', d3);
  if (was !== E.dimNow) { E.cat = 'All'; E.tool = d3 ? 'move' : 'select'; if (!A[E.asset]) E.asset = d3 ? 'block' : 'coin'; }
  if (E.ed3) E.ed3.setVisible(d3 && !E.playing);
  renderTools(); renderGridSel(); buildAssets();
}
function loadProject(P, opts = {}) {
  if (E.playing) stopPlay();
  E.P = P; E.sel.clear(); E.hopen = {}; setDim(); resetHistory(); refreshAll(); frameStart(); E.miniDirty = true; validateHint();
  if (opts.save) saveProject(true); else { E.saved = true; updSaved(); }
  lsSet(LS.last, P.id);
  if (is3D()) E.ready3 = load3D().then(() => { if (E.P !== P) return; ensureEd3(); E.ed3.setVisible(true); E.ed3.load(P); E.ed3.setSnap(E.snap, E.grid3); setTool(E.tool); buildAssets(); refreshHierarchy(); refreshInspector(); updStatus(); }).catch(() => {});
  else E.ready3 = Promise.resolve();
  return E.ready3;
}
function newFromTemplate(k, dim) {
  const d3 = dim === '3d' || (!dim && PX.TEMPLATES3D[k] && !PX.TEMPLATES[k]);
  saveProject(true); const P = d3 ? PX.newProject3D(k) : PX.newProject(k); const T2 = (d3 ? PX.TEMPLATES3D : PX.TEMPLATES)[k];
  const pr = loadProject(P, { save: true });
  log('New ' + (d3 ? '3D' : '2D') + ' project from template: ' + T2.name, 'ok'); toast('New ' + T2.name + ' project');
  return pr;
}
function thumbCanvas(P, W, H) {
  const c = h('canvas', { width: W, height: H });
  if (P.dim !== '3d') { try { c.getContext('2d').drawImage(R.thumb(P, W, H), 0, 0); } catch (e) { /* ignore */ } c._ready = Promise.resolve(c); return c; }
  const x = c.getContext('2d'); x.fillStyle = '#0b0b10'; x.fillRect(0, 0, W, H); x.fillStyle = '#ff4d00'; x.font = '700 12px JetBrains Mono, monospace'; x.textAlign = 'center'; x.fillText('RENDERING 3D…', W / 2, H / 2);
  c._ready = load3D().then(E3 => new Promise(res => setTimeout(() => { try { x.drawImage(E3.thumb(P, W, H), 0, 0); } catch (e) { log('Thumbnail failed: ' + e.message, 'warn'); } res(c); }, 16))).catch(() => c);
  return c;
}
async function thumbData(P, W = 192, H = 108) { const c = thumbCanvas(P, W, H); await c._ready; return c.toDataURL('image/png'); }
function openTemplates(dim) {
  dim = dim || E.dimPick || (is3D() ? '3d' : '2d'); E.dimPick = dim;
  const grid = h('div', { class: 'tpls' });
  const sw = h('div', { class: 'dimsw', role: 'tablist', 'aria-label': '2D or 3D' },
    h('button', { type: 'button', class: dim === '2d' ? 'on' : '', 'data-dim': '2d', role: 'tab', onclick: () => { bg._close(); openTemplates('2d'); } }, '2D'),
    h('button', { type: 'button', class: dim === '3d' ? 'on' : '', 'data-dim': '3d', role: 'tab', onclick: () => { bg._close(); openTemplates('3d'); } }, '3D'));
  const body = h('div', null, h('div', { class: 'tplhead' }, sw, h('span', { class: 'note', style: 'margin:0' }, dim === '3d' ? 'Full 3D worlds: orbit camera, gizmos, physics, cinematic lighting.' : 'Classic pixel-art games: side view, top-down, shooter, maze.')), grid);
  const bg = modal('Choose a template', 'Start a new game — your current one is saved', body, null, 'wide');
  const TT = dim === '3d' ? PX.TEMPLATES3D : PX.TEMPLATES;
  let chain = Promise.resolve();
  for (const k in TT) {
    const t = TT[k], P = dim === '3d' ? PX.newProject3D(k) : PX.newProject(k);
    const c = h('canvas', { width: 384, height: 216 }); const cx = c.getContext('2d'); cx.fillStyle = '#0b0b10'; cx.fillRect(0, 0, 384, 216);
    chain = chain.then(() => { if (!document.body.contains(bg)) return; const tc = thumbCanvas(P, 384, 216); return tc._ready.then(() => cx.drawImage(tc, 0, 0)); });
    grid.append(h('button', { type: 'button', class: 'tpl', 'data-tpl': k, 'data-dim': dim, onclick: () => { bg._close(); newFromTemplate(k, dim); } }, c, h('div', { class: 'tb2' }, h('em', null, (dim === '3d' ? '3D · ' : '2D · ') + t.tag), h('b', null, t.name), h('span', null, t.desc))));
  }
}
function openProjects() {
  const list = readProjects().sort((a, b) => (b.updated || 0) - (a.updated || 0));
  const grid = h('div', { class: 'projs' });
  let bg;
  if (!list.length) grid.append(h('p', { class: 'note' }, 'No saved projects yet.'));
  for (const rec of list) {
    let c; try { c = thumbCanvas(PX.normalize(PX.clone(rec.data)), 320, 180); } catch (e) { c = h('canvas', { width: 320, height: 180 }); }
    const card = h('div', { class: 'proj' + (rec.id === E.P.id ? ' cur' : '') }, c,
      h('div', { class: 'pb' }, h('div', null, h('b', null, (rec.data && rec.data.dim === '3d' ? '[3D] ' : '') + (rec.name || 'Untitled')), h('small', null, (rec.id === E.P.id ? 'open now · ' : '') + new Date(rec.updated || 0).toLocaleString())),
        h('button', { type: 'button', 'aria-label': 'Delete project', 'data-tip': 'Delete project', html: ic('trash'), onclick: () => { if (!confirm('Delete “' + (rec.name || 'Untitled') + '”? This cannot be undone.')) return; lsSet(LS.proj, readProjects().filter(r => r.id !== rec.id)); card.remove(); if (rec.id === E.P.id) { loadProject(PX.newProject('blank'), { save: true }); } log('Deleted project ' + rec.name); } })));
    c.onclick = () => { bg._close(); try { saveProject(true); loadProject(PX.normalize(PX.clone(rec.data))); log('Opened project: ' + rec.name, 'ok'); } catch (e) { log('Could not open project: ' + e.message, 'err'); } };
    grid.append(card);
  }
  bg = modal('Your projects', 'Saved in this browser', grid, [h('button', { type: 'button', class: 'btn', onclick: () => { bg._close(); openTemplates(); } }, '+ New from template')], 'wide');
}
function dupProject() { saveProject(true); const P = PX.clone(E.P); P.id = PX.uid(); P.settings.title = (P.settings.title + ' copy').slice(0, 60); loadProject(P, { save: true }); toast('Duplicated project'); log('Duplicated project', 'ok'); }
function deleteProject() {
  if (!confirm('Delete “' + E.P.settings.title + '” from this browser? This cannot be undone.')) return;
  lsSet(LS.proj, readProjects().filter(r => r.id !== E.P.id)); const rest = readProjects();
  loadProject(rest.length ? PX.normalize(rest[0].data) : PX.newProject('blank'), { save: !rest.length }); toast('Project deleted');
}
function download(name, text, type = 'application/json') { const a = h('a', { href: URL.createObjectURL(new Blob([text], { type })), download: name }); document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
const fileSafe = s => (s || 'game').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'game';
function exportJSON() { download(fileSafe(E.P.settings.title) + '.pxgame.json', JSON.stringify(slim(E.P), null, 1)); log('Exported JSON', 'ok'); }
function importFile() {
  const f = $('#importFile').files[0]; if (!f) return;
  f.text().then(txt => { const P = PX.normalize(JSON.parse(txt)); P.id = PX.uid(); saveProject(true); loadProject(P, { save: true }); toast('Imported ' + P.settings.title, 'ok'); log('Imported ' + f.name, 'ok'); })
    .catch(e => { toast('That file is not a builder project', 'err'); log('Import failed: ' + e.message, 'err'); })
    .finally(() => { $('#importFile').value = ''; });
}
async function copyText(t) { try { await navigator.clipboard.writeText(t); return true; } catch (e) { const ta = h('textarea', { style: 'position:fixed;opacity:0' }); ta.value = t; document.body.append(ta); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e2) { /* ignore */ } ta.remove(); return ok; } }
async function openShare() {
  saveProject(true);
  const link = await shareUrl(), remix = link.replace('?play#', '#');
  E.lastShare = link;
  const inp = h('input', { class: 'inp', id: 'shareLink', readonly: true, value: link });
  const body = h('div', null,
    h('div', { class: 'field' }, h('span', null, 'Play link — anyone can open it'), h('div', { class: 'linkbox' }, inp, h('button', { type: 'button', class: 'btn primary', onclick: async () => { const ok = await copyText(link); toast(ok ? 'Link copied' : 'Copy failed — select and copy manually', ok ? 'ok' : 'err'); } }, 'Copy'))),
    h('div', { class: 'field' }, h('span', null, 'Remix link — opens a copy in the builder'), h('div', { class: 'linkbox' }, h('input', { class: 'inp', readonly: true, value: remix }), h('button', { type: 'button', class: 'btn', onclick: async () => { const ok = await copyText(remix); toast(ok ? 'Remix link copied' : 'Copy failed', ok ? 'ok' : 'err'); } }, 'Copy'))),
    h('p', { class: 'note' }, 'The whole game is packed into the link itself (', h('b', null, (link.length / 1024).toFixed(1) + ' KB'), (link.includes('?play#z') ? ', compressed' : ''), ') — no server needed.', link.length > 7000 ? ' It is long, so some chat apps may cut it off; the JSON export always works.' : ''));
  inp.onfocus = () => inp.select();
  modal('Share your game', E.P.settings.title, body, [
    h('button', { type: 'button', class: 'btn ghost', onclick: exportJSON, html: ic('down') + 'Download JSON' }),
    h('a', { class: 'btn primary', href: link, target: '_blank', rel: 'noopener', html: ic('external') + 'Open play view' })], 'narrow');
  log('Share link created (' + link.length + ' chars)', 'ok');
}
function myGames() { const l = lsGet(LS.games, []); return Array.isArray(l) ? l : []; }
async function publishLocal() {
  const P = E.P, list = myGames();
  const rec = { id: P.id, title: P.settings.title, desc: P.settings.desc, category: P.settings.category, thumb: await thumbData(P, 192, 108), dim: P.dim === '3d' ? '3d' : '2d', data: slim(P), updated: Date.now(), url: 'builder/?play#' + await encodeProject(P) };
  const i = list.findIndex(g => g.id === P.id); if (i >= 0) list[i] = rec; else list.unshift(rec);
  if (lsSet(LS.games, list)) { log('Added to My Games (' + list.length + ' total)', 'ok'); return true; }
  return false;
}
async function publishGitHub() {
  const P = E.P, S = P.settings, link = await shareUrl(), json = JSON.stringify(slim(P));
  const head = `## ${S.title}\n\n${S.desc || '_No description yet._'}\n\n- **Category:** ${S.category}\n- **Win:** ${PX.WINS[S.win]}${S.win === 'score' ? ' (' + S.winScore + ')' : ''} · ${S.timeLimit}s · ${S.lives} lives\n- **Objects:** ${P.entities.length} · **Rules:** ${P.rules.length}\n\n### ▶ Play\n${link}\n\n`;
  let body = head + '### Game JSON\n<details><summary>project.json</summary>\n\n```json\n' + json + '\n```\n</details>\n\n_Made with the Pixel Arcade Game Builder._';
  let copied = false;
  if (encodeURIComponent(body).length > 7500) {
    copied = await copyText(json);
    body = head + '### Game JSON\n' + (copied ? '_The JSON was too big for a link — it is on your clipboard. Paste it below this line:_\n\n```json\n\n```' : '_The JSON was too big for a link. Use **File → Export JSON** in the builder and attach the file._') + '\n\n_Made with the Pixel Arcade Game Builder._';
    if (encodeURIComponent(body).length > 7500) body = `## ${S.title}\n\n${S.desc}\n\n_The play link is too long for a URL. Export the JSON (File → Export JSON) and attach it here._`;
  }
  const url = ISSUE_URL + '?title=' + encodeURIComponent('[game] ' + S.title) + '&body=' + encodeURIComponent(body);
  E.lastIssueUrl = url;
  window.open(url, '_blank', 'noopener');
  log('Opened GitHub issue to publish “' + S.title + '”' + (copied ? ' (JSON copied to clipboard)' : ''), 'ok');
  if (copied) toast('JSON copied — paste it into the issue', 'ok');
}
function openPublish() {
  saveProject(true);
  const P = E.P, S = P.settings, thumb = thumbCanvas(P, 480, 270);
  const ti = h('input', { class: 'inp', value: S.title, maxlength: 60 }), de = h('textarea', { class: 'ta', rows: 3, maxlength: 240, placeholder: 'One line that sells your game' }); de.value = S.desc;
  const ca = sel_(PX.CATEGORIES.map(c => [c, c]), S.category, v => { S.category = v; });
  ti.oninput = () => { S.title = ti.value; $('#projName').value = ti.value; }; de.oninput = () => { S.desc = de.value; };
  const mg = h('div', { class: 'mygames' });
  const renderMG = () => {
    mg.innerHTML = ''; const l = myGames();
    mg.append(h('div', { class: 'field', style: 'margin:0' }, h('span', null, 'My Games in this browser (' + l.length + ')')));
    l.slice(0, 6).forEach(g => mg.append(h('div', { class: 'mg' }, h('img', { src: g.thumb, alt: '' }), h('div', null, h('b', null, g.title), h('small', null, new Date(g.updated).toLocaleDateString())), h('a', { href: '?play&game=' + encodeURIComponent(g.id), target: '_blank', rel: 'noopener' }, 'Play ↗'),
      h('button', { type: 'button', 'aria-label': 'Remove', 'data-tip': 'Remove from My Games', html: ic('x').replace('class="i"', 'class="i" style="width:12px;height:12px"'), onclick: () => { lsSet(LS.games, myGames().filter(x => x.id !== g.id)); renderMG(); } }))));
  };
  renderMG();
  const body = h('div', { class: 'pubgrid' }, h('div', null, thumb, h('p', { class: 'note' }, 'Thumbnail is rendered from your level around the player start.')),
    h('div', null, h('label', { class: 'field' }, h('span', null, 'Title'), ti), h('label', { class: 'field' }, h('span', null, 'Description'), de), h('label', { class: 'field' }, h('span', null, 'Category'), ca),
      h('p', { class: 'note' }, h('b', null, 'My Games'), ' keeps it in this browser so the arcade lobby can list it. ', h('b', null, 'Publish to arcade'), ' opens a pre-filled GitHub issue with your play link and JSON so it can be added for everyone.'), mg));
  const bg = modal('Publish', 'Ship it', body, [
    h('button', { type: 'button', class: 'btn', id: 'pubLocal', onclick: async () => { commit('Publish details'); if (await publishLocal()) { toast('Saved to My Games', 'ok'); renderMG(); } } }, 'Save to My Games'),
    h('button', { type: 'button', class: 'btn primary', id: 'pubGH', onclick: async () => { commit('Publish details'); await publishLocal(); renderMG(); await publishGitHub(); }, html: ic('external') + 'Publish to arcade' })], 'wide');
  bg._onclose = () => { commit('Publish details'); refreshSettings(); };
}
function openHelp() {
  if ($('.modal-bg')) return;
  const K = (...k) => h('span', null, ...k.map(x => h('kbd', null, x)));
  const rowk = (l, ...k) => h('div', { class: 'krow' }, h('span', null, l), K(...k));
  const body = h('div', { class: 'keys' },
    h('h6', null, 'Tools'), rowk('Select / move', 'V'), rowk('Place asset', 'B'), rowk('Pan', 'H'), rowk('Erase', 'E'), rowk('Toggle grid snap', 'G'), rowk('Pan while held', 'Space'),
    h('h6', null, 'Editing'), rowk('Undo', 'Ctrl', 'Z'), rowk('Redo', 'Ctrl', 'Y'), rowk('Duplicate', 'Ctrl', 'D'), rowk('Delete', 'Del'), rowk('Copy / paste', 'Ctrl', 'C/V'), rowk('Select all', 'Ctrl', 'A'),
    rowk('Nudge (grid / 1px)', '←→↑↓', 'Shift'), rowk('Add to selection', 'Shift', 'Click'), rowk('Bring front / back', ']', '['), rowk('Duplicate-drag', 'Alt', 'Drag'),
    h('h6', null, 'View'), rowk('Zoom', 'Wheel'), rowk('Zoom in / out', '+', '−'), rowk('Reset zoom', '0'), rowk('Focus selection', 'F'), rowk('Pan', 'Middle-drag'), rowk('Scroll sideways', 'Shift', 'Wheel'),
    h('h6', null, 'Game'), rowk('Play / stop', 'F5'), rowk('Stop', 'Esc'), rowk('Restart after end', 'R'), rowk('Pause', 'P'), rowk('Mute', 'M'), rowk('Save', 'Ctrl', 'S'),
    h('h6', null, '3D editor'), rowk('Move / rotate / scale gizmo', 'W', 'E', 'R'), rowk('Place / erase', 'B', 'X'), rowk('Orbit camera', 'Right-drag'), rowk('Orbit (left button)', 'Alt', 'Drag'), rowk('Pan', 'Middle-drag'), rowk('Zoom', 'Wheel'),
    rowk('Nudge X/Z · up/down', '←→↑↓', 'PgUp/PgDn'), rowk('Snap view to axis', 'Click axis badge'),
    h('h6', null, 'Playing 3D'), rowk('Move', 'WASD'), rowk('Look', 'Click', 'Mouse'), rowk('Turn (no mouse)', '←', '→'), rowk('Jump / sprint', 'Space', 'Shift'), rowk('Shoot', 'X', 'Click'), rowk('Camera mode', 'C'), rowk('Graphics quality', 'G'),
    h('h6', null, 'Playing 2D'), rowk('Move', '←→↑↓', 'WASD'), rowk('Jump (platformer)', 'Space', '↑'), rowk('Shoot', 'X', 'J'), rowk('Shoot (top-down / ship)', 'Space'), rowk('Drop through ledge', '↓'), rowk('Help', '?'));
  modal('Keyboard shortcuts', 'Cheat sheet', body, null, '');
}

/* ================================================================ sprite painter */
function openPainter(e) {
  const P = E.P, a = A[e.type], key = R.spriteKeyOf(e);
  let px = (key === 'none' ? new Array(256).fill('') : R.spritePixels(key, P)).slice();
  let color = '#ff4d00', tool = 'pen', mirror = false, down = false;
  const hist = [px.slice()];
  const cv = h('canvas', { class: 'pcan', width: 384, height: 384, 'aria-label': 'Sprite canvas' }), x = cv.getContext('2d');
  const prevs = [16, 32, 64].map(s => h('canvas', { width: 16, height: 16, style: `width:${s}px;height:${s}px` }));
  const draw = () => {
    x.clearRect(0, 0, 384, 384);
    for (let i = 0; i < 256; i++) if (px[i]) { x.fillStyle = px[i]; x.fillRect((i % 16) * 24, Math.floor(i / 16) * 24, 24, 24); }
    x.strokeStyle = 'rgba(255,255,255,.08)'; x.lineWidth = 1; x.beginPath(); for (let k = 0; k <= 16; k++) { x.moveTo(k * 24 + .5, 0); x.lineTo(k * 24 + .5, 384); x.moveTo(0, k * 24 + .5); x.lineTo(384, k * 24 + .5); } x.stroke();
    x.strokeStyle = 'rgba(255,77,0,.35)'; x.beginPath(); x.moveTo(192.5, 0); x.lineTo(192.5, 384); x.moveTo(0, 192.5); x.lineTo(384, 192.5); x.stroke();
    const pc = R.pixelsToCanvas(px); prevs.forEach(p => { const c = p.getContext('2d'); c.clearRect(0, 0, 16, 16); c.drawImage(pc, 0, 0); });
  };
  const cell = ev => { const r = cv.getBoundingClientRect(); return { cx: clamp(Math.floor((ev.clientX - r.left) / r.width * 16), 0, 15), cy: clamp(Math.floor((ev.clientY - r.top) / r.height * 16), 0, 15) }; };
  const setPx = (cx, cy, v) => { px[cy * 16 + cx] = v; if (mirror) px[cy * 16 + (15 - cx)] = v; };
  const fill = (cx, cy, v) => { const from = px[cy * 16 + cx]; if (from === v) return; const st = [[cx, cy]]; while (st.length) { const [i, j] = st.pop(); if (i < 0 || j < 0 || i > 15 || j > 15 || px[j * 16 + i] !== from) continue; px[j * 16 + i] = v; st.push([i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]); } };
  const apply = ev => { const { cx, cy } = cell(ev); if (tool === 'pen') setPx(cx, cy, color); else if (tool === 'eraser') setPx(cx, cy, ''); else if (tool === 'fill') fill(cx, cy, color); else if (tool === 'pick') { color = px[cy * 16 + cx] || color; ci.value = color; tool = 'pen'; updTools(); renderPal(); } draw(); };
  cv.addEventListener('pointerdown', ev => { down = true; cv.setPointerCapture(ev.pointerId); apply(ev); });
  cv.addEventListener('pointermove', ev => { if (down && (tool === 'pen' || tool === 'eraser')) apply(ev); });
  cv.addEventListener('pointerup', () => { if (down) { down = false; hist.push(px.slice()); if (hist.length > 60) hist.shift(); } });
  cv.addEventListener('contextmenu', ev => { ev.preventDefault(); const { cx, cy } = cell(ev); color = px[cy * 16 + cx] || color; ci.value = /^#/.test(color) ? color : '#000000'; renderPal(); });
  const tb = (t, icon, tip) => h('button', { type: 'button', class: 'tbtn icon', 'data-t': t, 'data-tip': tip, 'aria-label': tip, html: ic(icon), onclick: () => { tool = t; updTools(); } });
  const tools = h('div', { class: 'ptools' }, tb('pen', 'pencil', 'Pencil'), tb('eraser', 'erase', 'Eraser'), tb('fill', 'bucket', 'Fill'), tb('pick', 'pipette', 'Eyedropper (or right-click)'),
    h('button', { type: 'button', class: 'tbtn icon', id: 'pMirror', 'data-tip': 'Mirror drawing (symmetry)', 'aria-label': 'Mirror', html: ic('mirror'), onclick: function () { mirror = !mirror; this.classList.toggle('on', mirror); } }),
    h('button', { type: 'button', class: 'tbtn icon', 'data-tip': 'Flip horizontally', 'aria-label': 'Flip', html: ic('flip'), onclick: () => { const n = px.slice(); for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) n[j * 16 + i] = px[j * 16 + 15 - i]; px = n; hist.push(px.slice()); draw(); } }),
    h('button', { type: 'button', class: 'tbtn icon', 'data-tip': 'Undo stroke', 'aria-label': 'Undo stroke', html: ic('undo'), onclick: () => { if (hist.length > 1) { hist.pop(); px = hist[hist.length - 1].slice(); draw(); } } }),
    h('button', { type: 'button', class: 'tbtn icon', 'data-tip': 'Clear', 'aria-label': 'Clear', html: ic('clear'), onclick: () => { px = new Array(256).fill(''); hist.push(px.slice()); draw(); } }),
    h('button', { type: 'button', class: 'tbtn', 'data-tip': 'Reset to the built-in sprite', onclick: () => { px = PX.builtinPixels(a.sprite); hist.push(px.slice()); draw(); } }, 'Reset'));
  const updTools = () => tools.querySelectorAll('[data-t]').forEach(b => b.classList.toggle('on', b.dataset.t === tool));
  const pal = h('div', { class: 'pal' });
  const ci = h('input', { type: 'color', value: color, style: 'width:100%;height:30px;border:1px solid var(--line2);border-radius:6px;background:var(--p1)' });
  ci.oninput = () => { color = ci.value; if (tool === 'eraser' || tool === 'pick') tool = 'pen'; updTools(); renderPal(); };
  const renderPal = () => { pal.innerHTML = ''; PX.PAINT.forEach(c => pal.append(h('button', { type: 'button', class: c === color ? 'on' : '', style: 'background:' + c, 'aria-label': c, onclick: () => { color = c; ci.value = c; if (tool === 'eraser' || tool === 'pick') tool = 'pen'; updTools(); renderPal(); } }))); pal.append(h('button', { type: 'button', class: 'tr' + (tool === 'eraser' ? ' on' : ''), 'aria-label': 'Transparent', 'data-tip': 'Transparent (eraser)', onclick: () => { tool = 'eraser'; updTools(); renderPal(); } })); };
  renderPal(); updTools(); draw();
  const same = P.entities.filter(x => x.type === e.type).length;
  const body = h('div', { class: 'painter' }, cv, h('div', null, tools, h('div', { class: 'field', style: 'margin:0' }, h('span', null, 'Palette')), pal, h('div', { class: 'field' }, h('span', null, 'Custom color'), ci),
    h('div', { class: 'field', style: 'margin:0' }, h('span', null, 'Preview')), h('div', { class: 'ppv' }, ...prevs),
    h('p', { class: 'note' }, 'Left-click paints, right-click picks a color. Your sprite is saved inside the project, so it travels with share links.')));
  const save = all => {
    let id = key.startsWith('c:') ? key.slice(2) : null;
    if (id && P.sprites[id]) { P.sprites[id].px = px.slice(); P.sprites[id].v = (P.sprites[id].v || 0) + 1; }
    else { id = 's' + (Object.keys(P.sprites).length + 1) + Math.random().toString(36).slice(2, 5); P.sprites[id] = { name: (e.name || a.name) + ' (painted)', px: px.slice(), v: 1 }; }
    (all ? P.entities.filter(x => x.type === e.type) : [e]).forEach(x => { x.sprite = 'c:' + id; });
    commit('Paint sprite'); refreshInspector(); refreshHierarchy(); bg._close(); toast('Sprite applied', 'ok'); log('Painted sprite applied to ' + (all ? 'all ' + a.name + 's' : (e.name || a.name)), 'ok');
  };
  const bg = modal('Sprite painter', a.name + ' · 16×16', body, [
    h('button', { type: 'button', class: 'btn ghost', onclick: () => bg._close() }, 'Cancel'),
    same > 1 ? h('button', { type: 'button', class: 'btn', onclick: () => save(true) }, 'Apply to all ' + same + ' ' + a.name + 's') : null,
    h('button', { type: 'button', class: 'btn primary', id: 'paintSave', onclick: () => save(false) }, 'Apply to this object')].filter(Boolean), 'paintm');
}

/* ================================================================ tooltips */
function wireTips() {
  const tip = $('#tip'); let timer = 0, cur = null;
  const hide = () => { clearTimeout(timer); tip.hidden = true; cur = null; };
  document.addEventListener('mouseover', ev => {
    const el = ev.target.closest && ev.target.closest('[data-tip]');
    if (el === cur) return; hide(); if (!el || E.drag) return; cur = el;
    timer = setTimeout(() => {
      if (!document.body.contains(el)) return;
      tip.innerHTML = ''; tip.append(el.dataset.tip); if (el.dataset.key) tip.append(h('kbd', null, el.dataset.key));
      tip.hidden = false; const r = el.getBoundingClientRect(), tr = tip.getBoundingClientRect();
      let x = r.left + r.width / 2 - tr.width / 2, y = r.bottom + 8; if (y + tr.height > innerHeight - 6) y = r.top - tr.height - 8;
      tip.style.left = clamp(x, 6, innerWidth - tr.width - 6) + 'px'; tip.style.top = y + 'px';
    }, 380);
  });
  document.addEventListener('pointerdown', hide, true); addEventListener('blur', hide);
}

/* ================================================================ onboarding tour */
const TOUR = [
  { sel: '#scene', title: 'This is your level', text: () => is3D() ? 'A full 3D world. Right-drag to orbit, middle-drag to pan, wheel to zoom, and click the axis badge to snap the view. File → New lets you switch between 2D and 3D templates.' : 'We loaded the Platformer template so you have something to play with. Pan with Space-drag or the middle mouse button, zoom with the wheel. File → New lets you pick a 2D or 3D template.' },
  { sel: '#assets', title: 'Drop things in', text: () => is3D() ? 'Pick an asset — try the Coin — then click any surface in the Scene to drop it there. It snaps to the grid; drag across the ground to paint a row.' : 'Pick an asset — try the Coin — then click in the Scene to place it. Drag to paint a row of coins, or drag a box to draw a big block of ground.' },
  { sel: '#right', title: 'Tweak anything', text: () => is3D() ? 'Select an object to edit position, rotation and scale (or use the W / E / R gizmo), its material, texture and shadows, physics, and components like Patrol, Chase, Mover or Spinner.' : 'Select an object to change its size, color, sprite (paint your own 16×16!), physics and components like Patrol, Chase, Shooter or Bounce Pad. 3D projects get move/rotate/scale gizmos too.' },
  { sel: '#bottom', title: 'Rules = gameplay', text: 'WHEN Player touches Coin → DO Add score 10 + Play sound. Build rules from dropdowns. Game Settings sets the win condition, lives and time limit.', before: () => setTab('rules') },
  { sel: '#playBtn', title: 'Play, share, publish', text: 'Press ▶ Play (or F5) to test right here. Share makes a link anyone can play; Publish adds it to My Games and the arcade. That’s it — go make something!', pad: 8 }
];
function startTour() { if (E.playing) stopPlay(); endTour(); E.tour = { i: 0, spot: h('div', { class: 'tour-spot' }), card: h('div', { class: 'tour-card', role: 'dialog', 'aria-label': 'Tour' }) }; document.body.append(E.tour.spot, E.tour.card); showTour(); }
function showTour() {
  const tr = E.tour, st = TOUR[tr.i]; if (st.before) st.before();
  const el = $(st.sel); if (innerWidth <= 980 && (st.sel === '#assets')) $('#app').classList.add('showl'); else if (innerWidth <= 980 && st.sel === '#right') $('#app').classList.add('showr'); else $('#app').classList.remove('showl', 'showr');
  setTimeout(() => {
    const r = el.getBoundingClientRect(), p = st.pad || 2;
    Object.assign(tr.spot.style, { left: r.left - p + 'px', top: r.top - p + 'px', width: r.width + p * 2 + 'px', height: r.height + p * 2 + 'px' });
    tr.card.innerHTML = '';
    tr.card.append(h('div', { class: 'step' }, 'STEP ' + (tr.i + 1) + ' / ' + TOUR.length + ' · FIRST GAME IN 60 SECONDS'), h('h3', null, st.title), h('p', null, typeof st.text === 'function' ? st.text() : st.text),
      h('div', { class: 'tf' }, h('div', { class: 'dots' }, ...TOUR.map((_, i) => h('i', { class: i === tr.i ? 'on' : '' }))),
        h('button', { type: 'button', class: 'btn ghost', id: 'tourSkip', onclick: endTour }, 'Skip'), tr.i > 0 ? h('button', { type: 'button', class: 'btn', onclick: () => tourStep(-1) }, 'Back') : null,
        h('button', { type: 'button', class: 'btn primary', id: 'tourNext', onclick: () => tourStep(1) }, tr.i === TOUR.length - 1 ? 'Done' : 'Next')));
    const cw = 330, ch = tr.card.offsetHeight || 200; let x, y;
    if (r.right + cw + 20 < innerWidth) { x = r.right + 14; y = r.top + 10; } else if (r.left - cw - 20 > 0) { x = r.left - cw - 14; y = r.top + 10; } else { x = r.left + r.width / 2 - cw / 2; y = r.bottom + 14; if (y + ch > innerHeight) y = r.top - ch - 14; }
    if (r.height > innerHeight * .5 && r.width > innerWidth * .4) { x = r.left + 20; y = r.top + 20; }
    tr.card.style.left = clamp(x, 8, innerWidth - cw - 8) + 'px'; tr.card.style.top = clamp(y, 8, innerHeight - ch - 8) + 'px';
  }, innerWidth <= 980 ? 260 : 0);
}
function tourStep(d) { const tr = E.tour; if (!tr) return; tr.i += d; if (tr.i >= TOUR.length) { endTour(); toast('You’re ready — press F5 to play!', 'ok'); return; } tr.i = Math.max(0, tr.i); showTour(); }
function endTour() { if (!E.tour) return; E.tour.spot.remove(); E.tour.card.remove(); E.tour = null; lsSet(LS.tour, true); $('#app').classList.remove('showl', 'showr'); }

/* ================================================================ 3D editor glue */
function sync3D() { if (is3D() && E.ed3) E.ed3.syncAll(); }
let live3T = 0;
function live3D() { if (live3T) return; live3T = requestAnimationFrame(() => { live3T = 0; sync3D(); updTransformFields3D(); }); }
function ensureEd3() {
  if (E.ed3) return E.ed3;
  E.ed3 = new PX.E3.Editor3D($('#sbody'), {
    space: () => E.space,
    onPick(id, add) {
      if (id == null) { if (!add && E.sel.size) setSel([]); return; }
      if (add) { const s = new Set(E.sel); s.has(id) ? s.delete(id) : s.add(id); setSel(s); } else { E.scrollHier = true; setSel([id]); }
    },
    onPlace(type, p) { const e = placeAt3D(type, p); E.ed3.syncAll(); return e; },
    onPaintEnd(st) { const before = E.hi; commit(st.erase ? 'Erase' : 'Place ' + (A[E.asset] || {}).name); if (E.hi !== before) { refreshHierarchy(); refreshInspector(); validateHint(); log(st.erase ? 'Erased objects' : 'Placed ' + (st.n || 1) + '× ' + A[E.asset].name); } },
    onErase(id) { E.P.entities = E.P.entities.filter(e => e.id !== id); E.sel.delete(id); E.ed3.syncAll(); },
    onXfStart() {}, onXfChange() { updTransformFields3D(); }, onXfEnd() { commit('Transform'); refreshInspector(); },
    onCursor(p) { $('#stPos').innerHTML = 'X <b>' + p[0].toFixed(2) + '</b> Y <b>' + p[1].toFixed(2) + '</b> Z <b>' + p[2].toFixed(2) + '</b>'; }
  });
  return E.ed3;
}
function placeAt3D(type, p) {
  const a = A[type]; if (!a) return null;
  if (a.single) { const ex = E.P.entities.find(e => e.type === type); if (ex) { ex.p = p.slice(); return ex; } }
  const e = PX.newEntity3D(type, p); e.id = nextId(); E.P.entities.push(e); return e;
}
function updTransformFields3D() {
  const s = selected(); if (s.length !== 1) return; const e = s[0];
  for (const k in E.tf3) { const inp = E.tf3[k]; if (document.activeElement !== inp) inp.value = fmtN(e[k[0]][+k[1]]); }
  const sz = $('#sz3'); if (sz) sz.textContent = PX.size3(e).map(v => +v.toFixed(2)).join(' × ') + ' m';
}
function xyz3(e, key, step) {
  const cls = ['cx', 'cy', 'cw'], lb = ['X', 'Y', 'Z'];
  return h('div', { class: 'row3' }, ...[0, 1, 2].map(i => {
    const inp = numIn(e[key][i], v => { if (key === 's') v = Math.max(.05, v); e[key][i] = v; live3D(); }, () => { commit(key === 'p' ? 'Move' : key === 'r' ? 'Rotate' : 'Scale'); }, step);
    E.tf3[key + i] = inp; return xyWrap(lb[i], cls[i], inp, step);
  }));
}
let texURL = {};
function texChip(name, on, fn) {
  const c = PX.texCanvas(name); if (c && !texURL[name]) { const t = document.createElement('canvas'); t.width = t.height = 48; t.getContext('2d').drawImage(c, 0, 0, 48, 48); texURL[name] = t.toDataURL(); }
  return h('button', { type: 'button', class: 'texchip' + (on ? ' on' : ''), 'data-tex': name, 'data-tip': PX.TEXTURES3D[name], 'aria-label': PX.TEXTURES3D[name], style: c ? `background-image:url(${texURL[name]})` : 'background:repeating-conic-gradient(#222 0 25%,#141414 0 50%) 0 0/10px 10px', onclick: fn }, c ? '' : '∅');
}
function materialSection(box, list) {
  const e = list[0], all = (f) => { list.forEach(f); live3D(); };
  sec(box, 'Material', b => {
    const ci = h('input', { type: 'color', value: /^#[0-9a-f]{6}$/i.test(e.color) ? e.color : '#ffffff' }), ct = h('input', { class: 'inp', value: e.color || '' });
    ci.oninput = () => { all(x => { x.color = ci.value; }); ct.value = ci.value; }; ci.onchange = () => commit('Color');
    ct.onchange = () => { if (/^#[0-9a-f]{6}$/i.test(ct.value)) { all(x => { x.color = ct.value; }); ci.value = ct.value; commit('Color'); } else ct.value = e.color; };
    b.append(row('Color', h('div', { class: 'colr' }, ci, ct), 'Base color (tints the texture)'));
    b.append(row('Finish', sel_(Object.entries(PX.FINISHES), e.mat || 'matte', v => { all(x => { x.mat = v; }); commit('Finish'); }), 'Matte, shiny metal, see-through glass or glowing (blooms in play)'));
    const chips = h('div', { class: 'texchips' }); Object.keys(PX.TEXTURES3D).forEach(t => chips.append(texChip(t, (e.tex || 'none') === t, () => { all(x => { x.tex = t; }); commit('Texture'); refreshInspector(); })));
    b.append(row('Texture', chips, 'Procedural textures tile every 2 m'));
    b.append(row('Cast shadow', chk(e.cast, v => { all(x => { x.cast = v; }); commit('Shadows'); })));
    b.append(row('Receive shadow', chk(e.recv, v => { all(x => { x.recv = v; }); commit('Shadows'); })));
  });
}
function inspect3D(box, s) {
  E.tf3 = {};
  if (!s.length) return inspectNone3D(box);
  if (s.length > 1) {
    box.append(h('div', { class: 'ihead' }, h('div', { class: 'big' }, assetIcon(s[0].type)), h('div', { class: 'meta' }, h('b', null, s.length + ' objects selected'), h('div', { class: 'ty' }, h('span', null, [...new Set(s.map(e => A[e.type].name))].slice(0, 3).join(', '))))));
    box.append(h('div', { class: 'iacts' }, ibtn('copy', 'Duplicate all', 'Ctrl+D', duplicate, 'Duplicate'), ibtn('trash', 'Delete all', 'Del', deleteSel, 'Delete'), ibtn('target', 'Focus', 'F', focusSel)));
    box.append(h('p', { class: 'note', style: 'padding:0 12px' }, 'The gizmo moves, rotates or scales every selected object together.'));
    materialSection(box, s);
    sec(box, 'Physics', b => b.append(row('Solid', chk(s.every(e => e.phys.solid), v => { s.forEach(e => e.phys.solid = v); commit('Physics'); }))));
    return;
  }
  const e = s[0], a = A[e.type];
  const nameIn = h('input', { class: 'inp', value: e.name || '', placeholder: a.name, 'aria-label': 'Object name' });
  nameIn.oninput = () => { e.name = nameIn.value; }; nameIn.onchange = () => { commit('Rename'); refreshHierarchy(); };
  box.append(h('div', { class: 'ihead' }, h('div', { class: 'big' }, assetIcon(e.type)), h('div', { class: 'meta' }, nameIn, h('div', { class: 'ty' }, h('span', null, a.name), h('b', null, '#' + e.id), h('span', null, a.cat)))));
  box.append(h('div', { class: 'iacts' },
    ibtn('copy', 'Duplicate', 'Ctrl+D', duplicate), ibtn('trash', 'Delete', 'Del', deleteSel), ibtn('target', 'Focus in Scene', 'F', focusSel),
    ibtn(e.locked ? 'lock' : 'unlock', e.locked ? 'Unlock' : 'Lock (not selectable in Scene)', null, () => { e.locked = !e.locked; commit('Lock'); refreshInspector(); refreshHierarchy(); }),
    ibtn('ground', 'Drop to the ground (Y so the bottom sits at 0)', null, () => { e.p[1] = +(PX.size3(e)[1] / 2).toFixed(3); commit('Drop to ground'); updTransformFields3D(); }),
    ibtn('rotate', 'Reset rotation', null, () => { e.r = [0, 0, 0]; commit('Reset rotation'); updTransformFields3D(); })));
  sec(box, 'Transform', b => {
    b.append(row('Position', xyz3(e, 'p', E.snap ? E.grid3 : .1), 'Centre of the object (metres)'));
    b.append(row('Rotation', xyz3(e, 'r', 15), 'Degrees around X / Y / Z'));
    b.append(row('Scale', xyz3(e, 's', .25), 'Multiplier of the asset size'));
    b.append(row('Size', h('span', { id: 'sz3', class: 'tx', style: 'color:var(--fg2)' }, PX.size3(e).map(v => +v.toFixed(2)).join(' × ') + ' m')));
  });
  materialSection(box, [e]);
  sec(box, 'Physics', b => {
    const ph = e.phys;
    b.append(row('Body', sel_([['static', 'Static (never moves)'], ['kinematic', 'Kinematic (scripted motion)'], ['dynamic', 'Dynamic (gravity)']], ph.body, v => { ph.body = v; commit('Physics'); }), 'How the object moves'));
    b.append(row('Solid', chk(ph.solid, v => { ph.solid = v; commit('Physics'); }), 'The player collides with it'));
    const bo = numIn(ph.bounce || 0, v => { ph.bounce = clamp(v, 0, 1.2); }, () => commit('Physics'), .05); b.append(row('Bounciness', bo, 'Rebound on impact (0–1)', bo, .05));
  });
  const p = e.props || {};
  if (Object.keys(p).length) sec(box, 'Properties', b => {
    if ('text' in p) { const ta = h('textarea', { class: 'ta', rows: 3 }); ta.value = p.text; ta.oninput = () => { p.text = ta.value; }; ta.onchange = () => commit('Sign text'); b.append(row('Message', ta, 'Shown when the player walks by')); }
    if (e.type === 'key' || e.type === 'door') b.append(row('Key color', sel_(Object.keys(PX.KEY_COLORS).map(k => [k, k[0].toUpperCase() + k.slice(1)]), p.color, v => { p.color = v; commit('Key color'); refreshInspector(); }), 'Keys open doors of the same color'));
    if ('what' in p) {
      b.append(row('Spawns', sel_(Object.keys(A).filter(k => k !== 'player').map(k => [k, A[k].name]), p.what, v => { p.what = v; commit('Spawner'); }), 'What comes out of the portal'));
      const ev = numIn(p.every, v => { p.every = Math.max(0, v); }, () => commit('Spawner'), .5); b.append(row('Every (s)', ev, '0 = only when a Rule says Spawn', ev, .5));
      const mx = numIn(p.max, v => { p.max = Math.max(1, Math.round(v)); }, () => commit('Spawner'), 1); b.append(row('Max alive', mx, 'Limit for timer spawns', mx, 1));
    }
    if ('kind' in p && e.type === 'light') {
      b.append(row('Light type', sel_([['point', 'Point (all around)'], ['spot', 'Spot (cone, aim with rotation)']], p.kind, v => { p.kind = v; commit('Light'); })));
      const it = numIn(p.intensity, v => { p.intensity = clamp(v, 0, 50); live3D(); }, () => commit('Light'), .5); b.append(row('Intensity', it, null, it, .5));
      const rg = numIn(p.range, v => { p.range = clamp(v, 1, 100); live3D(); }, () => commit('Light'), 1); b.append(row('Range (m)', rg, null, rg, 1));
    } else if ('kind' in p) {
      b.append(row('Power', sel_([['speed', 'Speed boost'], ['jump', 'Jump boost'], ['shield', 'Shield']], p.kind, v => { p.kind = v; commit('Power-up'); })));
      const d = numIn(p.duration, v => { p.duration = Math.max(1, v); }, () => commit('Power-up'), .5); b.append(row('Duration (s)', d, 'How long it lasts', d, .5));
    }
  });
  sec(box, 'Components', b => {
    for (const ck of Object.keys(e.comps)) {
      const C = CO[ck]; if (!C) continue; const c = e.comps[ck];
      const card = h('div', { class: 'comp' }, h('header', null, h('span', { class: 'g' }, C.glyph), C.label,
        h('button', { type: 'button', class: 'rm', 'data-tip': 'Remove component', 'aria-label': 'Remove ' + C.label, html: ic('x'), onclick: () => { delete e.comps[ck]; commit('Remove ' + C.label); refreshInspector(); } })));
      const cb = h('div', { class: 'cb' }, h('div', { class: 'cd' }, C.desc));
      for (const [k, type, label, a1, a2, a3] of C.params) {
        if (c[k] == null) c[k] = C.def[k];
        if (type === 'select') cb.append(row(label, sel_(a1.map(v => [v, v[0].toUpperCase() + v.slice(1)]), c[k], v => { c[k] = v; commit(C.label); })));
        else if (type === 'bool') cb.append(row(label, chk(c[k], v => { c[k] = v; commit(C.label); })));
        else { const n = numIn(c[k], v => { c[k] = clamp(v, a1, a2); live3D(); }, () => commit(C.label), a3); cb.append(row(label, n, a1 + ' … ' + a2, n, a3)); }
      }
      if (ck === 'mover') cb.append(h('p', { class: 'cd' }, 'The dashed blue box in the Scene shows point B.'));
      card.append(cb); b.append(card);
    }
    const free = Object.keys(CO).filter(k => !e.comps[k]);
    if (free.length) {
      const sl = h('select', { class: 'addbtn', 'aria-label': 'Add component' }, h('option', { value: '' }, '+ Add component…'), ...free.map(k => h('option', { value: k }, CO[k].label + ' — ' + CO[k].desc)));
      sl.onchange = () => { if (!sl.value) return; e.comps[sl.value] = PX.clone(CO[sl.value].def); if ((sl.value === 'mover' || sl.value === 'spinner') && e.phys.body === 'static') e.phys.body = 'kinematic'; commit('Add ' + CO[sl.value].label); refreshInspector(); log('Added ' + CO[sl.value].label + ' to ' + (e.name || a.name)); };
      b.append(h('div', { class: 'addc' }, sl));
    }
  }, h('span', { class: 'x', style: 'color:var(--mut);letter-spacing:0;font-weight:400' }, Object.keys(e.comps).length));
}
function inspectNone3D(box) {
  const P = E.P, S = P.settings;
  if (E.tool === 'place' && A[E.asset]) {
    const a = A[E.asset];
    box.append(h('div', { class: 'ihead' }, h('div', { class: 'big' }, assetIcon(E.asset)), h('div', { class: 'meta' }, h('b', null, a.name), h('div', { class: 'ty' }, h('span', null, a.cat), h('b', null, a.size.join(' × ') + ' m')))));
    box.append(h('div', { class: 'empty-insp' }, h('p', { style: 'margin:0 0 8px' }, a.desc), h('ul', null,
      h('li', null, h('b', null, '→'), 'Click any surface in the Scene to drop it there (snaps to the ' + E.grid3 + ' m grid).'),
      h('li', null, h('b', null, '→'), a.single ? 'Only one allowed — placing again moves it.' : 'Drag across the ground to paint several.'),
      h('li', null, h('b', null, 'Esc'), 'Back to the Move tool.'))));
    return;
  }
  const pick = P.entities.filter(e => e.comps.collectible && e.comps.collectible.counts).length, en = P.entities.filter(e => A[e.type].group === 'enemy').length;
  box.append(h('div', { class: 'empty-insp' }, h('h3', null, 'World'), h('div', null, 'Nothing selected. Click an object in the Scene or Hierarchy to edit it.'),
    h('div', { class: 'stats3' }, h('div', null, h('b', null, P.entities.length), h('span', null, 'objects')), h('div', null, h('b', null, pick), h('span', null, 'pickups')), h('div', null, h('b', null, en), h('span', null, 'enemies')))));
  sec(box, 'World', b => {
    b.append(row('Sky', sel_(Object.entries(PX.SKIES3D).map(([k, v]) => [k, v.name]), S.sky, v => { S.sky = v; commit('Sky'); refreshSettings(); })));
    b.append(row('Camera', sel_(Object.entries(PX.CAMS3D), S.camera, v => { S.camera = v; commit('Camera'); refreshSettings(); updStatus(); })));
    const w = numIn(S.world, v => { S.world = clamp(Math.round(v), 10, 400); }, () => { commit('World size'); updStatus(); }, 2); b.append(row('World (m)', w, 'Grid size & enemy path-finding area', w, 2));
  });
  box.append(h('div', { class: 'empty-insp' }, h('ul', null,
    h('li', null, h('b', null, '1'), 'Pick an asset, then click a surface to place it.'),
    h('li', null, h('b', null, '2'), 'Right-drag orbits, middle-drag pans, wheel zooms. F frames the selection.'),
    h('li', null, h('b', null, '3'), 'W / E / R switch the gizmo between move, rotate and scale.'),
    h('li', null, h('b', null, '4'), 'Add Rules below, then press F5 to play in 3D.'))));
}
function refreshSettings3D() {
  const box = $('#tab-settings'), S = E.P.settings; box.innerHTML = '';
  const g = h('div', { class: 'setgrid' });
  const c1 = h('div', { class: 'setcol' }, h('h5', null, 'Game'));
  const ti = h('input', { class: 'inp', id: 'set-title', value: S.title, maxlength: 60 }); ti.oninput = () => { S.title = ti.value; $('#projName').value = ti.value; }; ti.onchange = () => commit('Title');
  c1.append(row('Title', ti));
  const de = h('textarea', { class: 'ta', rows: 2, maxlength: 240, placeholder: 'One line that sells your game' }); de.value = S.desc; de.oninput = () => { S.desc = de.value; }; de.onchange = () => commit('Description');
  c1.append(row('Description', de));
  c1.append(row('Category', sel_(PX.CATEGORIES.map(c => [c, c]), S.category, v => { S.category = v; commit('Category'); })));
  const ws = numIn(S.winScore, v => { S.winScore = Math.max(0, Math.round(v)); }, () => commit('Win score'), 10);
  const wrow = row('Target score', ws, 'Score needed to win', ws, 10); wrow.hidden = S.win !== 'score';
  c1.append(row('Win when', sel_(Object.entries(PX.WINS), S.win, v => { S.win = v; wrow.hidden = v !== 'score'; commit('Win condition'); validateHint(); }), 'Every game also has a time limit'));
  c1.append(wrow);
  const li = numIn(S.lives, v => { S.lives = clamp(Math.round(v), 1, 99); }, () => commit('Lives'), 1); c1.append(row('Lives', li, 'Lives at the start', li, 1));
  const tl = numIn(S.timeLimit, v => { S.timeLimit = clamp(Math.round(v), 10, 3600); }, () => commit('Time limit'), 5); c1.append(row('Time limit (s)', tl, 'Every game has a time limit (default 180 s)', tl, 5));
  c1.append(h('p', { class: 'warnline', id: 'winWarn' }));
  const c2 = h('div', { class: 'setcol' }, h('h5', null, 'World & light'));
  const sw = h('div', { class: 'swatches' });
  for (const k in PX.SKIES3D) { const sk = PX.SKIES3D[k]; sw.append(h('button', { type: 'button', class: 'swatch wide' + (S.sky === k ? ' on' : ''), style: `background:linear-gradient(${sk.c[0]},${sk.c[1]},${sk.c[2]})`, 'data-tip': sk.name, 'aria-label': sk.name, onclick: () => { S.sky = k; commit('Sky'); refreshSettings(); } }, sk.name)); }
  c2.append(row('Sky', sw));
  const slider = (label, key, min, max, step, tip, fmt) => {
    const r = h('input', { type: 'range', min, max, step, value: S[key] }), v = h('span', { class: 'tx', style: 'width:46px;color:var(--fg2);text-align:right' }, fmt(S[key]));
    r.oninput = () => { S[key] = +r.value; v.textContent = fmt(S[key]); clearTimeout(E.slT); E.slT = setTimeout(sync3D, 60); }; r.onchange = () => commit(label);
    return row(label, h('div', { class: 'rng' }, r, v), tip);
  };
  c2.append(slider('Fog', 'fog', 0, 1, .05, 'Atmospheric haze', v => Math.round(v * 100) + '%'));
  c2.append(slider('Sun height', 'sunAngle', 3, 89, 1, 'Low sun = long shadows', v => v + '°'));
  c2.append(slider('Sun direction', 'sunDir', 0, 360, 5, 'Compass direction of the sun', v => v + '°'));
  c2.append(slider('Ambient', 'ambient', 0, 1.5, .05, 'Fill light from the sky', v => Math.round(v * 100) + '%'));
  c2.append(slider('Gravity', 'gravity', 4, 60, 1, 'm/s² (Earth-ish games feel best around 20–30)', v => v));
  const ky = numIn(S.killY, v => { S.killY = clamp(v, -500, 500); }, () => commit('Kill height'), 1); c2.append(row('Fall-out Y', ky, 'Falling below this height loses a life', ky, 1));
  const c3 = h('div', { class: 'setcol' }, h('h5', null, 'Camera & music'));
  const cc = h('div', { class: 'chips' });
  for (const k in PX.CAMS3D) cc.append(h('button', { type: 'button', class: 'chip' + (S.camera === k ? ' on' : ''), onclick: () => { S.camera = k; commit('Camera'); refreshSettings(); updStatus(); } }, PX.CAMS3D[k]));
  c3.append(row('Camera', cc, 'Players can also press C in game'));
  const mc = h('div', { class: 'chips' });
  for (const k in PX.MOODS) mc.append(h('button', { type: 'button', class: 'chip' + (S.music.mood === k ? ' on' : ''), onclick: () => { S.music.mood = k; commit('Music'); refreshSettings(); } }, PX.MOODS[k]));
  c3.append(row('Music', mc));
  const tr = h('input', { type: 'range', min: 60, max: 200, step: 2, value: S.music.tempo }), tv = h('span', { class: 'tx', style: 'width:54px;color:var(--fg2)' }, S.music.tempo + ' bpm');
  tr.oninput = () => { S.music.tempo = +tr.value; tv.textContent = tr.value + ' bpm'; }; tr.onchange = () => commit('Tempo');
  c3.append(row('Tempo', h('div', { class: 'rng' }, tr, tv)));
  c3.append(h('p', { class: 'note' }, h('kbd', null, 'WASD'), ' move · ', h('kbd', null, 'Space'), ' jump · ', h('kbd', null, 'Shift'), ' sprint · click + mouse to look (or ', h('kbd', null, '←'), h('kbd', null, '→'), ') · ', h('kbd', null, 'X'), ' shoot · ', h('kbd', null, 'C'), ' camera · ', h('kbd', null, 'G'), ' graphics quality.'));
  g.append(c1, c2, c3); box.append(g); validateHint();
}

/* ================================================================ play-only view */
async function bootPlayer(qs) {
  $('#app').hidden = true; $('#player').hidden = false; document.title = 'Play · Pixel Arcade';
  const hash = location.hash.slice(1); let P = null, err = null;
  try {
    if (hash.length > 4) P = await decodeProject(hash);
    else if (qs.get('game')) { const g = myGames().find(x => x.id === qs.get('game')); if (g) P = PX.normalize(PX.clone(g.data)); }
    else if (qs.get('p')) { const r = readProjects().find(x => x.id === qs.get('p')); if (r) P = PX.normalize(PX.clone(r.data)); }
  } catch (e) { err = e; }
  if (!P) {
    $('#pName').textContent = 'Game not found'; $('#pDesc').textContent = err ? 'This link could not be opened (' + err.message + ').' : 'The link is missing its game data.';
    $('#pStart').textContent = 'Open the builder'; $('#pStart').onclick = () => { location.href = './'; }; $('#pRemix').hidden = true; return;
  }
  const S = P.settings, pl = P.entities.find(e => e.comps.player), mode = pl ? pl.comps.player.mode : 'platformer';
  document.title = S.title + ' · Pixel Arcade';
  $('#pTitle').textContent = S.title; $('#pName').textContent = S.title; $('#pDesc').textContent = S.desc || ''; $('#pCat').textContent = (S.category + ' · ' + PX.WINS[S.win] + ' · ' + S.timeLimit + 's').toUpperCase();
  $('#pCtrl').innerHTML = mode === 'platformer' ? '<kbd>←</kbd><kbd>→</kbd> move · <kbd>Space</kbd> jump' + (pl && pl.comps.player.canShoot ? ' · <kbd>X</kbd> shoot' : '') + ' · <kbd>P</kbd> pause · <kbd>M</kbd> mute'
    : '<kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd> move' + (pl && pl.comps.player.canShoot ? ' · <kbd>Space</kbd> shoot' : '') + ' · <kbd>P</kbd> pause · <kbd>M</kbd> mute';
  const code = hash.length > 4 ? hash : await encodeProject(P);
  $('#pRemix').href = './#' + code;
  $('#pMute').textContent = PX.Audio.muted ? 'Sound off' : 'Sound on';
  $('#pMute').onclick = () => { PX.Audio.toggle(); $('#pMute').textContent = PX.Audio.muted ? 'Sound off' : 'Sound on'; };
  const host = $('#pStage');
  if (P.dim === '3d') {
    $('#pCtrl').innerHTML = '<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> move · <kbd>Space</kbd> jump · <kbd>Shift</kbd> sprint · click + mouse to look' + (pl && pl.comps.player.canShoot ? ' · <kbd>X</kbd>/click shoot' : '') + ' · <kbd>C</kbd> camera · <kbd>G</kbd> graphics';
    $('#pCv').hidden = true; $('#pCat').textContent = '3D · ' + $('#pCat').textContent; $('#pStart').disabled = true; $('#pStart').textContent = 'Loading 3D…';
    let E3; try { E3 = await load3D(); } catch (e) { $('#pDesc').textContent = 'Your browser could not start WebGL for this 3D game.'; return; }
    try { const th = E3.thumb(P, 960, 540); host.style.background = `#000 url(${th.toDataURL('image/jpeg', .85)}) center/cover no-repeat`; } catch (e) { /* ignore */ }
    $('#pStart').disabled = false; $('#pStart').textContent = '▶ Play';
    const start3 = () => {
      if (E.started) return; E.started = true; $('#pIntro').hidden = true; PX.Audio.init(); host.style.background = '#000';
      const gh = h('div', { class: 'g3host' }); host.prepend(gh);
      E.game = new E3.Game3D(gh, P, { host, noLock: matchMedia('(pointer:coarse)').matches, hint: !matchMedia('(pointer:coarse)').matches, onEnd: r => { E.lastResult = r; }, endButtons: [{ label: 'Remix in builder', fn: () => { location.href = $('#pRemix').href; } }] });
    };
    $('#pStart').onclick = start3;
    addEventListener('keydown', ev => { if (!E.started && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); start3(); } });
    $('#pRestart').onclick = () => { if (E.started && E.game) E.game.restart(); else start3(); };
    $$('#touch [data-k]').forEach(b => {
      const k = b.dataset.k, on = ev => { ev.preventDefault(); if (E.game) E.game.setTouch(k, true); }, off = ev => { ev.preventDefault(); if (E.game) E.game.setTouch(k, false); };
      b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off);
    });
    return;
  }
  // idle preview behind intro
  const pv = new PX.Game($('#pCv'), P, { silent: true, preview: true }); pv.paused = true;
  E.game = pv;
  const start = () => {
    if (E.started) return; E.started = true; $('#pIntro').hidden = true; pv.destroy(); PX.Audio.init();
    E.game = new PX.Game($('#pCv'), P, { host, onEnd: r => { E.lastResult = r; }, endButtons: [{ label: 'Remix in builder', fn: () => { location.href = $('#pRemix').href; } }] });
  };
  $('#pStart').onclick = start;
  addEventListener('keydown', function k(ev) { if (!E.started && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); start(); } });
  $('#pRestart').onclick = () => { if (E.started && E.game) E.game.restart(); else start(); };
  $$('#touch [data-k]').forEach(b => {
    const k = b.dataset.k, on = ev => { ev.preventDefault(); if (E.game) E.game.setTouch(k, true); }, off = ev => { ev.preventDefault(); if (E.game) E.game.setTouch(k, false); };
    b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off);
  });
}

/* ================================================================ boot */
async function bootEditor() {
  wireToolbar(); buildAssets(); wireScene(); wireBottom(); wireKeys(); wireTips();
  let P = null, fromHash = false;
  const hash = location.hash.slice(1);
  if (hash.length > 4) {
    try { P = await decodeProject(hash); P.id = PX.uid(); fromHash = true; } catch (e) { log('Could not open shared link: ' + e.message, 'err'); toast('That share link looks broken', 'err'); }
    history.replaceState(null, '', location.pathname);
  }
  const firstVisit = !lsGet(LS.tour, false) && !readProjects().length;
  if (!P) { const last = lsGet(LS.last, null), list = readProjects(); const rec = list.find(r => r.id === last) || list[0]; if (rec) { try { P = PX.normalize(PX.clone(rec.data)); } catch (e) { log('Saved project was damaged: ' + e.message, 'err'); } } }
  const isNew = !P;
  if (!P) P = PX.newProject('platformer');
  loadProject(P, { save: isNew || fromHash }); setTool('select');
  if (fromHash) { toast('Shared game imported — remix away!', 'ok'); log('Imported a shared game as a new project: ' + P.settings.title, 'ok'); }
  loop();
  log('Builder ready — ' + E.P.settings.title + '. Press F5 to play, ? for shortcuts.', 'ok');
  if (firstVisit && !fromHash) setTimeout(startTour, 500);
}
function boot() {
  const qs = new URLSearchParams(location.search);
  const go = () => qs.has('play') ? bootPlayer(qs) : bootEditor();
  (document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1200))]) : Promise.resolve()).then(go);
}
PX.builder = { setSel, setTool, focusSel, frameLevel, frameStart, slim, encodeProject, decodeProject, startPlay, stopPlay, undo, redo, saveProject, loadProject, newFromTemplate, setTab, log, publishLocal, shareUrl };
boot();
})();
