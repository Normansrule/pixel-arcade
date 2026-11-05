#!/usr/bin/env node
// Renders the top of the README: everything above "Play in 10 seconds".
//   docs/screenshot.png        the header still (also the social preview), from tools/readme_wall.html
//   docs/readme/hero.webp      the same header as a seamless animated loop: a tilted wall of 3D world screenshots
//                              drifting behind the title (tools/readme_hero.html still draws docs/intro.jpg)
//   docs/readme/bento.webp     the feature grid, from tools/readme_bento.html
//   docs/readme/marquee.svg    the scrolling LED (light-emitting diode) ticker of game names
//   docs/readme/btn-*.svg      the PLAY NOW / DESKTOP APP / BUILD A GAME buttons
//   docs/readme/stats.svg      the counts strip under the buttons
// Needs Playwright with Chromium (as the tests do), ffmpeg, and Python with Pillow (for the animated WebP).
//   node tools/readme_intro.js            all of it
//   node tools/readme_intro.js svg        only the SVGs (fast, no browser)
//   node tools/readme_intro.js hero|bento only that image
const path = require('path'), fs = require('fs'), http = require('http'), os = require('os');
const {execFileSync} = require('child_process');
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, 'docs', 'readme');
const only = process.argv[2] || 'all';
const want = k => only === 'all' || only === k;

// ---------------------------------------------------------------- counts and game names, from the registry
const A = require('../tests/lib/load.js')({quiet: true});
const games = A.games, worlds = games.filter(g => g.href), cabs = games.filter(g => !g.href);
const N = {total: games.length, worlds: worlds.length, cabs: cabs.length, vs: games.filter(g => g.vs).length,
  cats: new Set(cabs.map(g => g.cat)).size};
const title = s => s.split(' ').map(w => /\d/.test(w) ? w : w[0] + w.slice(1).toLowerCase()).join(' ');
const write = (rel, data) => {fs.writeFileSync(path.join(ROOT, rel), data); console.log('wrote', rel, (fs.statSync(path.join(ROOT, rel)).size / 1024).toFixed(0) + ' KB');};

// ---------------------------------------------------------------- SVGs (GitHub shows SVG files as images, CSS animation included)
const b64 = f => fs.readFileSync(path.join(ROOT, 'fonts', f)).toString('base64');
// fonts are embedded: an SVG shown as an image can't load anything else
const FONTS = `@font-face{font-family:P;src:url(data:font/woff2;base64,${b64('pa-pixel.woff2')}) format('woff2')}`;
const ANTON = `@font-face{font-family:An;src:url(data:font/woff2;base64,${b64('anton-400.woff2')}) format('woff2')}`;
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function marquee() {
  // a pick of names from every shelf, the 3D worlds first; the strip is drawn twice so the scroll wraps without a seam
  const pick = [...worlds.slice(-14).reverse(), ...cabs.filter((g, i) => i % 23 === 0).slice(0, 16)].map(g => g.name.toUpperCase());
  const W = 1280, H = 64, CH = 13.2; // PA Pixel advance at 16px with the letter spacing below
  let x = 0, items = '';
  for (const [k, n] of pick.entries()) {
    items += `<text x="${x.toFixed(1)}" y="40" class="${k % 3 === 0 ? 'o' : k % 3 === 1 ? 'w' : 'b'}">${esc(n)}</text>`;
    x += n.length * CH + 28; items += `<rect x="${(x - 18).toFixed(1)}" y="29" width="8" height="8" class="d"/>`; x += 14;
  }
  const L = Math.ceil(x), dur = (L / 60).toFixed(1); // 60 px a second
  // chase lights round the edge, like a cinema marquee
  let bulbs = '';
  for (let i = 0; i < W / 16; i++) for (const y of [6, H - 6]) bulbs += `<circle cx="${i * 16 + 8}" cy="${y}" r="2.2" class="l${i % 3}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${N.total} games, scrolling past">
<style>${FONTS}
text{font:16px P,monospace;letter-spacing:.1em}.o{fill:#ff4d00}.w{fill:#eceae3}.b{fill:#8f9fff}.d{fill:#3a4150}
.s{animation:m ${dur}s linear infinite}@keyframes m{to{transform:translateX(-${L}px)}}
circle{fill:#ffb38a;animation:c 1.2s steps(1) infinite}.l1{animation-delay:-.4s}.l2{animation-delay:-.8s}
@keyframes c{0%{opacity:1}33%{opacity:.18}}
@media (prefers-reduced-motion:reduce){.s,circle{animation:none}}</style>
<rect width="${W}" height="${H}" rx="10" fill="#0c0f17"/><rect x="1" y="12" width="${W - 2}" height="${H - 24}" fill="#11151f"/>
<g class="s"><g>${items}</g><g transform="translate(${L} 0)">${items}</g></g>
<rect x="0" y="12" width="90" height="${H - 24}" fill="url(#fl)"/><rect x="${W - 90}" y="12" width="90" height="${H - 24}" fill="url(#fr)"/>
<defs><linearGradient id="fl"><stop offset="0" stop-color="#11151f"/><stop offset="1" stop-color="#11151f" stop-opacity="0"/></linearGradient>
<linearGradient id="fr"><stop offset="0" stop-color="#11151f" stop-opacity="0"/><stop offset="1" stop-color="#11151f"/></linearGradient></defs>
${bulbs}</svg>\n`;
}

