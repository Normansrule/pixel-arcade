/* Pixel Arcade Builder — 3D engine: models, environment, editor scene view, game runtime, thumbnails.
   Loaded on demand (dynamic import) only when a 3D project is opened. */
import * as THREE from '../vendor/three.module.min.js';
import { OrbitControls } from '../vendor/jsm/controls/OrbitControls.js';
import { TransformControls } from '../vendor/jsm/controls/TransformControls.js';
import { cinematic, quality, setQuality } from '../js/fx3d.js';

const PX = window.PXB, A3 = PX.ASSETS3D, D2R = Math.PI / 180;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const PRIMS = new Set(['box', 'ramp', 'cyl', 'lava', 'water', 'zone', 'door']);

/* ================================================================ textures + materials */
const texCache = {};
function tex(name) {
  if (!name || name === 'none') return null; if (texCache[name]) return texCache[name];
  const c = PX.texCanvas(name); if (!c) return null;
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return (texCache[name] = t);
}
const matCache = new Map();
function material(color, finish = 'matte', texName = 'none', extra = '') {
  const key = color + '|' + finish + '|' + texName + '|' + extra; let m = matCache.get(key); if (m) return m;
  const map = tex(texName), col = new THREE.Color(color || '#ffffff');
  if (finish === 'metal') m = new THREE.MeshStandardMaterial({ color: col, map, metalness: .85, roughness: .28 });
  else if (finish === 'glass') m = new THREE.MeshPhysicalMaterial({ color: col, map, metalness: 0, roughness: .04, transparent: true, opacity: .5, clearcoat: 1, envMapIntensity: 2 });
  else if (finish === 'glow') m = new THREE.MeshStandardMaterial({ color: col, map, emissive: col, emissiveIntensity: 1.8, emissiveMap: map, roughness: .4 });
  else m = new THREE.MeshStandardMaterial({ color: col, map, roughness: .86, metalness: 0 });
  if (map && finish !== 'glow' && finish !== 'glass') { m.bumpMap = map; m.bumpScale = 1.2; }
  if (extra === 'flat') m.flatShading = true;
  matCache.set(key, m); return m;
}
const MAT = {
  dark: () => material('#1a1424', 'matte'), white: () => material('#ffffff', 'matte'), eye: () => material('#111018', 'metal'),
  lava() { let m = matCache.get('lava'); if (!m) { const t = tex('lava'); t.repeat.set(.34, .34); m = new THREE.MeshStandardMaterial({ color: '#ff8a3a', map: t, emissive: '#ff5a10', emissiveMap: t, emissiveIntensity: 2.2, roughness: .6 }); matCache.set('lava', m); } return m; },
  water() { let m = matCache.get('water'); if (!m) { const t = tex('water'); t.repeat.set(.25, .25); m = new THREE.MeshStandardMaterial({ color: '#3aa8e6', map: t, transparent: true, opacity: .72, roughness: .08, metalness: .1, envMapIntensity: 1.4, depthWrite: false }); matCache.set('water', m); } return m; },
  zone() { let m = matCache.get('zone'); if (!m) { m = new THREE.MeshBasicMaterial({ color: '#ff3b3b', transparent: true, opacity: .18, depthWrite: false }); matCache.set('zone', m); } return m; }
};
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
let swirlTex = null, dotTex = null;
const swirl = () => swirlTex || (swirlTex = canvasTex(256, 256, (x) => { const g = x.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, '#fff6d8'); g.addColorStop(.35, '#ff8a2a'); g.addColorStop(.75, '#ff4d00'); g.addColorStop(1, 'rgba(120,20,60,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256); x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 6; for (let i = 0; i < 5; i++) { x.beginPath(); for (let a = 0; a < 5; a += .05) { const r = a * 22; x.lineTo(128 + Math.cos(a + i * 1.256) * r, 128 + Math.sin(a + i * 1.256) * r); } x.stroke(); } }));
const dot = () => dotTex || (dotTex = canvasTex(64, 64, (x) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.4, 'rgba(255,255,255,.6)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); }));

/* ================================================================ geometry helpers (world-space UVs: texture spans 2 m) */
function boxGeo(w, h, d) {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, S = .5;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * dims[f][0] * S, uv.getY(k) * dims[f][1] * S); }
  return g;
}
function rampGeo(w, h, d) {
  const g = boxGeo(w, h, d), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) if (p.getX(i) < 0 && p.getY(i) > 0) p.setY(i, -h / 2);
  g.computeVertexNormals(); return g;
}
function cylGeo(w, h, d, seg = 32) {
  const r = Math.max(w, d) / 2, g = new THREE.CylinderGeometry(r, r, h, seg), uv = g.attributes.uv, side = (seg + 1) * 2, S = .5;
  for (let i = 0; i < uv.count; i++) { if (i < side) uv.setXY(i, uv.getX(i) * Math.PI * 2 * r * S, uv.getY(i) * h * S); else uv.setXY(i, uv.getX(i) * 2 * r * S, uv.getY(i) * 2 * r * S); }
  if (w !== d) g.scale(w / (2 * r), 1, d / (2 * r));
  return g;
}
const G = {}; // shared model geometries
const geo = (k, f) => G[k] || (G[k] = f());
function mesh(g, m, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); return o; }

/* ================================================================ models (built at the asset's base size; origin = bbox centre) */
function model(e) {
  const A = A3[e.type], [W, H, D] = A.size, g = new THREE.Group(), col = e.color || A.color, fin = e.mat || 'matte';
  const body = material(col, fin === 'glass' ? 'glass' : fin === 'metal' ? 'metal' : fin === 'glow' ? 'glow' : 'matte');
  switch (A.shape) {
    case 'player': {
      const b = mesh(geo('cap', () => new THREE.CapsuleGeometry(.4, 1, 8, 20)), fin === 'matte' ? new THREE.MeshPhysicalMaterial({ color: col, roughness: .42, clearcoat: .6, clearcoatRoughness: .3, emissive: col, emissiveIntensity: .14 }) : material(col, fin)); g.add(b); b.name = 'body';
      g.add(mesh(geo('visor', () => { const s = new THREE.SphereGeometry(.3, 24, 12, 0, Math.PI * 2, 0, Math.PI * .55); s.scale(1, .55, .55); s.rotateX(-Math.PI / 2); return s; }), material('#141a2a', 'metal'), 0, .45, -.28));
      const eye = geo('peye', () => new THREE.SphereGeometry(.055, 12, 8)); const em = material('#9ff4ff', 'glow');
      g.add(mesh(eye, em, -.1, .47, -.43)); g.add(mesh(eye, em, .1, .47, -.43));
      g.add(mesh(geo('pack', () => new THREE.BoxGeometry(.45, .5, .2)), material('#3a3150', 'matte'), 0, .1, .4));
      const foot = geo('pfoot', () => new THREE.CapsuleGeometry(.11, .14, 4, 8).rotateX(Math.PI / 2)); const fm = material('#2b2338', 'matte');
      g.add(mesh(foot, fm, -.17, -.86, -.06)); g.add(mesh(foot, fm, .17, -.86, -.06));
      break;
    }
    case 'slime': {
      const b = mesh(geo('slime', () => { const s = new THREE.SphereGeometry(.55, 28, 18); s.scale(1, .82, 1); return s; }), new THREE.MeshPhysicalMaterial({ color: col, roughness: .25, clearcoat: .8, transmission: 0 }), 0, -.0, 0); b.name = 'body'; g.add(b);
      const ew = geo('ew', () => new THREE.SphereGeometry(.13, 14, 10)), ep = geo('ep', () => new THREE.SphereGeometry(.065, 10, 8));
      [-1, 1].forEach(s => { g.add(mesh(ew, MAT.white(), s * .17, .15, -.43)); g.add(mesh(ep, MAT.eye(), s * .17, .15, -.53)); });
      break;
    }
    case 'ghost': {
      const m = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: .25, roughness: .5, transparent: true, opacity: .92 });
      g.add(mesh(geo('gh', () => new THREE.SphereGeometry(.5, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2)), m, 0, .1, 0));
      const skirt = mesh(geo('gs', () => { const c = new THREE.CylinderGeometry(.5, .56, .6, 24, 3, true); const p = c.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) < -.29) p.setY(i, p.getY(i) + Math.sin(Math.atan2(p.getZ(i), p.getX(i)) * 6) * .08); c.computeVertexNormals(); return c; }), m, 0, -.2, 0);
      skirt.material = m.clone(); skirt.material.side = THREE.DoubleSide; g.add(skirt);
      const ey = geo('ghe', () => new THREE.SphereGeometry(.09, 12, 8)); const red = material('#ff3b6b', 'glow');
      g.add(mesh(ey, red, -.17, .2, -.44)); g.add(mesh(ey, red, .17, .2, -.44)); g.children[0].name = 'body';
      break;
    }
    case 'turret': {
      g.add(mesh(geo('tb', () => new THREE.CylinderGeometry(.55, .62, .5, 20)), material('#3a3d4a', 'metal'), 0, -.45, 0));
      const head = new THREE.Group(); head.name = 'head'; head.position.y = .15;
      head.add(mesh(geo('td', () => new THREE.SphereGeometry(.5, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2)), material(col, 'metal')));
      head.add(mesh(geo('tbar', () => new THREE.CylinderGeometry(.09, .11, .8, 12).rotateX(Math.PI / 2)), material('#2b2b33', 'metal'), 0, .18, -.55));
      head.add(mesh(geo('teye', () => new THREE.SphereGeometry(.1, 12, 8)), material('#ff3b3b', 'glow'), 0, .3, -.38));
      g.add(head); break;
    }
    case 'coin': {
      const c = mesh(geo('coin', () => new THREE.CylinderGeometry(.35, .35, .1, 32).rotateX(Math.PI / 2)), new THREE.MeshStandardMaterial({ color: col, metalness: .9, roughness: .22, emissive: col, emissiveIntensity: .25 }));
      c.add(mesh(geo('coinr', () => new THREE.TorusGeometry(.35, .035, 8, 32)), material(col, 'metal'))); g.add(c); c.name = 'spin';
      break;
    }
    case 'gem': {
      const c = mesh(geo('gem', () => { const o = new THREE.OctahedronGeometry(.45, 0); o.scale(1, 1.3, 1); return o; }), new THREE.MeshPhysicalMaterial({ color: col, roughness: .05, metalness: .1, transparent: true, opacity: .78, clearcoat: 1, emissive: col, emissiveIntensity: .35, flatShading: true }));
      c.add(mesh(geo('gemi', () => new THREE.OctahedronGeometry(.18, 0)), material(col, 'glow'))); c.name = 'spin'; g.add(c); break;
    }
    case 'key': {
      const k = new THREE.Group(); k.name = 'spin'; const m = material(PX.KEY_COLORS[(e.props || {}).color] || col, 'metal');
      k.add(mesh(geo('kr', () => new THREE.TorusGeometry(.15, .05, 10, 20)), m, -.27, 0, 0));
      k.add(mesh(geo('ks', () => new THREE.BoxGeometry(.5, .07, .07)), m, .12, 0, 0));
      k.add(mesh(geo('kt', () => new THREE.BoxGeometry(.06, .14, .07)), m, .3, -.08, 0)); k.add(mesh(geo('kt', () => 0), m, .2, -.07, 0));
      g.add(k); break;
    }
    case 'orb': {
      const o = new THREE.Group(); o.name = 'spin';
      o.add(mesh(geo('orb', () => new THREE.IcosahedronGeometry(.28, 2)), material(col, 'glow')));
      o.add(mesh(geo('orbr', () => new THREE.TorusGeometry(.38, .035, 8, 32)), material('#ffffff', 'metal')));
      const r2 = mesh(geo('orbr', () => 0), material('#ffffff', 'metal')); r2.rotation.x = Math.PI / 2; o.add(r2);
      g.add(o); break;
    }
    case 'heart': {
      const o = new THREE.Group(); o.name = 'spin'; const m = new THREE.MeshPhysicalMaterial({ color: col, roughness: .2, clearcoat: 1, emissive: col, emissiveIntensity: .2 });
      const sg = geo('hs', () => new THREE.SphereGeometry(.2, 18, 12)); o.add(mesh(sg, m, -.15, .08, 0)); o.add(mesh(sg, m, .15, .08, 0));
      o.add(mesh(geo('hc', () => new THREE.ConeGeometry(.33, .45, 18).rotateZ(Math.PI)), m, 0, -.15, 0)); g.add(o); break;
    }
    case 'spikes': {
      g.add(mesh(geo('spb', () => new THREE.BoxGeometry(2, .1, 2)), material('#4a4a5a', 'metal'), 0, -.25, 0));
      const cg = geo('spc', () => new THREE.ConeGeometry(.17, .5, 6)), cm = material(col, 'metal');
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) g.add(mesh(cg, cm, -.75 + i * .5, .05, -.75 + j * .5));
      break;
    }
    case 'pad': {
      g.add(mesh(geo('pb', () => new THREE.CylinderGeometry(.7, .75, .2, 28)), material('#2b2b36', 'metal'), 0, -.05, 0));
      const top = mesh(geo('pt', () => new THREE.CylinderGeometry(.55, .55, .08, 28)), material(col, 'glow'), 0, .09, 0); top.name = 'padtop'; g.add(top);
      g.add(mesh(geo('pr', () => new THREE.TorusGeometry(.62, .04, 8, 32).rotateX(Math.PI / 2)), material('#ffd84a', 'glow'), 0, .1, 0));
      break;
    }
    case 'portal': {
      const ring = mesh(geo('por', () => new THREE.TorusGeometry(1, .13, 14, 48)), material(col, 'glow'), 0, .3, 0); g.add(ring);
      const disc = mesh(geo('pod', () => new THREE.CircleGeometry(.92, 40)), new THREE.MeshBasicMaterial({ map: swirl(), transparent: true, side: THREE.DoubleSide, depthWrite: false }), 0, .3, 0); disc.name = 'spin2'; g.add(disc);
      g.add(mesh(geo('pob', () => new THREE.BoxGeometry(2.2, .3, .6)), material('#2b2b36', 'metal'), 0, -1.35, 0));
      break;
    }
    case 'checkpoint': {
      g.add(mesh(geo('cpb', () => new THREE.CylinderGeometry(.45, .5, .15, 24)), material('#3a3d4a', 'metal'), 0, -1.12, 0));
      g.add(mesh(geo('cpp', () => new THREE.CylinderGeometry(.05, .05, 2.2, 10)), material('#d8d8e4', 'metal'), 0, -.05, 0));
      const f = mesh(geo('cpf', () => new THREE.BoxGeometry(.7, .42, .04)), material(col, 'matte'), .37, .78, 0); f.name = 'flag'; g.add(f);
      g.add(mesh(geo('cpk', () => new THREE.SphereGeometry(.08, 12, 8)), material('#ffd84a', 'metal'), 0, 1.08, 0));
      break;
    }
    case 'spawner': {
      g.add(mesh(geo('spd', () => new THREE.CylinderGeometry(.9, .9, .12, 32)), material('#1d1430', 'metal'), 0, -.08, 0));
      const r = mesh(geo('spr', () => new THREE.TorusGeometry(.75, .07, 10, 40).rotateX(Math.PI / 2)), material(col, 'glow'), 0, .04, 0); r.name = 'spin'; g.add(r);
      const in2 = mesh(geo('spi', () => new THREE.CircleGeometry(.62, 32).rotateX(-Math.PI / 2)), new THREE.MeshBasicMaterial({ map: swirl(), transparent: true, opacity: .8, color: '#c8a0ff', depthWrite: false }), 0, .03, 0); in2.name = 'spin2'; g.add(in2);
      break;
    }
    case 'sign': {
      g.add(mesh(geo('sgp', () => new THREE.BoxGeometry(.12, 1.7, .12)), material('#6e4222', 'matte'), 0, 0, .02));
      const t = canvasTex(256, 160, (x) => { x.fillStyle = '#f0d0a0'; x.fillRect(0, 0, 256, 160); x.strokeStyle = '#6e4222'; x.lineWidth = 10; x.strokeRect(5, 5, 246, 150); x.fillStyle = '#3a2410'; x.font = '700 24px JetBrains Mono, monospace'; x.textAlign = 'center'; const words = String((e.props || {}).text || '').split(' '); let line = '', y = 44; const lines = []; for (const w of words) { if (x.measureText(line + w).width > 220) { lines.push(line); line = ''; } line += w + ' '; } lines.push(line); lines.slice(0, 4).forEach((l, i) => x.fillText(l.trim(), 128, y + i * 30)); });
      const bm = [material('#a8743f'), material('#a8743f'), material('#a8743f'), material('#a8743f'), new THREE.MeshStandardMaterial({ map: t, roughness: .8 }), material('#a8743f')];
      g.add(mesh(geo('sgb', () => new THREE.BoxGeometry(1.4, .9, .1)), bm, 0, .35, -.04)); g.children[1].material = bm; break;
    }
    case 'light': {
      g.add(mesh(geo('lb', () => new THREE.SphereGeometry(.16, 16, 10)), material(col, 'glow')));
      g.add(mesh(geo('lc', () => new THREE.CylinderGeometry(.1, .14, .14, 12)), material('#2b2b36', 'metal'), 0, .18, 0));
      break;
    }
    case 'tree': {
      g.add(mesh(geo('tt', () => new THREE.CylinderGeometry(.18, .28, 2, 8)), material('#7a4a28', 'matte', 'none', 'flat'), 0, -1.25, 0));
      const lm = material(col, 'matte', 'none', 'flat'), ic = geo('ti', () => new THREE.IcosahedronGeometry(1, 0));
      [[0, .2, 0, 1.05], [.35, .9, .2, .8], [-.3, .75, -.25, .75], [0, 1.45, 0, .55]].forEach(([x, y, z, s]) => { const o = mesh(ic, lm, x, y, z); o.scale.setScalar(s); g.add(o); });
      break;
    }
    case 'pine': {
      g.add(mesh(geo('ptk', () => new THREE.CylinderGeometry(.15, .22, 1.4, 8)), material('#6e4222', 'matte', 'none', 'flat'), 0, -1.8, 0));
      const lm = material(col, 'matte', 'none', 'flat');
      [[-.7, 1, 1.6], [.3, .8, 1.4], [1.2, .6, 1.2]].forEach(([y, r, h]) => g.add(mesh(geo('pc' + r, () => new THREE.ConeGeometry(r, h, 8)), lm, 0, y, 0)));
      break;
    }
    case 'rock': {
      g.add(mesh(geo('rk', () => { const d = new THREE.DodecahedronGeometry(.8, 0); const p = d.attributes.position; for (let i = 0; i < p.count; i++) { const k = .85 + PX.hash2(Math.round(p.getX(i) * 9), Math.round(p.getZ(i) * 9), Math.round(p.getY(i) * 9)) * .3; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * .7, p.getZ(i) * k); } d.computeVertexNormals(); return d; }), material(col, 'matte', 'stone', 'flat')));
      break;
    }
    case 'bush': {
      const lm = material(col, 'matte', 'none', 'flat'), ic = geo('ti', () => new THREE.IcosahedronGeometry(1, 0));
      [[0, -.05, 0, .5], [.35, -.15, .1, .38], [-.33, -.15, -.05, .4]].forEach(([x, y, z, s]) => { const o = mesh(ic, lm, x, y, z); o.scale.setScalar(s); g.add(o); });
      break;
    }
    case 'house': {
      g.add(mesh(geo('hw', () => boxGeo(4.4, 2.8, 4.4)), material(col, 'matte', 'sand'), 0, -.85, 0));
      g.add(mesh(geo('hbase', () => boxGeo(4.6, .5, 4.6)), material('#b8b2a8', 'matte', 'stone'), 0, -2, 0));
      g.add(mesh(geo('hr', () => new THREE.ConeGeometry(3.6, 1.9, 4, 1).rotateY(Math.PI / 4)), material('#b04a36', 'matte', 'none', 'flat'), 0, 1.3, 0));
      g.add(mesh(geo('hd', () => new THREE.BoxGeometry(.9, 1.6, .1)), material('#6e4222', 'matte', 'wood'), 0, -1.45, -2.22));
      const win = geo('hwin', () => new THREE.BoxGeometry(.8, .7, .1)), wm = material('#ffd27a', 'glow');
      [[-1.3, -.6, -2.22], [1.3, -.6, -2.22]].forEach(p => g.add(mesh(win, wm, ...p)));
      const sw = mesh(win, wm, 2.22, -.6, .6); sw.rotation.y = Math.PI / 2; g.add(sw);
      g.add(mesh(geo('hch', () => new THREE.BoxGeometry(.5, 1.2, .5)), material('#8a8b95', 'matte', 'brick'), 1.2, 1.4, 1));
      break;
    }
    default: g.add(mesh(new THREE.BoxGeometry(W, H, D), body));
  }
  return g;
}
function prim(e, size) {
  const A = A3[e.type], [w, h, d] = size;
  let gm, m;
  switch (A.shape) {
    case 'ramp': gm = rampGeo(w, h, d); break;
    case 'cyl': gm = cylGeo(w, h, d); break;
    default: gm = boxGeo(w, h, d);
  }
  if (A.shape === 'lava') m = MAT.lava();
  else if (A.shape === 'water') m = MAT.water();
  else if (A.shape === 'zone') m = MAT.zone();
  else if (A.shape === 'door') { const kc = PX.KEY_COLORS[(e.props || {}).color] || '#ffd84a'; m = material(kc, 'matte', e.tex || 'wood'); }
  else m = material(e.color, e.mat || 'matte', e.tex || 'none');
  const o = new THREE.Mesh(gm, m);
  if (A.shape === 'door') { const knob = mesh(geo('knob', () => new THREE.SphereGeometry(.09, 12, 8)), material('#ffd84a', 'metal'), w * .32, -h * .05, -d / 2 - .05); o.add(knob); }
  return o;
}
function buildObject(e) {
  const A = A3[e.type]; if (!A) return new THREE.Group();
  const size = PX.size3(e), isPrim = PRIMS.has(A.shape);
  const holder = new THREE.Group();
  let inner;
  if (isPrim) { inner = prim(e, size); holder.userData.prim = true; }
  else { inner = model(e); inner.scale.set(e.s[0], e.s[1], e.s[2]); }
  inner.name = 'inner';
  holder.add(inner);
  holder.position.set(e.p[0], e.p[1], e.p[2]);
  holder.rotation.set(e.r[0] * D2R, e.r[1] * D2R, e.r[2] * D2R);
  const water = A.shape === 'water' || A.shape === 'zone';
  holder.traverse(o => { if (o.isMesh) { o.castShadow = !!e.cast && !water && A.shape !== 'portal' && A.shape !== 'light'; o.receiveShadow = !!e.recv && A.shape !== 'light'; } });
  holder.userData.id = e.id; holder.userData.type = e.type; holder.userData.size = size;
  return holder;
}

