/* The front-page intro: the README's arcade room, live. Scrolling flies the camera into the middle cabinet's screen
   (which shows the console's attract demo), while the title lifts away and four manifesto lines pass, then the room
   fades into the console stage below. Three.js loads only on a wide screen with WebGL, without reduced motion or
   data saver; everyone else gets the still render (docs/intro.jpg) with the same scroll timeline in CSS. */
const intro = document.getElementById('intro');
const RM = matchMedia('(prefers-reduced-motion: reduce)');
if (intro && !RM.matches) {
 intro.classList.add('scrub');
 const lines = [...intro.querySelectorAll('.manifesto li')];
 const smooth = (a, b, x) => {const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t);};
 let p = 0, view = null;
 // p runs 0..1 while the pinned stage is on screen; each manifesto line owns a slice of that
 const measure = () => {
  const r = intro.getBoundingClientRect(), span = r.height - innerHeight;
  p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
  intro.style.setProperty('--p', p.toFixed(4));
  lines.forEach((li, i) => {const c = .3 + i * .14; li.style.setProperty('--o', Math.max(0, 1 - Math.abs(p - c) / .1).toFixed(3));});
  if (view) view.kick();
 };
 addEventListener('scroll', measure, {passive: true}); addEventListener('resize', measure); measure();

 const gl = (() => {try {const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl'));} catch (e) {return false;}})();
 const save = navigator.connection && navigator.connection.saveData;
 if (gl && !save && innerWidth >= 720 && location.protocol !== 'file:') start().catch(() => {});

 async function start() {
  const THREE = await import('../vendor/three.module.min.js');
  const [{EffectComposer}, {RenderPass}, {UnrealBloomPass}, {OutputPass}, {arcadeScene}] = await Promise.all([
   import('../vendor/jsm/postprocessing/EffectComposer.js'), import('../vendor/jsm/postprocessing/RenderPass.js'),
   import('../vendor/jsm/postprocessing/UnrealBloomPass.js'), import('../vendor/jsm/postprocessing/OutputPass.js'), import('./arcade-scene.js')]);
  await document.fonts.load('64px "PA Pixel"').catch(() => {});
  const cv = document.getElementById('introgl'), stage = cv.parentElement;
  const r = new THREE.WebGLRenderer({canvas: cv, antialias: true, powerPreference: 'high-performance'});
  let dpr = Math.min(devicePixelRatio || 1, 1.5);
  r.setPixelRatio(dpr); r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05; r.outputColorSpace = THREE.SRGBColorSpace;
  // fade the live room in over the still once every screen texture has arrived
  const shown = () => {intro.classList.add('gl'); if (view) view.kick();};
  THREE.DefaultLoadingManager.onLoad = shown;
  const room = arcadeScene(THREE, {base: '', live: document.getElementById('cdemo')});
  const {scene, cam, start: a, target: b} = room;
  const comp = new EffectComposer(r); comp.addPass(new RenderPass(scene, cam));
  const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), .4, .5, .86); comp.addPass(bloom); comp.addPass(new OutputPass());
  let useBloom = true;
  const size = () => {const w = stage.clientWidth, h = stage.clientHeight; r.setSize(w, h, false); comp.setPixelRatio(dpr); comp.setSize(w, h); cam.aspect = w / h;
   // keep the ring in frame on tall or narrow windows by widening the lens a little
   cam.fov = 40 * Math.max(1, 1.6 / cam.aspect) ** .6; cam.updateProjectionMatrix();};
  size(); addEventListener('resize', size);

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
   useBloom ? comp.render() : r.render(scene, cam);
   // if the first second runs slow, drop the bloom and render at 1x so the scroll stays smooth
   if (last && frames < 60) {slow += t - last > 30 ? 1 : 0; if (++frames === 60 && slow > 24) {useBloom = false; dpr = 1; r.setPixelRatio(1); size();}}
   last = t;
   if (++idle < 600) raf = requestAnimationFrame(frame);   // dust keeps drifting for ~10 s after the last input
  };
  // nothing renders behind a running game
  const inHub = () => !(window.A && A._e && A._e.state && A._e.state !== 'hub');
  view = {kick() {idle = 0; if (!raf && on && inHub()) raf = requestAnimationFrame(frame);}};
  new IntersectionObserver(es => {on = es[0].isIntersecting; if (on) view.kick();}).observe(stage);
  document.addEventListener('visibilitychange', () => view.kick());
  setTimeout(shown, 4000);
  view.kick();
 }
}
