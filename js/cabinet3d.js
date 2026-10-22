/* A detailed upright arcade cabinet for the front-page arcade room (js/arcade-scene.js).
   Side panels with printed art and T-molding round the edge, a two-player control panel with ball-top joysticks
   and domed buttons over a printed overlay, a curved CRT behind glass and an art bezel, a speaker visor, a backlit
   marquee in chrome retainers, and a coin door with lit slots. Every static part is merged into one mesh per
   material and that geometry is shared by every cabinet, so a whole cabinet costs about twenty draw calls.
   cabinetKit(THREE) returns {build(opts), envMats}; build({side, accent, art, marquee, screen, hero, lite}) returns
   a Group with userData {mq, screen}. envMats are the shiny materials that want the room's reflection map. */
export function cabinetKit(THREE) {
 const W = 1.52, T = .07, hw = W / 2 - T;
 // side profile (z forward, y up): kick plate, sloped panel underside, panel lip, deck, leaning screen, speaker visor,
 // marquee box, rounded back top
 const PROF = [[-.62,0],[.44,0],[.44,1.0],[.82,1.12],[.84,1.16],[.84,1.22],[.81,1.25],[.40,1.38],[.24,2.40],[.47,2.5],[.5,2.54],[.5,2.98],[-.48,2.98],[-.58,2.94],[-.62,2.84]];
 const tex = (w, h, draw) => {const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;};
 const hex = n => '#' + n.toString(16).padStart(6, '0');
 const rng = s => () => (s = (s * 16807) % 2147483647) / 2147483647;

 // ---- printed artwork ----
 // side art: a deep wash in the side colour, three sweeping stripes, a sliced synth sun and pixel stars. No text, so
 // the mirrored far side reads the same.
 const sideArt = (col, acc, seed) => tex(512, 1024, (x, w, h) => {
  const g = x.createLinearGradient(0, 0, w * .3, h); g.addColorStop(0, hex(col)); g.addColorStop(1, '#07080d'); x.fillStyle = g; x.fillRect(0, 0, w, h);
  const r = rng(seed * 97 + 3);
  x.fillStyle = 'rgba(255,255,255,.9)'; for (let i = 0; i < 70; i++) {const s = r() < .15 ? 6 : 3; x.globalAlpha = .25 + r() * .6; x.fillRect(r() * w | 0, r() * h * .7 | 0, s, s);}
  x.globalAlpha = 1;
  // the sun, cut by horizontal slits, sits behind the stripes
  const sx = w * .46, sy = h * .2, sr = 100, sg = x.createLinearGradient(0, sy - sr, 0, sy + sr); sg.addColorStop(0, '#e8a35a'); sg.addColorStop(1, hex(acc));
  x.save(); x.beginPath(); x.arc(sx, sy, sr, 0, Math.PI * 2); x.clip(); x.fillStyle = sg; x.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
  x.fillStyle = hex(col); for (let k = 0; k < 7; k++) x.fillRect(sx - sr, sy + k * 22 - 4, sr * 2, 3 + k * 1.6); x.restore();
  const bands = [[acc, 46], ['#eceae3', 18], [col === 0x2443ff ? 0xff4d00 : 0x2443ff, 30]];
  let off = 0;
  for (const [c, bw] of bands) {x.fillStyle = typeof c === 'string' ? c : hex(c);
   x.beginPath(); x.moveTo(w + 40, h * .64 + off); x.bezierCurveTo(w * .55, h * .62 + off, w * .25, h * .42 + off, -40, h * .36 + off);
   x.lineTo(-40, h * .36 + off + bw); x.bezierCurveTo(w * .25, h * .42 + off + bw, w * .55, h * .62 + off + bw, w + 40, h * .64 + off + bw); x.fill(); off += bw + 12;}
  // pixel invader near the base, and a faint grid that runs into the floor
  const inv = ['00100000100','00010001000','00111111100','01101110110','11111111111','10111111101','10100000101','00011011000'];
  x.fillStyle = 'rgba(236,234,227,.85)'; inv.forEach((row, j) => [...row].forEach((b, i) => b === '1' && x.fillRect(w * .5 - 77 + i * 14, h * .8 + j * 14, 13, 13)));
  x.strokeStyle = 'rgba(143,159,255,.12)'; x.lineWidth = 2; for (let y = h * .9; y < h; y += 14) {x.beginPath(); x.moveTo(0, y); x.lineTo(w, y); x.stroke();}
 });
 // the control-panel overlay, laid out under the joysticks and buttons (canvas top = back edge of the panel)
 const DECK = {z: .61, y: 1.31, a: Math.atan2(.14, .42), L: Math.hypot(.14, .42)};
 const BTN = [[0, -.065, 0xff4d00], [1, -.075, 0xffc234], [2, -.07, 0x19c37d], [0, .035, 0x2443ff], [1, .025, 0xeceae3], [2, .03, 0xd23cff]];
 const PLAYERS = [{stick: -.56, b0: -.42, ball: 0xff3b1f}, {stick: .2, b0: .34, ball: 0x2f55ff}];
 const cpArt = tex(1024, 336, (x, w, h) => {
  const U = v => (v + hw) / (2 * hw) * w, V = z => (z + DECK.L / 2) / DECK.L * h;
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1b2036'); g.addColorStop(1, '#0b0d16'); x.fillStyle = g; x.fillRect(0, 0, w, h);
  x.fillStyle = 'rgba(36,67,255,.55)'; x.beginPath(); x.moveTo(0, h * .72); x.lineTo(w, h * .5); x.lineTo(w, h * .62); x.lineTo(0, h * .84); x.fill();
  x.fillStyle = 'rgba(255,77,0,.6)'; x.beginPath(); x.moveTo(0, h * .87); x.lineTo(w, h * .65); x.lineTo(w, h * .69); x.lineTo(0, h * .91); x.fill();
  x.font = '22px "PA Pixel", monospace'; x.textAlign = 'center'; x.textBaseline = 'middle';
  PLAYERS.forEach((p, k) => {
   // a printed gate ring round the stick and rings under every button
   x.strokeStyle = 'rgba(236,234,227,.5)'; x.lineWidth = 3; x.beginPath(); x.arc(U(p.stick), V(-.015), 52, 0, Math.PI * 2); x.stroke();
   x.fillStyle = 'rgba(236,234,227,.35)'; for (let a = 0; a < 8; a++) {const t = a * Math.PI / 4; x.fillRect(U(p.stick) + Math.cos(t) * 62 - 3, V(-.015) + Math.sin(t) * 62 - 3, 6, 6);}
   for (const [c, z, col] of BTN) {x.fillStyle = 'rgba(0,0,0,.45)'; x.beginPath(); x.arc(U(p.b0 + c * .1), V(z), 30, 0, Math.PI * 2); x.fill();
    x.strokeStyle = hex(col); x.globalAlpha = .55; x.lineWidth = 2; x.beginPath(); x.arc(U(p.b0 + c * .1), V(z), 33, 0, Math.PI * 2); x.stroke(); x.globalAlpha = 1;}
   x.fillStyle = '#eceae3'; x.fillText(k ? '2 PLAYER' : '1 PLAYER', U(p.b0 + .1), V(.105));
  });
  x.fillStyle = '#ff7a3d'; x.fillText('START', U(0), V(-.115)); x.font = '15px "PA Pixel", monospace'; x.fillStyle = 'rgba(236,234,227,.7)'; x.fillText('PIXEL ARCADE', U(0), V(.075));
  // screw heads in the corners
  x.fillStyle = '#c7cbd6'; for (const [a, b] of [[20, 20], [w - 20, 20], [20, h - 20], [w - 20, h - 20]]) {x.beginPath(); x.arc(a, b, 7, 0, 7); x.fill();}
 });
 // the bezel round the tube: black glass with neon corner brackets, a score strip and small print
 const SCR = {w: 1.12, h: .84, up: .035};
 const bezelArt = tex(1024, 768, (x, w, h) => {
  x.fillStyle = '#05060b'; x.fillRect(0, 0, w, h);
  const sw = SCR.w / (2 * hw) * w, sh = SCR.h / 1.03 * h, cx = w / 2, cy = h / 2 - SCR.up / 1.03 * h;
  const g = x.createRadialGradient(cx, cy, sh * .4, cx, cy, w * .7); g.addColorStop(0, '#141a33'); g.addColorStop(1, '#05060b'); x.fillStyle = g; x.fillRect(0, 0, w, h);
  x.strokeStyle = '#ff4d00'; x.lineWidth = 5; x.shadowColor = '#ff4d00'; x.shadowBlur = 14;
  const m = 26, bx = cx - sw / 2 - m, by = cy - sh / 2 - m, bw = sw + m * 2, bh = sh + m * 2, k = 60;
  for (const [px, py, dx, dy] of [[bx, by, 1, 1], [bx + bw, by, -1, 1], [bx, by + bh, 1, -1], [bx + bw, by + bh, -1, -1]]) {x.beginPath(); x.moveTo(px + dx * k, py); x.lineTo(px, py); x.lineTo(px, py + dy * k); x.stroke();}
  x.shadowBlur = 0; x.fillStyle = '#000'; x.fillRect(cx - sw / 2 - 8, cy - sh / 2 - 8, sw + 16, sh + 16);
  x.font = '20px "PA Pixel", monospace'; x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillStyle = '#8f9fff'; x.fillText('1UP', bx, by - 22);
  x.textAlign = 'center'; x.fillStyle = '#ff7a3d'; x.fillText('HIGH SCORE', cx, by - 22); x.textAlign = 'right'; x.fillStyle = '#8f9fff'; x.fillText('2UP', bx + bw, by - 22);
  x.textAlign = 'center'; x.font = '15px "PA Pixel", monospace'; x.fillStyle = 'rgba(236,234,227,.55)'; x.fillText('1 OR 2 PLAYERS  ·  EVERY ROUND ENDS ON THE CLOCK', cx, by + bh + 22);
 });
 // the speaker visor: two round grilles drilled in a black panel
 const spkArt = tex(512, 96, (x, w, h) => {x.fillStyle = '#0b0d14'; x.fillRect(0, 0, w, h);
  for (const cx of [w * .2, w * .8]) {x.fillStyle = '#000'; x.beginPath(); x.arc(cx, h / 2, 40, 0, 7); x.fill(); x.fillStyle = '#2a3045';
   for (let yy = -36; yy <= 36; yy += 7) for (let xx = -36; xx <= 36; xx += 7) if (xx * xx + yy * yy < 34 * 34) {x.beginPath(); x.arc(cx + xx, h / 2 + yy, 2, 0, 7); x.fill();}}
  x.fillStyle = 'rgba(236,234,227,.4)'; x.font = '14px "PA Pixel", monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('STEREO SOUND', w / 2, h / 2);});
 // the coin door: brushed steel with two lit slots, price plates and coin-return flaps
 const coinArt = tex(512, 448, (x, w, h) => {
  x.fillStyle = '#3a3f4b'; x.fillRect(0, 0, w, h); const r = rng(11);
  for (let i = 0; i < 900; i++) {x.fillStyle = `rgba(255,255,255,${r() * .06})`; x.fillRect(0, r() * h, w, 1);}
  x.strokeStyle = 'rgba(0,0,0,.6)'; x.lineWidth = 6; x.strokeRect(10, 10, w - 20, h - 20); x.strokeStyle = 'rgba(255,255,255,.15)'; x.lineWidth = 2; x.strokeRect(16, 16, w - 32, h - 32);
  for (const cx of [w * .3, w * .7]) {
   x.fillStyle = '#20232b'; x.fillRect(cx - 52, 50, 104, 170); x.fillStyle = '#7b1d00'; x.fillRect(cx - 40, 62, 80, 64);
   x.fillStyle = '#ffb38a'; x.font = '26px "PA Pixel", monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('25¢', cx, 94);
   x.fillStyle = '#000'; x.fillRect(cx - 5, 140, 10, 62);
   x.fillStyle = '#20232b'; x.fillRect(cx - 44, 290, 88, 70); x.fillStyle = '#0c0d11'; x.fillRect(cx - 32, 302, 64, 46);}
  x.fillStyle = 'rgba(236,234,227,.7)'; x.font = '18px "PA Pixel", monospace'; x.fillText('1 COIN  1 CREDIT', w / 2, 250);
  x.fillStyle = '#16181e'; x.beginPath(); x.arc(w / 2, 400, 14, 0, 7); x.fill(); x.fillStyle = '#c7cbd6'; x.fillRect(w / 2 - 2, 392, 4, 16);
  for (const [a, b] of [[30, 30], [w - 30, 30], [30, h - 30], [w - 30, h - 30]]) {x.fillStyle = '#9aa0ad'; x.beginPath(); x.arc(a, b, 6, 0, 7); x.fill();}
 });
 // only the price plates glow
 const coinGlow = tex(512, 448, (x, w) => {x.fillStyle = '#000'; x.fillRect(0, 0, w, 448); for (const cx of [w * .3, w * .7]) {x.fillStyle = '#ff4d00'; x.fillRect(cx - 40, 62, 80, 64);
  x.fillStyle = '#ffd2b8'; x.font = '26px "PA Pixel", monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('25¢', cx, 94);}});
 // a soft diagonal sheen for the glass over the tube
 const glassArt = tex(256, 256, (x, w, h) => {const g = x.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.3, 'rgba(255,255,255,0)'); g.addColorStop(.38, 'rgba(255,255,255,.55)'); g.addColorStop(.46, 'rgba(255,255,255,.08)');
  g.addColorStop(.6, 'rgba(255,255,255,0)'); g.addColorStop(.66, 'rgba(255,255,255,.22)'); g.addColorStop(.7, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h);});
 glassArt.colorSpace = THREE.NoColorSpace;

 // ---- materials ----
 const std = (o) => new THREE.MeshStandardMaterial(o), envMats = [];
 const shiny = m => (envMats.push(m), m);
 const M = {
  body: std({color: 0x10131c, roughness: .55, metalness: .1}),
  black: std({color: 0x07080c, roughness: .35, metalness: .2}),
  chrome: shiny(std({color: 0xd9dde6, roughness: .18, metalness: 1})),
  steel: shiny(std({color: 0x8a90a0, roughness: .35, metalness: .9})),
  cp: shiny(new THREE.MeshPhysicalMaterial({map: cpArt, roughness: .35, clearcoat: 1, clearcoatRoughness: .15})),
  bezel: shiny(new THREE.MeshPhysicalMaterial({map: bezelArt, roughness: .2, clearcoat: 1, clearcoatRoughness: .05, emissive: 0xffffff, emissiveMap: bezelArt, emissiveIntensity: .35})),
  spk: std({map: spkArt, roughness: .7}),
  coin: shiny(std({map: coinArt, roughness: .45, metalness: .6, emissive: 0xffffff, emissiveMap: coinGlow, emissiveIntensity: 2})),
  startL: std({color: 0x333333, emissive: 0xfff2dc, emissiveIntensity: 1.6}),
  glass: new THREE.MeshBasicMaterial({map: glassArt, transparent: true, opacity: .09, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false}),
  // buttons, their bezels and the ball tops are coloured per vertex, so all of them draw in three calls
  btn: shiny(new THREE.MeshPhysicalMaterial({vertexColors: true, roughness: .22, clearcoat: 1, clearcoatRoughness: .08})),
  ring: std({vertexColors: true, roughness: .4}),
  ball: shiny(new THREE.MeshPhysicalMaterial({vertexColors: true, roughness: .15, clearcoat: 1, clearcoatRoughness: .05}))
 };

 // ---- geometry: merged once per material and shared by every cabinet ----
 const merge = parts => {
  let n = 0; const gs = parts.map(({g, m}) => {const x = g.index ? g.toNonIndexed() : g.clone(); x.applyMatrix4(m); n += x.attributes.position.count; return x;});
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2), col = parts[0].c != null && new Float32Array(n * 3); let o = 0;
  gs.forEach((x, i) => {const k = x.attributes.position.count; pos.set(x.attributes.position.array, o * 3); nor.set(x.attributes.normal.array, o * 3); if (x.attributes.uv) uv.set(x.attributes.uv.array, o * 2);
   if (col) {const c = new THREE.Color(parts[i].c); for (let j = 0; j < k; j++) c.toArray(col, (o + j) * 3);} o += k; x.dispose();});
  const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  if (col) out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  out.computeBoundingSphere(); return out;};
 const o3 = new THREE.Object3D();
 const at = (x, y, z, rx = 0, ry = 0, rz = 0, s = [1, 1, 1], parent) => {o3.position.set(x, y, z); o3.rotation.set(rx, ry, rz); o3.scale.set(...s); o3.updateMatrix(); return parent ? parent.clone().multiply(o3.matrix) : o3.matrix.clone();};
 const parts = {}; const add = (k, g, m, c) => (parts[k] || (parts[k] = [])).push({g, m, c});
 const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);

 // side panels (one geometry, placed twice) with the art on their faces; their uvs are shape coordinates
 const shape = new THREE.Shape(PROF.map(p => new THREE.Vector2(p[0], p[1])));
 const sideGeo = new THREE.ExtrudeGeometry(shape, {depth: T, bevelEnabled: true, bevelSize: .008, bevelThickness: .008, bevelSegments: 2, curveSegments: 4});
 sideGeo.rotateY(-Math.PI / 2);
 // T-molding: a tube round each panel's edge, sampled densely so corners stay crisp
 const ring = []; for (let i = 0; i < PROF.length; i++) {const a = PROF[i], b = PROF[(i + 1) % PROF.length], n = Math.max(2, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / .05));
  for (let k = 0; k < n; k++) ring.push(new THREE.Vector3(0, a[1] + (b[1] - a[1]) * k / n, a[0] + (b[0] - a[0]) * k / n));}
 const tubeGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ring, true, 'catmullrom', .05), 420, .021, 6, true);
 const trimParts = [{g: tubeGeo, m: at(hw + T / 2, 0, 0)}, {g: tubeGeo, m: at(-hw - T / 2, 0, 0)}];
 // the carcass between the panels
 add('body', box(2 * hw, 2.92, .04), at(0, 1.46, -.6));                         // back
 add('body', box(2 * hw, .04, 1.1), at(0, 2.96, -.06));                         // top
 add('body', box(2 * hw, 1.0, .04), at(0, .5, .42));                            // kick panel
 add('body', box(2 * hw, .04, Math.hypot(.38, .12)), at(0, 1.06, .63, -Math.atan2(.12, .38)));   // panel underside
 add('steel', box(2 * hw, .09, .02), at(0, .055, .45));                         // kick plate
 add('black', box(2 * hw, .12, .04), at(0, 1.18, .82));                         // panel lip face
 add('black', new THREE.CylinderGeometry(.03, .03, 2 * hw, 16), at(0, 1.235, .815, 0, 0, Math.PI / 2));   // rounded lip edge
 for (const [x, z] of [[-.66, -.52], [.66, -.52], [-.66, .36], [.66, .36]]) add('steel', new THREE.CylinderGeometry(.045, .05, .03, 14), at(x, .015, z));   // levelers
 // coin door with lit slots and a lock
 add('steel', box(.6, .54, .03), at(0, .62, .45)); add('coin', new THREE.PlaneGeometry(.56, .49), at(0, .62, .467));
 for (const x of [-.112, .112]) {add('chrome', box(.1, .012, .012), at(x, .807, .472)); add('chrome', box(.014, .066, .008), at(x, .678, .472));}
 // the deck, with its overlay and the controls in its sloped frame
 const deck = at(0, DECK.y, DECK.z, DECK.a);
 add('body', box(2 * hw, .05, DECK.L + .01), at(0, -.026, 0, 0, 0, 0, [1, 1, 1], deck));
 add('cp', new THREE.PlaneGeometry(2 * hw, DECK.L), at(0, .001, 0, -Math.PI / 2, 0, 0, [1, 1, 1], deck));
 const cap = new THREE.SphereGeometry(.027, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), bez = new THREE.CylinderGeometry(.036, .038, .014, 22);
 PLAYERS.forEach(p => {
  for (const [c, z, col] of BTN) {add('ring', bez, at(p.b0 + c * .1, .007, z, 0, 0, 0, [1, 1, 1], deck), new THREE.Color(col).multiplyScalar(.5).getHex()); add('btn', cap, at(p.b0 + c * .1, .011, z, 0, 0, 0, [1, .55, 1], deck), col);}
  add('black', new THREE.CylinderGeometry(.062, .062, .006, 26), at(p.stick, .003, -.015, 0, 0, 0, [1, 1, 1], deck));        // dust washer
  add('chrome', new THREE.CylinderGeometry(.011, .013, .13, 10), at(p.stick, .065, -.015, 0, 0, 0, [1, 1, 1], deck));       // shaft
  add('ball', new THREE.SphereGeometry(.044, 24, 16), at(p.stick, .135, -.015, 0, 0, 0, [1, 1, 1], deck), p.ball);});
 for (const x of [-.045, .045]) add('startL', box(.05, .014, .032), at(x, .007, -.075, 0, 0, 0, [1, 1, 1], deck));
 // the leaning screen: bezel art, then the tube and glass in front of it (the tube is per cabinet, see build)
 const tilt = Math.atan2(.16, 1.02), scrF = at(0, 1.89, .32, -tilt);
 add('bezel', new THREE.PlaneGeometry(2 * hw, 1.035), scrF);
 add('black', box(2 * hw, .03, .07), at(0, .53, .02, 0, 0, 0, [1, 1, 1], scrF));   // shroud lip over the top of the glass
 add('glass', new THREE.PlaneGeometry(2 * hw - .02, 1.0), at(0, 0, .03, 0, 0, 0, [1, 1, 1], scrF));
 // speaker visor and the marquee box with chrome retainers
 add('spk', new THREE.PlaneGeometry(2 * hw, Math.hypot(.24, .1)), at(0, 2.45, .36, Math.atan2(.24, .1)));
 add('body', box(2 * hw, .44, .2), at(0, 2.76, .39));
 for (const y of [2.555, 2.955]) add('chrome', box(2 * hw + .01, .026, .03), at(0, y, .505));
 const GEO = {}; for (const k in parts) GEO[k] = merge(parts[k]);
 const TRIM = merge(trimParts), SIDE = sideGeo;
 // the tube: a gently domed plane; CRT shader below
 const tubeG = new THREE.PlaneGeometry(SCR.w, SCR.h, 18, 14); {const p = tubeG.attributes.position;
  for (let i = 0; i < p.count; i++) {const u = p.getX(i) / (SCR.w / 2), v = p.getY(i) / (SCR.h / 2); p.setZ(i, .028 * (1 - u * u * .8) * (1 - v * v * .8));} tubeG.computeVertexNormals();}
 const tubeM = at(0, SCR.up, .004, 0, 0, 0, [1, 1, 1], scrF);
 const lite = new Set(['ring', 'btn', 'ball', 'startL', 'cp', 'glass', 'coin']);

 // scanlines that fade out with distance (no moire), a slight barrel and bleed, rounded corners and a rolling band
 const crtV = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }';
 const crtF = `uniform sampler2D map; uniform float uT, uB; varying vec2 vUv;
  void main(){ vec2 q = vUv * 2. - 1.; q *= 1. + dot(q, q) * .04; vec2 uv = q * .5 + .5;
   vec3 c = texture2D(map, uv).rgb * .8 + texture2D(map, uv + vec2(.0025, 0.)).rgb * .2;
   float lines = 300., a = .28 * clamp(1. - fwidth(uv.y) * lines * 1.6, 0., 1.);
   c *= 1. - a + a * (.5 + .5 * sin(uv.y * lines * 6.2832));
   c *= 1. + .05 * sin(uv.y * 5. - uT * .0016);
   vec2 e = abs(q); float corner = 1. - smoothstep(.0, .025, length(max(e - vec2(.95, .93), 0.)) - .02);
   float vig = pow(clamp(16. * uv.x * uv.y * (1. - uv.x) * (1. - uv.y), 0., 1.), .22);
   gl_FragColor = vec4((c * 1.35 * vig + vec3(.012, .018, .03)) * corner * uB, 1.);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }`;
 const crts = [];
 const crt = (map, b) => {const m = new THREE.ShaderMaterial({vertexShader: crtV, fragmentShader: crtF, uniforms: {map: {value: map}, uT: {value: 0}, uB: {value: b}}}); crts.push(m); return m;};
 const sideMats = new Map();

 // build({side, accent, marquee, screen, dim, hero, lite}): side colour, T-molding/stripe colour, marquee texture,
 // screen texture, screen brightness, hero (glowing trim) and lite (drop the small parts on far cabinets)
 function build({side = 0x2443ff, accent = 0xff4d00, marquee, screen, dim = 1, hero = false, lite: far = false, seed = 1} = {}) {
  const g = new THREE.Group();
  const key = side + ':' + accent;
  if (!sideMats.has(key)) {const art = sideArt(side, accent, seed); art.repeat.set(1 / 1.46, 1 / 2.98); art.offset.set(.62 / 1.46, 0);
   sideMats.set(key, [std({map: art, roughness: .4, metalness: .05}), std({color: 0x0b0d14, roughness: .5})]);}
  const sm = sideMats.get(key);
  for (const x of [hw + T, -hw]) {const s = new THREE.Mesh(SIDE, sm); s.position.x = x; g.add(s);}
  g.add(new THREE.Mesh(TRIM, hero ? std({color: accent, emissive: accent, emissiveIntensity: 1.4, roughness: .3}) : shiny(std({color: accent, roughness: .3, metalness: .5}))));
  // small parts are tagged so the floor reflection can leave them out
  for (const k in GEO) {if (far && lite.has(k)) continue; const m = new THREE.Mesh(GEO[k], M[k]); m.userData.small = lite.has(k); g.add(m);}
  const scr = new THREE.Mesh(tubeG, crt(screen, dim)); scr.applyMatrix4(tubeM); g.add(scr);
  const mq = new THREE.Mesh(new THREE.PlaneGeometry(2 * hw - .02, .37), new THREE.MeshBasicMaterial({map: marquee, toneMapped: false}));
  mq.position.set(0, 2.755, .492); g.add(mq);
  g.userData.mq = mq; g.userData.screen = scr;
  return g;
 }
 const tick = t => {for (const m of crts) m.uniforms.uT.value = t;};
 return {build, envMats, tick, W, tex};
}
