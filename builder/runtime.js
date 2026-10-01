/* Pixel Arcade Builder — runtime: audio + game player */
(function () {
'use strict';
const PX = window.PXB, T = PX.T, R = PX.R;

/* ================================================================ audio */
PX.Audio = (() => {
  let ac = null, master = null, musicGain = null, timer = null, nextT = 0, step = 0, cfg = null;
  let muted = false; try { muted = localStorage.getItem('pxd_builder_mute') === '1'; } catch (e) { /* ignore */ }
  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume().catch(() => {}); return ac; }
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
    try { ac = new C(); } catch (e) { return null; }
    master = ac.createGain(); master.gain.value = muted ? 0 : .55; master.connect(ac.destination);
    musicGain = ac.createGain(); musicGain.gain.value = .5; musicGain.connect(master);
    return ac;
  }
  function tone(f, t0, dur, type = 'square', vol = .15, f2, dest) {
    const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + .008); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    o.connect(g); g.connect(dest || master); o.start(t0); o.stop(t0 + dur + .03);
  }
  let nbuf = null;
  function noise(t0, dur, vol = .2, freq = 1800, dest) {
    if (!nbuf) { nbuf = ac.createBuffer(1, ac.sampleRate * .5, ac.sampleRate); const d = nbuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = nbuf; f.type = 'lowpass'; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur); s.connect(f); f.connect(g); g.connect(dest || master); s.start(t0); s.stop(t0 + dur + .02);
  }
  const SFX = {
    coin: t => { tone(988, t, .07, 'square', .1); tone(1319, t + .06, .2, 'square', .1); },
    blip: t => tone(740 + Math.random() * 60, t, .05, 'square', .06),
    gem: t => { [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, t + i * .045, .14, 'triangle', .14)); },
    jump: t => tone(280, t, .16, 'square', .08, 620),
    hit: t => { noise(t, .2, .3, 1200); tone(220, t, .25, 'sawtooth', .12, 70); },
    power: t => { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, t + i * .06, .12, 'square', .08)); },
    key: t => { tone(1568, t, .08, 'triangle', .14); tone(2093, t + .08, .25, 'triangle', .14); },
    laser: t => tone(1300, t, .12, 'sawtooth', .05, 260),
    boom: t => { noise(t, .35, .35, 700); tone(140, t, .3, 'sine', .25, 40); },
    spring: t => tone(180, t, .3, 'sine', .22, 900),
    stomp: t => { tone(330, t, .1, 'square', .1, 110); noise(t, .08, .15, 2400); },
    unlock: t => { tone(392, t, .1, 'square', .1); tone(523, t + .1, .1, 'square', .1); tone(784, t + .2, .25, 'square', .1); },
    win: t => { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, t + i * .11, .22, 'square', .1)); },
    lose: t => { [392, 330, 262, 196].forEach((f, i) => tone(f, t + i * .18, .3, 'triangle', .16)); },
    die: t => { tone(600, t, .5, 'square', .1, 80); },
    checkpoint: t => { tone(660, t, .1, 'triangle', .14); tone(990, t + .1, .25, 'triangle', .14); }
  };
  function sfx(n) { if (muted || n === 'none') return; if (!init()) return; const f = SFX[n]; if (f) try { f(ac.currentTime + .005); } catch (e) { /* ignore */ } }
  const SCALES = { happy: [0, 2, 4, 7, 9, 12, 14, 16], chill: [0, 4, 7, 11, 14, 16, 19, 21], tense: [0, 2, 3, 7, 8, 12, 14, 15], spooky: [0, 1, 3, 6, 7, 10, 12, 13], epic: [0, 3, 5, 7, 10, 12, 15, 17] };
  const ROOT = { happy: 60, chill: 57, tense: 55, spooky: 53, epic: 52 };
  const PROG = { happy: [0, 5, 3, 4], chill: [0, 3, 5, 4], tense: [0, 0, 5, 6], spooky: [0, 1, 0, 6], epic: [0, 5, 3, 6] };
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  function sched() {
    if (!ac || !cfg) return;
    const spb = 60 / cfg.tempo / 4;
    while (nextT < ac.currentTime + .2) {
      const mood = cfg.mood, sc = SCALES[mood] || SCALES.happy, root = ROOT[mood] || 60, bar = Math.floor(step / 16) % 4, s = step % 16;
      const chord = (PROG[mood] || PROG.happy)[bar], rootN = root + [0, 1, 3, 5, 7, 8, 10][chord % 7] - 12;
      if (s % 4 === 0) tone(mtof(rootN - 12), nextT, spb * 3.5, 'triangle', .13, null, musicGain);
      if (s % 2 === 0 || mood === 'epic') { const n = sc[(s * 3 + bar * 2 + (s > 7 ? 2 : 0)) % sc.length]; if (PX.hash2(step, bar, 3) > (mood === 'chill' ? .5 : .25)) tone(mtof(root + n), nextT, spb * 1.6, mood === 'chill' ? 'sine' : 'square', .035, null, musicGain); }
      if (s % 4 === 2) noise(nextT, .04, .05, 7000, musicGain);
      if ((mood === 'tense' || mood === 'epic') && s % 8 === 0) noise(nextT, .12, .12, 300, musicGain);
      nextT += spb; step++;
    }
  }
  function music(mood, tempo) {
    stopMusic(); if (!mood || mood === 'off') return; if (!init()) return;
    cfg = { mood, tempo: Math.max(50, Math.min(220, tempo || 120)) }; nextT = ac.currentTime + .1; step = 0;
    musicGain.gain.cancelScheduledValues(ac.currentTime); musicGain.gain.setValueAtTime(.5, ac.currentTime);
    timer = setInterval(sched, 50);
  }
  function stopMusic() { if (timer) clearInterval(timer); timer = null; cfg = null; }
  function setMuted(m) { muted = m; try { localStorage.setItem('pxd_builder_mute', m ? '1' : '0'); } catch (e) { /* ignore */ } if (master) master.gain.value = m ? 0 : .55; }
  return { init, sfx, music, stopMusic, setMuted, get muted() { return muted; }, toggle() { setMuted(!muted); return muted; } };
})();

/* ================================================================ game */
const KEYMAP = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', Space: 'a', KeyZ: 'a', KeyK: 'a', KeyX: 'b', KeyJ: 'b' };
const ov = (a, b, m = 0) => a.x < b.x + b.w + m && a.x + a.w + m > b.x && a.y < b.y + b.h + m && a.y + a.h + m > b.y;
const ctr = e => ({ x: e.x + e.w / 2, y: e.y + e.h / 2 });
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

class Game {
  constructor(canvas, project, opts = {}) {
    this.cv = canvas; this.ctx = canvas.getContext('2d'); this.src = project; this.opts = opts;
    this.in = {}; this.prev = {}; this.codes = {}; this.pcodes = {};
    this._key = this.onKey.bind(this); this._blur = () => { this.in = {}; this.codes = {}; };
    addEventListener('keydown', this._key); addEventListener('keyup', this._key); addEventListener('blur', this._blur);
    this.reset();
    this.running = true; this.last = performance.now(); this.acc = 0;
    this._frame = this.frame.bind(this); this.raf = requestAnimationFrame(this._frame);
  }
  log(m, lvl) { if (this.opts.log) this.opts.log(m, lvl); }
  destroy() {
    this.running = false; cancelAnimationFrame(this.raf);
    removeEventListener('keydown', this._key); removeEventListener('keyup', this._key); removeEventListener('blur', this._blur);
    PX.Audio.stopMusic(); if (this.overlay) this.overlay.remove();
  }
  onKey(ev) {
    const tg = ev.target; if (tg && /INPUT|TEXTAREA|SELECT/.test(tg.tagName)) return;
    const down = ev.type === 'keydown', k = KEYMAP[ev.code];
    this.codes[ev.code] = down;
    if (k) { this.in[k] = down; ev.preventDefault(); }
    if (down && !ev.repeat) {
      if (ev.code === 'KeyR' && this.state !== 'play') this.restart();
      if (ev.code === 'KeyM') PX.Audio.toggle();
      if (ev.code === 'KeyP' || (ev.code === 'Escape' && this.opts.escPause)) this.paused = !this.paused;
    }
  }
  setTouch(k, v) { this.in[k] = v; }
  restart() { if (this.overlay) { this.overlay.remove(); this.overlay = null; } this.reset(); }