/* ================================================================ colliders */
// col = {e, kind:'obb'|'cyl', c:Vector3, h:Vector3, q, qi, r, hh, min, max}
function makeCollider(e, pos, quat) {
  const A = A3[e.type], size = PX.size3(e), col = { e, kind: 'obb', c: V(), h: V(), q: new THREE.Quaternion(), qi: new THREE.Quaternion(), min: V(), max: V() };
  updateCollider(col, pos, quat, size, A.shape);
  return col;
}
const _v = V(), _v2 = V(), _q = new THREE.Quaternion();
function updateCollider(col, pos, quat, size, shape) {
  const [w, h, d] = size;
  col.q.copy(quat); col.c.copy(pos); col.kind = 'obb';
  if (shape === 'ramp') {
    const L = Math.hypot(w, h), th = Math.atan2(h, w), T = w * h / L;
    // slab whose top face is the hypotenuse; local frame of the ramp
    const local = V(T / 2 * Math.sin(th), -T / 2 * Math.cos(th), 0);
    col.h.set(L / 2, T / 2, d / 2);
    _q.setFromAxisAngle(V(0, 0, 1), th); col.q.copy(quat).multiply(_q);
    col.c.copy(local.applyQuaternion(quat)).add(pos);
  } else if (shape === 'cyl' || shape === 'tree' || shape === 'pine' || shape === 'turret') {
    const up = V(0, 1, 0).applyQuaternion(quat);
    if (up.y > .98) { col.kind = 'cyl'; col.r = Math.max(w, d) / 2; col.hh = h / 2; if (shape === 'tree' || shape === 'pine') { col.r = w * .12; col.hh = h * .3; col.c.y = pos.y - h / 2 + col.hh; } }
    col.h.set(w / 2, h / 2, d / 2);
  } else if (shape === 'house') { col.h.set(w * .44, h * .31, d * .44); col.c.y = pos.y - h / 2 + h * .31; }
  else if (shape === 'rock') col.h.set(w * .4, h * .42, d * .4);
  else col.h.set(w / 2, h / 2, d / 2);
  col.qi.copy(col.q).invert();
  // world AABB
  if (col.kind === 'cyl') { col.min.set(col.c.x - col.r, col.c.y - col.hh, col.c.z - col.r); col.max.set(col.c.x + col.r, col.c.y + col.hh, col.c.z + col.r); }
  else {
    col.min.set(Infinity, Infinity, Infinity); col.max.set(-Infinity, -Infinity, -Infinity);
    for (let i = 0; i < 8; i++) { _v.set(i & 1 ? col.h.x : -col.h.x, i & 2 ? col.h.y : -col.h.y, i & 4 ? col.h.z : -col.h.z).applyQuaternion(col.q).add(col.c); col.min.min(_v); col.max.max(_v); }
  }
}
const _l = V(), _n = V();
// returns penetration depth (>0) and writes world normal into out
function sphereVs(c, r, col, out) {
  if (c.x + r < col.min.x || c.x - r > col.max.x || c.y + r < col.min.y || c.y - r > col.max.y || c.z + r < col.min.z || c.z - r > col.max.z) return 0;
  if (col.kind === 'cyl') {
    const lx = c.x - col.c.x, ly = c.y - col.c.y, lz = c.z - col.c.z, rad = Math.hypot(lx, lz);
    const k = rad > col.r ? col.r / rad : 1, px = lx * k, pz = lz * k, py = clamp(ly, -col.hh, col.hh);
    const dx = lx - px, dy = ly - py, dz = lz - pz, dist = Math.hypot(dx, dy, dz);
    if (dist > r) return 0;
    if (dist > 1e-5) { out.set(dx / dist, dy / dist, dz / dist); return r - dist; }
    const pr = col.r - rad, pyv = col.hh - Math.abs(ly);
    if (pyv < pr) { out.set(0, Math.sign(ly) || 1, 0); return r + pyv; }
    out.set(lx / (rad || 1), 0, lz / (rad || 1)); return r + pr;
  }
  _l.copy(c).sub(col.c).applyQuaternion(col.qi);
  const h = col.h, qx = clamp(_l.x, -h.x, h.x), qy = clamp(_l.y, -h.y, h.y), qz = clamp(_l.z, -h.z, h.z);
  const dx = _l.x - qx, dy = _l.y - qy, dz = _l.z - qz, dist = Math.hypot(dx, dy, dz);
  if (dist > r) return 0;
  let depth;
  if (dist > 1e-5) { _n.set(dx / dist, dy / dist, dz / dist); depth = r - dist; }
  else {
    const px = h.x - Math.abs(_l.x), py = h.y - Math.abs(_l.y), pz = h.z - Math.abs(_l.z);
    if (px < py && px < pz) { _n.set(Math.sign(_l.x) || 1, 0, 0); depth = r + px; } else if (py < pz) { _n.set(0, Math.sign(_l.y) || 1, 0); depth = r + py; } else { _n.set(0, 0, Math.sign(_l.z) || 1); depth = r + pz; }
  }
  out.copy(_n).applyQuaternion(col.q); return depth;
}

