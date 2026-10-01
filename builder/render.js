/* Pixel Arcade Builder — shared renderer: sprites, entities, skies, parallax, thumbnails */
(function () {
'use strict';
const PX = window.PXB, T = PX.T;
const cache = new Map();
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

function pixelsToCanvas(px) {
  const c = mk(16, 16), x = c.getContext('2d'), id = x.createImageData(16, 16);
  for (let i = 0; i < 256; i++) {
    const h = px[i]; if (!h) continue;
    const n = parseInt(h.slice(1), 16);
    id.data[i * 4] = n >> 16 & 255; id.data[i * 4 + 1] = n >> 8 & 255; id.data[i * 4 + 2] = n & 255; id.data[i * 4 + 3] = 255;
  }
  x.putImageData(id, 0, 0); return c;
}
function spritePixels(key, P) {
  if (key && key.startsWith('c:')) { const sp = P && P.sprites && P.sprites[key.slice(2)]; return sp ? sp.px : PX.builtinPixels('crate'); }
  return PX.builtinPixels(key);
}
function sprite(key, P) {
  let ck = key;
  if (key.startsWith('c:')) { const sp = P && P.sprites && P.sprites[key.slice(2)]; ck = key + ':' + (sp ? sp.v || 0 : 'x'); }
  let c = cache.get(ck);
  if (!c) { c = pixelsToCanvas(spritePixels(key, P)); cache.set(ck, c); }
  return c;
}
function tinted(img, color, ck) {
  const k = ck + '|t' + color; let c = cache.get(k);
  if (!c) {
    c = mk(img.width, img.height); const x = c.getContext('2d');
    x.drawImage(img, 0, 0); x.globalCompositeOperation = 'multiply'; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
    x.globalCompositeOperation = 'destination-in'; x.drawImage(img, 0, 0);
    cache.set(k, c);
  }
  return c;
}
function spriteKeyOf(e) { const A = PX.ASSETS[e.type] || {}; return e.sprite || A.sprite || 'none'; }
function imgFor(e, P) {
  const key = spriteKeyOf(e); let img = sprite(key, P);
  if (e.tint && e.color) img = tinted(img, e.color, key + (key.startsWith('c:') ? (P.sprites[key.slice(2)] || {}).v : ''));
  if (e.type === 'door' || e.type === 'key') { const kc = PX.KEY_COLORS[(e.props || {}).color]; if (kc && e.props.color !== 'gold') img = tinted(img, kc, key + 'k'); }
  return img;
}
// tiled entities are pre-composited at native sprite resolution (no seams)
function tiledCanvas(e, P) {
  const key = spriteKeyOf(e); const cell = Math.max(4, Math.min(e.w, e.h, T));
  const cw = Math.ceil(e.w / cell), ch = Math.ceil(e.h / cell);
  const spv = key.startsWith('c:') ? ((P.sprites[key.slice(2)] || {}).v || 0) : '';
  const tc = e.tint ? e.color : '', kc = (e.type === 'door') ? (e.props || {}).color : '';
  const ck = 'T|' + key + spv + '|' + e.w + 'x' + e.h + '|' + tc + kc;
  let c = cache.get(ck); if (c) return c;
  const pw = Math.round(e.w / cell * 16), ph = Math.round(e.h / cell * 16);
  c = mk(Math.max(1, pw), Math.max(1, ph)); const x = c.getContext('2d');
  const base = imgFor(e, P);
  const below = (key === 'grass') ? (e.tint && e.color ? tinted(sprite('dirt'), e.color, 'dirt') : sprite('dirt')) : base;
  for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) x.drawImage(j === 0 ? base : below, i * 16, j * 16);
  if (cache.size > 1500) cache.clear();
  cache.set(ck, c); return c;
}

function shape(ctx, e) {
  const r = Math.min(6, e.w / 4, e.h / 4);
  ctx.fillStyle = e.color || '#ff4d00';
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(e.x, e.y, e.w, e.h, r) : ctx.rect(e.x, e.y, e.w, e.h); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(e.x + 2, e.y + 2, e.w - 4, Math.min(4, e.h / 4));
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(e.x + 2, e.y + e.h - Math.min(4, e.h / 4) - 2, e.w - 4, Math.min(4, e.h / 4));
}
function drawLava(ctx, e, t) {
  const g = ctx.createLinearGradient(0, e.y, 0, e.y + e.h);
  g.addColorStop(0, '#ffd84a'); g.addColorStop(.25, '#ff8a2a'); g.addColorStop(.7, '#ff4d00'); g.addColorStop(1, '#a01830');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(e.x, e.y + e.h);
  for (let x = 0; x <= e.w; x += 4) ctx.lineTo(e.x + x, e.y + 3 + Math.sin((e.x + x) * .09 + t * 3) * 2.2);
  ctx.lineTo(e.x + e.w, e.y + e.h); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,244,184,.85)';
  const n = Math.max(1, Math.floor(e.w / 40));
  for (let i = 0; i < n; i++) {
    const ph = (t * .6 + PX.hash2(i, e.id || 0)) % 1, bx = e.x + (i + .5) * e.w / n + Math.sin(t + i) * 6;
    const by = e.y + e.h - ph * (e.h - 4); ctx.globalAlpha = 1 - ph; ctx.beginPath(); ctx.arc(bx, by, 1.5 + ph * 2, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
function drawFlag(ctx, e, t, color, lit, small) {
  const px = e.x + e.w * .28, top = e.y + 2, bot = e.y + e.h;
  ctx.fillStyle = '#1a1424'; ctx.fillRect(px - 3, top, 6, bot - top);
  ctx.fillStyle = '#d8d8e4'; ctx.fillRect(px - 1.5, top, 3, bot - top);
  ctx.fillStyle = '#9a9ab0'; ctx.fillRect(e.x + e.w * .05, bot - 6, e.w * .5, 6);
  ctx.fillStyle = lit === false ? '#5c5c74' : '#ffd84a'; ctx.beginPath(); ctx.arc(px, top + 1, 4, 0, 7); ctx.fill();
  const fw = e.w * (small ? .95 : 1.25), fh = e.h * (small ? .26 : .34), fy = top + 5;
  ctx.fillStyle = lit === false ? '#5c5c74' : color;
  ctx.beginPath(); ctx.moveTo(px + 1, fy);
  const seg = 10;
  for (let i = 0; i <= seg; i++) { const u = i / seg; ctx.lineTo(px + 1 + u * fw, fy + Math.sin(u * 5 - t * 6) * 3 * u); }
  for (let i = seg; i >= 0; i--) { const u = i / seg; ctx.lineTo(px + 1 + u * fw, fy + fh + Math.sin(u * 5 - t * 6) * 3 * u); }
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.28)';
  ctx.beginPath(); ctx.moveTo(px + 1, fy); for (let i = 0; i <= seg; i++) { const u = i / seg; ctx.lineTo(px + 1 + u * fw, fy + Math.sin(u * 5 - t * 6) * 3 * u); }
  for (let i = seg; i >= 0; i--) { const u = i / seg; ctx.lineTo(px + 1 + u * fw, fy + fh * .35 + Math.sin(u * 5 - t * 6) * 3 * u); } ctx.closePath(); ctx.fill();
}

/* rt: runtime state {sx, sy, face, alpha, lit, springT, open, flash, tilt} */
function drawEntity(ctx, e, P, t, rt) {
  const A = PX.ASSETS[e.type] || {};
  const key = spriteKeyOf(e), isDef = !e.sprite || e.sprite === A.sprite;
  ctx.save();
  if (rt && rt.alpha != null) ctx.globalAlpha *= rt.alpha;
  if (key === 'none') { shape(ctx, e); ctx.restore(); return; }
  if (isDef && A.draw === 'lava') drawLava(ctx, e, t);
  else if (isDef && A.draw === 'flag') drawFlag(ctx, e, t, e.color || '#ff4d00', true, false);
  else if (isDef && A.draw === 'checkpoint') drawFlag(ctx, e, rt && rt.lit ? t : 0, rt && rt.lit ? '#3ddc84' : e.color, rt ? !!rt.lit : true, true);
  else if (isDef && A.draw === 'neon') {
    const r = Math.min(8, e.w / 3, e.h / 3), x = e.x + 3, y = e.y + 3, w = e.w - 6, h = e.h - 6;
    ctx.fillStyle = '#0d0726'; ctx.fillRect(e.x, e.y, e.w, e.h);
    const rr = () => { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); };
    ctx.strokeStyle = e.color || '#4ab4ff'; ctx.globalAlpha *= .25; ctx.lineWidth = 6; rr(); ctx.stroke();
    ctx.globalAlpha *= 4; ctx.lineWidth = 2; rr(); ctx.stroke();
    ctx.strokeStyle = 'rgba(220,245,255,.8)'; ctx.lineWidth = .75; rr(); ctx.stroke();
  }
  else if (A.tile) {
    const img = tiledCanvas(e, P);
    ctx.drawImage(img, e.x, e.y, e.w, e.h);
  } else {
    const img = imgFor(e, P);
    let sx = rt && rt.sx || 1, sy = rt && rt.sy || 1, oy = 0, rot = rt && rt.tilt || 0;
    if (isDef || key.startsWith('c:')) {
      if (A.draw === 'spin') { sx *= Math.max(.18, Math.abs(Math.cos(t * 2.6 + e.x * .013))); oy = Math.sin(t * 3 + e.x * .05) * 2; }
      else if (A.draw === 'bob') oy = Math.sin(t * 3 + e.x * .05) * 3;
      else if (A.draw === 'spring' && rt && rt.springT > 0) sy *= 1 - .45 * Math.sin(Math.min(1, rt.springT / .25) * Math.PI);
    }
    const flip = ((rt && rt.face < 0) ? 1 : 0) ^ (e.flip ? 1 : 0);
    const cx = e.x + e.w / 2, by = e.y + e.h;
    ctx.translate(cx, by + oy);
    if (A.draw === 'spin2') { ctx.translate(0, -e.h / 2); ctx.rotate(t * 2); ctx.translate(0, e.h / 2); }
    if (rot) { ctx.translate(0, -e.h / 2); ctx.rotate(rot); ctx.translate(0, e.h / 2); }
    ctx.scale(flip ? -sx : sx, sy);
    ctx.drawImage(img, -e.w / 2, -e.h, e.w, e.h);
    if (rt && rt.flash > 0) { ctx.globalCompositeOperation = 'source-atop'; ctx.globalAlpha = Math.min(1, rt.flash * 6); ctx.fillStyle = '#fff'; ctx.fillRect(-e.w / 2, -e.h, e.w, e.h); }
  }
  ctx.restore();
}

/* ---------------------------------------------------------------- sky + parallax (screen space) */
function skyOf(S) { return PX.SKIES[S.sky] || PX.SKIES.day; }
function drawSky(ctx, S, W, H) {
  const sk = skyOf(S), g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, sk.c[0]); g.addColorStop(.55, sk.c[1]); g.addColorStop(1, sk.c[2]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function vnoise(x, seed) { const i = Math.floor(x), f = x - i, a = PX.hash2(i, seed), b = PX.hash2(i + 1, seed), u = f * f * (3 - 2 * f); return a + (b - a) * u; }
function mix(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const r = (pa >> 16) + ((pb >> 16) - (pa >> 16)) * t, g = (pa >> 8 & 255) + ((pb >> 8 & 255) - (pa >> 8 & 255)) * t, bl = (pa & 255) + ((pb & 255) - (pa & 255)) * t;
  return `rgb(${r | 0},${g | 0},${bl | 0})`;
}
// camX/camY in world px, scale = screen px per world px, LW/LH level px
function drawParallax(ctx, S, W, H, camX, camY, scale, t, LH) {
  const sk = skyOf(S), layers = S.parallax || [];
  const vh = H / scale, maxY = Math.max(0, LH - vh), yrel = (camY - maxY) * scale; // 0 at bottom of level, negative above
  const L = n => layers.includes(n);
  if (sk.stars || L('stars')) {
    const amt = Math.max(sk.stars || 0, L('stars') ? 1 : 0); ctx.fillStyle = '#fff';
    const off = camX * scale * .05, offy = camY * scale * .05;
    for (let i = 0; i < 170 * amt; i++) {
      const per = W + 200, ph = H * 1.2;
      const sx = ((PX.hash2(i, 1) * per - off) % per + per) % per - 100;
      const sy = (((PX.hash2(i, 2) * ph - offy) % ph + ph) % ph) * (L('stars') ? 1 : .7);
      ctx.globalAlpha = (.55 + .45 * Math.abs(Math.sin(t * (1 + PX.hash2(i, 3) * 2) + i))) * (PX.hash2(i, 4) * .4 + .6);
      const big = PX.hash2(i, 5), u = Math.max(1, Math.round(H / 420)), s = (big > .82 ? 2 : 1) * u;
      ctx.fillRect(Math.round(sx), Math.round(sy), s, s);
      if (big > .96) { ctx.globalAlpha *= .5; ctx.fillRect(Math.round(sx) - 2 * u, Math.round(sy) + s / 2 - u / 2, s + 4 * u, u); ctx.fillRect(Math.round(sx) + s / 2 - u / 2, Math.round(sy) - 2 * u, u, s + 4 * u); }
    }
    ctx.globalAlpha = 1;
  }
  if (sk.nebula) {
    for (let i = 0; i < 3; i++) {
      const x = ((PX.hash2(i, 21) * W * 1.6 - camX * scale * .08) % (W * 1.6) + W * 1.6) % (W * 1.6) - W * .3, y = PX.hash2(i, 22) * H;
      const g = ctx.createRadialGradient(x, y, 0, x, y, H * .5); const col = ['rgba(154,74,224,', 'rgba(255,77,0,', 'rgba(74,180,255,'][i];
      g.addColorStop(0, col + '.16)'); g.addColorStop(1, col + '0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
  }
  if (L('planets')) {
    const ps = [[.2, .25, 60, '#ff8a2a', .06], [.75, .55, 120, '#4ab4ff', .1], [1.3, .2, 34, '#ff6ab8', .04]];
    ps.forEach(([px, py, r, c, f], i) => {
      const per = W + 400, x = ((px * per - camX * scale * f) % per + per) % per - 200, y0 = py * H - camY * scale * f * .5, y = ((y0 % (H * 1.4)) + H * 1.4) % (H * 1.4) - H * .2;
      const rr = r * Math.max(.6, scale * .7), g = ctx.createRadialGradient(x - rr * .35, y - rr * .35, rr * .1, x, y, rr); g.addColorStop(0, c); g.addColorStop(.75, mix(c, '#0a0420', .65)); g.addColorStop(1, '#0a0420');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rr, 0, 7); ctx.fill();
      if (i === 1) { ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = Math.max(1, rr * .06); ctx.beginPath(); ctx.ellipse(x, y, rr * 1.7, rr * .35, -.3, 0, 7); ctx.stroke(); }
    });
  }
  const ridge = (f, base, amp, freq, seed, color, step = 6) => {
    const off = camX * scale * f; ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, H);
    const by = H * base - yrel * f;
    for (let x = 0; x <= W + step; x += step) { const wx = (x + off) / (freq * scale + 40); const n = vnoise(wx, seed) * .7 + vnoise(wx * 2.3, seed + 7) * .3; ctx.lineTo(x, by - n * amp * H); }
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    return by;
  };
  if (L('mountains')) {
    ridge(.12, .72, .32, 70, 11, mix(sk.mtn, sk.c[2], .45), 8);
    ridge(.2, .78, .26, 50, 12, sk.mtn, 6);
  }
  if (L('city')) {
    const f = .25, off = camX * scale * f, by = H * .84 - yrel * f, bw = 26 * Math.max(1, scale * .8);
    for (let x = -((off % bw) + bw); x < W + bw; x += bw) {
      const i = Math.floor((x + off) / bw), hh = (.08 + PX.hash2(i, 31) * .22) * H;
      ctx.fillStyle = sk.city; ctx.fillRect(x, by - hh, bw - 3, hh + H);
      ctx.fillStyle = 'rgba(255,216,74,.35)';
      for (let wy = by - hh + 6; wy < by - 4; wy += 9) for (let wx = x + 4; wx < x + bw - 7; wx += 7) if (PX.hash2(Math.floor(wx), Math.floor(wy), i) > .62) ctx.fillRect(wx, wy, 3, 4);
    }
  }
  if (L('hills')) ridge(.35, .86, .14, 34, 21, sk.hill, 5);
  if (L('trees')) {
    const f = .5, off = camX * scale * f, by = H * .9 - yrel * f, tw = 22 * Math.max(1, scale * .7);
    ctx.fillStyle = sk.tree;
    for (let x = -((off % tw) + tw); x < W + tw; x += tw) {
      const i = Math.floor((x + off) / tw), hh = (.06 + PX.hash2(i, 41) * .08) * H;
      ctx.beginPath(); ctx.moveTo(x, by); ctx.lineTo(x + tw / 2, by - hh); ctx.lineTo(x + tw, by); ctx.fill();
    }
    ctx.fillRect(0, by - 1, W, H);
  }
  if (L('clouds')) {
    const f = .08; ctx.fillStyle = sk.cloud;
    for (let i = 0; i < 7; i++) {
      const per = W + 300, x = ((PX.hash2(i, 51) * per - camX * scale * f - t * (6 + i * 2)) % per + per) % per - 150;
      const y = (PX.hash2(i, 52) * .35 + .06) * H - yrel * f, s = (.6 + PX.hash2(i, 53) * .8) * Math.max(.8, scale);
      ctx.globalAlpha = .55 + PX.hash2(i, 54) * .3;
      ctx.beginPath(); ctx.ellipse(x, y, 42 * s, 13 * s, 0, 0, 7); ctx.ellipse(x - 22 * s, y + 3 * s, 22 * s, 10 * s, 0, 0, 7); ctx.ellipse(x + 14 * s, y - 8 * s, 24 * s, 14 * s, 0, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
// world-space floor for top-down levels
function drawFloor(ctx, S, LW, LH) {
  const sk = skyOf(S);
  ctx.fillStyle = sk.c[1]; ctx.fillRect(0, 0, LW, LH);
  ctx.fillStyle = sk.c[2]; ctx.globalAlpha = .35;
  for (let y = 0; y < LH; y += T) for (let x = (y / T % 2) * T; x < LW; x += T * 2) ctx.fillRect(x, y, T, T);
  ctx.globalAlpha = .18; ctx.fillStyle = sk.c[0];
  for (let i = 0; i < LW * LH / 3000; i++) { const x = PX.hash2(i, 61) * LW, y = PX.hash2(i, 62) * LH; ctx.fillRect(x, y, 2, 3); ctx.fillRect(x + 3, y + 1, 2, 2); }
  ctx.globalAlpha = 1;
}
function isTopdown(P) { const pl = P.entities.find(e => e.comps && e.comps.player); return pl ? pl.comps.player.mode !== 'platformer' : false; }
const LAYER_ORDER = { back: 0, main: 1, front: 2 };
function sorted(ents) { return ents.map((e, i) => [e, i]).sort((a, b) => (LAYER_ORDER[a[0].layer] || 1) - (LAYER_ORDER[b[0].layer] || 1) || ((a[0].comps && a[0].comps.player ? 1 : 0) - (b[0].comps && b[0].comps.player ? 1 : 0)) || a[1] - b[1]).map(x => x[0]); }

/* thumbnail of a project around the player start */
function thumb(P, w = 192, h = 108, t = 0) {
  const c = mk(w, h), ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false;
  const S = P.settings, LW = S.levelW * T, LH = S.levelH * T, td = isTopdown(P);
  const pl = P.entities.find(e => e.comps && e.comps.player);
  const vh = Math.min(S.viewH * T, LH) , scale = h / vh, vw = w / scale;
  let cx = pl ? pl.x + pl.w / 2 - vw * .35 : 0, cy = pl ? pl.y + pl.h / 2 - vh * .55 : 0;
  cx = LW <= vw ? (LW - vw) / 2 : Math.max(0, Math.min(LW - vw, cx)); cy = LH <= vh ? (LH - vh) / 2 : Math.max(0, Math.min(LH - vh, cy));
  drawSky(ctx, S, w, h);
  if (!(td && skyOf(S).floor)) drawParallax(ctx, S, w, h, cx, cy, scale, t, LH);
  ctx.save(); ctx.scale(scale, scale); ctx.translate(-cx, -cy);
  if (td) drawFloor(ctx, S, LW, LH);
  for (const e of sorted(P.entities)) { if (e.x > cx + vw || e.x + e.w < cx || e.y > cy + vh || e.y + e.h < cy) continue; drawEntity(ctx, e, P, t, null); }
  ctx.restore();
  return c;
}

PX.R = { sprite, tinted, imgFor, spriteKeyOf, pixelsToCanvas, spritePixels, drawEntity, drawSky, drawParallax, drawFloor, skyOf, isTopdown, sorted, thumb, mk, mix, cache };
})();