function button(label, sub, primary) {
  // a chunky arcade button: lit face, a darker lip below, the label in the pixel face; the primary one pulses
  const W = 300, H = 84, face = primary ? '#ff4d00' : '#1b1f2b', ink = primary ? '#0c0f17' : '#eceae3', lip = primary ? '#a83300' : '#07090e';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">
<style>${FONTS}${ANTON}.t{font:28px An,Impact,sans-serif;letter-spacing:.02em;fill:${ink}}.u{font:11px P,monospace;letter-spacing:.14em;fill:${primary ? '#3a1204' : '#959aa8'}}
${primary ? '.g{animation:p 1.6s ease-in-out infinite}@keyframes p{50%{opacity:.25}}@media (prefers-reduced-motion:reduce){.g{animation:none}}' : ''}</style>
${primary ? `<rect class="g" x="2" y="2" width="${W - 4}" height="${H - 4}" rx="14" fill="none" stroke="#ff4d00" stroke-width="3" opacity=".7"/>` : ''}
<rect x="6" y="12" width="${W - 12}" height="${H - 16}" rx="11" fill="${lip}"/>
<rect x="6" y="6" width="${W - 12}" height="${H - 16}" rx="11" fill="${face}" ${primary ? '' : 'stroke="#3a4150" stroke-width="1.5"'}/>
<rect x="14" y="10" width="${W - 28}" height="3" rx="1.5" fill="#fff" opacity=".18"/>
<text x="${W / 2}" y="41" text-anchor="middle" class="t">${esc(label)}</text><text x="${W / 2}" y="60" text-anchor="middle" class="u">${esc(sub)}</text></svg>\n`;
}

function stats() {
  // counts strip: big Anton numbers over pixel labels, split by hairlines
  const cells = [[N.total, 'GAMES', '#ff4d00'], [N.cabs, 'CABINETS', '#eceae3'], [N.worlds, '3D WORLDS', '#eceae3'], [N.vs, 'VS CPU / 2P', '#eceae3'], [0, 'INSTALLS', '#8f9fff'], ['$0', 'FOREVER', '#8f9fff']];
  const w = 150, W = w * cells.length, H = 92;
  const body = cells.map(([v, l, c], i) => `<g transform="translate(${i * w} 0)">${i ? '<rect x="0" y="18" width="1" height="56" fill="#2a3040"/>' : ''}
<text x="${w / 2}" y="54" text-anchor="middle" class="n" fill="${c}">${v}</text><text x="${w / 2}" y="76" text-anchor="middle" class="l">${l}</text></g>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${N.total} games, ${N.cabs} cabinets, ${N.worlds} 3D worlds, ${N.vs} with a CPU or second player, no installs, free">
<style>${FONTS}${ANTON}.n{font:40px An,Impact,sans-serif}.l{font:11px P,monospace;letter-spacing:.14em;fill:#959aa8}</style>
<rect width="${W}" height="${H}" rx="12" fill="#0c0f17"/>${body}</svg>\n`;
}

if (want('svg')) {
  write('docs/readme/marquee.svg', marquee());
  write('docs/readme/btn-play.svg', button('▶ PLAY NOW', 'IN YOUR BROWSER', true));
  write('docs/readme/btn-app.svg', button('⤓ DESKTOP APP', 'WIN · MAC · LINUX', false));
  write('docs/readme/btn-build.svg', button('✚ BUILD A GAME', '2D + 3D EDITOR', false));
  write('docs/readme/stats.svg', stats());
}

// ---------------------------------------------------------------- browser renders
const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.png': 'image/png', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp'};
const serve = () => new Promise(res => {const s = http.createServer((q, r) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!f.startsWith(ROOT)) {r.writeHead(403); return r.end();}
  fs.readFile(f, (e, d) => {if (e) {r.writeHead(404); return r.end();} r.writeHead(200, {'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream'}); r.end(d);});
}).listen(0, '127.0.0.1', () => res(s));});
const ffmpeg = args => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], {stdio: 'inherit'});

(async () => {
  if (!want('hero') && !want('bento')) return;
  const {chromium} = require('playwright');
  const srv = await serve(), base = `http://127.0.0.1:${srv.address().port}`;
  const browser = await chromium.launch({args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist']});
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pa-intro-'));
  try {
    if (want('hero')) {
      const qs = `games=${N.total}&cabs=${N.cabs}&worlds=${N.worlds}`;
      // the still: drawn at 2x and scaled down for clean edges (1280 x 640 is also GitHub's social preview size)
      let p = await browser.newPage({viewport: {width: 1280, height: 640}, deviceScaleFactor: 2});
      await p.goto(`${base}/tools/readme_wall.html?${qs}`); await p.waitForFunction('window.HERO_READY', null, {timeout: 120000});
      await p.screenshot({path: path.join(tmp, 'still.png')}); await p.close();
      ffmpeg(['-i', path.join(tmp, 'still.png'), '-vf', 'scale=1280:640:flags=lanczos', path.join(ROOT, 'docs', 'screenshot.png')]);
      console.log('wrote docs/screenshot.png');
      // the loop: FRAMES frames at FPS, encoded as an animated WebP (far smaller and richer in colour than a GIF)
      const FRAMES = +(process.env.HERO_FRAMES || 96), FPS = 12;
      p = await browser.newPage({viewport: {width: 1280, height: 640}});
      await p.goto(`${base}/tools/readme_wall.html?${qs}&anim=1`); await p.waitForFunction('window.HERO_READY', null, {timeout: 120000});
      for (let i = 0; i < FRAMES; i++) {
        await p.evaluate(([i, n]) => window.frame(i, n), [i, FRAMES]);
        await p.screenshot({path: path.join(tmp, `f${String(i).padStart(3, '0')}.png`)});
      }
      await p.close();
      // every frame is a key frame: libwebp's frame-to-frame deltas leave blocky smears on the moving tiles
      execFileSync('python3', ['-I', '-c', `
import glob, sys
from PIL import Image
fs = sorted(glob.glob(sys.argv[1] + '/f*.png'))
im = [Image.open(f).convert('RGB').resize((1120, 560), Image.LANCZOS) for f in fs]
im[0].save(sys.argv[2], save_all=True, append_images=im[1:], duration=round(1000 / ${FPS}), loop=0, quality=72, method=6, kmin=0, kmax=1)`,
        tmp, path.join(OUT, 'hero.webp')], {stdio: 'inherit'});
      console.log('wrote docs/readme/hero.webp', (fs.statSync(path.join(OUT, 'hero.webp')).size / 1048576).toFixed(1) + ' MB');
    }
    if (want('bento')) {
      const p = await browser.newPage({viewport: {width: 1280, height: 1200}, deviceScaleFactor: 2});
      await p.goto(`${base}/tools/readme_bento.html?games=${N.total}&cabs=${N.cabs}&worlds=${N.worlds}&cats=${N.cats}&vs=${N.vs}`);
      await p.waitForFunction('window.BENTO_READY', null, {timeout: 60000});
      const box = await (await p.$('#grid')).boundingBox();
      await p.screenshot({path: path.join(tmp, 'bento.png'), clip: box, omitBackground: true}); await p.close();
      ffmpeg(['-i', path.join(tmp, 'bento.png'), '-c:v', 'libwebp', '-q:v', '86', path.join(OUT, 'bento.webp')]);
      console.log('wrote docs/readme/bento.webp', (fs.statSync(path.join(OUT, 'bento.webp')).size / 1024).toFixed(0) + ' KB');
    }
  } finally {await browser.close(); srv.close(); if (process.env.KEEP) console.log('frames kept in', tmp); else fs.rmSync(tmp, {recursive: true, force: true});}
})().catch(e => {console.error(e); process.exit(1);});
