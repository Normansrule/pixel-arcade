// End-to-end online play: two browser tabs link through a local signaling server (tools/signal-server.js) and play
// a lockstep 2-player game and a score duel. Needs Playwright with Chromium.  node tests/online.e2e.js
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path'), http = require('http'), fs = require('fs');
const ROOT = path.join(__dirname, '..'), SIG = 9137, WEB = 8137;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const web = http.createServer((q, r) => { let p = decodeURIComponent(new URL(q.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html'; const f = path.normalize(path.join(ROOT, p)); if (!f.startsWith(ROOT) || !fs.existsSync(f)) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
let fails = 0, sigProc = null; setTimeout(() => { console.log('FAIL timed out'); if (sigProc) sigProc.kill(); process.exit(1); }, 420000).unref();
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const sig = sigProc = spawn(process.execPath, [path.join(ROOT, 'tools', 'signal-server.js'), String(SIG)], { stdio: 'ignore' });
  await new Promise(r => web.listen(WEB, r)); await sleep(300);
  const browser = await chromium.launch({ args: ['--disable-features=LocalNetworkAccessChecks,BlockInsecurePrivateNetworkRequests,PrivateNetworkAccessRespectPreflightResults'] });
  const cfg = fs.readFileSync(path.join(ROOT, 'js/online/config.js'), 'utf8').replace(/signal:\{[^}]*\}/, `signal:{host:'127.0.0.1',port:${SIG},path:'/',key:'peerjs',secure:false}`).replace(/ice:\[[^\n]*\],\n/, 'ice:[],\n');
  const open = async () => { const ctx = await browser.newContext({ viewport: { width: 900, height: 640 }, serviceWorkers: 'block' }); const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon|404|net::/.test(m.text())) errs.push(m.text()); });
    await p.route('**/js/online/config.js', r => r.fulfill({ contentType: 'text/javascript', body: cfg }));
    // keep the page's real Content Security Policy, but allow the local test signaling server
    await p.route(/\/index\.html$/, r => r.fulfill({ contentType: 'text/html', body: fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').replace('connect-src ', `connect-src ws://127.0.0.1:${SIG} `) }));
    await p.goto(`http://127.0.0.1:${WEB}/index.html`); await p.waitForFunction(() => window.A && A.netLobby && A.games.length > 500); p.errs = errs; return p; };
  const host = await open(); console.log('host page loaded'); const guest = await open(); console.log('guest page loaded');
  // host makes a room
  await host.evaluate(() => A.netLobby()); await host.click('.netbox .nhot >> text=CREATE ROOM');
  await host.waitForSelector('.netbox .nroom', { timeout: 10000 }).catch(async e => { console.log('lobby text:', await host.textContent('.netbox .nb'), host.errs); throw e; }); const room = (await host.textContent('.netbox .nroom')).replace(/\s/g, '');
  ok(/^[A-Z2-9]{6}$/.test(room), 'host got room code ' + room);
  // a bad code is refused before any network call
  await guest.evaluate(() => A.netLobby()); await guest.fill('.netbox .ncode', 'bad!!'); await guest.click('.netbox .nhot >> text=JOIN');
  ok(/6 letters/.test(await guest.textContent('.netbox .nerr')), 'malformed room code rejected');
  // hostile name is cleaned before it is shown
  await guest.fill('.netbox .ninp[aria-label="Your name"]', '<img src=x onerror=alert(1)>\u202eBob'); await guest.dispatchEvent('.netbox .ninp[aria-label="Your name"]', 'change');
  await guest.fill('.netbox .ncode', room.toLowerCase().slice(0, 3) + '-' + room.slice(3)); await guest.click('.netbox .nhot >> text=JOIN');
  await host.waitForFunction(() => A.online.phase === 'linked' && A.online.rival, null, { timeout: 40000 });
  await guest.waitForFunction(() => A.online.phase === 'linked' && A.online.rival, null, { timeout: 40000 });
  const rn = await host.evaluate(() => A.online.rival.name);
  ok(!/[<>=()\u202e]/.test(rn) && [...rn].length <= 16, 'rival name sanitised: ' + JSON.stringify(rn));
  ok(await host.evaluate(() => !document.querySelector('.netbox img')), 'no HTML injected into the lobby');
  // chat, including an injection attempt, arrives as plain text
  await guest.fill('.netbox .nchat .ninp', '<b>hi</b> \u200bthere'); await guest.press('.netbox .nchat .ninp', 'Enter');
  await host.waitForFunction(() => document.querySelector('.netbox .nlog') && /hi/.test(document.querySelector('.netbox .nlog').textContent));
  ok(await host.evaluate(() => !document.querySelector('.netbox .nlog b b') && /<b>hi<\/b> there/.test(document.querySelector('.netbox .nlog').textContent)), 'chat shown as text');
  // raw garbage on the data channel is dropped, not executed
  await guest.evaluate(() => { const dc = A.online.dc; ['{"t":"go","game":"x;alert(1)","seed":1,"mode":"lock","delay":3,"n":1}', '{"t":"chat","text":"a","__proto__":{"x":1}}', 'not json', '{"t":"in","f":0,"k":[999]}', 'x'.repeat(5000)].forEach(s => dc.send(s)); });
  await sleep(500); ok(await host.evaluate(() => A.online.strikes >= 5 && A.online.phase === 'linked' && !A.online.match), 'malformed messages dropped and counted');
  // lockstep 2-player game
  await host.fill('.netbox input[type=search]', 'four in a row'); await host.click('.netbox .ngame >> nth=0');
  await guest.waitForFunction(() => A.online.match && A._e.state === 'play', null, { timeout: 10000 });
  const gid = await guest.evaluate(() => A._e.cur.id); ok(gid === 'four', 'guest started the same game: ' + gid);
  for (let i = 0; i < 6; i++) { await host.keyboard.press(i % 2 ? 'KeyD' : 'KeyS'); await sleep(250); await guest.keyboard.press(i % 2 ? 'ArrowLeft' : 'ArrowDown'); await sleep(250); }
  await host.waitForFunction(() => A.online.match && A.online.match.F > 300, null, { timeout: 60000 });
  await sleep(1500);
  const hs = await Promise.all([host, guest].map(p => p.evaluate(() => ({ F: A.online.match.F, desync: A.online.match.desync, h: window.PXSafe.stateHash(A._e.g.b || A._e.g) }))));
  ok(!hs[0].desync && !hs[1].desync, 'lockstep hashes matched (host F=' + hs[0].F + ', guest F=' + hs[1].F + ')');
  // a mouse-driven 2-player game: the host's pointer is part of the synced input
  await host.keyboard.press('Escape'); await guest.waitForFunction(() => !A.online.match, null, { timeout: 5000 });
  await host.evaluate(() => A._net.choose(A.games.find(g => g.id === 'melondrop'))); await guest.waitForFunction(() => A.online.match && A._e.state === 'play', null, { timeout: 10000 });
  const box = await host.locator('#scr').boundingBox();
  for (let i = 0; i < 8; i++) { await host.mouse.move(box.x + box.width * (.2 + .08 * i), box.y + box.height * .3); await host.mouse.down(); await sleep(120); await host.mouse.up(); await sleep(300); }
  await host.waitForFunction(() => A.online.match && A.online.match.F > 300, null, { timeout: 60000 }); await sleep(1500);
  const mh = await Promise.all([host, guest].map(p => p.evaluate(() => A.online.match.desync)));
  ok(!mh[0] && !mh[1], 'mouse game stays in sync (Melon Drop)');
  // back to lobby, then a score duel
  await host.keyboard.press('Escape'); await guest.waitForFunction(() => !A.online.match, null, { timeout: 5000 });
  ok(true, 'leaving the game ends it for both');
  await host.waitForSelector('.netbox input[type=search]'); const duelName = await host.evaluate(() => { const g = A.games.find(x => A.onlineMode(x) === 'duel' && x.id === 'snake') || A.games.find(x => A.onlineMode(x) === 'duel'); A._net.choose(g); return g.id; }); await guest.waitForFunction(() => A.online.match && A.online.match.mode === 'duel' && A._e.state === 'play', null, { timeout: 10000 });
  ok(true, 'score duel started: ' + duelName);
  await guest.evaluate(() => { A._e.g.score = 4321; }); await host.waitForFunction(() => A.online.match && A.online.match.rival.score === 4321, null, { timeout: 5000 });
  ok(true, 'rival score arrives live');
  await Promise.all([host, guest].map(p => p.evaluate(() => { A._e.g.over = 'TIME UP'; }))); await sleep(800);
  const head = await Promise.all([host, guest].map(p => p.evaluate(() => A._e.netInfo().head)));
  ok(head[1] === 'YOU WIN!' && head[0] === 'RIVAL WINS!', 'results card names the winner: ' + head.join(' / '));
  ok(!host.errs.length && !guest.errs.length, 'no hub page errors ' + JSON.stringify(host.errs.concat(guest.errs)).slice(0, 300));
  // 3D world hand-off: the host picks a world in the lobby, both pages open it and link again inside the world
  const perr = p => (p.perrs = [], p.on('pageerror', e => p.perrs.push(e.message)));
  [host, guest].forEach(perr);
  await Promise.all([host, guest].map(p => p.evaluate(() => A.close()))); await sleep(300);
  ok(await host.evaluate(() => A.onlineMode(A.games.find(g => g.id === 'orbitlab')) === 'world'), 'lobby offers 3D worlds');
  await Promise.all([host.waitForURL(/\/orbit\//, { timeout: 15000, waitUntil: 'domcontentloaded' }), guest.waitForURL(/\/orbit\//, { timeout: 15000, waitUntil: 'domcontentloaded' }), host.evaluate(() => A._net.choose(A.games.find(g => g.id === 'orbitlab')))]);
  ok(true, 'both browsers opened the world');
  await Promise.all([host, guest].map(p => p.waitForFunction(() => window.PXDuel && PXDuel.state().phase === 'linked' && PXDuel.state().rival, null, { timeout: 45000 }))).catch(async e => { for (const p of [host, guest]) console.log(p === host ? 'host' : 'guest', await p.evaluate(() => JSON.stringify([!!window.PXDuel && PXDuel.state(), document.querySelector('.pxd-p') && document.querySelector('.pxd-p').textContent])), p.perrs, p.errs); throw e; });
  ok(true, 'linked again inside the world');
  ok(await host.evaluate(() => PXDuel.state().rival) === rn, 'world duel keeps the cleaned rival name');
  await guest.evaluate(() => { const dc = PXDuel.dc(); ['{"t":"sc","n":5,"s":1,"done":true}', '{"t":"sc","n":1,"s":1e99,"done":true}', '{"t":"go","game":"x","seed":1,"mode":"lock","delay":3,"n":1}', '<script>', '{"t":"wh","world":"../../etc"}'].forEach(s => dc.send(s)); });
  await sleep(500); ok(await host.evaluate(() => { const s = PXDuel.state(); return s.strikes >= 4 && s.phase === 'linked' && s.theirs.length === 0; }), 'bad world messages dropped and counted');
  await host.evaluate(async () => (await import('/js/kit3d/score.js')).saveBest('orbitlab_test', 500));
  await guest.evaluate(async () => (await import('/js/kit3d/score.js')).saveBest('orbitlab_test', 800));
  await Promise.all([host, guest].map(p => p.waitForFunction(() => PXDuel.state().told === 1, null, { timeout: 5000 })));
  const bans = await Promise.all([host, guest].map(p => p.evaluate(() => document.querySelector('.pxd-ban b').textContent)));
  ok(/WINS/.test(bans[0]) && bans[1] === 'YOU WIN!', 'world round result shown: ' + bans.join(' / '));
  // a direct duel from the world's own menu, with no hub
  await Promise.all([host, guest].map(p => p.goto(`http://127.0.0.1:${WEB}/tumble/`, { waitUntil: 'domcontentloaded' })));
  // the worlds render 3D in software here, so the panel is driven from script rather than by simulated mouse clicks
  const press = (p, text) => p.evaluate(t => [...document.querySelectorAll('.pxd button')].find(b => b.textContent === t).click(), text);
  const type = (p, v) => p.evaluate(v => { const i = document.querySelector('.pxd-p input[aria-label="Room code"]'); i.value = v; }, v);
  const btnUp = p => p.waitForFunction(() => { const b = document.querySelector('.pxd-btn'); return b && !b.closest('[hidden]') && !b.hidden; }, null, { timeout: 30000, polling: 250 });
  await btnUp(host); await press(host, 'DUEL ONLINE'); await press(host, 'CREATE ROOM');
  const wroom = (await (await host.waitForFunction(() => { const c = document.querySelector('.pxd-code'); return c && c.textContent; }, null, { timeout: 15000, polling: 250 })).jsonValue()).replace(/\s/g, '');
  await btnUp(guest); await press(guest, 'DUEL ONLINE');
  await type(guest, 'zz'); await press(guest, 'JOIN');
  ok(/6 letters/.test(await guest.evaluate(() => document.querySelector('.pxd-err').textContent)), 'world rejects a malformed room code');
  await type(guest, wroom.toLowerCase()); await press(guest, 'JOIN');
  await Promise.all([host, guest].map(p => p.waitForFunction(() => PXDuel.state().phase === 'linked' && PXDuel.state().rival, null, { timeout: 45000 })));
  ok(true, 'world menu duel linked with room ' + wroom);
  ok(await host.evaluate(() => !document.querySelector('.pxd img, .pxd-chip img')), 'no HTML injected into the world duel panel');
  await press(guest, 'Leave duel'); await host.waitForFunction(() => PXDuel.state().phase === 'idle', null, { timeout: 15000, polling: 250 });
  ok(true, 'host sees the rival leave');
  ok(!host.perrs.length && !guest.perrs.length, 'no world script errors ' + JSON.stringify(host.perrs.concat(guest.perrs)).slice(0, 300));
  await browser.close(); sig.kill(); web.close();
  console.log(fails ? fails + ' online checks failed' : 'online e2e: all checks passed'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); if (sigProc) sigProc.kill(); process.exit(1); });
