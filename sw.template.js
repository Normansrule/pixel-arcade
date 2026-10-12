// Pixel Arcade service worker: installable app + offline play. Generated from sw.template.js by tools/make_pwa.py.
const VERSION = '__VERSION__';
const CORE = __CORE__;
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
