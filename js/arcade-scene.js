/* The arcade room: a ring of detailed upright cabinets (js/cabinet3d.js) with real game screens, round a
   PIXEL ARCADE hero machine, on a blacklight carpet under hanging lamps, with neon on the back wall.
   Shared by the front-page intro (js/intro.js) and the README header renderer (tools/readme_hero.html).
   arcadeScene(THREE, {base, ids, names, live}) returns {scene, cam, start, target, cabinets, rear, dust, tick, useRenderer}.
   base: path prefix to the site root ('' or '../'). live: an optional canvas for the hero cabinet's screen.
   useRenderer(renderer) bakes a small reflection map for the chrome, glass and glossy buttons. */
import {cabinetKit} from './cabinet3d.js';
export const SCREENS = ['hoops','starrun','artillery','volley','boxing','bowling','penalty','spellcaster','darts','bounceball','roadagent','digger'];
export const NAMES = {hoops:'HOOPS 1 ON 1',starrun:'STAR RUN 3D',artillery:'ARTILLERY DUEL',volley:'BEACH VOLLEY',boxing:'RING BOXING',bowling:'BOWLING 3D',penalty:'PENALTY KICKS',spellcaster:'SPELL CASTER',darts:'DARTS 301',bounceball:'BOUNCE BALL',roadagent:'ROAD AGENT',digger:'TUNNEL DIGGER'};