/* ================================================================ environment (sky, sun, fog, env-map) */
function buildEnv(scene, S, renderer, opts = {}) {
  const sk = PX.SKIES3D[S.sky] || PX.SKIES3D.day, out = { objs: [] };
  const elev = clamp(+S.sunAngle || 45, 2, 89) * D2R, az = (+S.sunDir || 0) * D2R;
  const sunDir = V(Math.cos(elev) * Math.sin(az), Math.sin(elev), Math.cos(elev) * Math.cos(az));
  const skyScene = new THREE.Scene();
  const c = sk.c, night = S.sky === 'night' || S.sky === 'space';
  const skyObj = new THREE.Mesh(new THREE.SphereGeometry(1800, 48, 24), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false,
    uniforms: { a: { value: new THREE.Color(c[0]) }, b: { value: new THREE.Color(c[1]) }, cc: { value: new THREE.Color(c[2]) }, sun: { value: sunDir.clone() }, sunC: { value: new THREE.Color(S.sky === 'sunset' ? '#ffb070' : night ? '#9fb4ff' : '#fff2d0') }, glow: { value: night ? .25 : S.sky === 'sunset' ? 1.4 : .9 } },
    vertexShader: 'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `uniform vec3 a,b,cc,sun,sunC;uniform float glow;varying vec3 vP;
      void main(){float h=vP.y;vec3 col=h>0.?mix(b,a,pow(clamp(h,0.,1.),.55)):mix(b,cc*.55,min(1.,-h*2.5));
      col=mix(col,cc,exp(-abs(h)*7.)*.85);
      float d=max(dot(normalize(vP),normalize(sun)),0.);col+=sunC*(pow(d,8.)*.35+pow(d,64.)*.6)*glow;col+=sunC*smoothstep(.9985,.9992,d)*(glow>.5?2.2:1.2);
      gl_FragColor=vec4(col,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }` }));
  out.exposure = night ? 1.05 : 1;
  if (night) {
    const n = S.sky === 'space' ? 2600 : 1400, pos = new Float32Array(n * 3), colr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const u = PX.hash2(i, 1) * 2 - 1, t = PX.hash2(i, 2) * Math.PI * 2, rr = Math.sqrt(1 - u * u); const y = S.sky === 'space' ? u : Math.abs(u); pos.set([rr * Math.cos(t) * 1500, y * 1500, rr * Math.sin(t) * 1500], i * 3); const w = .55 + PX.hash2(i, 3) * .45, tint = PX.hash2(i, 4); colr.set([w * (tint > .8 ? 1 : .85), w * .9, w * (tint < .2 ? 1 : .95)], i * 3); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); sg.setAttribute('color', new THREE.BufferAttribute(colr, 3));
    const stars = new THREE.Points(sg, new THREE.PointsMaterial({ size: 2.2, sizeAttenuation: false, vertexColors: true, map: dot(), transparent: true, depthWrite: false, fog: false }));
    skyObj.add(stars);
    if (S.sky === 'space') ['#7a3ae0', '#ff4d00', '#2a7fff'].forEach((c2, i) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot(), color: c2, transparent: true, opacity: .22, depthWrite: false, fog: false, blending: THREE.AdditiveBlending })); sp.position.set(Math.cos(i * 2.1) * 1200, 300 + i * 200, Math.sin(i * 2.1) * 1200); sp.scale.setScalar(1400); skyObj.add(sp); });
    if (S.sky === 'night') { const moon = new THREE.Mesh(new THREE.SphereGeometry(40, 24, 16), new THREE.MeshBasicMaterial({ color: '#f4f0dc', fog: false })); moon.position.copy(sunDir).multiplyScalar(1400); skyObj.add(moon); }
  }
  skyObj.renderOrder = -10; skyObj.frustumCulled = false;
  scene.add(skyObj); out.objs.push(skyObj); out.sky = skyObj;
  // environment map from the sky
  if (renderer && opts.env !== false) {
    try { const pm = new THREE.PMREMGenerator(renderer); const cl = skyObj.clone(); skyScene.add(cl); scene.environment = pm.fromScene(skyScene, .04).texture; pm.dispose(); } catch (err) { /* ignore */ }
  }
  const sun = new THREE.DirectionalLight(night ? '#b8c8ff' : S.sky === 'sunset' ? '#ffd2a0' : '#fff4e0', night ? 1.1 : 3.2);
  sun.position.copy(sunDir).multiplyScalar(60); sun.castShadow = true;
  const sm = opts.shadowSize || 2048; sun.shadow.mapSize.set(sm, sm); const sc = sun.shadow.camera; const ext = opts.shadowExtent || 40;
  sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext; sc.near = 1; sc.far = 220; sun.shadow.bias = -.0004; sun.shadow.normalBias = .03; sun.shadow.radius = 3;
  scene.add(sun); scene.add(sun.target); out.sun = sun; out.sunDir = sunDir; out.objs.push(sun, sun.target);
  const hemi = new THREE.HemisphereLight(night ? '#5a6aa8' : '#cfe6ff', night ? '#1a1430' : '#5a4a3a', (+S.ambient || .5) * (night ? 1.6 : 1.3));
  scene.add(hemi); out.objs.push(hemi);
  const fogc = new THREE.Color(sk.fog);
  scene.fog = (+S.fog > 0) ? new THREE.FogExp2(fogc, (+S.fog) * .03) : null;
  scene.background = fogc;
  out.follow = (p) => { sun.position.copy(p).addScaledVector(sunDir, 60); sun.target.position.copy(p); };
  out.dispose = () => { out.objs.forEach(o => o.parent && o.parent.remove(o)); if (scene.environment) { scene.environment.dispose(); scene.environment = null; } };
  return out;
}
function addLights(scene, ents, limit = 8) {
  const out = [];
  for (const e of ents) {
    if (e.type !== 'light' || out.length >= limit) continue;
    const pr = e.props || {}, col = e.color || '#ffc27a', I = (+pr.intensity || 6) * 9, range = +pr.range || 12;
    const L = pr.kind === 'spot' ? new THREE.SpotLight(col, I * 2, range, .55, .4, 1.6) : new THREE.PointLight(col, I, range, 1.6);
    L.position.set(e.p[0], e.p[1], e.p[2]);
    if (L.isSpotLight) { const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(e.r[0] * D2R, e.r[1] * D2R, e.r[2] * D2R)); L.target.position.copy(L.position).add(V(0, -1, 0).applyQuaternion(q).multiplyScalar(5)); scene.add(L.target); }
    scene.add(L); out.push(L);
  }
  return out;
}

/* ================================================================ shared offscreen renderer: thumbnails + icons */
let offR = null;
function offscreen(w, h) {
  if (!offR) { offR = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); offR.shadowMap.enabled = true; offR.shadowMap.type = THREE.PCFSoftShadowMap; offR.toneMapping = THREE.ACESFilmicToneMapping; offR.outputColorSpace = THREE.SRGBColorSpace; }
  offR.setPixelRatio(1); offR.setSize(w, h, false); return offR;
}
function sceneFromProject(P, r, opts = {}) {
  const scene = new THREE.Scene(), env = buildEnv(scene, P.settings, r, { shadowSize: 1024, shadowExtent: opts.extent || 40 });
  for (const e of P.entities) { if (e.hidden && !opts.all) continue; const o = buildObject(e); if (A3[e.type].shape === 'zone') o.visible = false; scene.add(o); }
  addLights(scene, P.entities, 6);
  return { scene, env };
}
function frameBox(P) {
  const b = new THREE.Box3();
  for (const e of P.entities) { const s = PX.size3(e); if (Math.max(s[0], s[2]) > 30 || A3[e.type].shape === 'zone') continue; b.expandByPoint(V(e.p[0] - s[0] / 2, e.p[1] - s[1] / 2, e.p[2] - s[2] / 2)); b.expandByPoint(V(e.p[0] + s[0] / 2, e.p[1] + s[1] / 2, e.p[2] + s[2] / 2)); }
  if (b.isEmpty()) b.set(V(-10, 0, -10), V(10, 2, 10));
  return b;
}
function thumb(P, w = 192, h = 108) {
  const r = offscreen(w, h), { scene, env } = sceneFromProject(P, r, { extent: 60 });
  const b = frameBox(P), c = b.getCenter(V()), rad = Math.max(4, b.getSize(V()).length() / 2);
  const cam = new THREE.PerspectiveCamera(40, w / h, .1, 4000);
  cam.position.copy(c).add(V(.75, .62, 1).normalize().multiplyScalar(rad * 1.55)); cam.lookAt(c);
  env.follow(c); r.toneMappingExposure = env.exposure || 1;
  r.render(scene, cam);
  const out = document.createElement('canvas'); out.width = w; out.height = h; out.getContext('2d').drawImage(r.domElement, 0, 0, w, h);
  env.dispose(); scene.traverse(o => { if (o.geometry && !Object.values(G).includes(o.geometry)) o.geometry.dispose(); });
  return out;
}
const iconCache = {};
function icon(type, size = 80) {
  if (iconCache[type]) return iconCache[type];
  const r = offscreen(size, size), scene = new THREE.Scene();
  const e = PX.newEntity3D(type, [0, 0, 0]); const A = A3[type];
  const big = Math.max(...A.size); if (big > 2.5) { const k = 2.5 / big; e.s = [k, k, k]; }
  if (type === 'water' || type === 'lava' || type === 'killzone') e.s[1] = Math.max(e.s[1], .3);
  const o = buildObject(e); scene.add(o);
  scene.add(new THREE.HemisphereLight('#ffffff', '#5a4a6a', 2.2)); const d = new THREE.DirectionalLight('#ffffff', 2.6); d.position.set(3, 5, 4); scene.add(d);
  scene.environment = null;
  const cam = new THREE.PerspectiveCamera(32, 1, .1, 100); const s = PX.size3(e), rad = Math.hypot(...s) / 2 + .1;
  cam.position.set(rad * 1.7, rad * 1.3, rad * 2.4); cam.lookAt(0, 0, 0);
  r.setClearColor(0x000000, 0); r.toneMappingExposure = 1.1; r.render(scene, cam);
  const c = document.createElement('canvas'); c.width = c.height = size; c.getContext('2d').drawImage(r.domElement, 0, 0);
  return (iconCache[type] = c);
}

/* ================================================================ editor scene view */
class Editor3D {
  constructor(host, hooks) {
    this.host = host; this.hooks = hooks; this.objs = new Map(); this.sigs = new Map(); this.sel = new Set(); this.tool = 'move'; this.snap = true; this.step = 1; this.asset = 'block';
    const r = this.renderer = new THREE.WebGLRenderer({ antialias: true }); r.setPixelRatio(Math.min(2, devicePixelRatio || 1));
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap; r.toneMapping = THREE.ACESFilmicToneMapping; r.outputColorSpace = THREE.SRGBColorSpace;
    r.domElement.className = 'v3d'; r.domElement.tabIndex = 0; host.prepend(r.domElement);
    this.scene = new THREE.Scene(); this.root = new THREE.Group(); this.helpers = new THREE.Group(); this.scene.add(this.root, this.helpers);
    this.cam = new THREE.PerspectiveCamera(50, 1, .1, 5000); this.cam.position.set(14, 12, 18);
    const oc = this.orbit = new OrbitControls(this.cam, r.domElement); oc.enableDamping = true; oc.dampingFactor = .14; oc.screenSpacePanning = true; oc.maxPolarAngle = Math.PI * .495;
    oc.mouseButtons = { LEFT: -1, MIDDLE: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.ROTATE }; oc.addEventListener('change', () => this.dirty());
    const tc = this.tc = new TransformControls(this.cam, r.domElement); tc.setSize(.9); this.scene.add(tc);
    tc.addEventListener('dragging-changed', ev => { oc.enabled = !ev.value; if (ev.value) this._startXf(); else this._endXf(); });
    tc.addEventListener('objectChange', () => this._changeXf());
    tc.addEventListener('change', () => this.dirty());
    this.grid = null; this.ray = new THREE.Raycaster(); this.ray.params.Line.threshold = .01; this.ray.params.Points.threshold = .01; this.mouse = new THREE.Vector2(); this.ground = new THREE.Plane(V(0, 1, 0), 0);
    this.axisCv = document.createElement('canvas'); this.axisCv.className = 'axis3d'; this.axisCv.width = 180; this.axisCv.height = 180; host.append(this.axisCv);
    this.axisCv.addEventListener('pointerdown', ev => this._axisClick(ev));
    this._bind(); this._loop = this._loop.bind(this); this.visible = true; this._dirty = true; requestAnimationFrame(this._loop);
    new ResizeObserver(() => { this.resize(); }).observe(host); this.resize();
  }
  dirty() { this._dirty = true; }
  resize() { const w = this.host.clientWidth || 1, h = this.host.clientHeight || 1; this.renderer.setSize(w, h); this.cam.aspect = w / h; this.cam.updateProjectionMatrix(); this.dirty(); }
  setVisible(v) { this.visible = v; this.renderer.domElement.style.display = v ? '' : 'none'; this.axisCv.style.display = v ? '' : 'none'; if (v) { this.resize(); this.dirty(); } }
  _loop() {
    requestAnimationFrame(this._loop);
    if (!this.visible) return;
    const moving = this.orbit.update(); if (moving) this._dirty = true;
    if (!this._dirty) return; this._dirty = false;
    this.renderer.render(this.scene, this.cam); this._drawAxis();
  }
  load(P) {
    this.P = P; for (const o of this.objs.values()) this.root.remove(o); this.objs.clear(); this.sigs.clear(); this.tc.detach();
    this.applySettings(); this.syncAll(); this.frame(null, true);
  }
  applySettings() {
    const S = this.P.settings, key = JSON.stringify([S.sky, S.fog, S.sunAngle, S.sunDir, S.ambient, S.world]);
    if (key === this._envKey) return; this._envKey = key;
    if (this.env) this.env.dispose();
    this.env = buildEnv(this.scene, S, this.renderer, { shadowExtent: Math.max(30, (+S.world || 60) / 2 + 10) });
    this.renderer.toneMappingExposure = this.env.exposure || 1;
    if (this.grid) this.helpers.remove(this.grid);
    const W = Math.max(10, Math.round(+S.world || 60)); this.grid = new THREE.GridHelper(W, W, 0xff4d00, 0x2a2a3a); this.grid.material.transparent = true; this.grid.material.opacity = .35; this.grid.material.depthWrite = false; this.grid.position.y = .005; this.grid.renderOrder = 1; this.helpers.add(this.grid);
    const ax = new THREE.AxesHelper(2); ax.position.y = .01; this.helpers.add(ax); if (this._ax) this.helpers.remove(this._ax); this._ax = ax;
    this.env.follow(V(0, 0, 0)); this.dirty();
  }
  sig(e) { return JSON.stringify([e.type, e.s, e.color, e.mat, e.tex, e.cast, e.recv, e.props, e.hidden]); }
  syncAll() {
    if (!this.P) return; const seen = new Set();
    for (const e of this.P.entities) {
      seen.add(e.id); const s = this.sig(e); let o = this.objs.get(e.id);
      if (!o || this.sigs.get(e.id) !== s) {
        const wasSel = o && this.tc.object === o; if (o) this.root.remove(o);
        o = buildObject(e); o.visible = !e.hidden; this.root.add(o); this.objs.set(e.id, o); this.sigs.set(e.id, s);
        if (wasSel) this.tc.attach(o);
      } else { o.position.set(e.p[0], e.p[1], e.p[2]); o.rotation.set(e.r[0] * D2R, e.r[1] * D2R, e.r[2] * D2R); }
    }
    for (const [id, o] of this.objs) if (!seen.has(id)) { if (this.tc.object === o) this.tc.detach(); this.root.remove(o); this.objs.delete(id); this.sigs.delete(id); }
    this._lights(); this.applySettings(); this._gizmos(); this.setSelection(this.sel); this.dirty();
  }
  _lights() {
    if (this._ls) this._ls.forEach(l => { this.scene.remove(l); if (l.target) this.scene.remove(l.target); });
    this._ls = addLights(this.scene, this.P.entities.filter(e => !e.hidden), 8);
  }
  _outline(o, color) {
    const e = this.P.entities.find(x => x.id === o.userData.id); if (!e) return null;
    const A = A3[e.type], sz = o.userData.prim ? PX.size3(e) : A.size, k = 1.03;
    const ln = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(sz[0] * k + .02, sz[1] * k + .02, sz[2] * k + .02)), new THREE.LineBasicMaterial({ color, depthTest: false, transparent: true, opacity: .95 }));
    ln.renderOrder = 999; ln.name = 'outline';
    const inner = o.getObjectByName('inner'); (o.userData.prim ? o : inner).add(ln); return ln;
  }
  setSelection(ids) {
    this.sel = new Set(ids);
    for (const o of this.objs.values()) { o.traverse(c => { if (c.name === 'outline') { c.parent.remove(c); c.geometry.dispose(); } }); }
    let primary = null;
    for (const id of this.sel) { const o = this.objs.get(id); if (!o) continue; this._outline(o, 0xff4d00); primary = o; }
    if (this.hoverId && !this.sel.has(this.hoverId)) { const o = this.objs.get(this.hoverId); if (o) this._outline(o, 0xffffff); }
    const gz = ['move', 'rotate', 'scale'].includes(this.tool);
    if (primary && gz) { this.tc.attach(primary); this.tc.setMode({ move: 'translate', rotate: 'rotate', scale: 'scale' }[this.tool]); }
    else this.tc.detach();
    this._gizmos(); this.dirty();
  }
  setTool(t) { this.tool = t; this._ghost(); this.setSelection(this.sel); this.renderer.domElement.style.cursor = t === 'place' ? 'crosshair' : t === 'erase' ? 'not-allowed' : ''; }
  setAsset(type) { this.asset = type; this._ghost(); }
  setSnap(on, step) { this.snap = on; this.step = step; this.tc.setTranslationSnap(on ? step : null); this.tc.setRotationSnap(on ? 15 * D2R : null); this.tc.setScaleSnap(on ? .25 : null); }
  _gizmos() {
    if (this._gz) { this.helpers.remove(this._gz); this._gz.traverse(o => o.geometry && o.geometry.dispose()); }
    const g = this._gz = new THREE.Group(); this.helpers.add(g);
    for (const e of this.P.entities) {
      if (e.hidden) continue; const sel = this.sel.has(e.id), c = e.comps || {}, p = V(...e.p), op = sel ? 1 : .35;
      const line = (a, b, col) => { const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), new THREE.LineDashedMaterial({ color: col, dashSize: .3, gapSize: .2, transparent: true, opacity: op, depthTest: false })); l.computeLineDistances(); l.renderOrder = 998; g.add(l); };
      if (c.mover) { const b = p.clone().add(V(+c.mover.dx || 0, +c.mover.dy || 0, +c.mover.dz || 0)); line(p, b, 0x4ab4ff); const sz = PX.size3(e); const bx = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(...sz)), new THREE.LineBasicMaterial({ color: 0x4ab4ff, transparent: true, opacity: op * .8, depthTest: false })); bx.position.copy(b); bx.rotation.set(e.r[0] * D2R, e.r[1] * D2R, e.r[2] * D2R); bx.renderOrder = 998; g.add(bx); }
      if (c.patrol) { const d = +c.patrol.distance || 0; line(p, p.clone().add(c.patrol.axis === 'z' ? V(0, 0, d) : V(d, 0, 0)), 0x6ee06e); }
      if (sel && (c.chase || c.shooter)) { const rr = c.chase ? +c.chase.range : +c.shooter.range; const ring = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 64 }, (_, i) => V(Math.cos(i / 64 * Math.PI * 2) * rr, 0, Math.sin(i / 64 * Math.PI * 2) * rr))), new THREE.LineBasicMaterial({ color: 0xff4d00, transparent: true, opacity: .5 })); ring.position.set(p.x, p.y - PX.size3(e)[1] / 2 + .05, p.z); g.add(ring); }
    }
    this.dirty();
  }
  frame(ids, initial) {
    const b = new THREE.Box3(); let any = false;
    for (const [id, o] of this.objs) { if (ids && ids.size && !ids.has(id)) continue; if (!ids || !ids.size) { const e = this.P.entities.find(x => x.id === id); const s = e && PX.size3(e); if (s && Math.max(s[0], s[2]) > 45) continue; } b.expandByObject(o); any = true; }
    if (!any) b.set(V(-8, 0, -8), V(8, 2, 8));
    const c = b.getCenter(V()), rad = Math.max(2.5, b.getSize(V()).length() / 2);
    const dir = initial ? V(.55, .62, 1).normalize() : this.cam.position.clone().sub(this.orbit.target).normalize();
    this.orbit.target.copy(c); this.cam.position.copy(c).addScaledVector(dir, rad * (ids && ids.size ? 2.6 : 1.5)); this.cam.near = Math.max(.05, rad / 200); this.cam.updateProjectionMatrix(); this.orbit.update(); this.dirty();
  }
  zoom(f) { const d = this.cam.position.clone().sub(this.orbit.target); d.multiplyScalar(f); this.cam.position.copy(this.orbit.target).add(d); this.orbit.update(); this.dirty(); }
  // ---------- picking / placing
  _setMouse(ev) { const r = this.renderer.domElement.getBoundingClientRect(); this.mouse.set((ev.clientX - r.left) / r.width * 2 - 1, -(ev.clientY - r.top) / r.height * 2 + 1); this.ray.setFromCamera(this.mouse, this.cam); }
  pick(ev, all) {
    this._setMouse(ev); const hits = this.ray.intersectObjects(this.root.children, true);
    for (const h of hits) { let o = h.object; while (o && o.userData.id == null) o = o.parent; if (!o || !o.visible) continue; const e = this.P.entities.find(x => x.id === o.userData.id); if (!e || (!all && e.locked)) continue; return { e, o, hit: h }; }
    return null;
  }
  placePoint(ev, type) {
    this._setMouse(ev);
    const hits = this.ray.intersectObjects(this.root.children, true).filter(h => { let o = h.object; while (o && o.userData.id == null) o = o.parent; return o && o.visible && o !== this._ghostObj && A3[o.userData.type] && !['water', 'zone'].includes(A3[o.userData.type].shape); });
    const tmp = PX.newEntity3D(type), sz = PX.size3(tmp), st = this.snap ? this.step : 0;
    const snp = v => st ? Math.round(v / st) * st : v;
    let pt, n;
    if (hits.length) { pt = hits[0].point.clone(); n = hits[0].face ? hits[0].face.normal.clone().transformDirection(hits[0].object.matrixWorld) : V(0, 1, 0); }
    else { pt = V(); if (!this.ray.ray.intersectPlane(this.ground, pt)) return null; n = V(0, 1, 0); }
    if (n.y > .5) return [snp(pt.x), +(pt.y + sz[1] / 2).toFixed(3), snp(pt.z)];
    const ax = Math.abs(n.x) > Math.abs(n.z) ? 'x' : 'z';
    const p = [snp(pt.x), snp(pt.y - sz[1] / 2) + sz[1] / 2, snp(pt.z)];
    if (ax === 'x') p[0] = pt.x + Math.sign(n.x) * sz[0] / 2; else p[2] = pt.z + Math.sign(n.z) * sz[2] / 2;
    return p.map(v => +v.toFixed(3));
  }
  _ghost() {
    if (this._ghostObj) { this.scene.remove(this._ghostObj); this._ghostObj = null; }
    if (this.tool !== 'place' || !A3[this.asset]) { this.dirty(); return; }
    const e = PX.newEntity3D(this.asset); const o = buildObject(e);
    o.traverse(c => { if (c.isMesh) { c.material = (Array.isArray(c.material) ? c.material[0] : c.material).clone(); c.material.transparent = true; c.material.opacity = .45; c.material.depthWrite = false; c.castShadow = false; } });
    o.visible = false; this._ghostObj = o; this.scene.add(o); this.dirty();
  }
  _bind() {
    const el = this.renderer.domElement; let down = null, painting = null;
    el.addEventListener('contextmenu', ev => ev.preventDefault());
    el.addEventListener('pointerdown', ev => {
      el.focus({ preventScroll: true });
      if (ev.button !== 0) return;
      if (ev.altKey || this.hooks.space()) return;
      if (this.tc.dragging || (this.tc.axis && this.tc.object)) return;
      down = { x: ev.clientX, y: ev.clientY, shift: ev.shiftKey || ev.ctrlKey || ev.metaKey };
      if (this.tool === 'place') { const p = this.placePoint(ev, this.asset); if (p) { const e = this.hooks.onPlace(this.asset, p); painting = { keys: new Set([p.join(',')]), n: e ? 1 : 0 }; } }
      else if (this.tool === 'erase') { const k = this.pick(ev); if (k) this.hooks.onErase(k.e.id); painting = { erase: true }; }
    });
    el.addEventListener('pointermove', ev => {
      if (this.tool === 'place' && this._ghostObj) { const p = this.placePoint(ev, this.asset); this._ghostObj.visible = !!p && !this.hooks.space(); if (p) this._ghostObj.position.set(...p); this.dirty(); if (p) this.hooks.onCursor(p); }
      if (painting && ev.buttons & 1) {
        if (painting.erase) { const k = this.pick(ev); if (k) this.hooks.onErase(k.e.id); }
        else if (A3[this.asset].paint || ['block', 'ground', 'crate', 'coin', 'gem', 'wall'].includes(this.asset)) { const p = this.placePoint(ev, this.asset); if (p && !painting.keys.has(p.join(','))) { painting.keys.add(p.join(',')); const sz = PX.size3(PX.newEntity3D(this.asset)); if (!this.P.entities.some(e => e.type === this.asset && Math.abs(e.p[0] - p[0]) < sz[0] * .6 && Math.abs(e.p[1] - p[1]) < sz[1] * .6 && Math.abs(e.p[2] - p[2]) < sz[2] * .6)) { this.hooks.onPlace(this.asset, p); painting.n++; } } }
        return;
      }
      if (!down && !this.tc.dragging && this.tool !== 'place') { clearTimeout(this._hv); this._hv = setTimeout(() => { const k = this.pick(ev); const id = k ? k.e.id : null; if (id !== this.hoverId) { this.hoverId = id; this.setSelection(this.sel); } }, 30); }
    });
    el.addEventListener('pointerup', ev => {
      if (painting) { this.hooks.onPaintEnd(painting); painting = null; }
      if (!down) return; const moved = Math.hypot(ev.clientX - down.x, ev.clientY - down.y) > 4, d = down; down = null;
      if (moved || ['place', 'erase'].includes(this.tool)) return;
      const k = this.pick(ev); this.hooks.onPick(k ? k.e.id : null, d.shift);
    });
    el.addEventListener('pointerleave', () => { if (this._ghostObj) { this._ghostObj.visible = false; this.dirty(); } if (this.hoverId) { this.hoverId = null; this.setSelection(this.sel); } });
    el.addEventListener('dragover', ev => { if ([...ev.dataTransfer.types].includes('text/pxb-asset')) { ev.preventDefault(); ev.dataTransfer.dropEffect = 'copy'; } });
    el.addEventListener('drop', ev => { const k = ev.dataTransfer.getData('text/pxb-asset'); if (!A3[k]) return; ev.preventDefault(); const p = this.placePoint(ev, k); if (p) { this.hooks.onPlace(k, p); this.hooks.onPaintEnd({ n: 1 }); } });
  }
  setNavMode(mode) { this.orbit.mouseButtons.LEFT = mode === 'orbit' ? THREE.MOUSE.ROTATE : mode === 'pan' ? THREE.MOUSE.PAN : -1; }
  // ---------- transform gizmo -> entity data
  _startXf() {
    this._xf = new Map(); for (const id of this.sel) { const e = this.P.entities.find(x => x.id === id), o = this.objs.get(id); if (e && o) this._xf.set(id, { p: o.position.clone(), q: o.quaternion.clone(), s: e.s.slice(), os: o.scale.clone() }); }
    this.hooks.onXfStart();
  }
  _changeXf() {
    const po = this.tc.object; if (!po || !this._xf) return; const pid = po.userData.id, st = this._xf.get(pid); if (!st) return;
    const dp = po.position.clone().sub(st.p), dq = po.quaternion.clone().multiply(st.q.clone().invert()), ds = V(po.scale.x / st.os.x, po.scale.y / st.os.y, po.scale.z / st.os.z);
    for (const [id, s0] of this._xf) {
      const e = this.P.entities.find(x => x.id === id), o = this.objs.get(id); if (!e || !o) continue;
      if (id !== pid) { if (this.tc.mode === 'translate') o.position.copy(s0.p).add(dp); else if (this.tc.mode === 'rotate') o.quaternion.copy(dq).multiply(s0.q); else o.scale.set(s0.os.x * ds.x, s0.os.y * ds.y, s0.os.z * ds.z); }
      e.p = [o.position.x, o.position.y, o.position.z].map(v => +v.toFixed(3));
      const eu = new THREE.Euler().setFromQuaternion(o.quaternion); e.r = [eu.x, eu.y, eu.z].map(v => +(v / D2R).toFixed(2));
      if (this.tc.mode === 'scale') e.s = [0, 1, 2].map(i => +Math.max(.05, s0.s[i] * ['x', 'y', 'z'].map(a => o.scale[a] / s0.os[a])[i]).toFixed(3));
    }
    this.hooks.onXfChange();
  }
  _endXf() { this._xf = null; this.hooks.onXfEnd(); }
  // ---------- axis indicator
  _drawAxis() {
    const c = this.axisCv, x = c.getContext('2d'), s = c.width, cx = s / 2, R = s * .32; x.clearRect(0, 0, s, s);
    x.fillStyle = 'rgba(0,0,0,.45)'; x.beginPath(); x.arc(cx, cx, s * .46, 0, 7); x.fill();
    const m = new THREE.Matrix4().extractRotation(this.cam.matrixWorldInverse);
    const ax = [['X', V(1, 0, 0), '#ff5a5a'], ['Y', V(0, 1, 0), '#6ee06e'], ['Z', V(0, 0, 1), '#4ab4ff']];
    const pts = []; ax.forEach(([l, v, col]) => { [1, -1].forEach(sg => { const p = v.clone().multiplyScalar(sg).applyMatrix4(m); pts.push({ l, sg, col, x: cx + p.x * R, y: cx - p.y * R, z: p.z }); }); });
    pts.sort((a, b) => a.z - b.z); this._axPts = pts;
    for (const p of pts) {
      if (p.sg > 0) { x.strokeStyle = p.col; x.lineWidth = 4; x.beginPath(); x.moveTo(cx, cx); x.lineTo(p.x, p.y); x.stroke(); }
      x.fillStyle = p.sg > 0 ? p.col : 'rgba(255,255,255,.18)'; x.beginPath(); x.arc(p.x, p.y, p.sg > 0 ? 15 : 10, 0, 7); x.fill();
      if (p.sg > 0) { x.fillStyle = '#000'; x.font = '700 16px JetBrains Mono, monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(p.l, p.x, p.y + 1); }
    }
  }
  _axisClick(ev) {
    const r = this.axisCv.getBoundingClientRect(), k = this.axisCv.width / r.width, mx = (ev.clientX - r.left) * k, my = (ev.clientY - r.top) * k;
    let best = null, bd = 22; for (const p of this._axPts || []) { const d = Math.hypot(p.x - mx, p.y - my); if (d < bd) { bd = d; best = p; } } if (!best) return;
    const dist = this.cam.position.distanceTo(this.orbit.target), dir = V(best.l === 'X' ? 1 : 0, best.l === 'Y' ? 1 : 0, best.l === 'Z' ? 1 : 0).multiplyScalar(best.sg);
    if (best.l === 'Y') dir.z += .001 * best.sg;
    this.cam.position.copy(this.orbit.target).addScaledVector(dir.normalize(), dist); this.orbit.update(); this.dirty();
  }
  shot(w, h) { const old = [this.host.clientWidth, this.host.clientHeight]; this.renderer.render(this.scene, this.cam); const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(this.renderer.domElement, 0, 0, w, h); return c; }
}

/* ================================================================ game runtime */
const KEY3 = { KeyW: 'fwd', ArrowUp: 'fwd', KeyS: 'back', ArrowDown: 'back', KeyA: 'left', KeyD: 'right', ArrowLeft: 'turnL', ArrowRight: 'turnR', Space: 'jump', ShiftLeft: 'sprint', ShiftRight: 'sprint', KeyX: 'shoot', KeyJ: 'shoot', KeyQ: 'q', KeyE: 'e' };
const PCAP = [-.5, 0, .5], PR = .4;
class Game3D {
  constructor(host, P, opts = {}) {
    this.host = host; this.src = P; this.opts = opts;
    const r = this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(1.5, devicePixelRatio || 1)); r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.domElement.className = 'g3d'; host.append(r.domElement);
    this.hudCv = document.createElement('canvas'); this.hudCv.className = 'g3dhud'; host.append(this.hudCv); this.hud2 = this.hudCv.getContext('2d');
    this.in = {}; this.prev = {}; this.codes = {}; this.pcodes = {}; this.look = { dx: 0, dy: 0 };
    this._key = this.onKey.bind(this); this._mm = this.onMouse.bind(this); this._md = this.onDown.bind(this); this._mu = ev => { if (ev.button === 0) { this.in.shootM = false; this.dragLook = false; } };
    this._wheel = ev => { if (this.state === 'play') { this.camDist = clamp(this.camDist * (ev.deltaY > 0 ? 1.1 : .9), 2.5, 16); ev.preventDefault(); } };
    this._blur = () => { this.in = {}; this.codes = {}; };
    addEventListener('keydown', this._key); addEventListener('keyup', this._key); addEventListener('mousemove', this._mm); r.domElement.addEventListener('mousedown', this._md); addEventListener('mouseup', this._mu); r.domElement.addEventListener('wheel', this._wheel, { passive: false }); addEventListener('blur', this._blur);
    this.reset();
    this.running = true; this.last = performance.now(); this.acc = 0; this._frame = this.frame.bind(this); this.raf = requestAnimationFrame(this._frame);
  }
  log(m, l) { if (this.opts.log) this.opts.log(m, l); }
  onKey(ev) {
    const tg = ev.target; if (tg && /INPUT|TEXTAREA|SELECT/.test(tg.tagName)) return;
    const down = ev.type === 'keydown', k = KEY3[ev.code]; this.codes[ev.code] = down;
    if (k) { this.in[k] = down; ev.preventDefault(); }
    if (down && !ev.repeat) {
      if (ev.code === 'KeyR' && this.state !== 'play') this.restart();
      if (ev.code === 'KeyM') PX.Audio.toggle();
      if (ev.code === 'KeyP') this.paused = !this.paused;
      if (ev.code === 'KeyG') { const q = (this.q + 2) % 3; setQuality(q); this.makePost(q); this.say('GRAPHICS · ' + ['LOW', 'MEDIUM', 'ULTRA'][q], 1.2); }
      if (ev.code === 'KeyC') { const order = ['third', 'first', 'top']; this.camMode = order[(order.indexOf(this.camMode) + 1) % 3]; this.say('CAMERA · ' + PX.CAMS3D[this.camMode].toUpperCase(), 1.2); }
    }
  }
  onDown(ev) {
    if (ev.button !== 0) return;
    if (document.pointerLockElement !== this.renderer.domElement && this.camMode !== 'top' && !this.opts.noLock) { try { const p = this.renderer.domElement.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* ignore */ } this.dragLook = true; }
    this.in.shootM = true;
  }
  onMouse(ev) { const locked = document.pointerLockElement === this.renderer.domElement; if (locked || (this.dragLook && ev.buttons & 1)) { this.look.dx += ev.movementX || 0; this.look.dy += ev.movementY || 0; } }
  setTouch(k, v) { const m = { up: 'fwd', down: 'back', left: 'turnL', right: 'turnR', a: 'jump', b: 'shoot' }; this.in[m[k] || k] = v; }
  restart() { if (this.overlay) { this.overlay.remove(); this.overlay = null; } this.reset(); }
  destroy() {
    this.running = false; cancelAnimationFrame(this.raf);
    removeEventListener('keydown', this._key); removeEventListener('keyup', this._key); removeEventListener('mousemove', this._mm); removeEventListener('mouseup', this._mu); removeEventListener('blur', this._blur);
    if (document.pointerLockElement) try { document.exitPointerLock(); } catch (e) { /* ignore */ }
    PX.Audio.stopMusic(); if (this.overlay) this.overlay.remove();
    this.clearScene(); this.renderer.dispose(); try { this.renderer.forceContextLoss(); } catch (e) { /* ignore */ }
    this.renderer.domElement.remove(); this.hudCv.remove();
  }
  clearScene() { if (this.post && this.post.composer) { try { this.post.composer.dispose(); } catch (e) { /* ignore */ } } if (this.env) this.env.dispose(); if (this.scene) this.scene.traverse(o => { if (o.geometry && !Object.values(G).includes(o.geometry)) o.geometry.dispose(); }); }
  makePost(q) {
    this.q = q;
    this.post = cinematic(this.renderer, this.scene, this.cam, { quality: q, exposure: this.env.exposure || 1, bloom: .55, bloomThreshold: .86, vignette: .3, grain: .02 });
    this.resize(true);
  }
  resize(force) {
    const w = this.host.clientWidth || 640, h = this.host.clientHeight || 400;
    if (!force && w === this._w && h === this._h) return; this._w = w; this._h = h;
    this.renderer.setSize(w, h); this.cam.aspect = w / h; this.cam.fov = w / h < 1 ? 78 : 62; this.cam.updateProjectionMatrix(); if (this.post) this.post.setSize(w, h);
    const dpr = Math.min(2, devicePixelRatio || 1); this.hudCv.width = Math.round(w * dpr); this.hudCv.height = Math.round(h * dpr);
  }
  /* -------------------------------------------------------------- setup */
  reset() {
    this.clearScene();
    const P = this.P = PX.clone(this.src), S = this.S = P.settings;
    this.scene = new THREE.Scene(); this.cam = new THREE.PerspectiveCamera(62, 1, .08, 4000);
    this.env = buildEnv(this.scene, S, this.renderer, { shadowExtent: 34 });
    this.g = +S.gravity || 24; this.camMode = S.camera || 'third'; this.camDist = this.camMode === 'top' ? 18 : 7;
    this.ents = []; this.cols = []; this.solidMeshes = [];
    for (const d of P.entities) this.ents.push(this.mk(d));
    this.lights = addLights(this.scene, P.entities, 8);
    this.player = this.ents.find(e => e.comps.player) || null;
    if (this.player) { const p = this.player; p.isPlayer = true; p.hp = p.comps.health ? +p.comps.health.hp : 1; p.maxHp = p.hp; p.yaw = p.r[1] * D2R; }
    this.camYaw = this.player ? this.player.yaw : 0; this.camPitch = this.camMode === 'first' ? 0 : .38;
    this.score = 0; this.lives = Math.max(1, S.lives | 0); this.time = Math.max(5, +S.timeLimit || 180); this.collected = 0;
    this.total = this.ents.filter(e => e.comps.collectible && e.comps.collectible.counts).length;
    this.keys = {}; this.power = { speed: 0, jump: 0, shield: 0 }; this.powerMax = { speed: 1, jump: 1, shield: 1 };
    this.state = 'play'; this.t = 0; this.msg = null; this.shakeT = 0; this.shakeA = 0; this.flash = 0; this.paused = false; this.endT = 0; this.texts = [];
    this.touching = new Set(); this.rs = (P.rules || []).map(() => ({ acc: 0, was: false })); this.ruleCount = {}; this.timeFired = false; this.sid = 0; this.bullets = []; this.fallWas = {};
    this.spawn = this.player ? this.player.pos.clone() : V(0, 2, 0);
    this.banner = { text: S.title || 'Untitled', sub: PX.WINS[S.win] + (S.win === 'score' ? ' · ' + S.winScore : ''), t: 2.6 };
    this.parts = this.makeParticles();
    this.grid = null; this.buildGrid();
    this.q = this.opts.quality != null ? this.opts.quality : quality(); this.makePost(this.q);
    this.updCam(1, true);
    this.event('start', this.player);
    if (!this.opts.silent) PX.Audio.music(S.music.mood, S.music.tempo);
    this.log('▶ Play 3D — ' + (S.title || 'Untitled') + ' (' + this.ents.length + ' objects, ' + this.camMode + ' camera, gfx ' + ['low', 'medium', 'ultra'][this.q] + ')', 'ok');
  }
  mk(d) {
    const A = A3[d.type], e = Object.assign({}, d);
    e.group = A.group; e.shape = A.shape; e.size = PX.size3(d); e.w = e.size[0]; e.h = e.size[1];
    e.pos = V(...d.p); e.quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(d.r[0] * D2R, d.r[1] * D2R, d.r[2] * D2R));
    e.origin = e.pos.clone(); e.vel = V(); e.alive = true; e.spd = 1; e.inv = 0; e.cool = .6 + Math.random() * .8; e.dir = 1; e.mv = { p: 0, d: 1, wait: 0 }; e.t0 = Math.random() * 6;
    if (e.comps.health) e.hp = +e.comps.health.hp;
    e.obj = buildObject(d); if (A.shape === 'zone') e.obj.visible = false; this.scene.add(e.obj);
    e.body = e.obj.getObjectByName('body'); e.spin = e.obj.getObjectByName('spin'); e.spin2 = e.obj.getObjectByName('spin2'); e.head = e.obj.getObjectByName('head'); e.flagM = e.obj.getObjectByName('flag');
    e.moving = !!(e.comps.patrol || e.comps.chase) || (e.phys.body === 'dynamic' && !e.comps.player);
    if (e.phys.solid) { e.col = makeCollider(e, e.pos, e.quat); this.cols.push(e.col); e.obj.traverse(o => { if (o.isMesh) this.solidMeshes.push(o); }); }
    if (e.group === 'spawner') e.cool = +e.props.every || 0;
    e.homeY = e.pos.y;
    return e;
  }
  buildGrid() {
    const W = Math.max(8, Math.round(+this.S.world || 60)), C = 2, n = Math.ceil(W / C); this.gn = n; this.gW = W; this.gC = C;
    const g = new Uint8Array(n * n), c = V(), nn = V();
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      c.set(-W / 2 + (i + .5) * C, 0, -W / 2 + (j + .5) * C);
      for (const col of this.cols) { if (!col.e.alive || col.e.open || col.e.comps.mover || col.e.comps.spinner) continue; if (col.max.y < .6 || col.min.y > 2.4) continue; for (const y of [1, 1.6]) { c.y = y; if (sphereVs(c, .3, col, nn) > 0) { g[j * n + i] = 1; break; } } if (g[j * n + i]) break; }
    }
    this.grid = g; this.df = null;
  }
  cellOf(x, z) { const i = Math.floor((x + this.gW / 2) / this.gC), j = Math.floor((z + this.gW / 2) / this.gC); return (i < 0 || j < 0 || i >= this.gn || j >= this.gn) ? -1 : j * this.gn + i; }
  distField() {
    const p = this.player; if (!p) return; const n = this.gn, g = this.grid, df = new Int32Array(n * n).fill(-1), s = this.cellOf(p.pos.x, p.pos.z); if (s < 0) { this.df = null; return; }
    const q = [s]; df[s] = 0;
    for (let k = 0; k < q.length; k++) { const c = q[k], x = c % n, y = (c / n) | 0, d = df[c] + 1; for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) { if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue; const m = ny * n + nx; if (g[m] || df[m] >= 0) continue; df[m] = d; q.push(m); } }
    this.df = df;
  }
  makeParticles() {
    const N = 700, g = new THREE.BufferGeometry(), pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setDrawRange(0, 0);
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ size: .22, map: dot(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    pts.frustumCulled = false; this.scene.add(pts);
    return { pts, list: [], N };
  }
  burst(at, color, n = 14, sp = 4, up = 2) {
    const c = new THREE.Color(color), L = this.parts.list;
    for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, b = Math.random() * Math.PI - Math.PI / 2, v = sp * (.3 + Math.random() * .7); L.push({ p: at.clone(), v: V(Math.cos(a) * Math.cos(b) * v, Math.sin(b) * v + up, Math.sin(a) * Math.cos(b) * v), life: .5 + Math.random() * .5, max: 1, c }); }
    if (L.length > this.parts.N) L.splice(0, L.length - this.parts.N);
  }
  /* -------------------------------------------------------------- loop */
  frame(now) {
    if (!this.running) return; this.raf = requestAnimationFrame(this._frame);
    const dt = Math.min(.1, (now - this.last) / 1000); this.last = now; this.resize();
    if (!this.paused) { this.acc += dt; let n = 0; while (this.acc >= 1 / 60 && n < 6) { this.step(1 / 60); this.acc -= 1 / 60; n++; } if (n === 6) this.acc = 0; }
    this.render(dt);
  }
  advance(sec) { const n = Math.round(sec * 60); for (let i = 0; i < n; i++) this.step(1 / 60); }
  pressed(k) { return this.in[k] && !this.prev[k]; }
  step(dt) {
    this.t += dt; this.fx(dt);
    if (this.state !== 'play') { this.endT += dt; this.updCam(dt); this.prev = Object.assign({}, this.in); this.pcodes = Object.assign({}, this.codes); return; }
    const S = this.S, p = this.player;
    this.time -= dt;
    for (const k in this.power) if (this.power[k] > 0) { this.power[k] -= dt; if (this.power[k] <= 0) { this.power[k] = 0; this.say(k.toUpperCase() + ' wore off', 1.2); } }
    (this.P.rules || []).forEach((r, i) => {
      if (r.off || !r.ev) return; const ev = r.ev, st = this.rs[i];
      if (ev.type === 'every') { st.acc += dt; const n = Math.max(.2, +ev.n || 1); while (st.acc >= n) { st.acc -= n; this.run(r, i, { self: p }); } }
      else if (ev.type === 'key') { const code = PX.KEYS[ev.k] || ev.k; if (this.codes[code] && !this.pcodes[code]) this.run(r, i, { self: p }); }
      else if (ev.type === 'fall' && p && !p.dead) { const below = p.pos.y - p.h / 2 < +ev.n; if (below && !st.was) this.run(r, i, { self: p }); st.was = below; }
    });
    for (const e of this.ents) if (e.alive && (e.comps.mover || e.comps.spinner)) this.kinematic(e, dt);
    if (p && p.alive && !p.dead) this.updPlayer(p, dt);
    if (this.grid && this.ents.some(e => e.alive && e.comps.chase && e.comps.chase.smart)) { this.dfT = (this.dfT || 0) - dt; if (this.dfT <= 0) { this.dfT = .3; this.distField(); } }
    for (const e of this.ents) if (e.alive && !e.isPlayer) this.updAI(e, dt);
    this.updBullets(dt);
    if (p && !p.dead) { if (p.pos.y < (+S.killY || -15)) this.die('FELL'); else this.triggers(); }
    if (p && p.dead) { p.deadT -= dt; if (p.deadT <= 0) { if (this.lives <= 0) this.lose('GAME OVER'); else this.respawn(); } }
    if (p && p.inv > 0) p.inv -= dt;
    this.compareRules();
    if (this.state === 'play') {
      if (S.win === 'collect' && this.total > 0 && this.collected >= this.total) this.win('ALL COLLECTED!');
      else if (S.win === 'score' && this.score >= (+S.winScore || 0)) this.win('TARGET SCORE!');
    }
    if (this.time <= 0 && this.state === 'play') { this.time = 0; if (!this.timeFired) { this.timeFired = true; this.event('timeup', p); } if (this.state === 'play') { if (S.win === 'survive') this.win('SURVIVED!'); else this.lose('TIME UP'); } }
    this.updCam(dt);
    this.prev = Object.assign({}, this.in); this.pcodes = Object.assign({}, this.codes);
  }
  /* -------------------------------------------------------------- physics */
  collide(e, offs, r, isPlayer) {
    const c = V(), n = V(); let ground = null, groundN = 0;
    for (let it = 0; it < 3; it++) {
      let any = false;
      for (const col of this.cols) {
        if (col.e === e || !col.e.alive || col.e.open) continue;
        if (e.pos.x + r < col.min.x || e.pos.x - r > col.max.x || e.pos.z + r < col.min.z || e.pos.z - r > col.max.z) continue;
        for (const oy of offs) {
          c.set(e.pos.x, e.pos.y + oy, e.pos.z); const d = sphereVs(c, r, col, n);
          if (d <= 0) continue; any = true;
          e.pos.addScaledVector(n, d);
          const vn = e.vel.dot(n); if (vn < 0) e.vel.addScaledVector(n, -vn * (1 + (+e.phys.bounce || 0) * (Math.abs(vn) > 3 ? 1 : 0)));
          if (n.y > .55 && n.y > groundN) { ground = col.e; groundN = n.y; }
          if (isPlayer) { this.touchNow.add(col.e.id); if (col.e.group === 'door') this.tryDoor(col.e); }
          if (Math.abs(n.y) < .3) e.hitWall = true;
        }
      }
      if (!any) break;
    }
    return ground;
  }
  kinematic(e, dt) {
    const ox = e.pos.clone(), oq = e.quat.clone();
    if (e.comps.mover) {
      const m = e.comps.mover, st = e.mv, D = V(+m.dx || 0, +m.dy || 0, +m.dz || 0), len = D.length() || 1;
      if (st.wait > 0) st.wait -= dt;
      else if (!st.done) { st.p += st.d * (+m.speed || 1) * e.spd * dt / len; if (st.p >= 1) { st.p = 1; if (m.loop === 'once') st.done = true; else { st.d = -1; st.wait = +m.pause || 0; } } else if (st.p <= 0) { st.p = 0; st.d = 1; st.wait = +m.pause || 0; } }
      const u = st.p, k = u * u * (3 - 2 * u) * .4 + u * .6; e.pos.copy(e.origin).addScaledVector(D, k);
    }
    let dyaw = 0;
    if (e.comps.spinner) { dyaw = (+e.comps.spinner.speed || 0) * D2R * dt * e.spd; _q.setFromAxisAngle(V(0, 1, 0), dyaw); e.quat.premultiply(_q); }
    const dp = e.pos.clone().sub(ox);
    e.obj.position.copy(e.pos); e.obj.quaternion.copy(e.quat);
    if (e.col) updateCollider(e.col, e.pos, e.quat, e.size, e.shape);
    for (const a of this.ents) {
      if (!a.alive || a === e || a.ground !== e || (a.isPlayer && a.dead)) continue;
      a.pos.add(dp);
      if (dyaw) { const rel = a.pos.clone().sub(e.pos); rel.applyAxisAngle(V(0, 1, 0), dyaw); a.pos.copy(e.pos).add(rel); if (a.isPlayer) { a.yaw += dyaw; } }
    }
  }
  updPlayer(p, dt) {
    const c = p.comps.player, I = this.in, S = this.S;
    // look
    const sens = .0026; this.camYaw -= this.look.dx * sens; this.camPitch = clamp(this.camPitch + this.look.dy * sens * (this.camMode === 'first' ? -1 : 1), this.camMode === 'first' ? -1.35 : -.25, this.camMode === 'first' ? 1.35 : 1.25); this.look.dx = this.look.dy = 0;
    if (this.camMode !== 'top') { if (I.turnL) this.camYaw += 2.4 * dt; if (I.turnR) this.camYaw -= 2.4 * dt; }
    let fx = (I.right ? 1 : 0) - (I.left ? 1 : 0), fz = (I.back ? 1 : 0) - (I.fwd ? 1 : 0);
    if (this.camMode === 'top') { fx += (I.turnR ? 1 : 0) - (I.turnL ? 1 : 0); }
    const len = Math.hypot(fx, fz) || 1; fx /= len; fz /= len;
    const yaw = this.camMode === 'top' ? 0 : this.camYaw, cs = Math.cos(yaw), sn = Math.sin(yaw);
    const wx = fx * cs + fz * sn, wz = -fx * sn + fz * cs;
    const sprint = I.sprint ? (+c.sprint || 1.5) : 1;
    let spd = (+c.speed || 6) * sprint * (this.power.speed > 0 ? 1.5 : 1) * p.spd; if (p.inWater) spd *= .6;
    const k = p.ground ? 14 : 4.5;
    p.vel.x += (wx * spd - p.vel.x) * Math.min(1, k * dt); p.vel.z += (wz * spd - p.vel.z) * Math.min(1, k * dt);
    if (Math.abs(fx) + Math.abs(fz) > 0) { const target = Math.atan2(-wx, -wz); let d = target - p.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); p.yaw += d * Math.min(1, 14 * dt); }
    if (this.camMode === 'first') p.yaw = this.camYaw;
    // jump
    if (p.ground && p.vel.y <= .1) { p.coyote = .12; p.jumps = 0; } else p.coyote = (p.coyote || 0) - dt;
    if (this.pressed('jump')) p.buf = .14; else p.buf = (p.buf || 0) - dt;
    const jv = (+c.jump || 8) * (this.power.jump > 0 ? 1.3 : 1);
    if (p.inWater) { if (I.jump) p.vel.y = Math.min(p.vel.y + 16 * dt, 4.2); }
    else if (p.buf > 0 && p.coyote > 0) this.doJump(p, jv);
    else if (p.buf > 0 && c.doubleJump && p.coyote <= 0 && (p.jumps || 0) < 1) { p.jumps = 1; this.doJump(p, jv * .9); this.burst(p.pos.clone().add(V(0, -.8, 0)), '#ffffff', 10, 2, 0); }
    if (p.jumpHeld && !I.jump && p.vel.y > 0) { p.vel.y *= .55; p.jumpHeld = false; }
    if (p.vel.y <= 0) p.jumpHeld = false;
    // gravity
    if (p.inWater) { p.vel.y -= this.g * .28 * dt; p.vel.y *= 1 - 2.2 * dt; } else p.vel.y = Math.max(p.vel.y - this.g * dt, -45);
    // shoot
    p.cool = (p.cool || 0) - dt;
    if (c.canShoot && (I.shoot || (I.shootM && (document.pointerLockElement === this.renderer.domElement || this.opts.noLock))) && p.cool <= 0) {
      p.cool = 1 / Math.max(1, +c.fireRate || 4); const dir = this.camMode === 'top' ? V(-Math.sin(p.yaw), 0, -Math.cos(p.yaw)) : V(-Math.sin(this.camYaw) * Math.cos(this.camPitch * (this.camMode === 'first' ? 1 : 0)), this.camMode === 'first' ? Math.sin(this.camPitch) : 0, -Math.cos(this.camYaw) * Math.cos(this.camPitch * (this.camMode === 'first' ? 1 : 0)));
      this.fire(p.pos.clone().add(V(0, .3, 0)).addScaledVector(dir, .6), dir, 22, 'p');
    }
    // integrate + collide
    const wasGround = p.ground, vy0 = p.vel.y;
    this.touchNow = this.touchNow || new Set();
    p.pos.addScaledVector(p.vel, dt);
    p.ground = this.collide(p, PCAP, PR, true);
    if (p.ground && !wasGround && vy0 < -7) { this.squash = .35; this.burst(p.pos.clone().add(V(0, -.85, 0)), '#ffffff', 8, 2.2, .5); }
    // visuals
    p.obj.position.copy(p.pos); p.obj.rotation.set(0, p.yaw, 0);
    const sq = this.squash || 0; this.squash = Math.max(0, sq - dt * 2.5);
    const stretch = p.ground ? 1 - Math.sin(sq / .35 * Math.PI) * .18 : 1 + clamp(p.vel.y / 30, -.08, .14);
    const inner = p.obj.children[0]; inner.scale.set(p.s[0] / Math.sqrt(stretch), p.s[1] * stretch, p.s[2] / Math.sqrt(stretch));
    inner.position.y = -(1 - stretch) * p.h / 2;
    p.obj.visible = this.camMode !== 'first' && !(p.inv > 0 && Math.floor(this.t * 16) % 2 === 0);
  }
  doJump(p, v) { p.vel.y = v; p.buf = 0; p.coyote = 0; p.ground = null; p.jumpHeld = true; this.squash = 0; PX.Audio.sfx('jump'); this.burst(p.pos.clone().add(V(0, -.85, 0)), '#ffffff', 6, 1.6, .3); }
  groundAhead(e, dx, dz) { const c = V(e.pos.x + dx, e.pos.y - e.h / 2 - .35, e.pos.z + dz), n = V(); for (const col of this.cols) { if (col.e === e || !col.e.alive || col.e.open) continue; if (sphereVs(c, .2, col, n) > 0) return true; } return false; }
  updAI(e, dt) {
    const c = e.comps, p = this.player, alive = p && p.alive && !p.dead, t = this.t + e.t0;
    if (e.spin) { e.spin.rotation.y += dt * 2.4; e.spin.position.y = Math.sin(t * 2.5) * .12; }
    if (e.spin2) e.spin2.rotation.z -= dt * 1.6;
    if (e.padT > 0) { e.padT -= dt; const top = e.obj.getObjectByName('padtop'); if (top) top.position.y = .09 + Math.sin(e.padT / .3 * Math.PI) * .18; }
    if (e.flashT > 0) { e.flashT -= dt; }
    if (e.group === 'spawner') { const ev = +e.props.every || 0; if (ev > 0) { e.cool -= dt; if (e.cool <= 0) { e.cool = ev; const n = this.ents.filter(x => x.alive && x.from === e.id).length; if (n < (+e.props.max || 6)) { const s = this.spawnType(e.props.what, e.pos.clone().add(V(0, 1, 0))); if (s) s.from = e.id; } } } return; }
    if (e.shape === 'lava') { const m = e.obj.children[0].material; if (m.map) m.map.offset.set(Math.sin(this.t * .2) * .2, this.t * .03); }
    if (e.shape === 'water') { const m = e.obj.children[0].material; if (m.map) m.map.offset.set(this.t * .02, this.t * .013); }
    if (!e.moving && !c.shooter) return;
    if (c.shooter && alive) {
      e.cool -= dt; const to = p.pos.clone().sub(e.pos), d = to.length();
      if (e.head) e.head.rotation.y = Math.atan2(-to.x, -to.z) - e.obj.rotation.y;
      if (e.cool <= 0 && d < (+c.shooter.range || 18)) { e.cool = Math.max(.25, +c.shooter.rate || 1.8); const dir = to.add(V(0, .2, 0)).normalize(); this.fire(e.pos.clone().add(V(0, .45, 0)).addScaledVector(dir, .7), dir, +c.shooter.speed || 11, 'e'); }
    }
    const flying = e.phys.body !== 'dynamic';
    let chasing = false;
    if (c.chase && alive) {
      const to = p.pos.clone().sub(e.pos), d = Math.hypot(to.x, to.z), sp = (+c.chase.speed || 3) * e.spd;
      if (d < (+c.chase.range || 14)) {
        chasing = true; let tx = p.pos.x, tz = p.pos.z;
        if (c.chase.smart && this.df) { const ci = this.cellOf(e.pos.x, e.pos.z); if (ci >= 0) { const n = this.gn, x = ci % n, y = (ci / n) | 0, cur = this.df[ci]; let best = -1, bd = cur < 0 ? 1e9 : cur; for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) { if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue; const v = this.df[ny * n + nx]; if (v >= 0 && v < bd) { bd = v; best = ny * n + nx; } } if (best >= 0 && cur !== 0) { tx = -this.gW / 2 + (best % n + .5) * this.gC; tz = -this.gW / 2 + (Math.floor(best / n) + .5) * this.gC; } } }
        const dx = tx - e.pos.x, dz = tz - e.pos.z, dd = Math.hypot(dx, dz) || 1;
        e.vel.x += (dx / dd * sp - e.vel.x) * Math.min(1, 6 * dt); e.vel.z += (dz / dd * sp - e.vel.z) * Math.min(1, 6 * dt);
        e.face = Math.atan2(-dx, -dz);
      }
    }
    if (!chasing && c.patrol) {
      const pt = c.patrol, sp = (+pt.speed || 0) * e.spd, dist = +pt.distance || 0, ax = pt.axis === 'z' ? 'z' : 'x', o = e.origin[ax];
      if (e.dir > 0 && e.pos[ax] >= o + dist) e.dir = -1; else if (e.dir < 0 && e.pos[ax] <= o) e.dir = 1;
      if (e.hitWall) { e.dir = -e.dir; e.hitWall = false; }
      if (!flying && e.ground && !this.groundAhead(e, ax === 'x' ? e.dir * e.w * .6 : 0, ax === 'z' ? e.dir * e.w * .6 : 0)) e.dir = -e.dir;
      e.vel.x = ax === 'x' ? e.dir * sp : 0; e.vel.z = ax === 'z' ? e.dir * sp : 0;
      e.face = Math.atan2(-(ax === 'x' ? e.dir : 0), -(ax === 'z' ? e.dir : 0));
    } else if (!chasing) { e.vel.x *= .9; e.vel.z *= .9; }
    if (flying) { e.vel.y = 0; e.pos.y += ((e.homeY + Math.sin(t * 2) * .2) - e.pos.y) * Math.min(1, 3 * dt); }
    else e.vel.y = Math.max(e.vel.y - this.g * dt, -40);
    e.pos.addScaledVector(e.vel, dt); e.hitWall = false;
    const r = Math.min(e.size[0], e.size[2]) * .45; const oy = -(e.h / 2 - r);
    e.ground = this.collide(e, [oy], r, false);
    if (e.pos.y < (+this.S.killY || -15) - 5) e.alive = false;
    e.obj.position.copy(e.pos);
    if (e.face != null) { let d = e.face - e.obj.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); e.obj.rotation.y += d * Math.min(1, 8 * dt); }
    if (e.body) { const s = 1 + Math.sin(t * 8) * .06; e.body.scale.set(1 / s, s, 1 / s); }
    if (e.flashT > 0 && e.body) e.body.visible = Math.floor(this.t * 30) % 2 === 0; else if (e.body) e.body.visible = true;
  }
  fire(from, dir, speed, owner) {
    if (!this._bg) { this._bg = new THREE.SphereGeometry(.13, 10, 8); this._bm = { p: new THREE.MeshBasicMaterial({ color: '#fff2a0' }), e: new THREE.MeshBasicMaterial({ color: '#ff3b6b' }) }; }
    const m = new THREE.Mesh(this._bg, this._bm[owner]); m.position.copy(from); this.scene.add(m);
    const L = new THREE.PointLight(owner === 'p' ? '#ffd84a' : '#ff3b6b', 6, 4, 2); m.add(L);
    this.bullets.push({ m, pos: from.clone(), vel: dir.clone().multiplyScalar(speed), life: 2, owner });
    PX.Audio.sfx(owner === 'p' ? 'laser' : 'blip');
  }
  updBullets(dt) {
    const p = this.player, n = V();
    for (const b of this.bullets) {
      b.pos.addScaledVector(b.vel, dt); b.life -= dt; b.m.position.copy(b.pos);
      for (const col of this.cols) { if (!col.e.alive || col.e.open || (col.e.group === 'enemy' && b.owner === 'p')) continue; if (sphereVs(b.pos, .12, col, n) > 0) { b.life = 0; this.burst(b.pos, b.owner === 'p' ? '#ffd84a' : '#ff3b6b', 6, 2, .5); break; } }
      if (b.life <= 0) continue;
      if (b.owner === 'p') { for (const e of this.ents) { if (!e.alive || e.isPlayer || !(e.group === 'enemy' || (e.comps.hazard && e.comps.health))) continue; if (b.pos.distanceTo(e.pos) < Math.max(e.size[0], e.size[1]) * .6) { b.life = 0; this.ruleTouch({ isBullet: true, group: 'bullet', type: 'bullet', id: 'b' }, e); this.damage(e, 1); break; } } }
      else if (p && !p.dead && b.pos.distanceTo(p.pos) < .7) { b.life = 0; this.hurt(1, null, b.vel); }
    }
    this.bullets = this.bullets.filter(b => { if (b.life <= 0) { this.scene.remove(b.m); return false; } return true; });
  }
  overlapPlayer(e, pad = 0) {
    const p = this.player, c = V(), n = V();
    if (['coin', 'gem', 'key', 'orb', 'heart'].includes(e.shape)) return p.pos.distanceTo(e.pos) < .9 + Math.max(...e.size) * .4;
    if (e.shape === 'portal') { const d = p.pos.clone().sub(e.pos); return Math.hypot(d.x, d.z) < e.size[0] * .45 && Math.abs(d.y) < e.size[1] * .5 + .5; }
    if (!e._tc) e._tc = { e, kind: 'obb', c: V(), h: V(), q: new THREE.Quaternion(), qi: new THREE.Quaternion(), min: V(), max: V() };
    if (!e._tcOk || e.comps.mover || e.comps.spinner || e.moving) { updateCollider(e._tc, e.pos, e.quat, e.size, e.shape === 'checkpoint' || e.shape === 'sign' ? 'box' : 'box'); e._tc.kind = 'obb'; e._tcOk = true; }
    for (const oy of PCAP) { c.set(p.pos.x, p.pos.y + oy, p.pos.z); if (sphereVs(c, PR + pad, e._tc, n) > 0) return true; }
    return false;
  }
  triggers() {
    const p = this.player, now = this.touchNow || new Set(); p.inWater = false;
    for (const e of this.ents) {
      if (!e.alive || e === p || e.open) continue;
      const g = e.group; if (g === 'block' && !e.comps.hazard) continue; if (g === 'decor' || g === 'light') continue;
      if (g === 'sign') { if (p.pos.distanceTo(e.pos) < 2.6 && (!this.msg || this.msg.sign !== e.id || this.msg.t < .3)) { this.say(e.props.text || '', .6); this.msg.sign = e.id; } continue; }
      if (!this.overlapPlayer(e, e.group === 'enemy' ? .05 : .02)) continue;
      now.add(e.id);
      const k = p.id + ':' + e.id;
      if (!this.touching.has(k)) { this.ruleTouch(p, e); this.enter(e); }
      if (this.state === 'play' && !p.dead) this.stay(e);
    }
    for (const id of now) { if (!this.touchingIds || !this.touchingIds.has(id)) { const e = this.ents.find(x => x.id === id); if (e && e.phys.solid) this.ruleTouch(p, e); } }
    this.touching = new Set([...now].map(id => p.id + ':' + id)); this.touchingIds = new Set(now); this.touchNow = new Set();
  }
  enter(e) {
    const c = e.comps, p = this.player;
    if (c.collectible) this.collect(e);
    if (e.group === 'checkpoint' && !e.lit) { this.ents.forEach(x => { if (x.group === 'checkpoint' && x.lit) { x.lit = false; if (x.flagM) x.flagM.material = material(x.color, 'matte'); } }); e.lit = true; if (e.flagM) e.flagM.material = material('#3ddc84', 'glow'); this.spawn = e.pos.clone().add(V(0, .2, 0)); this.spawn.y = e.pos.y - e.h / 2 + p.h / 2 + .05; PX.Audio.sfx('checkpoint'); this.say('CHECKPOINT', 1.2); this.burst(e.pos.clone().add(V(0, 1, 0)), '#3ddc84', 24, 3, 2); }
    if (c.goal) { const left = this.total - this.collected; if (c.goal.requireAll && left > 0) this.say('Collect everything first! (' + left + ' left)', 1.6); else { this.burst(p.pos, '#ff8a2a', 40, 6, 3); this.win('GOAL REACHED!'); } }
  }
  stay(e) {
    const p = this.player, c = e.comps;
    if (e.group === 'water' && p.pos.y < e.pos.y + e.h / 2 - .15) p.inWater = true;
    if (c.bounce && p.vel.y <= 1 && p.pos.y - p.h / 2 > e.pos.y - .1) { p.vel.y = +c.bounce.power || 15; p.ground = null; p.jumpHeld = false; e.padT = .3; this.squash = 0; PX.Audio.sfx('spring'); this.burst(e.pos.clone().add(V(0, .2, 0)), e.color || '#ff3b3b', 16, 3, 3); }
    if (c.hazard && e.alive) {
      const isEnemy = e.group === 'enemy' || !!c.health;
      if (isEnemy && c.hazard.stompable && p.vel.y < -1 && p.pos.y - p.h / 2 > e.pos.y + e.h * .1) { this.damage(e, 1, true); p.vel.y = this.in.jump ? (+p.comps.player.jump || 8) * .9 : 6.5; p.jumpHeld = true; PX.Audio.sfx('stomp'); this.shake(.15, 3); }
      else if (this.power.shield > 0) { if (isEnemy) this.damage(e, 99); }
      else if (+c.hazard.damage > 0) this.hurt(+c.hazard.damage, e);
    }
  }
  collect(e) {
    const c = e.comps.collectible; this.remove(e, true);
    if (c.score) this.addScore(+c.score, e);
    if (c.counts) this.collected++;
    PX.Audio.sfx(c.sound || 'coin');
    this.burst(e.pos, e.group === 'key' ? (PX.KEY_COLORS[e.props.color] || '#ffd84a') : (e.color || '#ffd84a'), 22, 3.5, 2.5);
    if (e.group === 'key') { const k = e.props.color || 'gold'; this.keys[k] = (this.keys[k] || 0) + 1; this.say(k[0].toUpperCase() + k.slice(1) + ' key!', 1.2); }
    else if (e.group === 'life') { this.lives++; this.say('+1 LIFE', 1.2); }
    else if (e.group === 'powerup') { const k = e.props.kind || 'speed', d = +e.props.duration || 8; this.power[k] = d; this.powerMax[k] = d; this.say(k.toUpperCase() + '!', 1.2); this.flash = .25; this.flashC = e.color; }
    this.event('destroyed', e);
  }
  tryDoor(d) {
    if (d.open) return; const k = d.props.color || 'gold';
    if (this.keys[k] > 0) { this.keys[k]--; d.open = true; PX.Audio.sfx('unlock'); this.say('Unlocked!', 1); this.burst(d.pos, PX.KEY_COLORS[k] || '#ffd84a', 30, 4, 2); d.obj.visible = false; this.buildGrid(); }
    else if (!this.doorMsgT || this.t - this.doorMsgT > 2) { this.doorMsgT = this.t; this.say('Locked — find the ' + k + ' key', 1.6); }
  }
  damage(e, n, stomp) {
    if (!e.alive) return;
    if (e.comps.health) { e.hp -= n; e.flashT = .25; if (e.hp > 0) { PX.Audio.sfx('blip'); this.burst(e.pos, '#ffffff', 6, 2, 1); return; } }
    if (!e.alive) return; e.alive = false; e.obj.visible = false;
    if (e.comps.health && +e.comps.health.points) this.addScore(+e.comps.health.points, e);
    this.burst(e.pos, e.color || '#ffffff', 30, 5, 2); this.burst(e.pos, '#ffffff', 10, 3, 1);
    PX.Audio.sfx('boom'); this.shake(.18, 4); this.event('destroyed', e);
  }
  remove(e, quiet) { if (!e || !e.alive) return; if (e.isPlayer) { this.die(); return; } e.alive = false; e.obj.visible = false; if (!quiet) { this.burst(e.pos, e.color || '#fff', 16, 3, 1); this.event('destroyed', e); } }
  hurt(dmg, src, dir) {
    const p = this.player; if (!p || p.dead || p.inv > 0 || this.state !== 'play' || this.power.shield > 0) return;
    p.hp -= dmg; p.inv = p.comps.health ? (+p.comps.health.invuln || 1) : 1.2;
    PX.Audio.sfx('hit'); this.shake(.3, 7); this.flash = .35; this.flashC = '#ff3b3b'; this.burst(p.pos, '#ff3b3b', 18, 4, 2);
    const away = src ? p.pos.clone().sub(src.pos) : (dir ? dir.clone() : V(0, 0, 1)); away.y = 0; if (away.lengthSq() < 1e-4) away.set(0, 0, 1); away.normalize();
    p.vel.x = away.x * 7; p.vel.z = away.z * 7; p.vel.y = 6;
    if (p.hp <= 0) this.die();
  }
  die(why) {
    const p = this.player; if (!p || p.dead || this.state !== 'play') return;
    p.dead = true; p.deadT = 1.1; this.lives = Math.max(0, this.lives - 1); p.obj.visible = false;
    this.burst(p.pos, p.color || '#ff4d00', 40, 6, 3); this.burst(p.pos, '#ffffff', 14, 4, 2);
    PX.Audio.sfx('die'); this.shake(.4, 9);
    this.say(this.lives > 0 ? (why === 'FELL' ? 'WHOOPS! ' : 'OUCH! ') + this.lives + (this.lives === 1 ? ' life' : ' lives') + ' left' : 'NO LIVES LEFT', 1.3);
  }
  respawn() { const p = this.player; p.dead = false; p.pos.copy(this.spawn); p.vel.set(0, 0, 0); p.hp = p.maxHp; p.inv = 1.6; p.ground = null; p.obj.visible = true; this.burst(p.pos, '#ffffff', 20, 3, 2); }
  addScore(n, at) { this.score += n; if (at && at.pos && n) this.texts.push({ p: at.pos.clone(), s: (n > 0 ? '+' : '') + n, life: 1, c: n > 0 ? '#ffd84a' : '#ff3b3b' }); }
  spawnType(type, at) {
    if (!A3[type] || this.ents.filter(e => e.alive && e.spawned).length > 120) return null;
    const proto = this.src.entities.find(e => e.type === type) || PX.newEntity3D(type);
    const d = PX.clone(proto); d.id = 's' + (++this.sid); const sz = PX.size3(d); d.p = [at.x, at.y + sz[1] / 2 - .5, at.z];
    const e = this.mk(d); e.spawned = true; this.ents.push(e);
    if (e.comps.collectible && e.comps.collectible.counts) this.total++;
    this.burst(e.pos, '#b07aff', 22, 3, 2); return e;
  }
  where(w, ctx) {
    const p = this.player, pick = l => l[Math.floor(Math.random() * l.length)];
    if (w === 'spawner') { const sp = this.ents.filter(e => e.alive && e.group === 'spawner'); if (sp.length) return pick(sp).pos.clone().add(V(0, .6, 0)); }
    if (w === 'self' && ctx.self && ctx.self.pos) return ctx.self.pos.clone();
    if (w === 'other' && ctx.other && ctx.other.pos) return ctx.other.pos.clone();
    if (w === 'checkpoint') return this.spawn.clone();
    if (w === 'start' && p) return p.origin.clone();
    if (w === 'player' && p) return p.pos.clone().add(V((Math.random() - .5) * 6, 2, (Math.random() - .5) * 6));
    const W = (+this.S.world || 40) * .4; return V((Math.random() - .5) * W, 3, (Math.random() - .5) * W);
  }
  act(a, ctx) {
    const p = this.player;
    if (a.type === 'respawn') { if (p && !p.dead) { p.pos.copy(this.spawn); p.vel.set(0, 0, 0); p.inv = Math.max(p.inv, .8); this.burst(p.pos, '#ffffff', 16, 3, 2); } return; }
    if (a.type === 'teleport') { const who = a.a === 'other' ? ctx.other : a.a === 'self' ? ctx.self : p; if (!who || !who.pos || who.isBullet) return; const d = this.where(a.b || 'checkpoint', ctx); who.pos.copy(d); if (who.vel) who.vel.set(0, 0, 0); this.burst(d, '#b07aff', 16, 3, 2); return; }
    PX.Game.prototype.act.call(this, a, ctx);
  }
  win(msg) { if (this.state !== 'play') return; this.state = 'win'; this.endMsg = msg || 'YOU WIN!'; this.end(); }
  lose(msg) { if (this.state !== 'play') return; this.state = 'lose'; this.endMsg = msg || 'GAME OVER'; this.end(); }
  end() {
    PX.Audio.stopMusic(); PX.Audio.sfx(this.state === 'win' ? 'win' : 'lose'); this.endT = 0;
    if (document.pointerLockElement) try { document.exitPointerLock(); } catch (e) { /* ignore */ }
    if (this.state === 'win' && this.player) for (let i = 0; i < 6; i++) this.burst(this.player.pos.clone().add(V((Math.random() - .5) * 4, 2 + Math.random() * 2, (Math.random() - .5) * 4)), ['#ff4d00', '#ffd84a', '#4ab4ff', '#6ee06e', '#ff6ab8', '#ffffff'][i], 30, 5, 3);
    const res = { result: this.state, msg: this.endMsg, score: this.score, time: +this.t.toFixed(1), lives: this.lives }; this.result = res;
    this.log((this.state === 'win' ? '★ WIN — ' : '✖ LOSE — ') + this.endMsg + ' · score ' + this.score + ' · ' + this.t.toFixed(1) + 's', this.state === 'win' ? 'ok' : 'warn');
    if (this.opts.onEnd) this.opts.onEnd(res);
    if (this.opts.host) this.showEnd();
  }
  fx(dt) {
    const L = this.parts.list;
    for (const q of L) { q.life -= dt; q.v.y -= 6 * dt; q.p.addScaledVector(q.v, dt); }
    this.parts.list = L.filter(q => q.life > 0);
    for (const t of this.texts) { t.life -= dt; t.p.y += 1.2 * dt; } this.texts = this.texts.filter(t => t.life > 0);
    if (this.msg) { this.msg.t -= dt; if (this.msg.t <= 0) this.msg = null; }
    if (this.banner) { this.banner.t -= dt; if (this.banner.t <= 0) this.banner = null; }
    if (this.shakeT > 0) this.shakeT -= dt; else this.shakeA = 0;
    if (this.flash > 0) this.flash -= dt;
  }
  updCam(dt, snap) {
    const p = this.player, cam = this.cam; if (!p) { cam.position.set(15, 15, 15); cam.lookAt(0, 0, 0); return; }
    const head = p.pos.clone().add(V(0, .55, 0));
    let want;
    if (this.camMode === 'first') { cam.position.copy(p.pos).add(V(0, .65, 0)); cam.rotation.set(0, 0, 0); cam.rotation.order = 'YXZ'; cam.rotation.y = this.camYaw; cam.rotation.x = this.camPitch; this.env.follow(p.pos); return; }
    if (this.camMode === 'top') want = head.clone().add(V(0, this.camDist, this.camDist * .55));
    else {
      const cp = Math.cos(this.camPitch), dir = V(Math.sin(this.camYaw) * cp, Math.sin(this.camPitch), Math.cos(this.camYaw) * cp);
      let dist = this.camDist;
      this._rc = this._rc || new THREE.Raycaster(); this._rc.set(head, dir); this._rc.far = dist;
      const hit = this._rc.intersectObjects(this.solidMeshes, false).find(h => { let o = h.object; while (o && o.userData.id == null) o = o.parent; const e = o && this.ents.find(x => x.id === o.userData.id); return e && e.alive && !e.open; });
      if (hit) dist = Math.max(1.2, hit.distance - .35);
      want = head.clone().addScaledVector(dir, dist);
    }
    if (snap) cam.position.copy(want); else cam.position.lerp(want, 1 - Math.exp(-14 * dt));
    cam.lookAt(head);
    if (this.shakeT > 0) { cam.position.x += (Math.random() - .5) * this.shakeA * .03; cam.position.y += (Math.random() - .5) * this.shakeA * .03; }
    this.env.follow(p.pos);
  }
  render() {
    // particles -> buffer
    const L = this.parts.list, pos = this.parts.pts.geometry.attributes.position, col = this.parts.pts.geometry.attributes.color;
    for (let i = 0; i < L.length; i++) { const q = L[i], a = Math.max(0, q.life / q.max); pos.setXYZ(i, q.p.x, q.p.y, q.p.z); col.setXYZ(i, q.c.r * a, q.c.g * a, q.c.b * a); }
    pos.needsUpdate = col.needsUpdate = true; this.parts.pts.geometry.setDrawRange(0, L.length);
    this.post.render();
    // HUD
    const ctx = this.hud2, W = this.hudCv.width, H = this.hudCv.height; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H);
    if (this.flash > 0) { ctx.globalAlpha = Math.min(.35, this.flash); ctx.fillStyle = this.flashC || '#fff'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
    ctx.textAlign = 'center'; ctx.font = `${Math.round(H / 26)}px Anton, Impact, sans-serif`;
    for (const t of this.texts) { const v = t.p.clone().project(this.cam); if (v.z > 1) continue; const x = (v.x + 1) / 2 * W, y = (1 - v.y) / 2 * H; ctx.globalAlpha = Math.min(1, t.life * 2); ctx.fillStyle = '#000'; ctx.fillText(t.s, x + 2, y + 2); ctx.fillStyle = t.c; ctx.fillText(t.s, x, y); }
    ctx.globalAlpha = 1;
    if (this.camMode === 'first' && this.state === 'play') { ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(W / 2, H / 2, 6, 0, 7); ctx.stroke(); }
    PX.Game.prototype.hud.call(this, ctx, W, H);
    if (this.state === 'play' && this.t < 6 && !this.opts.preview && this.opts.hint !== false) { ctx.textAlign = 'center'; ctx.font = `600 ${Math.round(Math.max(11, H / 60))}px "JetBrains Mono", monospace`; ctx.fillStyle = 'rgba(255,255,255,' + Math.min(1, (6 - this.t) / 2) * .8 + ')'; ctx.fillText('WASD move · Space jump · Shift sprint · click + mouse to look · C camera · G graphics', W / 2, H - Math.max(18, H / 28)); }
  }
}
for (const k of ['match', 'ruleTouch', 'event', 'val', 'compareRules', 'run', 'say', 'shake', 'bestScore', 'showEnd']) Game3D.prototype[k] = PX.Game.prototype[k];

const E3 = { THREE, Editor3D, Game3D, buildObject, thumb, icon, material, texCanvas: PX.texCanvas, ready: true };
PX.E3 = E3;
export default E3;
