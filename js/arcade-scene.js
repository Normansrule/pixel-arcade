/* The arcade room: a ring of upright cabinets with real game screens on a polished floor.
   Shared by the front-page intro (js/intro.js) and the README header renderer (tools/readme_hero.html).
   arcadeScene(THREE, {base, ids, names, live}) returns {scene, cam, start, target, cabinets, dust, tick}.
   base: path prefix to the site root ('' or '../'). live: an optional canvas for the middle cabinet's screen. */
export const SCREENS = ['hoops','starrun','artillery','volley','boxing','bowling','penalty','spellcaster','darts','bounceball','roadagent','digger'];
export const NAMES = {hoops:'HOOPS 1 ON 1',starrun:'STAR RUN 3D',artillery:'ARTILLERY DUEL',volley:'BEACH VOLLEY',boxing:'RING BOXING',bowling:'BOWLING 3D',penalty:'PENALTY KICKS',spellcaster:'SPELL CASTER',darts:'DARTS 301',bounceball:'BOUNCE BALL',roadagent:'ROAD AGENT',digger:'TUNNEL DIGGER'};

export function arcadeScene(THREE, {base = '', ids = SCREENS, names = NAMES, live = null, aspect = 1.6, cones = false} = {}) {
 const scene = new THREE.Scene(), NIGHT = 0x0c0f17;
 scene.background = new THREE.Color(NIGHT); scene.fog = new THREE.Fog(NIGHT, 11, 30);
 const cam = new THREE.PerspectiveCamera(40, aspect, .1, 100);
 const start = {pos: new THREE.Vector3(-.4, 2.3, 10.6), look: new THREE.Vector3(1.5, 1.55, -2)};
 cam.position.copy(start.pos); cam.lookAt(start.look);

 scene.add(new THREE.HemisphereLight(0x8f9fff, 0x0c0f17, .35));
 const key = new THREE.DirectionalLight(0xffd2b0, 1.1); key.position.set(-6, 7, 9); scene.add(key);
 const rimL = new THREE.PointLight(0x3352ff, 60, 26); rimL.position.set(-5, 5, -5); scene.add(rimL);
 const rimR = new THREE.PointLight(0x3352ff, 70, 26); rimR.position.set(7, 5, -3); scene.add(rimR);
 // keep this light weak and high: near the mirrored floor it blooms into a red blob
 const warm = new THREE.PointLight(0xff4d00, 9, 14); warm.position.set(1.5, 2.4, 1.2); scene.add(warm);

 // floor: dark polished tiles with a faint cobalt grid that runs off into the fog
 const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({color: 0x161a26, roughness: .3, metalness: .4, transparent: true, opacity: .86}));
 floor.rotation.x = -Math.PI / 2; scene.add(floor);
 const grid = new THREE.GridHelper(80, 64, 0x3352ff, 0x3352ff); grid.material.transparent = true; grid.material.opacity = .16; grid.position.y = .002; scene.add(grid);

 const tl = new THREE.TextureLoader();
 const label = (txt, bg, fg) => {const c = document.createElement('canvas'); c.width = 512; c.height = 128; const x = c.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, 512, 128);
  x.fillStyle = 'rgba(255,255,255,.06)'; for (let i = 0; i < 512; i += 8) x.fillRect(i, 0, 2, 128);
  let size = 64; x.font = size + 'px "PA Pixel"'; while (x.measureText(txt).width > 460 && size > 24) {size -= 4; x.font = size + 'px "PA Pixel"';}
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = fg; x.fillText(txt, 256, 70);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;};

 // the side profile of an upright cabinet: kick plate, control-panel ledge, a screen that leans back, marquee overhang
 const prof = new THREE.Shape([[-.62,0],[.46,0],[.46,1.02],[.78,1.16],[.74,1.3],[.36,1.38],[.2,2.46],[.44,2.56],[.44,2.98],[-.62,2.98]].map(p => new THREE.Vector2(p[0], p[1])));
 const sideGeo = new THREE.ExtrudeGeometry(prof, {depth: .08, bevelEnabled: true, bevelSize: .012, bevelThickness: .012, bevelSegments: 2});
 const SIDES = [0x2443ff, 0xdcd8cd, 0x1d2231, 0x2443ff, 0xff4d00, 0xdcd8cd];
 const tilt = Math.atan2(.16, 1.08), sy = 1.92, sz = .27;
 let liveTex = null;
 function cabinet(i, id, far, useLive) {
  const g = new THREE.Group(), sideCol = SIDES[i % SIDES.length];
  const sideM = new THREE.MeshStandardMaterial({color: sideCol, roughness: .45, metalness: .1});
  for (const sx of [-.8, .72]) {const s = new THREE.Mesh(sideGeo, sideM); s.rotation.y = -Math.PI / 2; s.position.x = sx + .08; g.add(s);}
  const body = new THREE.MeshStandardMaterial({color: 0x151925, roughness: .6, metalness: .15});
  const box = (w, h, d, m, x, y, z, rx = 0) => {const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.rotation.x = rx; g.add(b); return b;};
  box(1.52, 2.98, .9, body, 0, 1.49, -.17);                  // the cabinet's back and top
  box(1.52, 1.02, .06, body, 0, .51, .43);                   // front panel
  const coin = new THREE.MeshStandardMaterial({color: 0x0a0c12, emissive: 0xff4d00, emissiveIntensity: 1.6});
  box(.05, .16, .02, coin, -.16, .62, .47); box(.05, .16, .02, coin, .16, .62, .47);   // glowing coin slots
  box(1.52, .1, .5, new THREE.MeshStandardMaterial({color: 0x0f1219, roughness: .4}), 0, 1.2, .56, .18);
  // buttons and a ball-top joystick on the control panel
  [[-.05,0xff4d00],[.17,0x2443ff],[.39,0xdcd8cd],[.07,0xff4d00],[.29,0x2443ff]].forEach(([x, c], k) => {const b = new THREE.Mesh(new THREE.CylinderGeometry(.055, .055, .05, 20), new THREE.MeshStandardMaterial({color: c, emissive: c, emissiveIntensity: .35, roughness: .3})); b.position.set(x, 1.27 - (k > 2 ? .02 : 0), .5 + (k > 2 ? .12 : 0)); b.rotation.x = .18; g.add(b);});
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, .22, 10), new THREE.MeshStandardMaterial({color: 0x222631})); stick.position.set(-.42, 1.3, .62); g.add(stick);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(.075, 20, 14), new THREE.MeshStandardMaterial({color: 0xff4d00, roughness: .25})); ball.position.set(-.42, 1.42, .62); g.add(ball);
  // the screen leans back with the profile; a black bezel frames the game
  box(1.5, 1.1, .04, new THREE.MeshStandardMaterial({color: 0x05060a, roughness: .2, metalness: .3}), 0, sy, sz, -tilt);
  let tex;
  if (useLive) {tex = liveTex = new THREE.CanvasTexture(live);}
  else tex = tl.load(base + 'docs/thumbs/' + id + '.jpg');
  tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = THREE.NearestFilter;
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.32, .99), new THREE.MeshBasicMaterial({map: tex, toneMapped: false, color: far ? 0x8088a0 : 0xffffff}));
  scr.position.set(0, sy, sz + .03); scr.rotation.x = -tilt; g.add(scr); g.userData.screen = scr;
  // the marquee: a backlit sign with the game's name in the engine's pixel lettering
  const mq = new THREE.Mesh(new THREE.PlaneGeometry(1.5, .38), new THREE.MeshBasicMaterial({map: label(useLive ? 'INSERT COIN' : names[id] || id.toUpperCase(), i % 2 ? '#1b33cc' : '#141823', i % 2 ? '#eceae3' : '#ff7a3d'), toneMapped: false}));
  mq.position.set(0, 2.77, .455); g.add(mq);
  g.userData.mq = mq; g.userData.id = useLive ? null : id; g.userData.live = !!useLive;
  // each screen throws a little light onto the floor and the player's spot
  if (!far) {const glow = new THREE.PointLight(0x8f9fff, 5, 4.5); glow.position.set(0, 1.7, 1.3); g.add(glow);}
  return g;
 }
 // a ring of cabinets facing outwards: the middle one faces you, the ones round the sides turn away and show
 // their printed side panels. A dimmer second ring sits behind.
 const front = ids.slice(0, 7), back = ids.slice(7);
 const ring = new THREE.Group(), cabinets = []; scene.add(ring);
 const C = new THREE.Vector3(2.5, 0, -4.4);
 front.forEach((id, i) => {const a = (i - 3) * .42 + .08, R = 5.4, g = cabinet(i, id, false, live && i === 3); g.position.set(C.x + Math.sin(a) * R, 0, C.z + Math.cos(a) * R); g.rotation.y = a; ring.add(g); cabinets.push(g);});
 const rear = [];
 back.forEach((id, i) => {const a = (i - 2) * .5 + .3, R = 9.5, g = cabinet(i + 3, id, true); g.position.set(C.x + Math.sin(a) * R - 1, 0, C.z + Math.cos(a) * R - 6.5); g.rotation.y = a * .6; ring.add(g); rear.push(g);});
 // polished floor: a mirrored copy of the room under the tinted, slightly see-through floor
 const mirror = ring.clone(); mirror.scale.y = -1; scene.add(mirror);
 // light cones: a soft shaft from the ceiling onto each front cabinet, brightest at the top (added after the mirror
 // copy so the floor doesn't double them)
 if (cones) {
  // brightest at the ceiling and where you look straight through the shaft, fading to nothing at its edges and the floor
  const vert = 'varying vec3 vN; varying vec3 vV; varying float vY; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); vY = position.y / 5.2 + .5; gl_Position = projectionMatrix * mv; }';
  const frag = 'uniform vec3 uC; uniform float uO; varying vec3 vN; varying vec3 vV; varying float vY; void main(){ float f = pow(abs(dot(normalize(vN), normalize(vV))), 2.2); float g = pow(clamp(vY, 0., 1.), 1.8); gl_FragColor = vec4(uC * f * g * uO, 1.); }';
  cabinets.forEach((g, i) => {
   const m = new THREE.ShaderMaterial({vertexShader: vert, fragmentShader: frag, uniforms: {uC: {value: new THREE.Color(i === 3 ? 0xffb38a : 0x8f9fff)}, uO: {value: .22}},
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide});
   const cone = new THREE.Mesh(new THREE.CylinderGeometry(.1, 1.3, 5.2, 40, 1, true), m);
   cone.position.set(g.position.x, 3.25, g.position.z); scene.add(cone); g.userData.cone = cone;});
 }
 // dust in the air catches the screen light
 const pts = new Float32Array(900); for (let i = 0; i < 900; i += 3) {pts[i] = (Math.random() - .5) * 18; pts[i + 1] = Math.random() * 5; pts[i + 2] = (Math.random() - .5) * 12 - 1;}
 const dust = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pts, 3)), new THREE.PointsMaterial({color: 0x8f9fff, size: .025, transparent: true, opacity: .5}));
 scene.add(dust);

 // where the camera ends up when it flies into the middle cabinet: square on to its screen, close enough to fill the view
 scene.updateMatrixWorld(true);
 const mid = cabinets[3].userData.screen, look = new THREE.Vector3(), n = new THREE.Vector3(0, 0, 1);
 mid.getWorldPosition(look); n.applyQuaternion(mid.getWorldQuaternion(new THREE.Quaternion()));
 const target = {pos: look.clone().addScaledVector(n, .62), look};

 const tick = t => {dust.rotation.y = t * .00002; dust.position.y = Math.sin(t * .0004) * .05; if (liveTex) liveTex.needsUpdate = true;};
 return {scene, cam, start, target, cabinets, rear, dust, tick};
}
