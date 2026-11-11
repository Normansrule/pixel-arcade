/* The front-page intro: the README's arcade room, live. Scrolling flies the camera into the middle cabinet's screen
   (which shows the console's attract demo), while the title lifts away and five story chapters take the stage one
   at a time (each holds still long enough to read, with a chapter rail on the right), then the room fades into
   the console stage below. Three.js loads only on a wide screen with WebGL, without reduced motion or
   data saver; everyone else gets the still render (docs/intro.jpg) with the same scroll timeline in CSS. */
const intro = document.getElementById('intro');
const RM = matchMedia('(prefers-reduced-motion: reduce)');
const B = window.PA_BOOT || {set() {}, wait() {}, done() {}};
if (intro && !RM.matches) {
 intro.classList.add('scrub');
 const lines = [...intro.querySelectorAll('.story li')], rail = document.getElementById('srail'), dots = rail ? [...rail.querySelectorAll('button')] : [];
 const smooth = (a, b, x) => {const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t);};
 // the title lifts away first, then each chapter owns an equal slice of the scroll: it rises in over the first
 // fifth, holds still for the middle three fifths (about half a screen of scrolling) and leaves over the last fifth
 const T0 = .09, T1 = .94, N = lines.length || 1, SL = (T1 - T0) / N;
 let p = 0, view = null, cur = -1;
 const measure = () => {
  const r = intro.getBoundingClientRect(), span = r.height - innerHeight;
  p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
  intro.style.setProperty('--p', p.toFixed(4));
  let at = -1;
  lines.forEach((li, i) => {const t = (p - T0 - i * SL) / SL;
   const o = t < 0 || t > 1 ? 0 : t < .2 ? smooth(0, .2, t) : t > .8 ? 1 - smooth(.8, 1, t) : 1;
   li.style.setProperty('--o', o.toFixed(3)); li.style.setProperty('--y', (t < .5 ? 1 - o : o - 1).toFixed(3)); li.classList.toggle('on', o > .001);
   if (t >= 0 && t <= 1) at = i;});
  if (at !== cur) {cur = at; dots.forEach((d, i) => {d.classList.toggle('on', i === at); d.classList.toggle('done', at >= 0 && i < at);});}
  if (rail) rail.style.setProperty('--sp', Math.min(1, Math.max(0, (p - T0) / (T1 - T0))).toFixed(4));
  if (view) view.kick();
 };
 // the rail jumps to the middle of a chapter
 dots.forEach((d, i) => d.addEventListener('click', () => {const r = intro.getBoundingClientRect(), span = r.height - innerHeight;
  scrollTo({top: scrollY + r.top + span * (T0 + (i + .5) * SL), behavior: 'smooth'});}));
 addEventListener('scroll', measure, {passive: true}); addEventListener('resize', measure); measure();

 const gl = (() => {try {const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl'));} catch (e) {return false;}})();
 const save = navigator.connection && navigator.connection.saveData;
 // the boot screen (index.html) stays up until the room has loaded its textures and drawn its first frames
 if (gl && !save && innerWidth >= 720 && location.protocol !== 'file:') {B.wait('room'); start().catch(() => B.done('room'));}

 async function start() {
  const THREE = await import('../vendor/three.module.min.js');
  B.set(72, 'Wiring the arcade room');
  const [{EffectComposer}, {RenderPass}, {UnrealBloomPass}, {OutputPass}, {arcadeScene}] = await Promise.all([
   import('../vendor/jsm/postprocessing/EffectComposer.js'), import('../vendor/jsm/postprocessing/RenderPass.js'),
   import('../vendor/jsm/postprocessing/UnrealBloomPass.js'), import('../vendor/jsm/postprocessing/OutputPass.js'), import('./arcade-scene.js')]);
  await Promise.all(['64px "PA Pixel"', '64px Anton'].map(f => document.fonts.load(f))).catch(() => {});
  const cv = document.getElementById('introgl'), stage = cv.parentElement;
  const r = new THREE.WebGLRenderer({canvas: cv, antialias: true, powerPreference: 'high-performance'});
  let dpr = Math.min(devicePixelRatio || 1, 1.5);
  r.setPixelRatio(dpr); r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05; r.outputColorSpace = THREE.SRGBColorSpace;
  // fade the live room in over the still once every screen texture has arrived
  const shown = () => {B.set(90, 'Warming up'); intro.classList.add('gl'); if (matchMedia('(pointer: fine)').matches) intro.querySelector('.icue span').textContent = 'Click a cabinet to play, or scroll to insert coin'; if (view) view.kick();};
  THREE.DefaultLoadingManager.onLoad = shown;
  THREE.DefaultLoadingManager.onProgress = (u, n, total) => B.set(74 + 14 * n / total, 'Loading screens');
  const room = arcadeScene(THREE, {base: '', live: document.getElementById('cdemo'), cones: true});
  room.useRenderer(r);
  const {scene, cam, start: a, target: b} = room;
  const comp = new EffectComposer(r); comp.addPass(new RenderPass(scene, cam));
  const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), .4, .5, .86); comp.addPass(bloom); comp.addPass(new OutputPass());
  let useBloom = true;
  const size = () => {const w = stage.clientWidth, h = stage.clientHeight; r.setSize(w, h, false); comp.setPixelRatio(dpr); comp.setSize(w, h); cam.aspect = w / h;
   // keep the ring in frame on tall or narrow windows by widening the lens a little
   cam.fov = 40 * Math.max(1, 1.6 / cam.aspect) ** .6; cam.updateProjectionMatrix();};
  size(); addEventListener('resize', size);

  // a warm pool of light follows the pointer across the floor, like a torch in a dark arcade
  const spot = new THREE.SpotLight(0xffd9b8, 60, 26, .3, .9, 1.4); spot.position.set(1.2, 8, 5.5); scene.add(spot, spot.target);
  spot.target.position.set(2.5, 0, -1);
  // the cabinets are playable: hover lights the marquee and lifts the cabinet, a click starts its game.
  // The middle one is the console's demo, so it sends you down to the console instead.
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), aim = new THREE.Vector3(2.5, 0, -1);
  const pick = [...room.cabinets, ...room.rear], hint = document.getElementById('ihint');
  const gameOf = id => id && window.A && A.games && A.games.find(g => g.id === id);
  let hover = null;
  const setHover = g => {
   if (g === hover) return;
   if (hover) hover.userData.mq.material.color.setScalar(1);
   hover = g; stage.classList.toggle('picking', !!g);
   if (g) {g.userData.mq.material.color.setScalar(2.2); const gm = gameOf(g.userData.id);
    hint.textContent = g.userData.live ? 'Insert coin ↓ the console' : '▶ Play ' + (gm ? gm.name : g.userData.id.toUpperCase());}
   hint.hidden = !g;};
  const live = () => intro.classList.contains('gl') && p < .2 && inHub();
  stage.addEventListener('pointermove', e => {
   if (e.pointerType !== 'mouse') return;
   const rc = stage.getBoundingClientRect(); ndc.set((e.clientX - rc.left) / rc.width * 2 - 1, -(e.clientY - rc.top) / rc.height * 2 + 1);
   ray.setFromCamera(ndc, cam); if (ray.ray.intersectPlane(ground, aim)) aim.clamp(new THREE.Vector3(-6, 0, -14), new THREE.Vector3(10, 0, 6));
   let g = null;
   if (live()) {const h = ray.intersectObjects(pick, true)[0]; for (let o = h && h.object; o; o = o.parent) if (o.userData.mq) {g = o; break;}}
   setHover(g); hint.style.transform = `translate(${e.clientX - rc.left + 18}px,${e.clientY - rc.top + 18}px)`;});
  stage.addEventListener('pointerleave', () => setHover(null));
  stage.addEventListener('click', e => {
   if (!hover || e.target.closest('a,button')) return;
   const g = hover; setHover(null);
   if (g.userData.live) document.getElementById('deck').scrollIntoView({behavior: 'smooth', block: 'center'});
   else {const gm = gameOf(g.userData.id); if (gm && A.shelf) A.shelf.play(gm);}});
  // a little parallax from the pointer, fading out as the camera closes in on the screen
  const m = {x: 0, y: 0, tx: 0, ty: 0};
  addEventListener('pointermove', e => {m.tx = e.clientX / innerWidth - .5; m.ty = e.clientY / innerHeight - .5; if (view) view.kick();}, {passive: true});
  const pos = new THREE.Vector3(), look = new THREE.Vector3();
  let on = true, raf = 0, idle = 0, slow = 0, frames = 0, last = 0;
  const frame = t => {
   raf = 0; if (!on || document.hidden || !inHub()) return;
   m.x += (m.tx - m.x) * .06; m.y += (m.ty - m.y) * .06;
   const k = smooth(.06, .9, p), free = 1 - k;
   pos.lerpVectors(a.pos, b.pos, k); look.lerpVectors(a.look, b.look, smooth(0, .75, p));
   pos.x += m.x * .5 * free; pos.y -= m.y * .3 * free;
   cam.position.copy(pos); cam.lookAt(look); room.tick(t);
   spot.target.position.lerp(aim, .08);
   for (const g of pick) {const y = g === hover ? .08 : 0; g.position.y += (y - g.position.y) * .18;
    if (g.userData.cone) {const u = g.userData.cone.material.uniforms.uO; u.value += ((g === hover ? .6 : .22) - u.value) * .15;}}
   useBloom ? comp.render() : r.render(scene, cam);
   // if the first second runs slow, drop the bloom and render at 1x so the scroll stays smooth
   if (last && frames < 60) {slow += t - last > 30 ? 1 : 0; if (++frames === 60 && slow > 24) {useBloom = false; dpr = 1; r.setPixelRatio(1); size();}}
   last = t;
   if (frames === 12) B.done('room');   // a dozen smooth frames in: lift the boot screen
   if (++idle < 600) raf = requestAnimationFrame(frame);   // dust keeps drifting for ~10 s after the last input
  };
  // nothing renders behind a running game
  const inHub = () => !(window.A && A._e && A._e.state && A._e.state !== 'hub');
  view = {kick() {idle = 0; if (!raf && on && inHub()) raf = requestAnimationFrame(frame);}};
  new IntersectionObserver(es => {on = es[0].isIntersecting; if (on) view.kick();}).observe(stage);
  document.addEventListener('visibilitychange', () => view.kick());
  setTimeout(shown, 4000);
  try {r.compile(scene, cam);} catch (e) {}   // build every shader now, under the boot screen, not mid-scroll
  view.kick();
 }
}