export function arcadeScene(THREE, {base = '', ids = SCREENS, names = NAMES, live = null, aspect = 1.6, cones = false} = {}) {
 const scene = new THREE.Scene(), NIGHT = 0x0c0f17;
 scene.background = new THREE.Color(NIGHT); scene.fog = new THREE.Fog(NIGHT, 12, 32);
 const cam = new THREE.PerspectiveCamera(40, aspect, .1, 100);
 const start = {pos: new THREE.Vector3(-.4, 2.3, 10.6), look: new THREE.Vector3(1.5, 1.55, -2)};
 cam.position.copy(start.pos); cam.lookAt(start.look);
 const kit = cabinetKit(THREE), tex = kit.tex;

 scene.add(new THREE.HemisphereLight(0x8f9fff, 0x0c0f17, .35));
 const key = new THREE.DirectionalLight(0xffd2b0, 1.1); key.position.set(-6, 7, 9); scene.add(key);
 const rimL = new THREE.PointLight(0x3352ff, 60, 26); rimL.position.set(-5, 5, -5); scene.add(rimL);
 const rimR = new THREE.PointLight(0x3352ff, 70, 26); rimR.position.set(7, 5, -3); scene.add(rimR);
 // keep this light weak and high: near the mirrored floor it blooms into a red blob
 const warm = new THREE.PointLight(0xff4d00, 9, 14); warm.position.set(1.5, 2.4, 1.2); scene.add(warm);

 // blacklight arcade carpet: planets, zigzags and confetti that glow faintly under the polish
 const carpet = tex(512, 512, (x, w, h) => {
  x.fillStyle = '#0b0d18'; x.fillRect(0, 0, w, h); let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const C = ['#ff4d00', '#2443ff', '#19c37d', '#ffc234', '#d23cff', '#3ad6ff'];
  x.lineWidth = 5; x.lineCap = 'round';
  for (let i = 0; i < 46; i++) {const cx = r() * w, cy = r() * h, c = C[i % C.length], k = i % 4; x.strokeStyle = x.fillStyle = c; x.globalAlpha = .75;
   if (k === 0) {x.beginPath(); x.arc(cx, cy, 10 + r() * 14, 0, 7); x.stroke(); x.beginPath(); x.ellipse(cx, cy, 30, 7, -.4, 0, 7); x.stroke();}
   else if (k === 1) {x.beginPath(); x.moveTo(cx, cy); for (let j = 1; j < 6; j++) x.lineTo(cx + j * 10, cy + (j % 2 ? -10 : 0)); x.stroke();}
   else if (k === 2) {x.beginPath(); x.moveTo(cx, cy - 12); x.lineTo(cx + 12, cy + 9); x.lineTo(cx - 12, cy + 9); x.closePath(); x.stroke();}
   else {for (let j = 0; j < 5; j++) x.fillRect(cx + r() * 40, cy + r() * 40, 5, 5);}}
  x.globalAlpha = 1;});
 carpet.wrapS = carpet.wrapT = THREE.RepeatWrapping; carpet.repeat.set(26, 26);
 const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({color: 0x232838, map: carpet, emissive: 0xffffff, emissiveMap: carpet, emissiveIntensity: .16,
  roughness: .32, metalness: .35, transparent: true, opacity: .9}));
 floor.rotation.x = -Math.PI / 2; scene.add(floor);

 // marquee art: a sunburst over a starfield between chrome stripes, the name in bevelled lettering
 const PAL = [['#1b33cc', '#050b33', '#ffd27a', '#ff4d00'], ['#3a1204', '#0d0503', '#ffe2b0', '#ff4d00'], ['#141a2e', '#04060c', '#cfd6ff', '#2443ff'], ['#06302a', '#020c0a', '#d8fff2', '#19c37d'], ['#2c0b3d', '#0b0312', '#ffd6ff', '#d23cff']];
 const marquee = (txt, i, hero) => tex(1024, 280, (x, w, h) => {
  const [a, b, ink, acc] = PAL[i % PAL.length], g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, b); g.addColorStop(.55, a); g.addColorStop(1, b); x.fillStyle = g; x.fillRect(0, 0, w, h);
  x.save(); x.translate(w / 2, h * 1.05); x.fillStyle = 'rgba(255,255,255,.07)'; for (let k = 0; k < 18; k++) {x.rotate(Math.PI / 18); x.beginPath(); x.moveTo(0, 0); x.lineTo(-40, -900); x.lineTo(40, -900); x.fill();} x.restore();
  let s = i * 31 + 5; const r = () => (s = (s * 16807) % 2147483647) / 2147483647; x.fillStyle = '#fff'; for (let k = 0; k < 60; k++) {x.globalAlpha = r() * .7; x.fillRect(r() * w, r() * h, 3, 3);} x.globalAlpha = 1;
  for (const [y, c] of [[14, acc], [30, '#eceae3'], [h - 22, '#eceae3'], [h - 38, acc]]) {x.fillStyle = c; x.fillRect(0, y, w, 6);}
  const word = (t, font, size, y, max) => {let z = size; x.font = z + 'px ' + font; while (x.measureText(t).width > max && z > 20) {z -= 4; x.font = z + 'px ' + font;}
   x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
   x.fillStyle = 'rgba(0,0,0,.6)'; x.fillText(t, w / 2 + 7, y + 8);
   x.strokeStyle = b; x.lineWidth = z * .16; x.strokeText(t, w / 2, y);
   const f = x.createLinearGradient(0, y - z / 2, 0, y + z / 2); f.addColorStop(0, '#ffffff'); f.addColorStop(.48, ink); f.addColorStop(.52, acc); f.addColorStop(1, ink);
   x.fillStyle = f; x.fillText(t, w / 2, y); x.strokeStyle = 'rgba(255,255,255,.5)'; x.lineWidth = 2; x.strokeText(t, w / 2, y - 2);};
  if (hero) {word('PIXEL ARCADE', 'Anton, "PA Pixel", Impact, sans-serif', 168, h * .47, 930); x.fillStyle = '#eceae3'; x.font = '24px "PA Pixel", monospace'; x.fillText('INSERT COIN  ·  1 OR 2 PLAYERS', w / 2, h - 62);}
  else word(txt, '"PA Pixel", monospace', 92, h / 2 + 4, 900);
 });

 const SIDES = [[0x2443ff, 0xff4d00], [0xdcd8cd, 0x2443ff], [0x1d2231, 0xff4d00], [0x2443ff, 0xeceae3], [0xff4d00, 0x1d2231], [0x6b2bd9, 0xffc234], [0x0f8a6a, 0xeceae3]];
 const tl = new THREE.TextureLoader();
 let liveTex = null;
 const screenTex = (id, useLive) => {const t = useLive ? (liveTex = new THREE.CanvasTexture(live)) : tl.load(base + 'docs/thumbs/' + id + '.jpg'); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; return t;};
 function cabinet(i, id, far, hero) {
  const [side, accent] = hero ? [0x2443ff, 0xff4d00] : SIDES[i % SIDES.length];
  const g = kit.build({side, accent, seed: i + 1, hero, lite: far, dim: far ? .55 : 1,
   marquee: marquee(hero ? 'PIXEL ARCADE' : names[id] || id.toUpperCase(), hero ? 0 : i + 1, hero), screen: screenTex(id, hero && live)});
  g.userData.id = hero && live ? null : id; g.userData.live = !!(hero && live);
  // each screen throws a little light onto the floor and the player's spot
  if (!far) {const glow = new THREE.PointLight(0x8f9fff, 5, 4.5); glow.position.set(0, 1.7, 1.3); g.add(glow);}
  return g;
 }
 // a ring of cabinets facing outwards: the hero in the middle faces you, a little forward and taller, and the ones
 // round the sides turn away and show their printed side panels. A dimmer second ring sits behind.
 const front = ids.slice(0, 7), back = ids.slice(7);
 const ring = new THREE.Group(), cabinets = []; scene.add(ring);
 const C = new THREE.Vector3(2.5, 0, -4.4);
 front.forEach((id, i) => {const hero = i === 3, a = (i - 3) * .42 + .08, R = 5.4 + (hero ? .7 : 0), g = cabinet(i, id, false, hero);
  g.position.set(C.x + Math.sin(a) * R, 0, C.z + Math.cos(a) * R); g.rotation.y = a; if (hero) g.scale.setScalar(1.08); ring.add(g); cabinets.push(g);});
 const rear = [];
 back.forEach((id, i) => {const a = (i - 2) * .5 + .3, R = 9.5, g = cabinet(i + 3, id, true); g.position.set(C.x + Math.sin(a) * R - 1, 0, C.z + Math.cos(a) * R - 6.5); g.rotation.y = a * .6; ring.add(g); rear.push(g);});
 // polished floor: a mirrored copy of the front cabinets under the tinted, slightly see-through carpet, without
 // their lights and small parts, which would only double the cost for detail the carpet hides
 const mirror = ring.clone(); mirror.scale.y = -1; const lights = []; mirror.traverse(o => o.isLight && lights.push(o)); lights.forEach(l => l.removeFromParent());
 mirror.children.slice(front.length).forEach(o => mirror.remove(o)); const small = []; mirror.traverse(o => o.userData.small && small.push(o)); small.forEach(o => o.removeFromParent()); scene.add(mirror);
 const hero = cabinets[3];
 // a lit ring on the floor and an orange underglow pick out the hero machine
 const halo = new THREE.Mesh(new THREE.RingGeometry(1.25, 1.34, 64), new THREE.MeshBasicMaterial({color: 0xff4d00, transparent: true, opacity: .85, toneMapped: false}));
 halo.rotation.x = -Math.PI / 2; halo.position.set(hero.position.x, .01, hero.position.z + .1); scene.add(halo);
 const under = new THREE.PointLight(0xff6a2a, 6, 3.2); under.position.set(hero.position.x, .25, hero.position.z + 1.1); scene.add(under);

 // the back wall: dark panels, a neon sign over the ring, a high-score board, and a couple of small signs
 const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 9), new THREE.MeshStandardMaterial({color: 0x10131d, roughness: .8,
  map: tex(512, 128, (x, w, h) => {x.fillStyle = '#5d6275'; x.fillRect(0, 0, w, h); x.fillStyle = '#4a4f60'; for (let i = 0; i < w; i += 32) x.fillRect(i, 0, 3, h); x.fillRect(0, 76, w, 3);})}));
 wall.material.map.wrapS = THREE.RepeatWrapping; wall.material.map.repeat.set(10, 1); wall.position.set(2, 4.5, -10); scene.add(wall);
 const neonSign = (w, h, draw) => tex(w, h, (x) => {x.lineCap = x.lineJoin = 'round'; draw(x, w, h);});
 const glowText = (x, t, X, Y, font, col, lw) => {x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle';
  for (const [b, a, l] of [[40, .5, lw * 3], [16, .9, lw * 1.6], [0, 1, lw * .6]]) {x.shadowColor = col; x.shadowBlur = b; x.globalAlpha = a; x.strokeStyle = l < lw ? '#fff' : col; x.lineWidth = l; x.strokeText(t, X, Y);}
  x.globalAlpha = 1; x.shadowBlur = 0;};
 const neons = [];
 const sign = (map, w, h, x, y, z, flick) => {const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({map, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false}));
  m.position.set(x, y, z); scene.add(m); neons.push({m, flick}); return m;};
 sign(neonSign(1024, 256, (x, w, h) => {glowText(x, 'PIXEL ARCADE', w / 2, h / 2 + 6, '150px Anton, Impact, sans-serif', '#ff5a1a', 6);
  x.shadowColor = '#3a6bff'; x.shadowBlur = 24; x.strokeStyle = '#8fb0ff'; x.lineWidth = 6; x.strokeRect(14, 14, w - 28, h - 28); x.shadowBlur = 0;}), 7.5, 1.9, 2.5, 5.0, -9.9, true);
 sign(neonSign(512, 512, (x, w, h) => {x.shadowColor = '#3a6bff'; x.shadowBlur = 20; x.fillStyle = 'rgba(20,30,80,.55)'; x.fillRect(20, 20, w - 40, h - 40); x.strokeStyle = '#8fb0ff'; x.lineWidth = 6; x.strokeRect(20, 20, w - 40, h - 40); x.shadowBlur = 0;
  glowText(x, 'HIGH SCORES', w / 2, 76, '46px "PA Pixel", monospace', '#ffd27a', 3);
  x.font = '30px "PA Pixel", monospace'; x.textBaseline = 'middle';
  [['1ST', 'AAA', '98240'], ['2ND', 'ZED', '87110'], ['3RD', 'KIT', '76500'], ['4TH', 'MAX', '61830'], ['5TH', 'ACE', '55020'], ['6TH', 'ROY', '41290']].forEach(([n, a, s], k) => {
   x.fillStyle = ['#ff7a3d', '#eceae3', '#8f9fff'][k % 3]; x.textAlign = 'left'; x.fillText(n + '  ' + a, 60, 160 + k * 52); x.textAlign = 'right'; x.fillText(s, w - 60, 160 + k * 52);});}), 2.6, 2.6, -5.2, 3.3, -9.9);
 sign(neonSign(512, 256, (x, w, h) => {glowText(x, 'OPEN', w / 2, 80, '96px Anton, Impact, sans-serif', '#ff3bd0', 4); glowText(x, 'ALL NIGHT', w / 2, 180, '52px "PA Pixel", monospace', '#3ad6ff', 3);}), 2.4, 1.2, 10.2, 3.6, -9.9, true);
 sign(neonSign(512, 256, (x, w, h) => {x.shadowColor = '#19c37d'; x.shadowBlur = 24; x.strokeStyle = '#b6ffd9'; x.lineWidth = 8; x.beginPath(); x.moveTo(40, h / 2); x.lineTo(w - 120, h / 2); x.moveTo(w - 180, 60); x.lineTo(w - 70, h / 2); x.lineTo(w - 180, h - 60); x.stroke();
  glowText(x, 'TOKENS', 180, 60, '40px "PA Pixel", monospace', '#19c37d', 2.5);}), 1.8, .9, -1.6, 2.2, -9.9);

 // the ceiling: a lighting truss with a hanging lamp over every front cabinet
 const truss = new THREE.MeshStandardMaterial({color: 0x1a1e2a, roughness: .5, metalness: .7});
 for (const z of [-2.2, 1.6]) {const b = new THREE.Mesh(new THREE.BoxGeometry(22, .12, .12), truss); b.position.set(2.5, 6.1, z); scene.add(b);}
 const shade = new THREE.CylinderGeometry(.08, .36, .3, 24, 1, true), bulb = new THREE.CircleGeometry(.2, 24), cord = new THREE.CylinderGeometry(.008, .008, 1, 6);
 const shadeM = new THREE.MeshStandardMaterial({color: 0x20242f, roughness: .4, metalness: .8, side: THREE.DoubleSide});
 cabinets.forEach((g, i) => {const y = 5.75, l = new THREE.Group(); l.position.set(g.position.x, y, g.position.z);
  const sh = new THREE.Mesh(shade, shadeM); l.add(sh);
  const bu = new THREE.Mesh(bulb, new THREE.MeshBasicMaterial({color: i === 3 ? 0xffc9a8 : 0xc9d2ff, toneMapped: false})); bu.rotation.x = Math.PI / 2; bu.position.y = -.14; l.add(bu);
  const cd = new THREE.Mesh(cord, truss); cd.scale.y = 6.1 - y; cd.position.y = (6.1 - y) / 2 + .15; l.add(cd); scene.add(l);});

 // light cones: a soft shaft from each lamp onto its cabinet, brightest at the top (added after the mirror copy so
 // the floor doesn't double them)
 if (cones) {
  // brightest at the ceiling and where you look straight through the shaft, fading to nothing at its edges and the floor
  const vert = 'varying vec3 vN; varying vec3 vV; varying float vY; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); vY = position.y / 5.2 + .5; gl_Position = projectionMatrix * mv; }';
  const frag = 'uniform vec3 uC; uniform float uO; varying vec3 vN; varying vec3 vV; varying float vY; void main(){ float f = pow(abs(dot(normalize(vN), normalize(vV))), 2.2); float g = pow(clamp(vY, 0., 1.), 1.8); gl_FragColor = vec4(uC * f * g * uO, 1.); }';
  cabinets.forEach((g, i) => {
   const m = new THREE.ShaderMaterial({vertexShader: vert, fragmentShader: frag, uniforms: {uC: {value: new THREE.Color(i === 3 ? 0xffb38a : 0x8f9fff)}, uO: {value: .22}},
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide});
   const cone = new THREE.Mesh(new THREE.CylinderGeometry(.3, 1.3, 5.2, 40, 1, true), m);
   cone.position.set(g.position.x, 3.1, g.position.z); scene.add(cone); g.userData.cone = cone;});
 }
 // dust in the air catches the screen light
 const pts = new Float32Array(900); for (let i = 0; i < 900; i += 3) {pts[i] = (Math.random() - .5) * 18; pts[i + 1] = Math.random() * 5; pts[i + 2] = (Math.random() - .5) * 12 - 1;}
 const dust = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pts, 3)), new THREE.PointsMaterial({color: 0x8f9fff, size: .025, transparent: true, opacity: .5}));
 scene.add(dust);

 // where the camera ends up when it flies into the hero cabinet: square on to its screen, close enough to fill the view
 scene.updateMatrixWorld(true);
 const mid = hero.userData.screen, look = new THREE.Vector3(), n = new THREE.Vector3(0, 0, 1);
 mid.geometry.computeBoundingBox(); mid.geometry.boundingBox.getCenter(look); mid.localToWorld(look);
 n.applyQuaternion(mid.getWorldQuaternion(new THREE.Quaternion()));
 const target = {pos: look.clone().addScaledVector(n, .66), look};

 // a reflection map for the shiny parts: a dark room with a warm strip and cool panels, baked once
 const useRenderer = r => {
  const env = new THREE.Scene(), add = (c, w, h, x, y, z, ry = 0) => {const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({color: c, side: THREE.DoubleSide})); m.position.set(x, y, z); m.rotation.y = ry; env.add(m);};
  env.background = new THREE.Color(0x07080d);
  add(0xffb38a, 6, .6, 0, 3, -4); add(0x5f7dff, 3, 5, -4, 1, 0, Math.PI / 2); add(0x5f7dff, 3, 5, 4, 1, 0, -Math.PI / 2); add(0xffffff, 2, 2, 0, 1, 5); add(0xff4d00, 8, .3, 0, -1, -4);
  const pm = new THREE.PMREMGenerator(r), t = pm.fromScene(env, .02).texture; pm.dispose();
  for (const m of kit.envMats) {m.envMap = t; m.envMapIntensity = .9; m.needsUpdate = true;}};

 const tick = t => {dust.rotation.y = t * .00002; dust.position.y = Math.sin(t * .0004) * .05; if (liveTex) liveTex.needsUpdate = true; kit.tick(t);
  // neon hums and the odd letter stutters; the hero's halo breathes
  for (const s of neons) s.m.material.opacity = s.flick ? (Math.sin(t * .0131) > .985 ? .55 : .92 + Math.sin(t * .05) * .04) : .95;
  halo.material.opacity = .6 + Math.sin(t * .002) * .25;};
 return {scene, cam, start, target, cabinets, rear, dust, tick, useRenderer};
}
