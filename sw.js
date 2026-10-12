// Pixel Arcade service worker: installable app + offline play. Generated from sw.template.js by tools/make_pwa.py.
const VERSION = 'cbfd87c576';
const CORE = ["./", "index.html", "manifest.webmanifest", "style.css", "docs/icons/apple-touch-icon.png", "docs/icons/favicon-64.png", "docs/icons/icon-1024.png", "docs/icons/icon-192.png", "docs/icons/icon-512.png", "docs/icons/maskable-512.png", "fonts/OFL-Anton.txt", "fonts/OFL-JetBrainsMono.txt", "fonts/anton-400.woff2", "fonts/jetbrains-mono-400.woff2", "fonts/jetbrains-mono-700.woff2", "games/action.js", "games/action2.js", "games/action3.js", "games/advanced1.js", "games/advanced2.js", "games/arcade4.js", "games/arcade5.js", "games/board2.js", "games/cards.js", "games/classics1.js", "games/classics2.js", "games/classics3.js", "games/classics4.js", "games/finale.js", "games/misc6.js", "games/more.js", "games/party.js", "games/popular1.js", "games/popular2.js", "games/popular3.js", "games/popular4.js", "games/popular5.js", "games/puzzle.js", "games/puzzle2.js", "games/puzzle3.js", "games/puzzle4.js", "games/puzzle5.js", "games/retro4.js", "games/retro5.js", "games/sim.js", "games/solo.js", "games/space1.js", "games/sports1.js", "games/sports2.js", "games/sports3.js", "games/sports4.js", "games/sports5.js", "games/sports6.js", "games/tabletop.js", "games/threed.js", "games/threed2.js", "games/threed3.js", "games/threed4.js", "games/threed5.js", "games/versus2.js", "games/versus3.js", "games/versus4.js", "games/versus5.js", "js/fx3d.js", "js/gx.js", "js/hero.js", "js/trail.js", "js/engine/00-core.js", "js/engine/01-draw.js", "js/engine/02-pseudo3d.js", "js/engine/03-person.js", "js/engine/04-audio.js", "js/engine/05-fx.js", "js/engine/06-input.js", "js/engine/07-session.js", "js/engine/08-scores.js", "js/engine/09-clock.js", "js/engine/10-cards.js", "js/engine/11-loop.js", "js/engine/12-hub.js"];
const SHELL = 'pa-shell-' + VERSION, RUNTIME = 'pa-runtime';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('pa-shell-') && k !== SHELL).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// same-origin GETs: answer from cache straight away, refresh in the background (stale-while-revalidate)
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith((async () => {
    const hit = await caches.match(r, { ignoreSearch: u.pathname.endsWith('/') || u.pathname.endsWith('.html') });
    const net = fetch(r).then(async res => {
      if (res.ok && res.type === 'basic') { const c = await caches.open(hit && (await caches.open(SHELL).then(s => s.match(r))) ? SHELL : RUNTIME); c.put(r, res.clone()); }
      return res;
    }).catch(() => hit || (r.mode === 'navigate' ? caches.match('./') : Response.error()));
    return hit || net;
  })());
});
// "Save every game offline": the page sends {type:'cache-all', files:[...]} and gets progress messages back
self.addEventListener('message', e => {
  if (!e.data || e.data.type !== 'cache-all') return;
  const files = e.data.files || [], src = e.source;
  e.waitUntil((async () => {
    const c = await caches.open(RUNTIME); let done = 0, failed = 0;
    for (let i = 0; i < files.length; i += 8) {
      await Promise.all(files.slice(i, i + 8).map(async f => {
        try { if (!(await caches.match(f))) { const res = await fetch(f); if (res.ok) await c.put(f, res); else failed++; } } catch (_) { failed++; }
        done++;
      }));
      src && src.postMessage({ type: 'cache-progress', done, total: files.length, failed });
    }
    src && src.postMessage({ type: 'cache-done', done, total: files.length, failed });
  })());
});
