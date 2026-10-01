/* Pixel Arcade Builder — 3D definitions: assets, components, settings, textures, templates */
(function () {
'use strict';
const PX = window.PXB, clone = PX.clone, H = PX.hash2;

/* ------------------------------------------------------------------ components (3D units: metres, m/s) */
const C2 = PX.COMPS;
PX.COMPS3D = {
  player: { label: 'Player Controller', glyph: '◆', desc: 'The hero: WASD / arrows, Space jump, Shift sprint.', params: [
    ['speed', 'num', 'Walk speed', 1, 30, .5], ['sprint', 'num', 'Sprint ×', 1, 3, .1], ['jump', 'num', 'Jump power', 2, 30, .5],
    ['doubleJump', 'bool', 'Double jump'], ['canShoot', 'bool', 'Can shoot'], ['fireRate', 'num', 'Shots / sec', 1, 15, 1]],
    def: { speed: 6, sprint: 1.6, jump: 8.5, doubleJump: false, canShoot: false, fireRate: 4 } },
  patrol: { label: 'Patrol', glyph: '↔', desc: 'Walks back and forth from its start.', params: [
    ['axis', 'select', 'Axis', ['x', 'z']], ['distance', 'num', 'Distance (m)', 0, 200, .5], ['speed', 'num', 'Speed', 0, 30, .25]],
    def: { axis: 'x', distance: 6, speed: 2.5 } },
  chase: { label: 'Chase', glyph: '➚', desc: 'Hunts the player when in range.', params: [
    ['speed', 'num', 'Speed', 0, 30, .25], ['range', 'num', 'Sight range (m)', 0, 300, 1], ['smart', 'bool', 'Path-find around walls']],
    def: { speed: 3.2, range: 14, smart: true } },
  shooter: { label: 'Shooter', glyph: '✦', desc: 'Fires bolts at the player.', params: [
    ['rate', 'num', 'Seconds between', .2, 10, .1], ['speed', 'num', 'Bolt speed', 1, 60, .5], ['range', 'num', 'Range (m)', 1, 200, 1]],
    def: { rate: 1.8, speed: 11, range: 18 } },
  collectible: C2.collectible, hazard: C2.hazard, goal: C2.goal,
  bounce: { label: 'Jump Pad', glyph: '⤒', desc: 'Launches the player upward.', params: [['power', 'num', 'Power', 2, 60, .5]], def: { power: 15 } },
  mover: { label: 'Mover (Path)', glyph: '⇢', desc: 'Moves between point A and point B.', params: [
    ['dx', 'num', 'B offset X', -200, 200, .5], ['dy', 'num', 'B offset Y', -200, 200, .5], ['dz', 'num', 'B offset Z', -200, 200, .5],
    ['speed', 'num', 'Speed', .1, 40, .25], ['pause', 'num', 'Pause (s)', 0, 10, .1], ['loop', 'select', 'Loop', ['pingpong', 'once']]],
    def: { dx: 6, dy: 0, dz: 0, speed: 2.5, pause: .5, loop: 'pingpong' } },
  spinner: { label: 'Spinner', glyph: '↻', desc: 'Rotates around the vertical axis and carries riders.', params: [['speed', 'num', 'Degrees / sec', -720, 720, 5]], def: { speed: 45 } },
  health: C2.health
};
const comp = (k, o = {}) => Object.assign(clone(PX.COMPS3D[k].def), o);

/* ------------------------------------------------------------------ assets */
const ph = (o = {}) => Object.assign({ body: 'static', solid: false, bounce: 0 }, o);
const enemy = x => Object.assign({ hazard: comp('hazard', { stompable: true }), health: comp('health') }, x);
PX.CATS3D = ['All', 'Characters', 'Building', 'Items', 'Hazards', 'Logic', 'Nature'];
// shape = visual + collider family; size = base size (m); sprite = 2D icon fallback
PX.ASSETS3D = {
  player: { name: 'Player', cat: 'Characters', group: 'player', shape: 'player', size: [.8, 1.8, .8], color: '#ff4d00', sprite: 'player', single: true, desc: 'Capsule hero. WASD move, Space jump, Shift sprint, mouse look.', phys: ph({ body: 'dynamic' }), comps: { player: comp('player'), health: comp('health', { hp: 1, invuln: 1.2, points: 0 }) } },
  enemy_patrol: { name: 'Patroller', cat: 'Characters', group: 'enemy', shape: 'slime', size: [1.1, .9, 1.1], color: '#6ee06e', sprite: 'slime', desc: 'Bouncy blob that patrols. Jump on it!', phys: ph({ body: 'dynamic' }), comps: enemy({ patrol: comp('patrol') }) },
  enemy_chase: { name: 'Chaser', cat: 'Characters', group: 'enemy', shape: 'ghost', size: [1, 1.2, 1], color: '#c8d2ff', sprite: 'ghost', desc: 'Floating ghost that hunts the player.', phys: ph({ body: 'kinematic' }), comps: enemy({ chase: comp('chase'), hazard: comp('hazard') }) },
  enemy_shooter: { name: 'Turret', cat: 'Characters', group: 'enemy', shape: 'turret', size: [1.2, 1.4, 1.2], color: '#9a9ab0', sprite: 'turret', desc: 'Stationary turret that fires at the player.', phys: ph({ solid: true }), comps: enemy({ shooter: comp('shooter'), hazard: comp('hazard'), health: comp('health', { hp: 3, points: 100 }) }) },
  ground: { name: 'Ground', cat: 'Building', group: 'block', shape: 'box', size: [4, 1, 4], color: '#ffffff', tex: 'grass', sprite: 'grass', desc: 'Solid grassy slab. Scale it up for big floors.', phys: ph({ solid: true }), comps: {} },
  block: { name: 'Block', cat: 'Building', group: 'block', shape: 'box', size: [2, 2, 2], color: '#ffffff', tex: 'stone', sprite: 'stone', desc: 'Solid box — the basic building brick.', phys: ph({ solid: true }), comps: {} },
  wall: { name: 'Wall', cat: 'Building', group: 'block', shape: 'box', size: [4, 3, .5], color: '#ffffff', tex: 'brick', sprite: 'brick', desc: 'Brick wall segment.', phys: ph({ solid: true }), comps: {} },
  ramp: { name: 'Ramp', cat: 'Building', group: 'block', shape: 'ramp', size: [3, 1.5, 3], color: '#ffffff', tex: 'wood', sprite: 'wood', desc: 'Wedge that rises toward +X. Rotate it to aim.', phys: ph({ solid: true }), comps: {} },
  pillar: { name: 'Pillar', cat: 'Building', group: 'block', shape: 'cyl', size: [1.2, 4, 1.2], color: '#ffffff', tex: 'stone', sprite: 'stone', desc: 'Solid cylinder. Flatten it for round floors.', phys: ph({ solid: true }), comps: {} },
  platform: { name: 'Moving Platform', cat: 'Building', group: 'platform', shape: 'box', size: [3, .5, 3], color: '#ffffff', tex: 'metal', sprite: 'platform', desc: 'Travels from A to B and carries the player.', phys: ph({ body: 'kinematic', solid: true }), comps: { mover: comp('mover') } },
  rotator: { name: 'Rotating Platform', cat: 'Building', group: 'platform', shape: 'box', size: [6, .5, 1.6], color: '#ffd84a', tex: 'metal', sprite: 'platform', desc: 'Spinning bar that carries riders around.', phys: ph({ body: 'kinematic', solid: true }), comps: { spinner: comp('spinner') } },
  crate: { name: 'Crate', cat: 'Building', group: 'block', shape: 'box', size: [1, 1, 1], color: '#ffffff', tex: 'crate', sprite: 'crate', desc: 'Wooden crate. Dynamic: it falls.', phys: ph({ body: 'dynamic', solid: true }), comps: {} },
  house: { name: 'House', cat: 'Building', group: 'block', shape: 'house', size: [5, 4.5, 5], color: '#f0e2c8', sprite: 'sign', desc: 'A cosy cottage. Solid walls.', phys: ph({ solid: true }), comps: {} },
  door: { name: 'Door', cat: 'Logic', group: 'door', shape: 'door', size: [2, 3, .4], color: '#ffffff', tex: 'wood', sprite: 'door', desc: 'Solid until the player brings a matching key.', phys: ph({ solid: true }), comps: {}, props: { color: 'gold' } },
  coin: { name: 'Coin', cat: 'Items', group: 'collectible', shape: 'coin', size: [.7, .7, .15], color: '#ffd84a', sprite: 'coin', paint: true, desc: 'Spinning coin worth points.', phys: ph(), comps: { collectible: comp('collectible') } },
  gem: { name: 'Gem', cat: 'Items', group: 'collectible', shape: 'gem', size: [.7, .9, .7], color: '#4ab4ff', sprite: 'gem', paint: true, desc: 'Rare crystal worth more points.', phys: ph(), comps: { collectible: comp('collectible', { score: 50, sound: 'gem' }) } },
  key: { name: 'Key', cat: 'Items', group: 'key', shape: 'key', size: [.9, .45, .15], color: '#ffd84a', sprite: 'key', desc: 'Opens a Door of the same color.', phys: ph(), comps: { collectible: comp('collectible', { score: 0, counts: false, sound: 'key' }) }, props: { color: 'gold' } },
  pw_speed: { name: 'Speed Boost', cat: 'Items', group: 'powerup', shape: 'orb', size: [.8, .8, .8], color: '#4ab4ff', sprite: 'pw_speed', desc: 'Run 50% faster for a while.', phys: ph(), comps: { collectible: comp('collectible', { score: 0, counts: false, sound: 'power' }) }, props: { kind: 'speed', duration: 8 } },
  pw_jump: { name: 'Jump Boost', cat: 'Items', group: 'powerup', shape: 'orb', size: [.8, .8, .8], color: '#6ee06e', sprite: 'pw_jump', desc: 'Jump higher for a while.', phys: ph(), comps: { collectible: comp('collectible', { score: 0, counts: false, sound: 'power' }) }, props: { kind: 'jump', duration: 8 } },
  pw_shield: { name: 'Shield', cat: 'Items', group: 'powerup', shape: 'orb', size: [.8, .8, .8], color: '#b07aff', sprite: 'pw_shield', desc: 'Invincible — and enemies you touch pop.', phys: ph(), comps: { collectible: comp('collectible', { score: 0, counts: false, sound: 'power' }) }, props: { kind: 'shield', duration: 7 } },
  life: { name: 'Extra Life', cat: 'Items', group: 'life', shape: 'heart', size: [.8, .8, .3], color: '#ff3b3b', sprite: 'heart', desc: 'One more life.', phys: ph(), comps: { collectible: comp('collectible', { score: 0, counts: false, sound: 'power' }) } },
  lava: { name: 'Lava', cat: 'Hazards', group: 'hazard', shape: 'lava', size: [6, .4, 6], color: '#ff6a1a', tex: 'lava', sprite: 'lava', desc: 'Glowing lava. Instant knock-out.', phys: ph(), comps: { hazard: comp('hazard', { damage: 99 }) } },
  killzone: { name: 'Kill Zone', cat: 'Hazards', group: 'hazard', shape: 'zone', size: [10, 1, 10], color: '#ff3b3b', sprite: 'spikes', desc: 'Invisible in play. Knocks out anything inside.', phys: ph(), comps: { hazard: comp('hazard', { damage: 99 }) } },
  spikes: { name: 'Spikes', cat: 'Hazards', group: 'hazard', shape: 'spikes', size: [2, .6, 2], color: '#d8d8e4', sprite: 'spikes', desc: 'Sharp! Hurts on touch.', phys: ph(), comps: { hazard: comp('hazard') } },
  water: { name: 'Water', cat: 'Hazards', group: 'water', shape: 'water', size: [10, 2, 10], color: '#2a9fd6', sprite: 'ice', desc: 'Swim! Gravity is weaker inside. Hold Space to rise.', phys: ph(), comps: {} },
  spring: { name: 'Jump Pad', cat: 'Logic', group: 'bounce', shape: 'pad', size: [1.4, .3, 1.4], color: '#ff3b3b', sprite: 'spring', desc: 'Boing! Launches the player high.', phys: ph(), comps: { bounce: comp('bounce') } },
  goal: { name: 'Goal Portal', cat: 'Logic', group: 'goal', shape: 'portal', size: [2.2, 3, .6], color: '#ff4d00', sprite: 'flag', desc: 'Step through to win.', phys: ph(), comps: { goal: comp('goal') } },
  checkpoint: { name: 'Checkpoint', cat: 'Logic', group: 'checkpoint', shape: 'checkpoint', size: [1, 2.4, 1], color: '#4ab4ff', sprite: 'checkpoint', desc: 'Respawn here after a fall or knock-out.', phys: ph(), comps: {} },
  spawner: { name: 'Spawner', cat: 'Logic', group: 'spawner', shape: 'spawner', size: [1.8, .3, 1.8], color: '#b07aff', sprite: 'spawner', desc: 'Portal pad that spawns things (timer or Rules).', phys: ph(), comps: {}, props: { what: 'enemy_chase', every: 0, max: 6 } },
  sign: { name: 'Sign', cat: 'Logic', group: 'sign', shape: 'sign', size: [1.4, 1.7, .2], color: '#f0c090', sprite: 'sign', desc: 'Shows a message when the player walks by.', phys: ph(), comps: {}, props: { text: 'Hello, adventurer!' } },
  light: { name: 'Light', cat: 'Logic', group: 'light', shape: 'light', size: [.4, .4, .4], color: '#ffc27a', sprite: 'star', desc: 'Point or spot light.', phys: ph(), comps: {}, props: { kind: 'point', intensity: 6, range: 12 } },
  tree: { name: 'Tree', cat: 'Nature', group: 'decor', shape: 'tree', size: [2.2, 4.5, 2.2], color: '#3fae52', sprite: 'tree', desc: 'Low-poly tree. Trunk is solid.', phys: ph({ solid: true }), comps: {} },
  pine: { name: 'Pine', cat: 'Nature', group: 'decor', shape: 'pine', size: [2, 5, 2], color: '#1f7a45', sprite: 'pine', desc: 'Pine tree. Trunk is solid.', phys: ph({ solid: true }), comps: {} },
  rock: { name: 'Rock', cat: 'Nature', group: 'decor', shape: 'rock', size: [1.6, 1.1, 1.6], color: '#8f8fa3', sprite: 'rock', desc: 'Chunky rock. Solid.', phys: ph({ solid: true }), comps: {} },
  bush: { name: 'Bush', cat: 'Nature', group: 'decor', shape: 'bush', size: [1.4, .9, 1.4], color: '#4fbf5a', sprite: 'bush', desc: 'Leafy bush (walk through).', phys: ph(), comps: {} }
};
PX.TEXTURES3D = { none: 'None', grass: 'Grass', stone: 'Stone', wood: 'Wood', brick: 'Brick', sand: 'Sand', metal: 'Metal panel', tiles: 'Tiles', crate: 'Crate', checker: 'Checker', grid: 'Proto grid', lava: 'Lava', water: 'Water' };
PX.FINISHES = { matte: 'Matte', metal: 'Metal', glass: 'Glass', glow: 'Glow' };
PX.SKIES3D = {
  day: { name: 'Day', c: ['#3f8fe0', '#9fd2ff', '#e6f4ff'], fog: '#bfe0ff' },
  sunset: { name: 'Sunset', c: ['#2b1055', '#e0567a', '#ffc27a'], fog: '#e8a07a' },
  night: { name: 'Night', c: ['#02030a', '#0b1440', '#26407a'], fog: '#0d1736' },
  space: { name: 'Space', c: ['#000000', '#090320', '#1d0838'], fog: '#120626' }
};
PX.CAMS3D = { third: 'Third-person', first: 'First-person', top: 'Top-down' };
PX.EVENTS.fall = { label: 'Fall', fmt: ['player falls below Y', 'n'], def: { n: -5 }, only: '3d' };
PX.ACTIONS.respawn = { label: 'Respawn at checkpoint', f: [] };

PX.defaultSettings3D = () => ({ title: 'Untitled 3D Game', desc: '', category: 'Platformer', sky: 'day', fog: .25, sunAngle: 50, sunDir: 35, ambient: .6, gravity: 24,
  camera: 'third', lives: 3, timeLimit: 180, win: 'goal', winScore: 100, music: { mood: 'happy', tempo: 120 }, killY: -15, world: 60 });

PX.newEntity3D = (type, p = [0, 0, 0]) => {
  const A = PX.ASSETS3D[type]; if (!A) return null;
  return { id: 0, type, name: '', p: [p[0], p[1], p[2]], r: [0, 0, 0], s: [1, 1, 1], color: A.color, mat: A.mat || (type === 'gem' ? 'glass' : (A.group === 'powerup' || type === 'goal') ? 'glow' : (type === 'coin' || type === 'key') ? 'metal' : 'matte'),
    tex: A.tex || 'none', cast: true, recv: true, phys: clone(A.phys), comps: clone(A.comps), props: clone(A.props || {}) };
};
PX.size3 = e => { const b = (PX.ASSETS3D[e.type] || {}).size || [1, 1, 1]; return [b[0] * e.s[0], b[1] * e.s[1], b[2] * e.s[2]]; };

PX.normalize3D = P => {
  P.dim = '3d';
  P.settings = Object.assign(PX.defaultSettings3D(), P.settings || {});
  P.settings.music = Object.assign({ mood: 'happy', tempo: 120 }, P.settings.music || {});
  P.rules = Array.isArray(P.rules) ? P.rules : []; P.sprites = P.sprites || {};
  let max = 0;
  P.entities = (P.entities || []).filter(e => e && PX.ASSETS3D[e.type]).map(e => {
    const base = PX.newEntity3D(e.type), out = Object.assign(base, e);
    ['p', 'r', 's'].forEach(k => { const d = k === 's' ? 1 : 0; out[k] = [0, 1, 2].map(i => { const v = +((e[k] || [])[i]); return isFinite(v) ? v : d; }); });
    out.phys = Object.assign(base.phys, e.phys || {}); out.comps = e.comps || {}; out.props = Object.assign(clone(PX.ASSETS3D[e.type].props || {}), e.props || {});
    max = Math.max(max, out.id | 0); return out;
  });
  P.entities.forEach(e => { if (!e.id) e.id = ++max; });
  P.nextId = Math.max(P.nextId || 1, max + 1); P.id = P.id || PX.uid(); P.v = 1;
  return P;
};
const norm2d = PX.normalize;
PX.normalize = P => (P && P.dim === '3d') ? PX.normalize3D(P) : norm2d(P);

/* ------------------------------------------------------------------ procedural textures (2D canvases, shared with the module) */
const texCache = {};
function cv(n = 256) { const c = document.createElement('canvas'); c.width = c.height = n; return c; }
function noise(x, n, a, cols, seed, size = 2) { for (let i = 0; i < n; i++) { x.fillStyle = cols[i % cols.length]; x.globalAlpha = a * (.4 + H(i, seed) * .6); x.fillRect(H(i, seed + 1) * 256, H(i, seed + 2) * 256, size + H(i, seed + 3) * size, size + H(i, seed + 4) * size); } x.globalAlpha = 1; }
const TEX = {
  grass(x) { x.fillStyle = '#4c9a3f'; x.fillRect(0, 0, 256, 256); noise(x, 2600, .5, ['#3a7f33', '#62b54c', '#7dc75a', '#2f6b2b'], 11, 3); x.strokeStyle = 'rgba(160,230,120,.35)'; for (let i = 0; i < 260; i++) { const px = H(i, 21) * 256, py = H(i, 22) * 256; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (H(i, 23) - .5) * 4, py - 4 - H(i, 24) * 5); x.stroke(); } },
  stone(x) { x.fillStyle = '#8a8b95'; x.fillRect(0, 0, 256, 256); noise(x, 1800, .35, ['#6c6d78', '#a3a4ad', '#7b7c86'], 31, 4); x.strokeStyle = 'rgba(30,30,40,.55)'; x.lineWidth = 3; for (let i = 0; i <= 2; i++) { x.beginPath(); x.moveTo(0, i * 128); x.lineTo(256, i * 128); x.stroke(); } for (let r = 0; r < 2; r++) for (let i = 0; i <= 2; i++) { const xx = i * 128 + (r % 2) * 64; x.beginPath(); x.moveTo(xx, r * 128); x.lineTo(xx, r * 128 + 128); x.stroke(); } x.strokeStyle = 'rgba(255,255,255,.12)'; x.lineWidth = 2; for (let i = 0; i < 2; i++) { x.beginPath(); x.moveTo(0, i * 128 + 3); x.lineTo(256, i * 128 + 3); x.stroke(); } },
  wood(x) { x.fillStyle = '#9b6a3e'; x.fillRect(0, 0, 256, 256); for (let p = 0; p < 4; p++) { x.fillStyle = ['#a8743f', '#94633a', '#9f6c41', '#8c5c33'][p]; x.fillRect(0, p * 64, 256, 62); x.strokeStyle = 'rgba(70,40,20,.35)'; x.lineWidth = 1; for (let i = 0; i < 9; i++) { x.beginPath(); const y0 = p * 64 + 6 + i * 6; x.moveTo(0, y0); for (let xx = 0; xx <= 256; xx += 16) x.lineTo(xx, y0 + Math.sin(xx * .04 + i + p) * 2); x.stroke(); } x.fillStyle = 'rgba(40,20,10,.6)'; x.fillRect(0, p * 64 + 62, 256, 2); x.fillStyle = '#5a3a20'; x.beginPath(); x.arc(14 + p * 50 % 200, p * 64 + 32, 2.5, 0, 7); x.fill(); } },
  brick(x) { x.fillStyle = '#c9c0b4'; x.fillRect(0, 0, 256, 256); for (let r = 0; r < 8; r++) for (let i = -1; i < 4; i++) { const bx = i * 64 + (r % 2) * 32 + 3, by = r * 32 + 3; x.fillStyle = ['#a8452f', '#b4513a', '#9c3d2a', '#bd5a40'][(r * 3 + i + 4) % 4]; x.fillRect(bx, by, 58, 26); x.fillStyle = 'rgba(255,255,255,.08)'; x.fillRect(bx, by, 58, 4); } noise(x, 900, .2, ['#000', '#fff'], 41, 2); },
  sand(x) { x.fillStyle = '#e2c98f'; x.fillRect(0, 0, 256, 256); noise(x, 4000, .35, ['#d4b87a', '#f0dcaa', '#c9a96b'], 51, 2); x.strokeStyle = 'rgba(180,140,80,.25)'; x.lineWidth = 2; for (let i = 0; i < 6; i++) { x.beginPath(); for (let xx = 0; xx <= 256; xx += 8) x.lineTo(xx, i * 44 + 20 + Math.sin(xx * .05 + i) * 6); x.stroke(); } },
  metal(x) { const g = x.createLinearGradient(0, 0, 256, 256); g.addColorStop(0, '#9aa0ac'); g.addColorStop(1, '#7c828e'); x.fillStyle = g; x.fillRect(0, 0, 256, 256); x.strokeStyle = 'rgba(255,255,255,.06)'; for (let i = 0; i < 256; i += 3) { x.beginPath(); x.moveTo(0, i); x.lineTo(256, i); x.stroke(); } x.strokeStyle = 'rgba(20,24,32,.6)'; x.lineWidth = 3; x.strokeRect(2, 2, 252, 252); x.strokeRect(2, 2, 124, 124); x.strokeRect(130, 130, 124, 124); x.fillStyle = '#d9dde4'; [[12, 12], [116, 12], [12, 116], [116, 116], [140, 140], [244, 140], [140, 244], [244, 244]].forEach(([a, b]) => { x.beginPath(); x.arc(a, b, 3.5, 0, 7); x.fill(); }); },
  tiles(x) { x.fillStyle = '#d9d4cc'; x.fillRect(0, 0, 256, 256); for (let r = 0; r < 4; r++) for (let i = 0; i < 4; i++) { x.fillStyle = (r + i) % 2 ? '#e8e3db' : '#cfc9bf'; x.fillRect(i * 64 + 2, r * 64 + 2, 60, 60); } noise(x, 600, .12, ['#000'], 61, 2); },
  crate(x) { TEX.wood(x); x.strokeStyle = '#5a3a1e'; x.lineWidth = 22; x.strokeRect(11, 11, 234, 234); x.lineWidth = 18; x.beginPath(); x.moveTo(20, 20); x.lineTo(236, 236); x.stroke(); x.strokeStyle = '#c08a52'; x.lineWidth = 4; x.strokeRect(22, 22, 212, 212); },
  checker(x) { for (let r = 0; r < 4; r++) for (let i = 0; i < 4; i++) { x.fillStyle = (r + i) % 2 ? '#3a3d48' : '#585c6a'; x.fillRect(i * 64, r * 64, 64, 64); } },
  grid(x) { x.fillStyle = '#2b2d36'; x.fillRect(0, 0, 256, 256); x.strokeStyle = 'rgba(255,255,255,.12)'; x.lineWidth = 1; for (let i = 0; i <= 256; i += 32) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 256); x.moveTo(0, i); x.lineTo(256, i); x.stroke(); } x.strokeStyle = '#ff4d00'; x.lineWidth = 3; x.strokeRect(1.5, 1.5, 253, 253); x.fillStyle = 'rgba(255,77,0,.85)'; x.font = '700 22px monospace'; x.fillText('1m', 10, 30); },
  lava(x) { x.fillStyle = '#2a0805'; x.fillRect(0, 0, 256, 256); for (let i = 0; i < 70; i++) { const px = H(i, 71) * 256, py = H(i, 72) * 256, r = 10 + H(i, 73) * 30; const g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, '#ffe08a'); g.addColorStop(.35, '#ff8a1a'); g.addColorStop(1, 'rgba(160,30,10,0)'); x.fillStyle = g; x.fillRect(px - r, py - r, r * 2, r * 2); } x.strokeStyle = 'rgba(40,6,4,.9)'; x.lineWidth = 3; for (let i = 0; i < 18; i++) { x.beginPath(); let px = H(i, 74) * 256, py = H(i, 75) * 256; x.moveTo(px, py); for (let k = 0; k < 5; k++) { px += (H(i, 76 + k) - .5) * 60; py += (H(i, 81 + k) - .5) * 60; x.lineTo(px, py); } x.stroke(); } },
  water(x) { x.fillStyle = '#2a8fd0'; x.fillRect(0, 0, 256, 256); for (let i = 0; i < 160; i++) { x.strokeStyle = `rgba(255,255,255,${.05 + H(i, 91) * .12})`; x.lineWidth = 1 + H(i, 92) * 2; const px = H(i, 93) * 256, py = H(i, 94) * 256; x.beginPath(); x.ellipse(px, py, 8 + H(i, 95) * 20, 2 + H(i, 96) * 4, 0, 0, Math.PI); x.stroke(); } }
};
PX.texCanvas = name => {
  if (!TEX[name]) return null; if (texCache[name]) return texCache[name];
  const c = cv(), x = c.getContext('2d'); TEX[name](x);
  // make it tile seamlessly: mirror-blend edges lightly
  texCache[name] = c; return c;
};