  /* -------------------------------------------------------------- setup */
  reset() {
    const P = this.P = PX.clone(this.src), S = this.S = P.settings;
    this.LW = S.levelW * T; this.LH = S.levelH * T;
    this.sid = 0;
    this.ents = P.entities.filter(e => !e.hidden || true).map(e => this.mk(e));
    this.player = this.ents.find(e => e.comps.player) || null;
    if (this.player) { this.player.isPlayer = true; this.player.hp = this.player.comps.health ? this.player.comps.health.hp : 1; this.player.maxHp = this.player.hp; }
    this.mode = this.player ? this.player.comps.player.mode : 'platformer';
    this.g = this.mode === 'platformer' ? +S.gravity : 0;
    this.score = 0; this.lives = Math.max(1, S.lives | 0); this.time = Math.max(5, +S.timeLimit || 120); this.collected = 0;
    this.total = this.ents.filter(e => e.comps.collectible && e.comps.collectible.counts).length;
    this.keys = {}; this.power = { speed: 0, jump: 0, shield: 0 }; this.powerMax = { speed: 1, jump: 1, shield: 1 };
    this.state = 'play'; this.t = 0; this.parts = []; this.bullets = []; this.texts = []; this.msg = null; this.shakeT = 0; this.shakeA = 0; this.flash = 0;
    this.touching = new Set(); this.rs = (P.rules || []).map(() => ({ acc: 0, was: false }));
    this.timeFired = false; this.paused = false; this.endT = 0; this.ruleCount = {};
    this.spawn = this.player ? { x: this.player.x, y: this.player.y } : { x: 0, y: 0 };
    this.solids = this.ents.filter(e => e.phys.solid);
    this.banner = { text: S.title || 'Untitled', sub: PX.WINS[S.win] + (S.win === 'score' ? ' · ' + S.winScore : ''), t: 2.4 };
    this.buildGrid(); this.dfT = 0;
    this.zoom = 1; this.measure();
    const p = this.player;
    this.cam = { x: 0, y: 0, la: 0 }; this.updCam(1, true);
    this.event('start', p);
    if (!this.opts.silent) PX.Audio.music(S.music.mood, S.music.tempo);
    this.log('▶ Play — ' + (S.title || 'Untitled') + ' (' + this.ents.length + ' objects, ' + this.mode + ')', 'ok');
  }
  mk(e) {
    const r = PX.clone(e); const A = PX.ASSETS[e.type] || {};
    r.phys = Object.assign({ body: 'static', gravity: 1, friction: .8, bounce: 0, solid: false, oneWay: false }, r.phys || {});
    r.comps = r.comps || {}; r.props = r.props || {};
    r.group = A.group || 'misc'; r.ox = e.x; r.oy = e.y; r.vx = 0; r.vy = 0; r.alive = true; r.face = 1; r.dir = 1; r.sx = 1; r.sy = 1;
    r.inv = 0; r.cool = Math.random() * .8 + .4; r.spd = 1; r.flashT = 0; r.mv = { p: 0, d: 1, wait: 0 };
    if (r.comps.health) r.hp = r.comps.health.hp;
    r.moving = r.phys.body === 'dynamic' || !!r.comps.patrol || !!r.comps.chase;
    if (r.group === 'spawner') r.cool = +r.props.every || 0;
    return r;
  }
  measure() {
    const S = this.S, dpr = Math.min(2, window.devicePixelRatio || 1), cw = this.cv.clientWidth || 640, ch = this.cv.clientHeight || 480;
    if (this.cv.width !== Math.round(cw * dpr) || this.cv.height !== Math.round(ch * dpr)) { this.cv.width = Math.round(cw * dpr); this.cv.height = Math.round(ch * dpr); }
    const vt = Math.max(4, S.viewH || 15) * T;
    this.scale = Math.min(this.cv.height / vt, this.cv.width / (vt * .95)) * this.zoom;
    this.vw = this.cv.width / this.scale; this.vh = this.cv.height / this.scale;
  }
  buildGrid() {
    const gw = Math.ceil(this.LW / T), gh = Math.ceil(this.LH / T); this.gw = gw; this.gh = gh;
    const g = new Uint8Array(gw * gh);
    for (const s of this.solids) {
      if (!s.alive || s.open || s.phys.oneWay || s.comps.mover || s.phys.body === 'dynamic') continue;
      const x0 = Math.max(0, Math.floor((s.x + 2) / T)), x1 = Math.min(gw - 1, Math.floor((s.x + s.w - 2) / T));
      const y0 = Math.max(0, Math.floor((s.y + 2) / T)), y1 = Math.min(gh - 1, Math.floor((s.y + s.h - 2) / T));
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y * gw + x] = 1;
    }
    this.grid = g; this.df = null;
  }
  distField() {
    const p = this.player; if (!p) return;
    const { gw, gh, grid } = this, df = new Int32Array(gw * gh).fill(-1);
    const c = ctr(p), sx = clamp(Math.floor(c.x / T), 0, gw - 1), sy = clamp(Math.floor(c.y / T), 0, gh - 1);
    const q = [sy * gw + sx]; df[q[0]] = 0;
    for (let i = 0; i < q.length; i++) {
      const cur = q[i], x = cur % gw, y = (cur / gw) | 0, d = df[cur] + 1;
      if (x > 0 && !grid[cur - 1] && df[cur - 1] < 0) { df[cur - 1] = d; q.push(cur - 1); }
      if (x < gw - 1 && !grid[cur + 1] && df[cur + 1] < 0) { df[cur + 1] = d; q.push(cur + 1); }
      if (y > 0 && !grid[cur - gw] && df[cur - gw] < 0) { df[cur - gw] = d; q.push(cur - gw); }
      if (y < gh - 1 && !grid[cur + gw] && df[cur + gw] < 0) { df[cur + gw] = d; q.push(cur + gw); }
    }
    this.df = df;
  }

  /* -------------------------------------------------------------- loop */
  frame(now) {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this._frame);
    const dt = Math.min(.1, (now - this.last) / 1000); this.last = now;
    this.measure();
    if (!this.paused) { this.acc += dt; let n = 0; while (this.acc >= 1 / 60 && n < 6) { this.step(1 / 60); this.acc -= 1 / 60; n++; } if (n === 6) this.acc = 0; }
    this.draw();
  }
  pressed(k) { return this.in[k] && !this.prev[k]; }
  step(dt) {
    this.t += dt; this.fx(dt);
    if (this.state !== 'play') { this.endT += dt; this.prev = Object.assign({}, this.in); this.pcodes = Object.assign({}, this.codes); this.updCam(dt); return; }
    const S = this.S, p = this.player;
    this.time -= dt;
    for (const k in this.power) if (this.power[k] > 0) { this.power[k] -= dt; if (this.power[k] <= 0) { this.power[k] = 0; this.say(k.toUpperCase() + ' wore off', 1.2); } }
    // rules: every / key
    (this.P.rules || []).forEach((r, i) => {
      if (r.off || !r.ev) return; const ev = r.ev, st = this.rs[i];
      if (ev.type === 'every') { st.acc += dt; const n = Math.max(.2, +ev.n || 1); while (st.acc >= n) { st.acc -= n; this.run(r, i, { self: p }); } }
      else if (ev.type === 'key') { const code = PX.KEYS[ev.k] || ev.k; if (this.codes[code] && !this.pcodes[code]) this.run(r, i, { self: p }); }
    });
    for (const e of this.ents) if (e.alive && e.comps.mover) this.updMover(e, dt);
    if (p && p.alive && !p.dead) this.updPlayer(p, dt);
    if (this.mode !== 'platformer') { this.dfT -= dt; if (this.dfT <= 0) { this.dfT = .25; this.distField(); } }
    for (const e of this.ents) if (e.alive && e !== p) this.updAI(e, dt);
    for (const e of this.ents) if (e.alive && e.moving && !(e === p && p.dead)) this.integrate(e, dt);
    this.updBullets(dt);
    if (p && !p.dead) {
      if (p.y > this.LH + 80 && this.mode === 'platformer') this.die();
      else this.touches();
    }
    if (p && p.dead) { p.deadT -= dt; if (p.deadT <= 0) { if (this.lives <= 0) this.lose('GAME OVER'); else this.respawn(); } }
    if (p && p.inv > 0) p.inv -= dt;
    this.compareRules();
    if (this.state === 'play') {
      if (S.win === 'collect' && this.total > 0 && this.collected >= this.total) this.win('ALL COLLECTED!');
      else if (S.win === 'score' && this.score >= (+S.winScore || 0)) this.win('TARGET SCORE!');
    }
    if (this.time <= 0 && this.state === 'play') {
      this.time = 0;
      if (!this.timeFired) { this.timeFired = true; this.event('timeup', p); }
      if (this.state === 'play') { if (S.win === 'survive') this.win('SURVIVED!'); else this.lose('TIME UP'); }
    }
    this.updCam(dt);
    this.prev = Object.assign({}, this.in); this.pcodes = Object.assign({}, this.codes);
  }

  /* -------------------------------------------------------------- movement */
  free(x, y, w, h, self) { const r = { x, y, w, h }; for (const s of this.solids) { if (s === self || !s.alive || s.open || s.phys.oneWay) continue; if (ov(r, s)) return false; } return true; }
  pointSolid(x, y) { for (const s of this.solids) { if (!s.alive || s.open) continue; if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return true; } return false; }
  moveX(e, dx) {
    if (!dx) return; e.x += dx;
    let hit = null; for (const s of this.solids) { if (s === e || !s.alive || s.open || s.phys.oneWay) continue; if (ov(e, s)) { hit = s; break; } }
    if (!hit) return;
    if (e.assist && !e.vyIntent) {
      for (let d = 1; d <= 12; d++) for (const sg of [-1, 1]) if (this.free(e.x, e.y + sg * d, e.w, e.h, e)) { e.x -= dx; e.y += sg * Math.min(d, 2.5); return; }
    }
    for (const s of this.solids) {
      if (s === e || !s.alive || s.open || s.phys.oneWay || !ov(e, s)) continue;
      if (dx > 0) e.x = s.x - e.w; else e.x = s.x + s.w;
      e.hitWall = Math.sign(dx);
      if (e.isPlayer && s.group === 'door') this.tryDoor(s);
    }
    e.vx = e.phys.bounce > 0 ? -e.vx * e.phys.bounce : 0;
  }
  moveY(e, dy) {
    if (!dy) return; const prevB = e.y + e.h; e.y += dy; let landed = null, bonk = false;
    for (const s of this.solids) {
      if (s === e || !s.alive || s.open || !ov(e, s)) continue;
      if (s.phys.oneWay) {
        if (dy > 0 && prevB <= s.y + 1 && !(e.isPlayer && this.in.down && this.mode === 'platformer')) { e.y = s.y - e.h; landed = s; }
        continue;
      }
      if (dy > 0) { e.y = s.y - e.h; landed = s; } else { e.y = s.y + s.h; bonk = true; }
      if (e.isPlayer && s.group === 'door') this.tryDoor(s);
    }
    if (e.assist && !landed && !bonk) return;
    if (landed) {
      if (e.phys.bounce > 0 && Math.abs(e.vy) > 120) e.vy = -e.vy * e.phys.bounce;
      else { e.vy = 0; if (this.g > 0 || dy > 0) e.ground = landed; }
      e.hitY = 1;
    } else if (bonk) { e.vy = e.phys.bounce > 0 ? -e.vy * e.phys.bounce : 0; e.hitY = -1; if (e.assist) { /* top-down: corner slide */ } }
  }
  moveYAssist(e, dy) {
    if (!dy) return; e.y += dy; let hit = false;
    for (const s of this.solids) { if (s === e || !s.alive || s.open || s.phys.oneWay) continue; if (ov(e, s)) { hit = true; break; } }
    if (!hit) return;
    if (!e.vxIntent) for (let d = 1; d <= 12; d++) for (const sg of [-1, 1]) if (this.free(e.x + sg * d, e.y, e.w, e.h, e)) { e.y -= dy; e.x += sg * Math.min(d, 2.5); return; }
    for (const s of this.solids) {
      if (s === e || !s.alive || s.open || s.phys.oneWay || !ov(e, s)) continue;
      if (dy > 0) e.y = s.y - e.h; else e.y = s.y + s.h;
      e.hitY = Math.sign(dy); if (e.isPlayer && s.group === 'door') this.tryDoor(s);
    }
    e.vy = 0;
  }
  integrate(e, dt) {
    const grav = this.g * (e.phys.gravity == null ? 1 : +e.phys.gravity);
    if (e.phys.body === 'dynamic' && grav) e.vy = Math.min(e.vy + grav * dt, 1100);
    e.prevBottom = e.y + e.h; e.lastGround = e.ground; e.ground = null; e.hitWall = 0; e.hitY = 0;
    const vyBefore = e.vy;
    e.assist = this.mode !== 'platformer';
    this.moveX(e, e.vx * dt);
    if (e.assist) this.moveYAssist(e, e.vy * dt); else this.moveY(e, e.vy * dt);
    // stay inside level
    if (e.x < 0) { e.x = 0; e.hitWall = -1; } else if (e.x + e.w > this.LW) { e.x = this.LW - e.w; e.hitWall = 1; }
    if (this.mode !== 'platformer' || !e.isPlayer) {
      if (e.y < 0 && (this.mode !== 'platformer' || e.phys.gravity === 0)) { e.y = 0; e.hitY = -1; if (!e.isPlayer) e.vy = Math.abs(e.vy); }
      if (this.mode !== 'platformer' && e.y + e.h > this.LH) { e.y = this.LH - e.h; e.hitY = 1; }
      if (!e.isPlayer && this.mode === 'platformer' && e.y > this.LH + 200) e.alive = false;
    }
    if (e.isPlayer && e.ground && !e.lastGround && vyBefore > 260) { e.sx = 1.3; e.sy = .72; this.dust(e, 6); }
  }
  updMover(e, dt) {
    const m = e.comps.mover, st = e.mv, len = Math.hypot(m.dx, m.dy) || 1;
    const px = e.x, py = e.y;
    if (st.wait > 0) st.wait -= dt;
    else if (!st.done) {
      st.p += st.d * (m.speed * e.spd) * dt / len;
      if (st.p >= 1) { st.p = 1; if (m.loop === 'once') st.done = true; else { st.d = -1; st.wait = +m.pause || 0; } }
      else if (st.p <= 0) { st.p = 0; st.d = 1; st.wait = +m.pause || 0; }
    }
    const u = st.p, k = u * u * (3 - 2 * u) * .35 + u * .65;
    e.x = e.ox + m.dx * k; e.y = e.oy + m.dy * k;
    const dx = e.x - px, dy = e.y - py; e.mdx = dx; e.mdy = dy;
    if (!dx && !dy) return;
    for (const d of this.ents) {
      if (!d.alive || d === e || !d.moving || (d.isPlayer && d.dead)) continue;
      if (d.ground === e) { this.moveX(d, dx); if (dy > 0) { d.y += dy; } else if (dy < 0) d.y = e.y - d.h; }
      else if (e.phys.solid && !e.phys.oneWay && ov(d, e)) {
        if (dy < 0 && d.y + d.h <= e.y - dy + 2) { d.y = e.y - d.h; d.ground = e; d.vy = Math.min(d.vy, 0); }
        else if (dx !== 0) { d.x = dx > 0 ? e.x + e.w : e.x - d.w; }
        else if (dy > 0) d.y = e.y + e.h;
      }
    }
  }
  updPlayer(p, dt) {
    const c = p.comps.player, I = this.in, spd = (+c.speed || 200) * (this.power.speed > 0 ? 1.5 : 1) * p.spd;
    p.cool -= dt;
    if (this.mode === 'platformer') {
      const dir = (I.right ? 1 : 0) - (I.left ? 1 : 0);
      const gr = p.ground, fr = gr ? Math.max(.02, gr.phys.friction == null ? .8 : +gr.phys.friction) : .8;
      if (dir) {
        const acc = gr ? 2600 * Math.min(1, fr + .1) + 300 : 1500;
        const along = p.vx * dir;
        if (along < spd) p.vx = Math.min(spd, along + acc * (along < 0 ? 1.6 : 1) * dt) * dir;
        else p.vx = Math.max(spd, along - 2000 * dt) * dir;
        p.face = dir;
      } else {
        const dec = (gr ? 3200 * Math.min(1, fr) + 40 : 500) * dt; p.vx = Math.abs(p.vx) <= dec ? 0 : p.vx - Math.sign(p.vx) * dec;
      }
      if (gr && (p.vy >= 0)) { p.coyote = .1; p.jumps = 0; } else p.coyote -= dt;
      if (this.pressed('a') || this.pressed('up')) p.buf = .13; else p.buf -= dt;
      const jv = (+c.jump || 600) * (this.power.jump > 0 ? 1.3 : 1);
      if (p.buf > 0 && p.coyote > 0) { this.doJump(p, jv); }
      else if (p.buf > 0 && c.doubleJump && p.coyote <= 0 && (p.jumps || 0) < 1) { p.jumps = (p.jumps || 0) + 1; this.doJump(p, jv * .9); this.burst(ctr(p).x, p.y + p.h, '#ffffff', 8, 120); }
      if (p.jumpHeld && !(I.a || I.up) && p.vy < 0) { p.vy *= .5; p.jumpHeld = false; }
      if (p.vy >= 0) p.jumpHeld = false;
      if (c.canShoot && I.b && p.cool <= 0) { p.cool = 1 / Math.max(1, +c.fireRate || 5); this.fire(p, p.face, 0, 520, 'p'); }
    } else {
      let dx = (I.right ? 1 : 0) - (I.left ? 1 : 0), dy = (I.down ? 1 : 0) - (I.up ? 1 : 0);
      p.vxIntent = !!dx; p.vyIntent = !!dy;
      const len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len;
      const k = this.mode === 'ship' ? 7 : 16;
      p.vx += (dx * spd - p.vx) * Math.min(1, k * dt); p.vy += (dy * spd - p.vy) * Math.min(1, k * dt);
      if (dx || dy) { p.fx = dx; p.fy = dy; if (dx) p.face = Math.sign(dx); }
      if (this.mode === 'ship') { p.tilt = (p.tilt || 0) + (dx * .22 - (p.tilt || 0)) * Math.min(1, 10 * dt); p.face = 1; if (Math.random() < .5) this.parts.push({ x: p.x + p.w / 2 + (Math.random() - .5) * 6, y: p.y + p.h, vx: (Math.random() - .5) * 30, vy: 120 + Math.random() * 80, life: .35, max: .35, c: Math.random() < .5 ? '#ff8a2a' : '#ffd84a', s: 3, g: 0 }); }
      if (c.canShoot && (I.a || I.b) && p.cool <= 0) {
        p.cool = 1 / Math.max(1, +c.fireRate || 5);
        if (this.mode === 'ship') this.fire(p, 0, -1, 620, 'p'); else this.fire(p, p.fx == null ? p.face : p.fx, p.fy || 0, 480, 'p');
      }
    }
    p.sx += (1 - p.sx) * Math.min(1, 12 * dt); p.sy += (1 - p.sy) * Math.min(1, 12 * dt);
  }
  doJump(p, v) { p.vy = -v; p.buf = 0; p.coyote = 0; p.ground = null; p.lastGround = null; p.jumpHeld = true; p.sx = .72; p.sy = 1.32; this.dust(p, 5); PX.Audio.sfx('jump'); }
  updAI(e, dt) {
    const c = e.comps, p = this.player, alive = p && p.alive && !p.dead;
    if (e.flashT > 0) e.flashT -= dt;
    if (e.springT > 0) e.springT -= dt;
    if (e.group === 'spawner') {
      const every = +e.props.every || 0;
      if (every > 0) { e.cool -= dt; if (e.cool <= 0) { e.cool = every; const n = this.ents.filter(x => x.alive && x.from === e.id).length; if (n < (+e.props.max || 6)) { const s = this.spawnType(e.props.what, ctr(e)); if (s) s.from = e.id; } } }
      return;
    }
    if (!e.moving && !c.shooter) return;
    const flying = this.mode !== 'platformer' || e.phys.gravity === 0 || e.phys.body !== 'dynamic';
    let chasing = false;
    if (c.chase && alive) {
      const a = ctr(e), b = ctr(p), dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), sp = (+c.chase.speed || 0) * e.spd;
      if (d < (+c.chase.range || 0)) {
        chasing = true;
        if (this.mode !== 'platformer' && c.chase.smart && this.df) {
          const gx = clamp(Math.floor(a.x / T), 0, this.gw - 1), gy = clamp(Math.floor(a.y / T), 0, this.gh - 1), i = gy * this.gw + gx, cur = this.df[i];
          let best = -1, bd = cur < 0 ? 1e9 : cur;
          const nb = [[gx - 1, gy], [gx + 1, gy], [gx, gy - 1], [gx, gy + 1]];
          for (const [nx, ny] of nb) { if (nx < 0 || ny < 0 || nx >= this.gw || ny >= this.gh) continue; const v = this.df[ny * this.gw + nx]; if (v >= 0 && v < bd) { bd = v; best = ny * this.gw + nx; } }
          let tx = b.x, ty = b.y;
          if (best >= 0 && cur !== 0) { tx = (best % this.gw) * T + T / 2; ty = Math.floor(best / this.gw) * T + T / 2; }
          const ddx = tx - a.x, ddy = ty - a.y, dd = Math.hypot(ddx, ddy) || 1;
          e.vx = ddx / dd * sp; e.vy = ddy / dd * sp;
        } else if (flying) { e.vx += (dx / (d || 1) * sp - e.vx) * Math.min(1, 4 * dt); e.vy += (dy / (d || 1) * sp - e.vy) * Math.min(1, 4 * dt); }
        else e.vx = Math.sign(dx) * sp;
        if (Math.abs(dx) > 2) e.face = Math.sign(dx);
      }
    }
    if (!chasing && c.patrol) {
      const pt = c.patrol, sp = (+pt.speed || 0) * e.spd, dist = +pt.distance || 0;
      if (pt.axis === 'y') {
        e.vy = e.dir * sp; if (!flying || this.mode !== 'platformer') {}
        if (e.dir > 0 && e.y >= e.oy + dist) e.dir = -1; else if (e.dir < 0 && e.y <= e.oy) e.dir = 1;
        if (e.hitY) { e.dir = -e.hitY; e.hitY = 0; }
        if (flying) e.vx = 0;
      } else {
        e.vx = e.dir * sp;
        if (e.dir > 0 && e.x >= e.ox + dist) e.dir = -1; else if (e.dir < 0 && e.x <= e.ox) e.dir = 1;
        if (e.hitWall) { e.dir = -e.hitWall; e.hitWall = 0; }
        if (pt.edgeTurn && !flying && e.ground) { const fx = e.dir > 0 ? e.x + e.w + 3 : e.x - 3; if (!this.pointSolid(fx, e.y + e.h + 6)) e.dir = -e.dir; }
        if (+pt.wave) e.vy = Math.cos(this.t * 3 + e.id) * pt.wave * 3; else if (flying) e.vy = 0;
        e.face = e.dir;
      }
    } else if (!chasing && flying && e.phys.body === 'dynamic') { e.vx *= .92; e.vy *= .92; }
    if (c.shooter && alive) {
      const s = c.shooter; e.cool -= dt;
      const a = ctr(e), b = ctr(p), d = Math.hypot(b.x - a.x, b.y - a.y);
      if (e.cool <= 0 && d < (+s.range || 300)) {
        e.cool = Math.max(.2, +s.rate || 1.5);
        let dx = 0, dy = 0;
        if (s.aim === 'player') { dx = (b.x - a.x) / d; dy = (b.y - a.y) / d; } else { dx = s.aim === 'left' ? -1 : s.aim === 'right' ? 1 : 0; dy = s.aim === 'up' ? -1 : s.aim === 'down' ? 1 : 0; }
        this.fire(e, dx, dy, +s.speed || 200, 'e');
        e.sx = 1.2; e.sy = .85;
      }
    }
    e.sx += (1 - e.sx) * Math.min(1, 10 * dt); e.sy += (1 - e.sy) * Math.min(1, 10 * dt);
  }
  fire(from, dx, dy, speed, owner) {
    const c = ctr(from), s = owner === 'p' ? 8 : 10;
    this.bullets.push({ x: c.x - s / 2 + dx * from.w * .4, y: c.y - s / 2 + dy * from.h * .4, w: s, h: s, vx: dx * speed, vy: dy * speed, owner, life: 1.8, c: owner === 'p' ? '#ffe066' : '#ff3b6b' });
    PX.Audio.sfx(owner === 'p' ? 'laser' : 'blip');
  }
  updBullets(dt) {
    const p = this.player;
    for (const b of this.bullets) {
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      if (b.x < -20 || b.y < -20 || b.x > this.LW + 20 || b.y > this.LH + 20) b.life = 0;
      for (const s of this.solids) { if (!s.alive || s.open || s.phys.oneWay || !ov(b, s)) continue; b.life = 0; this.burst(b.x + 4, b.y + 4, b.c, 5, 80); break; }
      if (b.life <= 0) continue;
      if (b.owner === 'p') {
        for (const e of this.ents) {
          if (!e.alive || e.isPlayer || !(e.group === 'enemy' || (e.comps.hazard && e.comps.health)) || !ov(b, e)) continue;
          b.life = 0; this.ruleTouch(Object.assign({ isBullet: true, group: 'bullet', type: 'bullet', id: 'b' }, b), e); this.damage(e, 1); break;
        }
      } else if (p && !p.dead && ov(b, p)) { b.life = 0; this.hurt(1); }
    }
    this.bullets = this.bullets.filter(b => b.life > 0);
  }

  /* -------------------------------------------------------------- interactions */
  touches() {
    const p = this.player, now = new Set();
    const actors = this.ents.filter(e => e.alive && e.group !== 'decor' && (e.isPlayer || e.moving));
    for (const A of actors) {
      for (const B of this.ents) {
        if (B === A || !B.alive || B.group === 'decor' || B.open) continue;
        if (!ov(A, B, 1)) continue;
        if (B.moving && !A.isPlayer && A.id > B.id) continue; // avoid duplicate actor pairs
        const k = A.id + ':' + B.id; now.add(k);
        if (!this.touching.has(k)) { this.ruleTouch(A, B); if (A.isPlayer) this.enter(B); }
        if (A.isPlayer && this.state === 'play' && !p.dead) this.stay(B);
      }
    }
    this.touching = now;
  }
  enter(B) {
    const c = B.comps;
    if (c.collectible) this.collect(B);
    if (B.group === 'checkpoint' && !B.lit) { this.ents.forEach(e => { if (e.group === 'checkpoint') e.lit = false; }); B.lit = true; this.spawn = { x: B.x + B.w / 2 - this.player.w / 2, y: B.y + B.h - this.player.h }; PX.Audio.sfx('checkpoint'); this.say('CHECKPOINT', 1.2); this.burst(B.x + B.w / 2, B.y + 10, '#3ddc84', 16, 160); }
    if (c.goal) {
      const left = this.total - this.collected;
      if (c.goal.requireAll && left > 0) this.say('Collect everything first! (' + left + ' left)', 1.6);
      else this.win('GOAL REACHED!');
    }
  }
  stay(B) {
    const p = this.player, c = B.comps;
    if (c.bounce && this.mode === 'platformer' && p.vy >= 0 && p.y + p.h <= B.y + B.h * .75) {
      p.vy = -(+c.bounce.power || 900); p.jumpHeld = false; p.ground = null; p.lastGround = null; p.coyote = 0; p.sx = .7; p.sy = 1.4; B.springT = .3; PX.Audio.sfx('spring'); this.dust(p, 6);
    }
    if (c.hazard && B.alive) {
      const isEnemy = B.group === 'enemy' || !!c.health;
      if (isEnemy && this.mode === 'platformer' && c.hazard.stompable && p.vy > 0 && p.prevBottom <= B.y + 10) {
        this.damage(B, 1, true);
        p.vy = -(this.in.a || this.in.up ? (+p.comps.player.jump || 600) * .85 : 420); p.jumpHeld = true; p.sx = .8; p.sy = 1.25;
        PX.Audio.sfx('stomp'); this.shake(.12, 3);
      } else if (this.power.shield > 0) { if (isEnemy) this.damage(B, 99); }
      else if (+c.hazard.damage > 0) this.hurt(+c.hazard.damage, B);
    }
  }
  collect(B) {
    const c = B.comps.collectible; B.alive = false;
    if (c.score) this.addScore(+c.score, B);
    if (c.counts) this.collected++;
    PX.Audio.sfx(c.sound || 'coin');
    const col = B.group === 'key' ? (PX.KEY_COLORS[B.props.color] || '#ffd84a') : (B.color || '#ffd84a');
    this.burst(B.x + B.w / 2, B.y + B.h / 2, col, B.w < 14 ? 4 : 12, 140, true);
    if (B.group === 'key') { const k = B.props.color || 'gold'; this.keys[k] = (this.keys[k] || 0) + 1; this.say((k[0].toUpperCase() + k.slice(1)) + ' key!', 1.2); }
    else if (B.group === 'life') { this.lives++; this.say('+1 LIFE', 1.2); }
    else if (B.group === 'powerup') { const k = B.props.kind || 'speed', d = +B.props.duration || 8; this.power[k] = d; this.powerMax[k] = d; this.say(k.toUpperCase() + '!', 1.2); this.flash = .25; this.flashC = B.color; }
    this.event('destroyed', B);
  }
  tryDoor(d) {
    if (d.open) return; const k = d.props.color || 'gold';
    if (this.keys[k] > 0) { this.keys[k]--; d.open = true; d.openT = 0; PX.Audio.sfx('unlock'); this.say('Unlocked!', 1); this.burst(d.x + d.w / 2, d.y + d.h / 2, PX.KEY_COLORS[k] || '#ffd84a', 20, 160); this.buildGrid(); }
    else if (!this.doorMsgT || this.t - this.doorMsgT > 2) { this.doorMsgT = this.t; this.say('Locked — find the ' + k + ' key', 1.6); }
  }
  damage(e, n, stomp) {
    if (!e.alive) return;
    if (e.comps.health) { if (e.inv > 0 && !stomp) return; e.hp -= n; e.flashT = .12; e.inv = 0; if (e.hp > 0) { PX.Audio.sfx('blip'); this.burst(e.x + e.w / 2, e.y + e.h / 2, '#ffffff', 5, 100); if (stomp) { e.sy = .6; e.sx = 1.3; } return; } }
    this.kill(e, true, stomp);
  }
  kill(e, points, stomp) {
    if (!e.alive) return; e.alive = false;
    if (points && e.comps.health && +e.comps.health.points) this.addScore(+e.comps.health.points, e);
    this.burst(e.x + e.w / 2, e.y + e.h / 2, e.color || '#ffffff', 18, 220); this.burst(e.x + e.w / 2, e.y + e.h / 2, '#ffffff', 6, 120);
    if (stomp) this.parts.push({ squash: true, x: e.x, y: e.y + e.h * .6, w: e.w, h: e.h * .4, c: e.color, life: .4, max: .4 });
    PX.Audio.sfx('boom'); this.shake(.15, 4);
    this.event('destroyed', e);
  }
  remove(e) { if (!e || !e.alive) return; if (e.isPlayer) { this.die(); return; } e.alive = false; this.burst(e.x + e.w / 2, e.y + e.h / 2, e.color || '#fff', 12, 160); this.event('destroyed', e); }
  hurt(dmg, src) {
    const p = this.player; if (!p || p.dead || p.inv > 0 || this.state !== 'play' || this.power.shield > 0) return;
    p.hp -= dmg; p.inv = p.comps.health ? (+p.comps.health.invuln || 1) : 1.2;
    PX.Audio.sfx('hit'); this.shake(.3, 7); this.flash = .35; this.flashC = '#ff3b3b';
    this.burst(p.x + p.w / 2, p.y + p.h / 2, '#ff3b3b', 14, 200);
    if (this.mode === 'platformer') { p.vy = -320; p.vx = (src ? Math.sign(ctr(p).x - ctr(src).x) || -p.face : -p.face) * 260; }
    else if (src) { const a = ctr(p), b = ctr(src), d = Math.hypot(a.x - b.x, a.y - b.y) || 1; p.vx = (a.x - b.x) / d * 380; p.vy = (a.y - b.y) / d * 380; }
    if (p.hp <= 0) this.die();
  }
  die() {
    const p = this.player; if (!p || p.dead || this.state !== 'play') return;
    p.dead = true; p.deadT = 1.1; this.lives = Math.max(0, this.lives - 1);
    this.burst(p.x + p.w / 2, p.y + p.h / 2, p.color || '#ff4d00', 30, 280); this.burst(p.x + p.w / 2, p.y + p.h / 2, '#ffffff', 10, 160);
    PX.Audio.sfx('die'); this.shake(.4, 9);
    this.say(this.lives > 0 ? 'OUCH! ' + this.lives + (this.lives === 1 ? ' life' : ' lives') + ' left' : 'NO LIVES LEFT', 1.3);
  }
  respawn() {
    const p = this.player; p.dead = false; p.x = this.spawn.x; p.y = this.spawn.y; p.vx = p.vy = 0; p.hp = p.maxHp; p.inv = 1.6; p.ground = null; p.sx = 1.3; p.sy = .7;
    this.burst(p.x + p.w / 2, p.y + p.h / 2, '#ffffff', 16, 140);
  }
  addScore(n, at) { this.score += n; if (at && n) this.texts.push({ x: at.x + at.w / 2, y: at.y, s: (n > 0 ? '+' : '') + n, life: .9, c: n > 0 ? '#ffd84a' : '#ff3b3b' }); }
  say(s, d = 2.4) { this.msg = { s: String(s).slice(0, 80), t: d, max: d }; }
  shake(t, a) { this.shakeT = Math.max(this.shakeT, t); this.shakeA = Math.max(this.shakeA * (this.shakeT > 0 ? 1 : 0), a); }
  spawnType(type, at) {
    if (!PX.ASSETS[type]) return null;
    if (this.ents.filter(e => e.alive && e.spawned).length > 150) return null;
    const proto = this.src.entities.find(e => e.type === type) || PX.newEntity(type);
    const e = this.mk(Object.assign(PX.clone(proto), { id: 's' + (++this.sid), x: at.x - proto.w / 2, y: at.y - proto.h / 2 }));
    e.spawned = true; e.ox = e.x; e.oy = e.y;
    this.ents.push(e); if (e.phys.solid) this.solids.push(e);
    if (e.comps.collectible && e.comps.collectible.counts) this.total++;
    this.burst(at.x, at.y, '#b07aff', 14, 160);
    return e;
  }
  where(w, ctx) {
    const p = this.player;
    if (w === 'spawner') { const sp = this.ents.filter(e => e.alive && e.group === 'spawner'); if (sp.length) return ctr(sp[Math.floor(Math.random() * sp.length)]); }
    if (w === 'self' && ctx.self && ctx.self.w) return ctr(ctx.self);
    if (w === 'other' && ctx.other && ctx.other.w) return ctr(ctx.other);
    if (w === 'checkpoint') return { x: this.spawn.x + (p ? p.w / 2 : 0), y: this.spawn.y + (p ? p.h / 2 : 0) };
    if (w === 'start' && p) return { x: p.ox + p.w / 2, y: p.oy + p.h / 2 };
    if (w === 'player' && p) return { x: p.x + p.w / 2 + (Math.random() - .5) * 160, y: p.y - 80 };
    return { x: this.cam.x + Math.random() * this.vw, y: this.cam.y + 40 };
  }

  /* -------------------------------------------------------------- rules */
  match(e, sel) {
    if (!e || !sel) return false;
    if (sel === 'any') return true;
    if (sel === 'player') return !!e.isPlayer;
    if (sel === 'bullet') return !!e.isBullet;
    if (sel.startsWith('t:')) return e.type === sel.slice(2);
    return e.group === sel;
  }
  ruleTouch(A, B) {
    (this.P.rules || []).forEach((r, i) => {
      if (r.off || !r.ev || r.ev.type !== 'touch') return;
      if (this.match(A, r.ev.a) && this.match(B, r.ev.b)) this.run(r, i, { self: A, other: B });
      else if (this.match(B, r.ev.a) && this.match(A, r.ev.b)) this.run(r, i, { self: B, other: A });
    });
  }
  event(type, e) {
    (this.P.rules || []).forEach((r, i) => {
      if (r.off || !r.ev || r.ev.type !== type) return;
      if (type === 'destroyed' && !this.match(e, r.ev.a)) return;
      this.run(r, i, { self: e });
    });
  }
  val(v) {
    switch (v) {
      case 'score': return this.score; case 'lives': return this.lives; case 'time': return Math.ceil(this.time);
      case 'collected': return this.collected; case 'left': return this.total - this.collected;
      case 'enemies': return this.ents.filter(e => e.alive && e.group === 'enemy').length;
    } return 0;
  }
  compareRules() {
    (this.P.rules || []).forEach((r, i) => {
      if (r.off || !r.ev || r.ev.type !== 'compare' || this.state !== 'play') return;
      const v = this.val(r.ev.v), n = +r.ev.n, op = r.ev.op;
      const ok = op === '>=' ? v >= n : op === '<=' ? v <= n : op === '>' ? v > n : op === '<' ? v < n : v === n;
      if (ok && !this.rs[i].was) this.run(r, i, { self: this.player });
      this.rs[i].was = ok;
    });
  }
  run(r, i, ctx) {
    if (this.state !== 'play') return;
    this.ruleCount[i] = (this.ruleCount[i] || 0) + 1;
    if (this.opts.onRule) this.opts.onRule(i, r);
    for (const a of r.acts || []) { if (this.state !== 'play') break; this.act(a, ctx); }
  }
  act(a, ctx) {
    const p = this.player, n = +a.n || 0;
    switch (a.type) {
      case 'score': this.addScore(n, ctx.other && ctx.other.w ? ctx.other : (ctx.self && ctx.self.w ? ctx.self : null)); break;
      case 'time': this.time += n; this.say((n >= 0 ? '+' : '') + n + 's', 1); break;
      case 'lives': this.lives = Math.max(0, n | 0); if (!this.lives) this.lose('OUT OF LIVES'); break;
      case 'addlife': this.lives++; break;
      case 'loselife': this.die(); break;
      case 'destroy': {
        const t = a.a || 'other';
        if (t === 'other') this.remove(ctx.other && !ctx.other.isBullet ? ctx.other : null);
        else if (t === 'self') this.remove(ctx.self && !ctx.self.isBullet ? ctx.self : null);
        else if (t.startsWith('all:')) this.ents.filter(e => e.alive && !e.isPlayer && this.match(e, t.slice(4))).forEach(e => this.remove(e));
        break;
      }
      case 'spawn': this.spawnType(a.s, this.where(a.b, ctx)); break;
      case 'sound': PX.Audio.sfx(a.s); break;
      case 'message': this.say(a.s || ''); break;
      case 'win': this.win(); break;
      case 'lose': this.lose(); break;
      case 'teleport': {
        const who = a.a === 'other' ? ctx.other : a.a === 'self' ? ctx.self : p;
        if (!who || !who.w || who.isBullet) break;
        const d = this.where(a.b || 'checkpoint', ctx); this.burst(who.x + who.w / 2, who.y + who.h / 2, '#b07aff', 12, 140);
        who.x = d.x - who.w / 2; who.y = d.y - who.h / 2; who.vx = who.vy = 0; break;
      }
      case 'speed': {
        const f = clamp(n || 1, .1, 5), who = a.a || 'player';
        const list = who === 'enemies' ? this.ents.filter(e => e.alive && e.group === 'enemy') : [who === 'other' ? ctx.other : who === 'self' ? ctx.self : p];
        list.forEach(e => { if (e && e.w && !e.isBullet) e.spd = clamp((e.spd || 1) * f, .1, 6); });
        break;
      }
      case 'shake': this.shake(.35, 8); break;
      case 'respawn': if (p && !p.dead) { p.x = this.spawn.x; p.y = this.spawn.y; p.vx = p.vy = 0; p.inv = Math.max(p.inv, .8); } break;
    }
  }
  win(msg) { if (this.state !== 'play') return; this.state = 'win'; this.endMsg = msg || 'YOU WIN!'; this.end(); }
  lose(msg) { if (this.state !== 'play') return; this.state = 'lose'; this.endMsg = msg || 'GAME OVER'; this.end(); }
  end() {
    PX.Audio.stopMusic(); PX.Audio.sfx(this.state === 'win' ? 'win' : 'lose'); this.endT = 0;
    if (this.state === 'win') for (let i = 0; i < 90; i++) this.parts.push({ x: this.cam.x + Math.random() * this.vw, y: this.cam.y - 10 - Math.random() * 80, vx: (Math.random() - .5) * 120, vy: 60 + Math.random() * 160, life: 3, max: 3, c: ['#ff4d00', '#ffd84a', '#4ab4ff', '#6ee06e', '#ff6ab8', '#fff'][i % 6], s: 4, g: 60, rot: Math.random() * 6 });
    const res = { result: this.state, msg: this.endMsg, score: this.score, time: +this.t.toFixed(1), lives: this.lives };
    this.result = res;
    this.log((this.state === 'win' ? '★ WIN — ' : '✖ LOSE — ') + this.endMsg + ' · score ' + this.score + ' · ' + this.t.toFixed(1) + 's', this.state === 'win' ? 'ok' : 'warn');
    if (this.opts.onEnd) this.opts.onEnd(res);
    if (this.opts.host) this.showEnd();
  }
  showEnd() {
    const o = this.overlay = document.createElement('div'); o.className = 'pg-end ' + this.state;
    const best = this.bestScore();
    o.innerHTML = `<div class="pg-card"><p class="pg-eyebrow">${this.state === 'win' ? 'LEVEL CLEAR' : 'TRY AGAIN'}</p><h2>${this.state === 'win' ? 'YOU WIN' : 'GAME OVER'}</h2><p class="pg-msg"></p>
      <div class="pg-stats"><div><b>${this.score}</b><span>score</span></div><div><b>${this.t.toFixed(1)}s</b><span>time</span></div><div><b>${best}</b><span>best</span></div></div><div class="pg-btns"></div><p class="pg-hint">Press <kbd>R</kbd> to restart</p></div>`;
    o.querySelector('.pg-msg').textContent = this.endMsg;
    const btns = o.querySelector('.pg-btns');
    const add = (label, fn, cls) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'pg-btn ' + (cls || ''); b.textContent = label; b.onclick = fn; btns.append(b); };
    add('Play again', () => this.restart(), 'primary');
    (this.opts.endButtons || []).forEach(b => add(b.label, b.fn));
    this.opts.host.append(o);
  }
  bestScore() {
    const k = 'pxd_builder_best_' + (this.src.id || 'x'); let b = 0;
    try { b = +localStorage.getItem(k) || 0; if (this.score > b) { b = this.score; localStorage.setItem(k, b); } } catch (e) { /* ignore */ }
    return b;
  }

  /* -------------------------------------------------------------- fx */
  burst(x, y, c, n, sp, sparkle) {
    for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, v = sp * (.3 + Math.random() * .7); this.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (sparkle ? 40 : 0), life: .45 + Math.random() * .4, max: .85, c, s: sparkle ? 3 : 2 + Math.random() * 3, g: this.mode === 'platformer' ? 500 : 0, star: sparkle && i % 3 === 0 }); }
    if (this.parts.length > 900) this.parts.splice(0, this.parts.length - 900);
  }
  dust(e, n) { for (let i = 0; i < n; i++) this.parts.push({ x: e.x + e.w / 2 + (Math.random() - .5) * e.w, y: e.y + e.h - 2, vx: (Math.random() - .5) * 140, vy: -Math.random() * 60, life: .35 + Math.random() * .2, max: .55, c: 'rgba(255,255,255,.75)', s: 3 + Math.random() * 3, g: 0, dust: true }); }
  fx(dt) {
    for (const q of this.parts) { q.life -= dt; if (q.squash) continue; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += (q.g || 0) * dt; if (q.dust) { q.vx *= .9; q.s += dt * 6; } }
    this.parts = this.parts.filter(q => q.life > 0);
    for (const t of this.texts) { t.life -= dt; t.y -= 40 * dt; } this.texts = this.texts.filter(t => t.life > 0);
    if (this.msg) { this.msg.t -= dt; if (this.msg.t <= 0) this.msg = null; }
    if (this.banner) { this.banner.t -= dt; if (this.banner.t <= 0) this.banner = null; }
    if (this.shakeT > 0) this.shakeT -= dt; else this.shakeA = 0;
    if (this.flash > 0) this.flash -= dt;
    for (const e of this.ents) if (e.open && e.openT < 1) e.openT += dt * 2.5;
  }
  updCam(dt, snap) {
    const tgt = this.ents.find(e => e.alive && e.comps.followCam && !e.dead) || this.player;
    const fc = (tgt && tgt.comps.followCam) || { smooth: 6, lookahead: 40, zoom: 1 };
    this.zoom = clamp(+fc.zoom || 1, .3, 4); this.measure();
    const vw = this.vw, vh = this.vh;
    if (!tgt) { this.cam.x = (this.LW - vw) / 2; this.cam.y = (this.LH - vh) / 2; return; }
    this.cam.la += ((tgt.face || 1) * (+fc.lookahead || 0) - this.cam.la) * Math.min(1, 2.5 * dt);
    let tx = tgt.x + tgt.w / 2 + this.cam.la - vw / 2, ty = tgt.y + tgt.h / 2 - vh * (this.mode === 'platformer' ? .56 : .5);
    tx = this.LW <= vw ? (this.LW - vw) / 2 : clamp(tx, 0, this.LW - vw);
    ty = this.LH <= vh ? (this.LH - vh) / 2 : clamp(ty, 0, this.LH - vh);
    if (snap) { this.cam.x = tx; this.cam.y = ty; return; }
    const k = 1 - Math.exp(-(+fc.smooth || 6) * dt);
    this.cam.x += (tx - this.cam.x) * k; this.cam.y += (ty - this.cam.y) * k;
  }

  /* -------------------------------------------------------------- render */
  draw() {
    const ctx = this.ctx, W = this.cv.width, H = this.cv.height, sc = this.scale, S = this.S, t = this.t;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
    let sx = 0, sy = 0; if (this.shakeT > 0) { sx = (Math.random() - .5) * this.shakeA * 2; sy = (Math.random() - .5) * this.shakeA * 2; }
    const cx = Math.round((this.cam.x + sx) * sc) / sc, cy = Math.round((this.cam.y + sy) * sc) / sc;
    R.drawSky(ctx, S, W, H);
    const td = this.mode !== 'platformer';
    if (!(td && R.skyOf(S).floor)) R.drawParallax(ctx, S, W, H, cx, cy, sc, t, this.LH);
    ctx.setTransform(sc, 0, 0, sc, -cx * sc, -cy * sc);
    if (td && R.skyOf(S).floor) R.drawFloor(ctx, S, this.LW, this.LH);
    else if (td && !S.parallax.length) { ctx.strokeStyle = 'rgba(255,255,255,.03)'; ctx.lineWidth = 1; ctx.beginPath(); for (let x = 0; x <= this.LW; x += T) { ctx.moveTo(x, 0); ctx.lineTo(x, this.LH); } for (let y = 0; y <= this.LH; y += T) { ctx.moveTo(0, y); ctx.lineTo(this.LW, y); } ctx.stroke(); }
    const vx0 = cx - 64, vx1 = cx + this.vw + 64, vy0 = cy - 64, vy1 = cy + this.vh + 64;
    const vis = e => e.alive && !(e.x > vx1 || e.x + e.w < vx0 || e.y > vy1 || e.y + e.h < vy0);
    const list = R.sorted(this.ents.filter(vis));
    // shadows
    ctx.fillStyle = 'rgba(0,0,0,.28)';
    for (const e of list) {
      if (e.layer === 'back' || e.group === 'decor' || e.open) continue;
      if (e.phys.solid && !e.moving && !td) { ctx.fillRect(e.x + 5, e.y + 6, e.w, e.h); continue; }
      if (td) { if (e.phys.solid) ctx.fillRect(e.x + 6, e.y + 8, e.w, e.h); else this.ell(ctx, e.x + e.w / 2 + 3, e.y + e.h - 1, e.w * .42, e.h * .14, .3); continue; }
      if (e.isPlayer && e.dead) continue;
      const gy = this.groundBelow(e); if (gy == null) continue;
      const d = gy - (e.y + e.h); if (d > 220) continue;
      const k = 1 - d / 220; this.ell(ctx, e.x + e.w / 2, gy, e.w * .45 * (.5 + .5 * k), 3.5 * (.5 + .5 * k), .32 * k);
    }
    // entities
    for (const e of list) {
      if (e.isPlayer) continue;
      if (e.open) { if (e.openT >= 1) continue; ctx.save(); ctx.globalAlpha = 1 - e.openT; ctx.translate(0, -e.openT * 8); R.drawEntity(ctx, e, this.P, t, null); ctx.restore(); continue; }
      R.drawEntity(ctx, e, this.P, t, { sx: e.sx, sy: e.sy, face: e.face, lit: e.lit, springT: e.springT, flash: e.flashT });
    }
    // bullets
    for (const b of this.bullets) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = b.c; ctx.globalAlpha = .35;
      ctx.beginPath(); ctx.arc(b.x + b.w / 2, b.y + b.h / 2, b.w, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(b.x + b.w / 2, b.y + b.h / 2, b.w / 2, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(b.x + b.w / 2, b.y + b.h / 2, b.w / 4, 0, 7); ctx.fill(); ctx.restore();
    }
    // player
    const p = this.player;
    if (p && p.alive && !p.dead && !(p.inv > 0 && Math.floor(t * 20) % 2 === 0)) {
      if (this.power.shield > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const r = Math.max(p.w, p.h) * .8 + Math.sin(t * 10) * 1.5; const g = ctx.createRadialGradient(p.x + p.w / 2, p.y + p.h / 2, r * .4, p.x + p.w / 2, p.y + p.h / 2, r); g.addColorStop(0, 'rgba(176,122,255,0)'); g.addColorStop(.8, 'rgba(176,122,255,.35)'); g.addColorStop(1, 'rgba(176,122,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x + p.w / 2, p.y + p.h / 2, r, 0, 7); ctx.fill(); ctx.restore(); }
      if (this.power.speed > 0 && Math.abs(p.vx) > 50) { ctx.globalAlpha = .25; R.drawEntity(ctx, Object.assign({}, p, { x: p.x - p.vx * .03 }), this.P, t, { sx: p.sx, sy: p.sy, face: p.face }); ctx.globalAlpha = 1; }
      R.drawEntity(ctx, p, this.P, t, { sx: p.sx, sy: p.sy, face: p.face, tilt: p.tilt });
    }
    // particles
    for (const q of this.parts) {
      const a = Math.max(0, q.life / q.max);
      if (q.squash) { ctx.globalAlpha = a; ctx.fillStyle = q.c || '#fff'; ctx.fillRect(q.x, q.y, q.w, q.h); continue; }
      ctx.globalAlpha = q.dust ? a * .5 : a; ctx.fillStyle = q.c;
      if (q.star) { ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(t * 6); ctx.fillRect(-q.s, -.6, q.s * 2, 1.2); ctx.fillRect(-.6, -q.s, 1.2, q.s * 2); ctx.restore(); }
      else if (q.dust) { ctx.beginPath(); ctx.arc(q.x, q.y, q.s, 0, 7); ctx.fill(); }
      else ctx.fillRect(q.x - q.s / 2, q.y - q.s / 2, q.s, q.s);
    }
    ctx.globalAlpha = 1;
    // floating texts
    ctx.textAlign = 'center'; ctx.font = '700 10px "JetBrains Mono", monospace';
    for (const tx of this.texts) { ctx.globalAlpha = Math.min(1, tx.life * 2); ctx.fillStyle = '#000'; ctx.fillText(tx.s, tx.x + 1, tx.y + 1); ctx.fillStyle = tx.c; ctx.fillText(tx.s, tx.x, tx.y); }
    ctx.globalAlpha = 1;
    // signs
    if (p && !p.dead) for (const e of list) if (e.group === 'sign' && e.props.text && Math.abs(ctr(e).x - ctr(p).x) < 72 && Math.abs(ctr(e).y - ctr(p).y) < 72) this.bubble(ctx, e.x + e.w / 2, e.y - 6, e.props.text);
    // ---------- screen space
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.max(W, H) * .75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.38)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    if (this.flash > 0) { ctx.globalAlpha = Math.min(.35, this.flash); ctx.fillStyle = this.flashC || '#fff'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
    this.hud(ctx, W, H);
  }
  ell(ctx, x, y, rx, ry, a) { ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(x, y, Math.max(1, rx), Math.max(.5, ry), 0, 0, 7); ctx.fill(); ctx.restore(); }
  groundBelow(e) {
    const x0 = e.x + 2, x1 = e.x + e.w - 2, y = e.y + e.h - 1; let best = null;
    for (const s of this.solids) { if (!s.alive || s.open || s === e) continue; if (s.x > x1 || s.x + s.w < x0 || s.y < y) continue; if (best == null || s.y < best) best = s.y; }
    return best;
  }
  bubble(ctx, x, y, text) {
    ctx.save(); ctx.font = '600 9px "JetBrains Mono", monospace';
    const words = text.split(' '), lines = []; let cur = '';
    for (const w of words) { const tt = cur ? cur + ' ' + w : w; if (ctx.measureText(tt).width > 150 && cur) { lines.push(cur); cur = w; } else cur = tt; } if (cur) lines.push(cur);
    const w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 16, h = lines.length * 12 + 10;
    ctx.fillStyle = 'rgba(0,0,0,.82)'; ctx.strokeStyle = '#ff4d00'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.rect(x - w / 2, y - h - 6, w, h); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 5, y - 6); ctx.lineTo(x, y); ctx.lineTo(x + 5, y - 6); ctx.fill();
    ctx.fillStyle = '#f2f2f2'; ctx.textAlign = 'center'; lines.forEach((l, i) => ctx.fillText(l, x, y - h - 6 + 15 + i * 12));
    ctx.restore();
  }
  hud(ctx, W, H) {
    const u = Math.max(1, Math.min(W / 640, H / 400)), S = this.S, pad = 14 * u;
    if (this.opts.preview) return;
    ctx.save(); ctx.textBaseline = 'top';
    const panel = (x, y, w, h) => { ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 1; ctx.strokeRect(x + .5, y + .5, w - 1, h - 1); };
    // score
    panel(pad, pad, 150 * u, 46 * u);
    ctx.fillStyle = '#7a7a7a'; ctx.font = `700 ${8 * u}px "JetBrains Mono", monospace`; ctx.textAlign = 'left'; ctx.fillText('SCORE' + (S.win === 'score' ? ' / ' + S.winScore : ''), pad + 10 * u, pad + 7 * u);
    ctx.fillStyle = '#f2f2f2'; ctx.font = `${22 * u}px Anton, Impact, sans-serif`; ctx.fillText(String(this.score).padStart(5, '0'), pad + 10 * u, pad + 17 * u);
    // lives
    const heart = R.sprite('heart');
    const lx = pad + 160 * u; panel(lx, pad, Math.max(60, 26 + Math.min(this.lives, 6) * 18) * u, 46 * u);
    ctx.fillStyle = '#7a7a7a'; ctx.font = `700 ${8 * u}px "JetBrains Mono", monospace`; ctx.fillText('LIVES', lx + 10 * u, pad + 7 * u);
    for (let i = 0; i < Math.min(this.lives, 6); i++) ctx.drawImage(heart, lx + (8 + i * 18) * u, pad + 19 * u, 16 * u, 16 * u);
    if (this.lives > 6) { ctx.fillStyle = '#f2f2f2'; ctx.fillText('+' + (this.lives - 6), lx + 116 * u, pad + 24 * u); }
    // time
    const tw = 120 * u, tx = W / 2 - tw / 2, low = this.time < 10;
    panel(tx, pad, tw, 46 * u);
    ctx.textAlign = 'center'; ctx.fillStyle = '#7a7a7a'; ctx.font = `700 ${8 * u}px "JetBrains Mono", monospace`; ctx.fillText('TIME', W / 2, pad + 7 * u);
    const tt = Math.max(0, Math.ceil(this.time)), mm = Math.floor(tt / 60), ss = String(tt % 60).padStart(2, '0');
    ctx.fillStyle = low ? (Math.floor(this.t * 4) % 2 ? '#ff3b3b' : '#ffd84a') : '#f2f2f2'; ctx.font = `${22 * u}px Anton, Impact, sans-serif`; ctx.fillText(mm + ':' + ss, W / 2, pad + 17 * u);
    ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(tx, pad + 46 * u - 3 * u, tw, 3 * u);
    ctx.fillStyle = low ? '#ff3b3b' : '#ff4d00'; ctx.fillRect(tx, pad + 46 * u - 3 * u, tw * clamp(this.time / (+S.timeLimit || 120), 0, 1), 3 * u);
    // right: goal progress / keys / powers
    ctx.textAlign = 'right'; let rx = W - pad;
    const items = [];
    if (this.total > 0) items.push(['coin', this.collected + '/' + this.total]);
    for (const k in this.keys) if (this.keys[k] > 0) items.push(['key', '×' + this.keys[k], PX.KEY_COLORS[k]]);
    if (items.length) {
      const w = items.length * 66 * u + 10 * u; panel(rx - w, pad, w, 46 * u);
      items.forEach((it, i) => {
        const x = rx - w + 8 * u + i * 66 * u; let img = R.sprite(it[0]); if (it[2] && it[2] !== '#ffd84a') img = R.tinted(img, it[2], 'hudkey' + it[2]);
        ctx.drawImage(img, x, pad + 13 * u, 20 * u, 20 * u); ctx.textAlign = 'left'; ctx.fillStyle = '#f2f2f2'; ctx.font = `${15 * u}px Anton, Impact, sans-serif`; ctx.fillText(it[1], x + 24 * u, pad + 15 * u);
      });
      rx -= w + 8 * u;
    }
    let py = pad + 54 * u;
    for (const k of ['speed', 'jump', 'shield']) {
      if (!(this.power[k] > 0)) continue;
      const x = W - pad - 120 * u; panel(x, py, 120 * u, 22 * u);
      ctx.drawImage(R.sprite('pw_' + k), x + 4 * u, py + 3 * u, 16 * u, 16 * u);
      ctx.textAlign = 'left'; ctx.fillStyle = '#f2f2f2'; ctx.font = `700 ${8 * u}px "JetBrains Mono", monospace`; ctx.fillText(k.toUpperCase(), x + 24 * u, py + 4 * u);
      ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(x + 24 * u, py + 15 * u, 88 * u, 3 * u);
      ctx.fillStyle = ({ speed: '#4ab4ff', jump: '#6ee06e', shield: '#b07aff' })[k]; ctx.fillRect(x + 24 * u, py + 15 * u, 88 * u * this.power[k] / this.powerMax[k], 3 * u);
      py += 26 * u;
    }
    // message
    if (this.msg) {
      const a = Math.min(1, this.msg.t * 3, (this.msg.max - this.msg.t) * 8);
      ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.font = `${16 * u}px Anton, Impact, sans-serif`;
      const w = ctx.measureText(this.msg.s).width + 36 * u, y = H * .2;
      ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillRect(W / 2 - w / 2, y, w, 32 * u); ctx.fillStyle = '#ff4d00'; ctx.fillRect(W / 2 - w / 2, y, 3 * u, 32 * u);
      ctx.fillStyle = '#f2f2f2'; ctx.fillText(this.msg.s, W / 2, y + 7 * u); ctx.globalAlpha = 1;
    }
    if (this.banner && this.state === 'play') {
      const a = Math.min(1, this.banner.t * 2, (2.4 - this.banner.t) * 6); ctx.globalAlpha = a; ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, H * .38, W, 70 * u);
      ctx.fillStyle = '#f2f2f2'; ctx.font = `${30 * u}px Anton, Impact, sans-serif`; ctx.fillText(this.banner.text.toUpperCase(), W / 2, H * .38 + 9 * u);
      ctx.fillStyle = '#ff4d00'; ctx.font = `700 ${9 * u}px "JetBrains Mono", monospace`; ctx.fillText('GOAL · ' + this.banner.sub.toUpperCase(), W / 2, H * .38 + 50 * u);
      ctx.globalAlpha = 1;
    }
    if (this.paused && !this.opts.preview) { ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, 0, W, H); ctx.textAlign = 'center'; ctx.fillStyle = '#f2f2f2'; ctx.font = `${40 * u}px Anton, Impact, sans-serif`; ctx.fillText('PAUSED', W / 2, H / 2 - 20 * u); }
    if (this.state !== 'play' && !this.opts.host) { ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(0, 0, W, H); ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = `${40 * u}px Anton, Impact, sans-serif`; ctx.fillText(this.state === 'win' ? 'YOU WIN' : 'GAME OVER', W / 2, H / 2 - 20 * u); }
    ctx.restore();
  }
}
PX.Game = Game;
})();
