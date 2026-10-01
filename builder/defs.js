/* Pixel Arcade Builder — definitions: sprites, assets, components, rules, skies, templates */
(function () {
'use strict';
const PX = window.PXB = window.PXB || {};
const T = PX.T = 32;
const clone = PX.clone = o => JSON.parse(JSON.stringify(o));

/* ------------------------------------------------------------------ palette */
const PAL = PX.PAL = {
  '.': '', k: '#1a1424', K: '#3a3150', w: '#ffffff', s: '#d8d8e4', S: '#9a9ab0', d: '#5c5c74',
  r: '#ff3b3b', R: '#a01830', o: '#ff8a2a', O: '#ff4d00', y: '#ffd84a', Y: '#d49a1a', l: '#fff4b8',
  g: '#6ee06e', G: '#2fa34a', t: '#186a3a', q: '#a6f07a', b: '#4ab4ff', B: '#2358c8', c: '#9ff4ff',
  p: '#ff6ab8', P: '#9a4ae0', v: '#3a1f78', n: '#b0703c', N: '#6e4222', m: '#f0c090', e: '#4a2e1a',
  x: '#c0503a', X: '#7a2a1e', z: '#e07a5a'
};
// painter palette (ordered)
PX.PAINT = ['#000000', '#1a1424', '#3a3150', '#5c5c74', '#9a9ab0', '#d8d8e4', '#ffffff', '#fff4b8',
  '#ffd84a', '#d49a1a', '#ff8a2a', '#ff4d00', '#ff3b3b', '#a01830', '#ff6ab8', '#9a4ae0',
  '#3a1f78', '#2358c8', '#4ab4ff', '#9ff4ff', '#a6f07a', '#6ee06e', '#2fa34a', '#186a3a',
  '#f0c090', '#b0703c', '#6e4222', '#4a2e1a', '#c0503a', '#7a2a1e'];

const h2 = (x, y, s = 0) => { let n = (x * 374761393 + y * 668265263 + s * 1442695041) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
PX.hash2 = h2;
const gen = fn => { const rows = []; for (let y = 0; y < 16; y++) { let r = ''; for (let x = 0; x < 16; x++) r += fn(x, y) || '.'; rows.push(r); } return rows; };
const dist = (x, y, cx = 7.5, cy = 7.5) => Math.hypot(x - cx, y - cy);

const dirtFn = (x, y) => { const r = h2(x, y, 1); return r < .07 ? 'N' : r < .1 ? 'e' : r < .13 ? 'm' : 'n'; };
const orb = (fill, dark, glyph) => gen((x, y) => {
  const d = dist(x, y);
  if (d > 7.4) return '.';
  if (d > 6.3) return 'k';
  const gx = x - 4, gy = y - 4;
  if (glyph && gx >= 0 && gx < 8 && gy >= 0 && gy < 8 && glyph[gy][gx] === 'w') return 'w';
  if ((x === 4 && y === 3) || (x === 3 && y === 4)) return 'w';
  return d > 5 && x + y > 15 ? dark : fill;
});
const G_BOLT = ['....ww..', '...ww...', '..ww....', '.wwwwww.', '....ww..', '...ww...', '..ww....', '........'];
const G_UP = ['...ww...', '..wwww..', '.wwwwww.', 'wwwwwwww', '...ww...', '...ww...', '...ww...', '........'];
const G_SHIELD = ['.wwwwww.', '.wwwwww.', '.wwwwww.', '.wwwwww.', '..wwww..', '...ww...', '........', '........'];
const spikeHalf = ['...kk...', '...kk...', '..kwsk..', '..kwsk..', '..kwsk..', '.kwsSdk.', '.kwsSdk.', '.kwsSdk.', '.kwsSdk.', 'kwssSddk', 'kwssSddk', 'kwssSddk', 'kwssSddk', 'kddddddk', 'kKKKKKKk', 'kkkkkkkk'];
const flagMap = ['..kk............', '..kskkkkkk......', '..ksOOOOOOkk....', '..ksOOwwOOOOkk..', '..ksOwwwwOOOOOk.', '..ksOOwwOOOOOk..', '..ksOOOOOOOOk...', '..kskkkkkkkk....', '..ksk...........', '..ksk...........', '..ksk...........', '..ksk...........', '..ksk...........', '..ksk...........', '.kkkkk..........', 'kSSSSSk.........'];

const MAPS = {
  player: ['................', '......kkkk......', '....kkOOOOkk....', '...kOOOOOOOOk...', '..kOOlOOOOOOOk..', '..kOlOOOOOOOOk..', '..kOOwwOOwwOOk..', '..kOOwkOOwkOOk..', '..kOOwkOOwkOOk..', '..kOOOOOOOOOOk..', '..kOOOOkkOOOOk..', '...kOOOOOOOOk...', '....kkOOOOkk....', '....kRkkkkRk....', '...kRRk..kRRk...', '....kk....kk....'],
  ship: ['.......kk.......', '......kwwk......', '......kswk......', '.....kssswk.....', '.....kbccsk.....', '....kSbccbSk....', '....kSsbbsSk....', '...kOSssssSOk...', '..kOOSssssSOOk..', '.kOOkSssssSkOOk.', 'kOOk.kSssSk.kOOk', 'kOk..kSkkSk..kOk', 'kk...kyooyk...kk', '.....kyllyk.....', '......kyyk......', '.......kk.......'],
  grass: gen((x, y) => y === 0 ? (h2(x, 0, 9) < .3 ? 'q' : 'g') : y < 3 ? 'g' : y === 3 ? (h2(x, 3, 2) < .55 ? 'G' : 'g') : y === 4 ? (h2(x, 4, 3) < .4 ? 'G' : 'n') : dirtFn(x, y)),
  dirt: gen(dirtFn),
  stone: gen((x, y) => { const qx = x % 8, qy = y % 8; return (qy === 0 || qx === 0) ? 's' : (qy === 7 || qx === 7) ? 'd' : (h2(x, y, 4) < .08 ? 'd' : 'S'); }),
  brick: gen((x, y) => { const row = y >> 2, ly = y & 3, lx = (x + (row % 2) * 4) % 8; return (ly === 3 || lx === 7) ? 'K' : (ly === 0 ? 'z' : (h2(x, y, 5) < .1 ? 'X' : 'x')); }),
  ice: gen((x, y) => (y === 0 || x === 0) ? 'w' : (y === 15 || x === 15) ? 'b' : ((x + y) % 9 === 0 && y > 2 && y < 13) ? 'w' : 'c'),
  wood: gen((x, y) => { if (y === 0 || y === 15) return 'k'; if (y === 1 || y === 8) return 'm'; if (y === 7 || y === 14) return 'N'; if ((x === 2 || x === 13) && (y === 3 || y === 11)) return 's'; if (x === 15) return 'N'; return h2(x, y, 6) < .1 ? 'N' : 'n'; }),
  metal: gen((x, y) => { if (y === 0 || x === 0) return 's'; if (y === 15 || x === 15) return 'd'; if ((x === 2 || x === 13) && (y === 2 || y === 13)) return 'w'; if (y === 7) return 'd'; if (y === 8) return 's'; return 'S'; }),
  neon: gen((x, y) => { const e = x === 0 || y === 0 || x === 15 || y === 15; const e2 = x === 1 || y === 1 || x === 14 || y === 14; return e ? 'b' : e2 ? 'B' : (h2(x, y, 7) < .04 ? 'P' : 'v'); }),
  lava: ['..oo......oo....', '.oyyo....oyyo...', 'oyyyyooooyyyyooo', 'yyllyyyyyyllyyyy', 'yyyyyyyyyyyyyyyy', 'yyoyyyyyyyyoyyyy', 'ooyyyooyyyyyyooy', 'oooooooooyoooooo', 'oOooooooooooOooo', 'ooooOoooooooooOo', 'OoooooooOooooooo', 'ooOoooooooOooooo', 'OOooOOOoooooOOoO', 'OOOOOOOOOOOOOOOO', 'ROOOROOOOOROOOOR', 'RRRRRRRRRRRRRRRR'],
  spikes: spikeHalf.map(r => r + r),
  slime: ['................', '................', '................', '................', '......kkkk......', '....kkggggkk....', '...kgglgggggk...', '..kgglggggggGk..', '..kggwkggwkgGk..', '..kggwkggwkgGk..', '.kgggggggggggGk.', '.kggggkkkkgggGk.', '.kgggggggggggGk.', '.kGGgggggggGGGk.', '..kkkkkkkkkkkk..', '................'],
  bat: ['................', '................', 'k..............k', 'kk....k..k....kk', 'kPk...kkkk...kPk', 'kPPk.kPPPPk.kPPk', 'kPPPkPwPPwPkPPPk', 'kPPPPPkPPkPPPPPk', '.kPPPPPPPPPPPPk.', '.kPPkPPPPPPkPPk.', '..kk.kPwwPk.kk..', '.....kPPPPk.....', '......kkkk......', '................', '................', '................'],
  turret: ['................', '................', '.....kkkkkk.....', '....kSsssSSk....', '...kSsSSSSSSk...', '..kSsSkkkkSSSk..', '..kSSkrrrrkSSk..', '..kSSkrwrRkSSk..', '..kSSkrrRRkSSk..', '..kSSSkkkkSSSk..', '.kddddddddddddk.', '.kdSdSdSdSdSddk.', 'kddddddddddddddk', 'kdKdKdKdKdKdKddk', 'kkkkkkkkkkkkkkkk', '................'],
  ghost: ['................', '......kkkk......', '....kkwwwwkk....', '...kwwwwwwwwk...', '..kwwwwwwwwwwk..', '..kwkkwwwkkwwk..', '..kwkbwwwkbwwk..', '..kwwwwwwwwwwk..', '.kwwwwwwwwwwwsk.', '.kwwwwkkkwwwwsk.', '.kwwwwwwwwwwwsk.', '.kwwwwwwwwwwssk.', '.kwwswwwswwwssk.', '.kwk.kwk.kwk.kk.', '..k...k...k.....', '................'],
  alien: ['................', '................', '................', '...k........k...', '....k......k....', '...kkkkkkkkkk...', '..kggggggggggk..', '.kggkkggggkkggk.', '.kggkwggggkwggk.', 'kggggggggggggggk', 'kgkggggggggggkgk', 'kgk.kkkkkkkk.kgk', 'kk..kgk..kgk..kk', '....kk....kk....', '................', '................'],
  ufo: ['................', '................', '................', '................', '......kkkk......', '.....kcccck.....', '....kcwcccck....', '..kkkkkkkkkkkk..', '.kssssssssssssk.', 'kSSyySSyySSyySSk', '.kddddddddddddk.', '..kkkkkkkkkkkk..', '....k......k....', '................', '................', '................'],
  asteroid: gen((x, y) => { const d = dist(x, y) + (h2(x, y, 8) - .5) * 1.2; if (d > 7) return '.'; if (d > 6) return 'k'; if (dist(x, y, 5, 6) < 1.6 || dist(x, y, 10, 10) < 1.3) return 'd'; return x + y < 12 ? 'S' : (x + y > 19 ? 'd' : 'S'); }),
  coin: ['................', '................', '.....kkkkkk.....', '....kyyyyyyk....', '...kyllyyyyYk...', '...kylyyyyyYk...', '...kyyyYYyyYk...', '...kyyyYlyyYk...', '...kyyyYlyyYk...', '...kyyyYlyyYk...', '...kyyyylyyYk...', '...kyyyyyyyYk...', '....kYyyyyYk....', '.....kkkkkk.....', '................', '................'],
  dot: gen((x, y) => { const d = dist(x, y); return d < 3.5 ? 'l' : d < 5.5 ? 'y' : d < 6.5 ? 'Y' : '.'; }),
  gem: ['................', '................', '....kkkkkkkk....', '...kcwcccbbBk...', '..kcwccccbbBBk..', '.kkkkkkkkkkkkkk.', '.kccwcccbbbbBBk.', '..kccwccbbbBBk..', '...kccccbbbBk...', '....kccbbbBk....', '.....kcbbBk.....', '......kbBk......', '.......kk.......', '................', '................', '................'],
  heart: ['................', '................', '..kkk.....kkk...', '.krrrk...krrrk..', 'krwwrrk.krrrrRk.', 'krwrrrrkrrrrrRk.', 'krrrrrrrrrrrrRk.', 'krrrrrrrrrrrrRk.', '.krrrrrrrrrrRk..', '..krrrrrrrrRk...', '...krrrrrrRk....', '....krrrrRk.....', '.....krrRk......', '......kRk.......', '.......k........', '................'],
  flag: flagMap,
  checkpoint: flagMap.map(r => r.replace(/O/g, 'b').replace(/w/g, 'c')),
  spring: ['................', '................', '................', '................', '..kkkkkkkkkkkk..', '..krrrrrrrrrrk..', '..kRRRRRRRRRRk..', '..kkkkkkkkkkkk..', '....kssssssk....', '.....kSSSSk.....', '....kssssssk....', '.....kSSSSk.....', '....kssssssk....', '..kkkkkkkkkkkk..', '..kddddddddddk..', '..kkkkkkkkkkkk..'],
  key: ['................', '................', '................', '..kkkk..........', '.klyyyk.........', 'kyykkyykkkkkkk..', 'kyk..kyyyyyyyyk.', 'kyk..kyyyyyyyyk.', 'kyykkyykkkyykyk.', '.kyyyyk..kyykyk.', '..kkkk....kk.k..', '................', '................', '................', '................', '................'],
  door: ['kkkkkkkkkkkkkkkk', 'kyyyyyyyyyyyyyYk', 'kyNNNNNNNNNNNNYk', 'kyNnnnnnnnnnnNYk', 'kyNnnnnkknnnnNYk', 'kyNnnnkeeknnnNYk', 'kyNnnnkeeknnnNYk', 'kyNnnnnkeknnnNYk', 'kyNnnnnkeknnnNYk', 'kyNnnnnkkknnnNYk', 'kyNnnnnnnnnnnNYk', 'kyNnnnnnnnnnnNYk', 'kyNnnnnnnnnnnNYk', 'kyNNNNNNNNNNNNYk', 'kYYYYYYYYYYYYYYk', 'kkkkkkkkkkkkkkkk'],
  sign: ['................', '................', '.kkkkkkkkkkkkkk.', '.kmmmmmmmmmmmmk.', '.kmNNNNmNNNNmmk.', '.kmmmmmmmmmmmmk.', '.kmNNNmNNNNNmmk.', '.kmmmmmmmmmmmmk.', '.kmNNNNNmNNmmmk.', '.knnnnnnnnnnnnk.', '.kkkkkkkkkkkkkk.', '......knk.......', '......knk.......', '......knk.......', '.....kNNNk......', '....kkkkkkk.....'],
  tree: ['......kkkk......', '....kkggggkk....', '...kgglgggggk...', '..kgglggggggGk..', '..kglgggggGgGk..', '.kgggggggggGGGk.', '.kggGgggggGGgGk.', '.kgGGggggGGGGGk.', '..kGGGgGGGGGtk..', '...kkGGGGGtkk...', '.....kkNnkk.....', '......kNnk......', '......kNnk......', '......kNnk......', '.....kNNnnk.....', '....kkkkkkkk....'],
  pine: gen((x, y) => { if (y >= 13) return (x >= 7 && x <= 8) ? (y === 15 ? 'k' : 'N') : '.'; const half = 1 + ((y % 5) + Math.floor(y / 5) * 1.6) * 0.9; const dx = Math.abs(x - 7.5); if (dx > half) return '.'; if (dx > half - 1) return 'k'; return x < 7 ? 'G' : 't'; }),
  cloud: ['................', '................', '................', '................', '................', '......wwww......', '....wwwwwwww....', '...wwwwwwwwwww..', '.wwwwwwwwwwwwww.', 'wwwwwwwwwwwwwwww', 'wwwwwwwwwwwwwwws', 'swwwwwwwwwwwwwss', '.sssswwwwwsssss.', '..ssssssssssss..', '................', '................'],
  rock: ['................', '................', '................', '................', '................', '......kkkkk.....', '....kksssSSk....', '...ksssSSSSdk...', '..kssSSSSSSddk..', '.ksSSSSSSSSSddk.', '.ksSSSSSSSSdddk.', 'kSSSSSSSSSSddddk', 'kSSSSSSSSSdddddk', 'kddddddddddddddk', '.kkkkkkkkkkkkkk.', '................'],
  bush: ['................', '................', '................', '................', '................', '................', '................', '....kkkk.kkk....', '...kgglgkgggk...', '..kgglggggggGk..', '.kgglgggggggGGk.', '.kggggggggGgGGk.', 'kgggggggggGGGGGk', 'kGgggGgggGGGGGtk', 'kGGGGGGGGGGGGttk', '.kkkkkkkkkkkkkk.'],
  flower: gen((x, y) => { if (y > 8 && (x === 7 || x === 8)) return y === 15 ? 'G' : 'g'; if (y > 10 && ((x === 5 && y === 12) || (x === 10 && y === 11))) return 'g'; const d = dist(x, y, 7.5, 5); if (d < 1.6) return 'y'; if (d < 3.6) return 'p'; if (d < 4.3) return 'k'; return '.'; }),
  spawner: gen((x, y) => { const d = dist(x, y); if (d > 7.4) return '.'; if (d > 6.6) return 'k'; const a = Math.atan2(y - 7.5, x - 7.5) + d * .7; const s = Math.sin(a * 3) > 0; if (d < 1.8) return 'w'; if (d < 3.2) return s ? 'p' : 'c'; return s ? 'P' : 'v'; }),
  pw_speed: orb('b', 'B', G_BOLT),
  pw_jump: orb('g', 'G', G_UP),
  pw_shield: orb('P', 'v', G_SHIELD),
  star: gen((x, y) => { const a = Math.atan2(y - 8, x - 7.5), d = dist(x, y, 7.5, 8); const r = 3 + 4.4 * Math.pow(Math.abs(Math.cos(a * 2.5 + Math.PI / 2)), 2.2); return d < r - 1 ? (d < 2 ? 'l' : 'y') : d < r ? 'k' : '.'; }),
  crate: gen((x, y) => { if (x === 0 || y === 0 || x === 15 || y === 15) return 'k'; if (x === 1 || y === 1 || x === 14 || y === 14) return 'N'; if (x === y || x === 15 - y || x === y + 1 || x + 1 === 15 - y) return 'N'; return h2(x, y, 11) < .1 ? 'N' : 'n'; }),
  platform: gen((x, y) => { if (y === 0 || y === 15) return 'k'; if (y === 1) return 's'; if (y === 14) return 'd'; if (y === 7 || y === 8) return (x % 4 === 1) ? 'y' : 'k'; return 'S'; })
};
PX.MAPS = MAPS;
PX.SPRITE_NAMES = {
  player: 'Hero', ship: 'Ship', grass: 'Grass', dirt: 'Dirt', stone: 'Stone', brick: 'Brick', ice: 'Ice', wood: 'Wood', metal: 'Metal', neon: 'Neon', lava: 'Lava', spikes: 'Spikes',
  slime: 'Slime', bat: 'Bat', turret: 'Turret', ghost: 'Ghost', alien: 'Alien', ufo: 'UFO', asteroid: 'Asteroid', coin: 'Coin', dot: 'Dot', gem: 'Gem', heart: 'Heart', flag: 'Flag',
  checkpoint: 'Checkpoint', spring: 'Spring', key: 'Key', door: 'Lock block', sign: 'Sign', tree: 'Tree', pine: 'Pine', cloud: 'Cloud', rock: 'Rock', bush: 'Bush', flower: 'Flower',
  spawner: 'Portal', pw_speed: 'Speed orb', pw_jump: 'Jump orb', pw_shield: 'Shield orb', star: 'Star', crate: 'Crate', platform: 'Lift'
};
PX.builtinPixels = key => {
  const m = MAPS[key]; const out = new Array(256).fill('');
  if (!m) return out;
  for (let y = 0; y < 16; y++) { const row = m[y] || ''; for (let x = 0; x < 16; x++) out[y * 16 + x] = PAL[row[x]] || ''; }
  return out;
};

/* ------------------------------------------------------------------ components */
PX.COMPS = {
  player: { label: 'Player Controller', glyph: '◆', desc: 'Makes this the hero you control.', params: [
    ['mode', 'select', 'Mode', ['platformer', 'topdown', 'ship']], ['speed', 'num', 'Move speed', 40, 600, 10], ['jump', 'num', 'Jump power', 200, 1400, 10],
    ['doubleJump', 'bool', 'Double jump'], ['canShoot', 'bool', 'Can shoot'], ['fireRate', 'num', 'Shots / sec', 1, 15, 1]],
    def: { mode: 'platformer', speed: 250, jump: 680, doubleJump: false, canShoot: false, fireRate: 5 } },
  patrol: { label: 'Patrol', glyph: '↔', desc: 'Walks back and forth from its start.', params: [
    ['axis', 'select', 'Axis', ['x', 'y']], ['distance', 'num', 'Distance', 0, 2000, 16], ['speed', 'num', 'Speed', 0, 600, 5], ['wave', 'num', 'Wave height', 0, 200, 2], ['edgeTurn', 'bool', 'Turn at ledges']],
    def: { axis: 'x', distance: 128, speed: 60, wave: 0, edgeTurn: true } },
  chase: { label: 'Chase', glyph: '➚', desc: 'Hunts the player when in range.', params: [
    ['speed', 'num', 'Speed', 0, 600, 5], ['range', 'num', 'Sight range', 0, 3000, 16], ['smart', 'bool', 'Path-find (top-down)']],
    def: { speed: 80, range: 320, smart: true } },
  shooter: { label: 'Shooter', glyph: '✦', desc: 'Fires bullets on a timer.', params: [
    ['rate', 'num', 'Seconds between', .2, 10, .1], ['speed', 'num', 'Bullet speed', 40, 900, 10], ['range', 'num', 'Range', 32, 3000, 16], ['aim', 'select', 'Aim', ['player', 'left', 'right', 'up', 'down']]],
    def: { rate: 1.8, speed: 220, range: 380, aim: 'player' } },
  collectible: { label: 'Collectible', glyph: '●', desc: 'Picked up by the player for points.', params: [
    ['score', 'num', 'Score', -1000, 10000, 5], ['counts', 'bool', 'Counts for “collect all”'], ['sound', 'select', 'Sound', ['coin', 'gem', 'power', 'key', 'none']]],
    def: { score: 10, counts: true, sound: 'coin' } },
  hazard: { label: 'Hazard', glyph: '▲', desc: 'Hurts the player on touch.', params: [
    ['damage', 'num', 'Damage', 0, 99, 1], ['stompable', 'bool', 'Can be stomped']],
    def: { damage: 1, stompable: false } },
  goal: { label: 'Goal', glyph: '⚑', desc: 'Touch it to win the level.', params: [['requireAll', 'bool', 'Needs all collectibles']], def: { requireAll: false } },
  bounce: { label: 'Bounce Pad', glyph: '⤒', desc: 'Launches the player upward.', params: [['power', 'num', 'Power', 100, 2500, 20]], def: { power: 980 } },
  mover: { label: 'Mover (Path)', glyph: '⇢', desc: 'Moves between point A and point B.', params: [
    ['dx', 'num', 'B offset X', -4000, 4000, 16], ['dy', 'num', 'B offset Y', -4000, 4000, 16], ['speed', 'num', 'Speed', 5, 800, 5], ['pause', 'num', 'Pause (s)', 0, 10, .1], ['loop', 'select', 'Loop', ['pingpong', 'once']]],
    def: { dx: 128, dy: 0, speed: 70, pause: .4, loop: 'pingpong' } },
  health: { label: 'Health', glyph: '♥', desc: 'Hit points, i-frames and score on defeat.', params: [
    ['hp', 'num', 'Hit points', 1, 99, 1], ['invuln', 'num', 'Invulnerable (s)', 0, 5, .1], ['points', 'num', 'Score on defeat', 0, 10000, 5]],
    def: { hp: 1, invuln: .8, points: 50 } },
  followCam: { label: 'Follow Camera', glyph: '◎', desc: 'The camera tracks this object.', params: [
    ['smooth', 'num', 'Smoothing', 1, 30, 1], ['lookahead', 'num', 'Look-ahead', 0, 300, 4], ['zoom', 'num', 'Zoom', .5, 3, .1]],
    def: { smooth: 6, lookahead: 40, zoom: 1 } }
};

/* ------------------------------------------------------------------ assets */
const phys = (o = {}) => Object.assign({ body: 'static', gravity: 1, friction: .8, bounce: 0, solid: false, oneWay: false }, o);
const C = PX.COMPS;
const comp = (k, o = {}) => Object.assign(clone(C[k].def), o);
const enemyComps = (x = {}) => Object.assign({ hazard: comp('hazard', { stompable: true }), health: comp('health') }, x);

PX.CATS = ['All', 'Characters', 'Terrain', 'Items', 'Hazards', 'Logic', 'Decor'];
PX.ASSETS = {
  player: { name: 'Player', cat: 'Characters', group: 'player', sprite: 'player', w: 28, h: 28, color: '#ff4d00', anchor: 'bottom', single: true, desc: 'The hero you control. One per game.',
    phys: phys({ body: 'dynamic' }), comps: { player: comp('player'), health: comp('health', { hp: 1, invuln: 1.2, points: 0 }), followCam: comp('followCam') } },
  enemy_patrol: { name: 'Patroller', cat: 'Characters', group: 'enemy', sprite: 'slime', w: 28, h: 24, color: '#6ee06e', anchor: 'bottom', desc: 'Enemy that walks back and forth. Stomp it!',
    phys: phys({ body: 'dynamic' }), comps: enemyComps({ patrol: comp('patrol') }) },
  enemy_chase: { name: 'Chaser', cat: 'Characters', group: 'enemy', sprite: 'ghost', w: 28, h: 28, color: '#e8e8ff', anchor: 'center', desc: 'Floating enemy that hunts the player.',
    phys: phys({ body: 'dynamic', gravity: 0 }), comps: enemyComps({ chase: comp('chase'), hazard: comp('hazard') }) },
  enemy_shooter: { name: 'Shooter', cat: 'Characters', group: 'enemy', sprite: 'turret', w: 32, h: 32, color: '#9a9ab0', anchor: 'bottom', desc: 'Turret that fires at the player.',
    phys: phys({ body: 'static', solid: false }), comps: enemyComps({ shooter: comp('shooter'), hazard: comp('hazard'), health: comp('health', { hp: 3, points: 100 }) }) },
  enemy_flyer: { name: 'Flyer', cat: 'Characters', group: 'enemy', sprite: 'bat', w: 30, h: 24, color: '#9a4ae0', anchor: 'center', desc: 'Flies in a wavy patrol path.',
    phys: phys({ body: 'dynamic', gravity: 0 }), comps: enemyComps({ patrol: comp('patrol', { distance: 160, speed: 80, wave: 18, edgeTurn: false }) }) },
  ground: { name: 'Ground', cat: 'Terrain', group: 'block', sprite: 'grass', w: 32, h: 32, tile: true, color: '#6ee06e', desc: 'Solid grassy ground. Drag to paint a big area.', phys: phys({ solid: true }), comps: {} },
  stone: { name: 'Stone Wall', cat: 'Terrain', group: 'block', sprite: 'stone', w: 32, h: 32, tile: true, color: '#9a9ab0', desc: 'Solid stone block or wall.', phys: phys({ solid: true }), comps: {} },
  brick: { name: 'Brick', cat: 'Terrain', group: 'block', sprite: 'brick', w: 32, h: 32, tile: true, color: '#c0503a', desc: 'Solid brick block.', phys: phys({ solid: true }), comps: {} },
  ice: { name: 'Ice', cat: 'Terrain', group: 'block', sprite: 'ice', w: 32, h: 32, tile: true, color: '#9ff4ff', desc: 'Slippery ice — very low friction.', phys: phys({ solid: true, friction: .04 }), comps: {} },
  wall: { name: 'Metal Wall', cat: 'Terrain', group: 'block', sprite: 'metal', w: 32, h: 32, tile: true, color: '#9a9ab0', desc: 'Sci-fi metal wall.', phys: phys({ solid: true }), comps: {} },
  neon: { name: 'Neon Wall', cat: 'Terrain', group: 'block', sprite: 'neon', draw: 'neon', w: 32, h: 32, tile: true, color: '#4ab4ff', desc: 'Glowing maze wall.', phys: phys({ solid: true }), comps: {} },
  ledge: { name: 'Ledge', cat: 'Terrain', group: 'block', sprite: 'wood', w: 96, h: 16, tile: true, align: 'top', color: '#b0703c', desc: 'Jump up through it, land on top.', phys: phys({ solid: true, oneWay: true }), comps: {} },
  platform: { name: 'Moving Platform', cat: 'Terrain', group: 'platform', sprite: 'platform', w: 96, h: 16, tile: true, align: 'top', color: '#9a9ab0', desc: 'Rides from A to B. Drag the B handle to set the path.', phys: phys({ solid: true }), comps: { mover: comp('mover') } },
  crate: { name: 'Crate', cat: 'Terrain', group: 'block', sprite: 'crate', w: 32, h: 32, color: '#b0703c', anchor: 'bottom', desc: 'A dynamic box that falls with gravity.', phys: phys({ body: 'dynamic', solid: true }), comps: {} },
  coin: { name: 'Coin', cat: 'Items', group: 'collectible', sprite: 'coin', draw: 'spin', w: 20, h: 20, color: '#ffd84a', anchor: 'center', paint: true, desc: 'Collect for points.', phys: phys(), comps: { collectible: comp('collectible') } },
  gem: { name: 'Gem', cat: 'Items', group: 'collectible', sprite: 'gem', draw: 'bob', w: 24, h: 24, color: '#4ab4ff', anchor: 'center', paint: true, desc: 'Rare treasure worth more points.', phys: phys(), comps: { collectible: comp('collectible', { score: 50, sound: 'gem' }) } },
  life: { name: 'Extra Life', cat: 'Items', group: 'life', sprite: 'heart', draw: 'bob', w: 24, h: 24, color: '#ff3b3b', anchor: 'center', desc: 'Gives the player one more life.', phys: phys(), comps: { collectible: comp('collectible', { score: 0, counts: false, sound: 'power' }) } },
  key: { name: 'Key', cat: 'Items', group: 'key', sprite: 'key', draw: 'bob', w: 26, h: 26, color: '#ffd84a', anchor: 'center', desc: 'Opens a Door with the same color.', phys: phys(), comps: { collectible: comp('collectible', { score: 0, counts: false, sound: 'key' }) }, props: { color: 'gold' } },
  pw_speed: { name: 'Speed Boost', cat: 'Items', group: 'powerup', sprite: 'pw_speed', draw: 'bob', w: 24, h: 24, color: '#4ab4ff', anchor: 'center', desc: 'Run 50% faster for a while.', phys: phys(), comps: { collectible: comp('collectible', { score: 0, counts: false, sound: 'power' }) }, props: { kind: 'speed', duration: 8 } },
  pw_jump: { name: 'Jump Boost', cat: 'Items', group: 'powerup', sprite: 'pw_jump', draw: 'bob', w: 24, h: 24, color: '#6ee06e', anchor: 'center', desc: 'Jump 30% higher for a while.', phys: phys(), comps: { collectible: comp('collectible', { score: 0, counts: false, sound: 'power' }) }, props: { kind: 'jump', duration: 8 } },
  pw_shield: { name: 'Shield', cat: 'Items', group: 'powerup', sprite: 'pw_shield', draw: 'bob', w: 24, h: 24, color: '#9a4ae0', anchor: 'center', desc: 'Invincible for a while — and enemies you touch are defeated.', phys: phys(), comps: { collectible: comp('collectible', { score: 0, counts: false, sound: 'power' }) }, props: { kind: 'shield', duration: 7 } },
  spikes: { name: 'Spikes', cat: 'Hazards', group: 'hazard', sprite: 'spikes', w: 32, h: 16, tile: true, align: 'bottom', color: '#d8d8e4', desc: 'Ouch. Hurts on touch.', phys: phys(), comps: { hazard: comp('hazard') } },
  lava: { name: 'Lava', cat: 'Hazards', group: 'hazard', sprite: 'lava', draw: 'lava', w: 32, h: 32, tile: true, color: '#ff8a2a', desc: 'Instant knock-out. Fill pits with it.', phys: phys(), comps: { hazard: comp('hazard', { damage: 99 }) } },
  asteroid: { name: 'Asteroid', cat: 'Hazards', group: 'hazard', sprite: 'asteroid', w: 32, h: 32, color: '#9a9ab0', anchor: 'center', desc: 'Drifting space rock. Shoot it twice.', phys: phys({ body: 'dynamic', gravity: 0 }), comps: { hazard: comp('hazard'), health: comp('health', { hp: 2, points: 20 }), patrol: comp('patrol', { distance: 96, speed: 30, edgeTurn: false }) } },
  spring: { name: 'Spring', cat: 'Logic', group: 'bounce', sprite: 'spring', draw: 'spring', w: 32, h: 32, color: '#ff3b3b', anchor: 'bottom', desc: 'Boing! Launches the player high.', phys: phys(), comps: { bounce: comp('bounce') } },
  goal: { name: 'Goal Flag', cat: 'Logic', group: 'goal', sprite: 'flag', draw: 'flag', w: 32, h: 64, color: '#ff4d00', anchor: 'bottom', desc: 'Reach it to win.', phys: phys(), comps: { goal: comp('goal') } },
  checkpoint: { name: 'Checkpoint', cat: 'Logic', group: 'checkpoint', sprite: 'checkpoint', draw: 'checkpoint', w: 32, h: 64, color: '#4ab4ff', anchor: 'bottom', desc: 'Respawn here after losing a life.', phys: phys(), comps: {} },
  door: { name: 'Door (locked)', cat: 'Logic', group: 'door', sprite: 'door', w: 32, h: 64, tile: true, color: '#ffd84a', desc: 'Solid until the player brings a matching key.', phys: phys({ solid: true }), comps: {}, props: { color: 'gold' } },
  sign: { name: 'Sign', cat: 'Logic', group: 'sign', sprite: 'sign', w: 32, h: 32, color: '#f0c090', anchor: 'bottom', desc: 'Shows a message when the player is near.', phys: phys(), comps: {}, props: { text: 'Hello, adventurer!' } },
  spawner: { name: 'Spawner', cat: 'Logic', group: 'spawner', sprite: 'spawner', draw: 'spin2', w: 32, h: 32, color: '#9a4ae0', anchor: 'center', desc: 'Portal that spawns things (on a timer or from Rules).', phys: phys(), comps: {}, props: { what: 'enemy_patrol', every: 0, max: 6 } },
  tree: { name: 'Tree', cat: 'Decor', group: 'decor', sprite: 'tree', w: 64, h: 64, layer: 'back', color: '#2fa34a', anchor: 'bottom', desc: 'Decoration (no collision).', phys: phys(), comps: {} },
  pine: { name: 'Pine', cat: 'Decor', group: 'decor', sprite: 'pine', w: 48, h: 64, layer: 'back', color: '#186a3a', anchor: 'bottom', desc: 'Decoration (no collision).', phys: phys(), comps: {} },
  cloud: { name: 'Cloud', cat: 'Decor', group: 'decor', sprite: 'cloud', w: 96, h: 96, layer: 'back', color: '#ffffff', anchor: 'center', desc: 'Decoration (no collision).', phys: phys(), comps: {} },
  rock: { name: 'Rock', cat: 'Decor', group: 'decor', sprite: 'rock', w: 32, h: 32, layer: 'back', color: '#9a9ab0', anchor: 'bottom', desc: 'Decoration (no collision).', phys: phys(), comps: {} },
  bush: { name: 'Bush', cat: 'Decor', group: 'decor', sprite: 'bush', w: 32, h: 32, layer: 'back', color: '#6ee06e', anchor: 'bottom', desc: 'Decoration (no collision).', phys: phys(), comps: {} },
  flower: { name: 'Flower', cat: 'Decor', group: 'decor', sprite: 'flower', w: 24, h: 24, layer: 'back', color: '#ff6ab8', anchor: 'bottom', desc: 'Decoration (no collision).', phys: phys(), comps: {} }
};
PX.KEY_COLORS = { gold: '#ffd84a', red: '#ff3b3b', blue: '#4ab4ff', green: '#6ee06e', purple: '#b07aff' };

PX.newEntity = (type, x = 0, y = 0) => {
  const A = PX.ASSETS[type]; if (!A) return null;
  return { id: 0, type, name: '', x, y, w: A.w, h: A.h, color: A.color, sprite: '', tint: false, flip: false, layer: A.layer || 'main', phys: clone(A.phys), comps: clone(A.comps), props: clone(A.props || {}) };
};
const deepMerge = (a, b) => { for (const k in b) { if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object') deepMerge(a[k], b[k]); else a[k] = b[k]; } return a; };
PX.deepMerge = deepMerge;

/* ------------------------------------------------------------------ rules schema */
PX.EVENTS = {
  touch: { label: 'Collision', fmt: ['a', 'touches', 'b'], def: { a: 'player', b: 't:coin' } },
  compare: { label: 'Value check', fmt: ['v', 'op', 'n'], def: { v: 'score', op: '>=', n: 100 } },
  timeup: { label: 'Timer', fmt: ['timer hits 0'], def: {} },
  every: { label: 'Repeat', fmt: ['every', 'n', 'seconds'], def: { n: 3 } },
  start: { label: 'Start', fmt: ['the game starts'], def: {} },
  key: { label: 'Key press', fmt: ['key', 'k', 'is pressed'], def: { k: 'Q' } },
  destroyed: { label: 'Destroyed', fmt: ['a', 'is destroyed'], def: { a: 'enemy' } }
};
PX.ACTIONS = {
  score: { label: 'Add score', f: [['n', 'num', 10]] },
  time: { label: 'Add time', f: [['n', 'num', 10]] },
  lives: { label: 'Set lives', f: [['n', 'num', 3]] },
  addlife: { label: 'Gain a life', f: [] },
  loselife: { label: 'Lose a life', f: [] },
  destroy: { label: 'Destroy', f: [['a', 'target', 'other']] },
  spawn: { label: 'Spawn', f: [['s', 'type', 'enemy_patrol'], ['b', 'where', 'spawner']] },
  sound: { label: 'Play sound', f: [['s', 'sound', 'coin']] },
  message: { label: 'Show message', f: [['s', 'text', 'Nice!']] },
  teleport: { label: 'Teleport', f: [['a', 'who', 'player'], ['b', 'dest', 'checkpoint']] },
  speed: { label: 'Change speed', f: [['a', 'who2', 'player'], ['n', 'num', 1.5]] },
  shake: { label: 'Shake screen', f: [] },
  win: { label: 'Win', f: [] },
  lose: { label: 'Lose', f: [] }
};
PX.SOUNDS = ['coin', 'gem', 'jump', 'hit', 'power', 'key', 'laser', 'boom', 'spring', 'win', 'lose', 'blip'];
PX.VARS = { score: 'Score', lives: 'Lives', time: 'Time left', collected: 'Collected', left: 'Collectibles left', enemies: 'Enemies left' };
PX.OPS = { '>=': '≥', '<=': '≤', '=': '=', '>': '>', '<': '<' };
PX.KEYS = { Q: 'KeyQ', E: 'KeyE', F: 'KeyF', C: 'KeyC', V: 'KeyV', Enter: 'Enter', Shift: 'ShiftLeft', X: 'KeyX', Space: 'Space' };
PX.selectorOptions = (AS = PX.ASSETS) => {
  const o = [['player', 'Player'], ['enemy', 'Any enemy'], ['collectible', 'Any coin/gem'], ['hazard', 'Any hazard'], ['bullet', 'Player bullet'], ['any', 'Anything']];
  for (const k in AS) if (k !== 'player') o.push(['t:' + k, AS[k].name]);
  return o;
};
PX.TARGETS = [['other', 'the other one'], ['self', 'the first one'], ['all:enemy', 'all enemies'], ['all:hazard', 'all hazards'], ['all:collectible', 'all coins/gems']];
PX.WHERE = [['spawner', 'at a Spawner'], ['self', 'at the first one'], ['other', 'at the other one'], ['player', 'near the Player'], ['random', 'at a random spot']];
PX.WHO = [['player', 'Player'], ['other', 'the other one'], ['self', 'the first one']];
PX.WHO2 = [['player', 'Player'], ['enemies', 'All enemies'], ['other', 'the other one'], ['self', 'the first one']];
PX.DEST = [['checkpoint', 'last checkpoint'], ['start', 'start position'], ['spawner', 'a Spawner'], ['other', 'the other one'], ['self', 'the first one']];

/* ------------------------------------------------------------------ skies */
PX.SKIES = {
  day: { name: 'Day', c: ['#2f8fe8', '#7cc8ff', '#d9f2ff'], mtn: '#7d9cc7', hill: '#4fae68', city: '#6f86b5', tree: '#2f7d4b', cloud: '#ffffff', stars: 0 },
  sunset: { name: 'Sunset', c: ['#2b1055', '#c93a6b', '#ffb46b'], mtn: '#6a2b6e', hill: '#3a1a4f', city: '#2a1540', tree: '#241034', cloud: '#ffc7a8', stars: .35 },
  dusk: { name: 'Dusk', c: ['#07070f', '#2b1a4e', '#ff5a1f'], mtn: '#2a1a40', hill: '#170f26', city: '#120b1e', tree: '#0c0716', cloud: '#ff9b6b', stars: .6 },
  night: { name: 'Night', c: ['#02030a', '#0b1440', '#27418a'], mtn: '#14204a', hill: '#0c1433', city: '#0b1230', tree: '#070c20', cloud: '#5a6aa8', stars: 1 },
  space: { name: 'Space', c: ['#000000', '#06021a', '#160630'], mtn: '#1a0a3a', hill: '#10062a', city: '#10062a', tree: '#0a0420', cloud: '#6a3aa8', stars: 1.4, nebula: true },
  ocean: { name: 'Ocean', c: ['#032a4a', '#0a6b9a', '#5fd0e0'], mtn: '#0b4f73', hill: '#07405f', city: '#07405f', tree: '#063550', cloud: '#bff0ff', stars: 0 },
  candy: { name: 'Candy', c: ['#ff7cc6', '#ffc2e2', '#cdf3ff'], mtn: '#e58ac8', hill: '#ff9fd2', city: '#d77ab8', tree: '#c060a0', cloud: '#ffffff', stars: 0 },
  meadow: { name: 'Meadow', c: ['#3f9a58', '#4cab66', '#58b872'], mtn: '#2f7a45', hill: '#2f7a45', city: '#2f7a45', tree: '#236338', cloud: '#e8ffe8', stars: 0, floor: true },
  dungeon: { name: 'Dungeon', c: ['#141018', '#1c1622', '#2a1e30'], mtn: '#221a2a', hill: '#18121f', city: '#18121f', tree: '#100b15', cloud: '#3a2f45', stars: 0, floor: true },
  midnight: { name: 'Arcade', c: ['#000000', '#04040e', '#0a0a1f'], mtn: '#10103a', hill: '#0a0a24', city: '#0a0a24', tree: '#06061a', cloud: '#2a2a6a', stars: .5 }
};
PX.LAYERS = { stars: 'Stars', clouds: 'Clouds', mountains: 'Mountains', city: 'City', hills: 'Hills', trees: 'Forest', planets: 'Planets' };
PX.MOODS = { off: 'Off', happy: 'Happy', chill: 'Chill', tense: 'Tense', spooky: 'Spooky', epic: 'Epic' };
PX.CATEGORIES = ['Platformer', 'Adventure', 'Shooter', 'Maze', 'Puzzle', 'Arcade', 'Racing', 'Other'];
PX.WINS = { goal: 'Reach the goal', collect: 'Collect everything', score: 'Reach a score', survive: 'Survive the timer' };

PX.defaultSettings = () => ({ title: 'Untitled Game', desc: '', category: 'Platformer', sky: 'day', parallax: ['mountains', 'hills', 'clouds'], gravity: 1800,
  lives: 3, timeLimit: 120, win: 'goal', winScore: 100, music: { mood: 'happy', tempo: 120 }, levelW: 60, levelH: 15, viewH: 15 });

/* ------------------------------------------------------------------ templates */
function lb() {
  const es = [];
  const place = (type, cx, cy, over) => {
    const A = PX.ASSETS[type], e = PX.newEntity(type);
    if (over) deepMerge(e, clone(over));
    if (!over || over.w == null) e.w = A.w; if (!over || over.h == null) e.h = A.h;
    e.x = cx * T + (T - e.w) / 2;
    e.y = A.anchor === 'bottom' ? (cy + 1) * T - e.h : cy * T + (T - e.h) / 2;
    es.push(e); return e;
  };
  const rect = (type, cx, cy, cw, ch, over) => {
    const A = PX.ASSETS[type], e = PX.newEntity(type);
    if (over) deepMerge(e, clone(over));
    e.x = cx * T; e.w = cw * T;
    if (A.h < T && ch === 1) { e.h = A.h; e.y = A.align === 'bottom' ? cy * T + (T - A.h) : cy * T; } else { e.y = cy * T; e.h = ch * T; }
    es.push(e); return e;
  };
  return { es, put: place, rect };
}
const R = (ev, ...acts) => ({ ev, acts, off: false });
function mapRects(rows, ch) {
  const H = rows.length, W = rows[0].length, used = rows.map(r => [...r].map(() => false)), out = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (rows[y][x] !== ch || used[y][x]) continue;
    let w = 1; while (x + w < W && rows[y][x + w] === ch && !used[y][x + w]) w++;
    let h = 1; outer: while (y + h < H) { for (let i = 0; i < w; i++) if (rows[y + h][x + i] !== ch || used[y + h][x + i]) break outer; h++; }
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used[y + j][x + i] = true;
    out.push({ x, y, w, h });
  }
  return out;
}

PX.TEMPLATES = {
  platformer: { name: 'Platformer', tag: 'Jump · Run', desc: 'Side-scrolling run & jump with coins, lava pits, a moving platform and a goal flag.', build() {
    const L = lb();
    [[3, 2], [15, 1], [29, 3], [44, 2], [58, 1], [71, 3]].forEach(([x, y]) => L.put('cloud', x, y));
    [[7, 11, 'tree'], [26, 11, 'pine'], [48, 11, 'tree'], [66, 11, 'pine'], [78, 11, 'tree']].forEach(([x, y, t]) => L.put(t, x, y));
    [[5, 11], [17, 11], [31, 11], [46, 11], [74, 11]].forEach(([x, y]) => L.put('bush', x, y));
    [[11, 11], [59, 11]].forEach(([x, y]) => L.put('flower', x, y));
    L.put('rock', 69, 11);
    L.rect('ground', 0, 12, 20, 3); L.rect('lava', 20, 13, 3, 2); L.rect('ground', 23, 12, 12, 3); L.rect('lava', 35, 13, 10, 2);
    L.rect('ground', 45, 12, 16, 3); L.rect('lava', 61, 13, 3, 2); L.rect('ground', 64, 12, 16, 3);
    L.put('sign', 4, 11, { props: { text: 'Arrows move · Space jumps. Grab coins, reach the flag!' } });
    [9, 10, 11].forEach(x => L.put('coin', x, 10));
    L.rect('ledge', 13, 9, 4, 1); [13, 14, 15, 16].forEach(x => L.put('coin', x, 8));
    L.put('enemy_patrol', 9, 11, { comps: { patrol: { distance: 96 } } });
    L.put('checkpoint', 25, 11);
    L.rect('spikes', 28, 11, 2, 1); [27, 28, 29, 30].forEach(x => L.put('coin', x, 8));
    L.put('pw_jump', 32, 11);
    L.rect('platform', 36, 10, 4, 1, { comps: { mover: { dx: 128, dy: 0, speed: 64, pause: .6 } } });
    [38, 39, 40, 41, 42].forEach(x => L.put('coin', x, 8));
    L.put('spring', 47, 11); L.put('coin', 47, 7); L.put('coin', 47, 6); L.put('gem', 47, 3);
    L.rect('brick', 50, 11, 2, 1); L.rect('brick', 51, 10, 1, 1);
    L.put('enemy_flyer', 53, 8, { comps: { patrol: { distance: 128 } } });
    L.rect('ledge', 55, 8, 4, 1); [55, 56, 57, 58].forEach(x => L.put('coin', x, 7));
    L.put('enemy_patrol', 57, 11, { comps: { patrol: { distance: 64 } } });
    [66, 67, 68, 69, 70].forEach(x => L.put('coin', x, 10));
    L.rect('stone', 71, 11, 1, 1); L.rect('stone', 72, 10, 1, 2);
    L.put('goal', 76, 11);
    L.put('player', 2, 11);
    return { settings: { title: 'Sunny Hills', desc: 'Run, jump and stomp your way to the flag.', category: 'Platformer', sky: 'day', parallax: ['mountains', 'hills', 'clouds'], win: 'goal', levelW: 80, levelH: 15, viewH: 15, music: { mood: 'happy', tempo: 124 } },
      entities: L.es, rules: [
        R({ type: 'compare', v: 'score', op: '>=', n: 150 }, { type: 'message', s: '150 POINTS — NICE!' }, { type: 'sound', s: 'power' }),
        R({ type: 'touch', a: 'player', b: 't:gem' }, { type: 'shake' }, { type: 'message', s: 'SHINY!' }),
        R({ type: 'timeup' }, { type: 'message', s: 'Out of time!' }, { type: 'lose' })] };
  } },
  topdown: { name: 'Top-down Adventure', tag: 'Explore · Key & door', desc: 'Three rooms, a locked gate, a key to find, chasers and turrets. Space shoots.', build() {
    const L = lb();
    L.rect('stone', 0, 0, 40, 1); L.rect('stone', 0, 23, 40, 1); L.rect('stone', 0, 1, 1, 22); L.rect('stone', 39, 1, 1, 22);
    L.rect('stone', 13, 1, 1, 9); L.rect('stone', 13, 13, 1, 10); L.rect('stone', 27, 1, 1, 9); L.rect('stone', 27, 13, 1, 10);
    L.rect('door', 27, 10, 1, 3); L.rect('brick', 18, 5, 4, 2); L.rect('brick', 18, 16, 4, 2); L.rect('brick', 31, 6, 5, 1); L.rect('brick', 31, 17, 5, 1);
    [[2, 2], [10, 2], [2, 21], [10, 21], [16, 21], [37, 21]].forEach(([x, y]) => L.put('tree', x, y, { layer: 'back' }));
    [[6, 4], [8, 18], [15, 8], [25, 14], [30, 2], [37, 9]].forEach(([x, y]) => L.put('bush', x, y));
    [[4, 7], [9, 15], [22, 9], [33, 12]].forEach(([x, y]) => L.put('flower', x, y));
    L.put('sign', 5, 9, { props: { text: 'Find the key to open the gate. Space shoots!' } });
    [4, 5, 6, 7, 8, 9].forEach(x => L.put('coin', x, 14));
    [[16, 3], [24, 3], [16, 20], [24, 11], [35, 3], [35, 20], [30, 11]].forEach(([x, y]) => L.put('gem', x, y));
    L.put('enemy_patrol', 9, 5, { comps: { patrol: { axis: 'y', distance: 256, speed: 70, edgeTurn: false } } });
    L.put('enemy_chase', 22, 11, { comps: { chase: { range: 260, speed: 70 } } });
    L.put('enemy_chase', 20, 20, { comps: { chase: { range: 200, speed: 65 } } });
    L.put('key', 24, 20);
    L.put('pw_speed', 6, 20);
    L.put('enemy_shooter', 34, 4, { comps: { shooter: { rate: 2 } } }); L.put('enemy_shooter', 34, 19, { comps: { shooter: { rate: 2.3 } } });
    L.put('pw_shield', 30, 14); L.put('life', 16, 11);
    L.put('goal', 36, 11);
    L.put('player', 3, 11, { comps: { player: { mode: 'topdown', speed: 170, canShoot: true, fireRate: 4 }, followCam: { lookahead: 0 } } });
    return { settings: { title: 'Gatehouse', desc: 'Find the key, open the gate and escape.', category: 'Adventure', sky: 'meadow', parallax: [], win: 'goal', levelW: 40, levelH: 24, viewH: 14, lives: 3, timeLimit: 150, music: { mood: 'chill', tempo: 100 } },
      entities: L.es, rules: [
        R({ type: 'touch', a: 'player', b: 't:key' }, { type: 'message', s: 'Key found! The gate can open now.' }),
        R({ type: 'destroyed', a: 'enemy' }, { type: 'score', n: 25 }),
        R({ type: 'compare', v: 'enemies', op: '=', n: 0 }, { type: 'message', s: 'All enemies cleared!' })] };
  } },
  shooter: { name: 'Space Shooter', tag: 'Blast · Survive', desc: 'Fly a ship through an asteroid field. Portals spawn aliens every 4 seconds. Hit the target score.', build() {
    const L = lb(); let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 16; i++) L.put('asteroid', 2 + Math.floor(rnd() * 26), 8 + Math.floor(rnd() * 42), { comps: { patrol: { distance: 64 + Math.floor(rnd() * 4) * 32, speed: 20 + Math.floor(rnd() * 30) } } });
    [[6, 10], [20, 16], [10, 22], [24, 30], [4, 36], [16, 44]].forEach(([x, y]) => L.put('enemy_flyer', x, y, { sprite: 'alien', color: '#6ee06e', comps: { patrol: { distance: 192, speed: 90, wave: 26 } } }));
    [[14, 12], [6, 28], [22, 40]].forEach(([x, y]) => L.put('enemy_shooter', x, y, { sprite: 'ufo', color: '#9ff4ff', phys: { body: 'dynamic', gravity: 0 }, comps: { patrol: comp('patrol', { distance: 160, speed: 50, edgeTurn: false }), shooter: { rate: 1.6, speed: 240, range: 420 } } }));
    L.put('enemy_chase', 15, 24, { sprite: 'alien', color: '#ff6ab8', comps: { chase: { range: 520, speed: 75, smart: false } } });
    [[5, 3], [15, 2], [25, 3]].forEach(([x, y]) => L.put('spawner', x, y, { props: { what: 'enemy_chase' } }));
    [[3, 18], [27, 12], [12, 33], [26, 46], [8, 50], [18, 6]].forEach(([x, y]) => L.put('gem', x, y));
    L.put('pw_shield', 15, 38); L.put('life', 4, 30); L.put('pw_speed', 25, 22);
    [[8, 49], [23, 46], [4, 44]].forEach(([x, y]) => L.put('asteroid', x, y, { comps: { patrol: { distance: 96, speed: 26 } } }));
    [[12, 51], [19, 49], [15, 46]].forEach(([x, y]) => L.put('gem', x, y));
    L.put('enemy_flyer', 18, 43, { sprite: 'alien', color: '#6ee06e', comps: { patrol: { distance: 160, speed: 80, wave: 20 } } });
    L.put('player', 15, 56, { sprite: 'ship', comps: { player: { mode: 'ship', speed: 260, canShoot: true, fireRate: 7 }, followCam: { lookahead: 0, smooth: 5 } } });
    return { settings: { title: 'Nebula Run', desc: 'Blast aliens and asteroids. Reach 600 points before time runs out.', category: 'Shooter', sky: 'space', parallax: ['stars', 'planets'], win: 'score', winScore: 600, levelW: 30, levelH: 60, viewH: 16, lives: 3, timeLimit: 120, music: { mood: 'epic', tempo: 138 } },
      entities: L.es, rules: [
        R({ type: 'every', n: 4 }, { type: 'spawn', s: 'enemy_chase', b: 'spawner' }),
        R({ type: 'compare', v: 'score', op: '>=', n: 300 }, { type: 'message', s: 'HALFWAY THERE' }, { type: 'time', n: 15 }),
        R({ type: 'touch', a: 'player', b: 'hazard' }, { type: 'shake' })] };
  } },
  maze: { name: 'Maze Chase', tag: 'Collect · Evade', desc: 'Eat every dot while ghosts hunt you. Shield orbs let you bite back.', build() {
    const L = lb();
    const M = ['#####################', '#H........#........H#', '#.##.####.#.####.##.#', '#.##.####.#.####.##.#', '#...................#', '#.##.#.#######.#.##.#', '#....#....#....#....#',
      '####.####.#.####.####', '#.......o...o.......#', '####.#.###.###.#.####', '#....#.........#....#', '#.##.#.#######.#.##.#', '#..#.............#..#', '##.#.#.#######.#.#.##', '#....#....#....#....#', '#.#######.P.#######.#', '#####################'];
    mapRects(M, '#').forEach(r => L.rect('neon', r.x, r.y, r.w, r.h));
    M.forEach((row, y) => [...row].forEach((ch, x) => {
      if (ch === '.') L.put('coin', x, y, { name: 'Dot', sprite: 'dot', w: 10, h: 10, comps: { collectible: { score: 10, sound: 'blip' } } });
      else if (ch === 'H') L.put('pw_shield', x, y, { props: { duration: 7 } });
    }));
    L.put('enemy_chase', 8, 8, { w: 26, h: 26, color: '#ff4d4d', comps: { chase: { range: 2000, speed: 92, smart: true } } });
    L.put('enemy_chase', 12, 8, { w: 26, h: 26, color: '#4ab4ff', tint: true, comps: { chase: { range: 180, speed: 88, smart: true }, patrol: comp('patrol', { distance: 224, speed: 80, edgeTurn: false }) } });
    L.put('player', 10, 15, { w: 26, h: 26, comps: { player: { mode: 'topdown', speed: 140 }, followCam: { lookahead: 0 } } });
    return { settings: { title: 'Neon Maze', desc: 'Eat every dot. Grab a shield to turn the tables.', category: 'Maze', sky: 'midnight', parallax: [], win: 'collect', levelW: 21, levelH: 17, viewH: 17, lives: 3, timeLimit: 150, music: { mood: 'tense', tempo: 132 } },
      entities: L.es, rules: [
        R({ type: 'compare', v: 'left', op: '<=', n: 20 }, { type: 'message', s: 'Almost there!' }),
        R({ type: 'destroyed', a: 't:enemy_chase' }, { type: 'score', n: 200 }, { type: 'message', s: 'GHOST BUSTED +200' })] };
  } },
  blank: { name: 'Blank', tag: 'Empty canvas', desc: 'Just a strip of ground, a player and a goal. Build anything.', build() {
    const L = lb();
    L.rect('ground', 0, 12, 40, 3); L.put('player', 2, 11); L.put('goal', 37, 11);
    return { settings: { title: 'My New Game', desc: '', category: 'Platformer', sky: 'day', parallax: ['hills', 'clouds'], win: 'goal', levelW: 40, levelH: 15, viewH: 15 }, entities: L.es, rules: [] };
  } }
};

PX.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
PX.newProject = (tpl = 'blank') => {
  const t = PX.TEMPLATES[tpl] || PX.TEMPLATES.blank; const b = t.build();
  const P = { v: 1, id: PX.uid(), updated: Date.now(), template: tpl, nextId: 1, settings: Object.assign(PX.defaultSettings(), b.settings), entities: b.entities, rules: b.rules, sprites: {} };
  P.entities.forEach(e => { e.id = P.nextId++; });
  return P;
};
PX.normalize = P => {
  if (!P || typeof P !== 'object' || !Array.isArray(P.entities)) throw new Error('Not a Pixel Arcade Builder project');
  P.settings = Object.assign(PX.defaultSettings(), P.settings || {});
  P.settings.music = Object.assign({ mood: 'happy', tempo: 120 }, P.settings.music || {});
  P.rules = Array.isArray(P.rules) ? P.rules : []; P.sprites = P.sprites || {};
  let max = 0;
  P.entities = P.entities.filter(e => e && PX.ASSETS[e.type]).map(e => {
    const base = PX.newEntity(e.type); const out = Object.assign(base, e);
    out.phys = Object.assign(base.phys, e.phys || {}); out.comps = e.comps || {}; out.props = Object.assign(clone(PX.ASSETS[e.type].props || {}), e.props || {});
    if (!out.id) out.id = 0; max = Math.max(max, out.id | 0); return out;
  });
  P.entities.forEach(e => { if (!e.id) e.id = ++max; });
  P.nextId = Math.max(P.nextId || 1, max + 1);
  P.id = P.id || PX.uid(); P.v = 1;
  return P;
};
})();