/* ------------------------------------------------------------------ templates */
function lb3() {
  const es = [];
  // put: base (feet) at y
  const put = (type, x, y, z, over) => { const e = PX.newEntity3D(type); if (over) PX.deepMerge(e, clone(over)); const sz = PX.size3(e); e.p = [x, y + sz[1] / 2, z]; es.push(e); return e; };
  // box: centre x/z, TOP at y, full size w/h/d
  const box = (type, x, top, z, w, h, d, over) => { const A = PX.ASSETS3D[type], e = PX.newEntity3D(type); if (over) PX.deepMerge(e, clone(over)); e.s = [w / A.size[0], h / A.size[1], d / A.size[2]]; e.p = [x, top - h / 2, z]; es.push(e); return e; };
  return { es, put, box };
}
const R = (ev, ...acts) => ({ ev, acts, off: false });
function rects(rows, ch) {
  const Hh = rows.length, W = rows[0].length, used = rows.map(r => [...r].map(() => false)), out = [];
  for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
    if (rows[y][x] !== ch || used[y][x]) continue;
    let w = 1; while (x + w < W && rows[y][x + w] === ch && !used[y][x + w]) w++;
    let h = 1; outer: while (y + h < Hh) { for (let i = 0; i < w; i++) if (rows[y + h][x + i] !== ch || used[y + h][x + i]) break outer; h++; }
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used[y + j][x + i] = true;
    out.push({ x, y, w, h });
  }
  return out;
}
PX.TEMPLATES3D = {
  obby: { name: 'Obstacle Course', tag: 'Jump · Ride · Climb', desc: 'Leap across floating platforms over lava, ride the lift, time the spinner and bounce up to the portal.', build() {
    const L = lb3();
    L.box('lava', 0, -2.2, -26, 34, .4, 76);
    const plat = (x, top, z, w, d, type = 'block', over) => { const e = L.box(type, x, top, z, w, 1, d, over); L.box('pillar', x, top - 1, z, Math.min(w, d) * .55, top + 1.2, Math.min(w, d) * .55, { tex: 'stone', color: '#b8b8c8' }); return e; };
    plat(0, 0, 0, 7, 7, 'ground');
    plat(0, 0, -6.5, 3, 3);
    plat(1.5, .6, -11, 3, 3);
    plat(0, .6, -17, 5, 5, 'ground');
    L.put('checkpoint', -1.6, .6, -18.2);
    L.box('platform', 0, .6, -22, 3, .5, 3, { comps: { mover: { dx: 0, dy: 0, dz: -7, speed: 2.4, pause: .6 } } });
    plat(0, .6, -33.5, 3, 3);
    L.box('rotator', 0, .6, -39.5, 8, .5, 1.6, { comps: { spinner: { speed: 40 } } });
    L.box('pillar', 0, .1, -39.5, .7, 2.3, .7, { tex: 'metal' });
    plat(0, .6, -46, 3.4, 3.4);
    L.put('spring', 0, .6, -46.6);
    plat(0, 4.2, -53, 5, 5, 'ground');
    L.put('goal', 0, 4.2, -54);
    L.put('enemy_patrol', -1.5, .6, -16, { comps: { patrol: { axis: 'x', distance: 3, speed: 1.6 } } });
    [[0, 1.4, -3.9], [0, 1.4, -5.5], [.7, 1.9, -8.9], [1.5, 2, -11], [0, 1.7, -14], [0, 1.9, -20.5], [0, 1.9, -25], [0, 1.9, -29.5], [0, 2, -36.5], [0, 2, -42.5], [0, 3.8, -48], [0, 5.6, -50.5]].forEach(([x, y, z]) => L.put('coin', x, y, z));
    L.put('gem', 1.5, .6, -11.2);
    L.put('sign', 2, 0, 1.5, { r: [0, -25, 0], props: { text: 'Reach the portal! WASD + Space. Falling sends you back.' } });
    L.put('light', 4, -.8, -20, { props: { kind: 'point', intensity: 8, range: 14 }, color: '#ff8a3a' });
    L.put('light', -4, -.8, -40, { props: { kind: 'point', intensity: 8, range: 14 }, color: '#ff8a3a' });
    L.put('player', 0, 0, 1.5);
    return { settings: { title: 'Lava Leap', desc: 'Jump, ride and bounce your way to the portal above the lava.', category: 'Platformer', sky: 'sunset', fog: .35, sunAngle: 18, sunDir: 160, ambient: .5, win: 'goal', killY: -12, world: 80, music: { mood: 'epic', tempo: 128 } }, entities: L.es,
      rules: [R({ type: 'fall', n: -1.2 }, { type: 'respawn' }, { type: 'message', s: 'Too hot! Back to the checkpoint.' }, { type: 'sound', s: 'hit' }), R({ type: 'touch', a: 'player', b: 't:gem' }, { type: 'message', s: 'SHINY! +50' })] };
  } },
  island: { name: 'Coin Island', tag: 'Explore · Collect', desc: 'A sunny island ringed by water. Find every coin — some are on the hill and the crates.', build() {
    const L = lb3();
    L.box('ground', 0, -3, 0, 90, 1, 90, { tex: 'sand', color: '#d9c7a0' });
    L.box('water', 0, -.25, 0, 90, 2.6, 90);
    L.box('pillar', 0, -.45, 0, 38, 1, 38, { tex: 'sand' });
    L.box('pillar', 0, .3, 0, 28, 1.2, 28, { tex: 'grass' });
    L.box('ground', 6, 2.3, -5, 8, 2, 8, { tex: 'grass' });
    L.box('ramp', 6, 2.3, 1, 4, 2, 4, { r: [0, 90, 0], tex: 'stone' });
    L.put('house', -7, .3, -4, { r: [0, 20, 0] });
    L.put('crate', -3.2, .3, -7.6); L.put('crate', -2.1, .3, -7.6); L.put('crate', -2.6, 1.3, -7.6);
    [[10, 6], [-10, 6], [11, -1], [-12, 3], [2, -11], [-6, 10], [9, -11], [-11, -9], [4, 11]].forEach(([x, z], i) => L.put(i % 3 ? 'tree' : 'pine', x, .3, z, { r: [0, i * 40, 0] }));
    [[3, 3], [-4, 4], [8, 2], [-9, -1]].forEach(([x, z]) => L.put('rock', x, .3, z));
    [[0, 8], [-2, -2], [12, 3], [-13, -2], [5, 6]].forEach(([x, z]) => L.put('bush', x, .3, z));
    const coins = [[0, 2], [2, 0], [-2, 4], [4, -2], [-5, 2], [9, 7], [-9, 8], [11, -6], [-12, -5], [0, -9], [-4, -11], [7, -10], [13, 1], [-14, 1], [3, 10]];
    coins.forEach(([x, z]) => L.put('coin', x, .9, z));
    [[5, -3], [7, -5], [6, -7]].forEach(([x, z]) => L.put('coin', x, 2.9, z));
    L.put('coin', -2.6, 2.9, -7.6); L.put('gem', -7, 5.3, -4);
    L.put('enemy_patrol', -3, .3, 9, { comps: { patrol: { axis: 'x', distance: 6, speed: 2 } } });
    L.put('pw_speed', -8, .9, 1.5);
    L.put('sign', 1.8, .3, 9.5, { r: [0, -15, 0], props: { text: 'Collect every coin on the island! Hold Shift to sprint.' } });
    L.put('player', 0, .3, 11);
    return { settings: { title: 'Coin Island', desc: 'Sun, sand and shiny coins. Grab them all!', category: 'Adventure', sky: 'day', fog: .12, sunAngle: 55, sunDir: 40, ambient: .65, win: 'collect', killY: -10, world: 90, music: { mood: 'chill', tempo: 100 } }, entities: L.es,
      rules: [R({ type: 'compare', v: 'left', op: '=', n: 3 }, { type: 'message', s: 'Just 3 coins left!' }), R({ type: 'touch', a: 'player', b: 't:gem' }, { type: 'message', s: 'Rooftop treasure!' })] };
  } },
  maze: { name: 'Maze Run', tag: 'Navigate · Evade', desc: 'A torch-lit maze at night. Grab the key, open the gate and reach the portal before the ghosts catch you.', build() {
    const L = lb3(), S = 2;
    const M = ['###########', '#P..#....K#', '#.#.#.###.#', '#.#...#...#', '#.#####.#.#', '#...#.C.#.#', '###.#.###.#', '#.....#...#', '#.###.#D###', '#..C#.#.G.#', '###########'];
    const off = (M.length - 1) * S / 2, X = c => c * S - off, Z = r => r * S - off;
    L.box('ground', 0, 0, 0, M[0].length * S + 2, 1, M.length * S + 2, { tex: 'tiles', color: '#9a96a8' });
    rects(M, '#').forEach(r => L.box('wall', X(r.x) + (r.w - 1) * S / 2, 2.6, Z(r.y) + (r.h - 1) * S / 2, r.w * S, 2.6, r.h * S, { tex: 'brick', color: '#d8d0e0' }));
    let n = 0;
    M.forEach((row, r) => [...row].forEach((ch, c) => {
      const x = X(c), z = Z(r);
      if (ch === '.' && (r + c) % 2 === 0) L.put('coin', x, .9, z);
      else if (ch === 'P') L.put('player', x, 0, z, { r: [0, 180, 0] });
      else if (ch === 'K') L.put('key', x, .9, z);
      else if (ch === 'D') L.box('door', x, 2.6, z, 2, 2.6, .4, { r: [0, 0, 0] });
      else if (ch === 'G') L.put('goal', x, 0, z, { r: [0, 90, 0] });
      else if (ch === 'C') L.put('enemy_chase', x, .2, z, { comps: { chase: { speed: 2.6, range: 30, smart: true } } });
      if (ch === '#' && (r === 0 || r === M.length - 1) && c % 4 === 2 && n < 4) { n++; L.put('light', x, 2.2, z + (r === 0 ? 1.2 : -1.2), { props: { kind: 'point', intensity: 9, range: 10 }, color: '#ffb35a' }); }
    }));
    L.put('light', X(5), 2.3, Z(5), { props: { kind: 'point', intensity: 9, range: 10 }, color: '#8ab4ff' });
    return { settings: { title: 'Midnight Maze', desc: 'Find the key, open the gate, escape the ghosts.', category: 'Maze', sky: 'night', fog: .45, sunAngle: 40, sunDir: 220, ambient: .55, win: 'goal', killY: -10, world: 26, music: { mood: 'spooky', tempo: 96 } }, entities: L.es,
      rules: [R({ type: 'touch', a: 'player', b: 't:key' }, { type: 'message', s: 'Key found! Find the gate.' }), R({ type: 'start' }, { type: 'message', s: 'Find the key — avoid the ghosts!' })] };
  } },
  arena: { name: 'Arena Survival', tag: 'Fight · Survive', desc: 'Hold out in a neon arena as ghosts pour from the portals. Shoot with X or click. Survive 90 seconds.', build() {
    const L = lb3();
    L.box('pillar', 0, 0, 0, 38, 1, 38, { tex: 'metal', color: '#7d7f9a' });
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; L.box('block', Math.cos(a) * 18.4, 1.2, Math.sin(a) * 18.4, 7.4, 1.2, .8, { r: [0, -a * 180 / Math.PI + 90, 0], tex: 'metal', color: '#5a5f78' }); }
    [[7, 7], [-7, 7], [7, -7], [-7, -7]].forEach(([x, z]) => { L.box('pillar', x, 4, z, 1.8, 4, 1.8, { tex: 'stone' }); L.put('light', x, 4.4, z, { props: { kind: 'point', intensity: 10, range: 14 }, color: ['#ff4d00', '#4ab4ff', '#b07aff', '#6ee06e'][(x > 0 ? 1 : 0) + (z > 0 ? 2 : 0)] }); });
    [[0, -14], [14, 0], [0, 14], [-14, 0]].forEach(([x, z]) => L.put('spawner', x, 0, z, { props: { what: 'enemy_chase', every: 0 } }));
    L.put('enemy_chase', 10, .4, -10, { comps: { chase: { speed: 3.4, range: 60, smart: false } } });
    L.put('enemy_chase', -10, .4, -10, { comps: { chase: { speed: 3, range: 60, smart: false } } });
    L.put('pw_shield', 0, .8, -4); L.put('pw_speed', -10, .8, 0); L.put('life', 10, .8, 0);
    [[3, 3], [-3, 3], [3, -3], [-3, -3], [0, 9], [9, 9], [-9, -9]].forEach(([x, z]) => L.put('gem', x, .8, z));
    L.put('player', 0, 0, 6, { comps: { player: { canShoot: true, fireRate: 5 } } });
    return { settings: { title: 'Neon Arena', desc: 'Survive the ghost waves for 90 seconds.', category: 'Arcade', sky: 'space', fog: .2, sunAngle: 60, sunDir: 20, ambient: .55, win: 'survive', timeLimit: 90, killY: -10, world: 44, music: { mood: 'tense', tempo: 140 } }, entities: L.es,
      rules: [R({ type: 'every', n: 5 }, { type: 'spawn', s: 'enemy_chase', b: 'spawner' }), R({ type: 'destroyed', a: 'enemy' }, { type: 'score', n: 25 }), R({ type: 'compare', v: 'time', op: '<=', n: 30 }, { type: 'message', s: '30 SECONDS — HOLD ON!' })] };
  } },
  blank3d: { name: 'Blank 3D', tag: 'Empty world', desc: 'A grassy field, a player and a goal portal. Build anything.', build() {
    const L = lb3();
    L.box('ground', 0, 0, 0, 40, 1, 40);
    L.put('goal', 0, 0, -12);
    L.put('player', 0, 0, 12);
    return { settings: { title: 'My 3D Game', desc: '', category: 'Platformer', sky: 'day', fog: .15, win: 'goal', world: 60 }, entities: L.es, rules: [] };
  } }
};
PX.newProject3D = tpl => {
  const t = PX.TEMPLATES3D[tpl] || PX.TEMPLATES3D.blank3d, b = t.build();
  const P = { v: 1, dim: '3d', id: PX.uid(), updated: Date.now(), template: tpl, nextId: 1, settings: Object.assign(PX.defaultSettings3D(), b.settings), entities: b.entities, rules: b.rules, sprites: {} };
  P.settings.music = Object.assign({ mood: 'happy', tempo: 120 }, b.settings.music || {});
  P.entities.forEach(e => { e.id = P.nextId++; });
  return P;
};
})();
