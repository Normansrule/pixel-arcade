# Architecture

Pixel Arcade is a static website with no build step. GitHub Pages serves `main` as it is; the same files run as an installable offline web app, inside the Electron desktop app, and (for the canvas games) as one self-contained HTML file.

```
index.html ── js/engine/*.js ── js/gx.js ── games/*.js        455 canvas cabinets + hub entries for the 3D worlds
           └─ js/hero.js (Three.js lobby hero)
<folder>/index.html ── <folder>/game.js (+ modules) ── vendor/, js/fx3d.js, js/kit3d/      31 full-3D worlds
builder/                                                       2D + 3D game builder
sw.js + offline.json + manifest.webmanifest                    installable offline web app
desktop/                                                       Electron app (arcade:// scheme)
tools/                                                         docs, thumbnails, offline files, single-file build
tests/                                                         headless Node tests for every canvas game
```

## The canvas engine (`js/engine/`)

Every cabinet draws on a 320×240 logical screen, rendered in high definition (HD) at 2–4× the logical size. The engine is a set of classic scripts loaded in order. Each file is an IIFE (immediately invoked function expression) that adds to the global `A` namespace; state the files share lives on the internal object `A._e`.

| File | What it holds |
|---|---|
| `00-core.js` | `A`, palette `A.K`, the registry `A.add()`, random and clamp helpers |
| `01-draw.js` | `A.cls`, `A.rect`, `A.circ`, `A.line`, `A.poly`, cached backdrops, the bitmap font `A.text` |
| `02-pseudo3d.js` | flat-shaded painter's renderer with fog: `A.cam`, `A.p3`, `A.face`, `A.box3`, `A.cyl3`, `A.flush` |
| `03-person.js` | `A.person` characters and `A.emoji` |
| `04-audio.js` | synthesized sound effects `A.sfx` and mute state |
| `05-fx.js` | particles `A.burst`, `A.confetti`, screen shake, score pops |
| `06-input.js` | keyboard, mouse, touch pad, `A.in`/`A.hit`, `A.fire` (hold-to-fire and spam-click), CPU input `A.bot` |
| `07-session.js` | the current game, mode, turn and pause flags |
| `08-scores.js` | `pxd_profile`, tokens, high scores, `A.submitScore` (GitHub issue) and `A.leaderboard` |
| `09-clock.js` | round clock: category defaults `LIMITS`, per-game `TIMES`, `A.limitOf`, round start |
| `10-cards.js` | cabinet UI drawn at backing resolution: title, pause and results cards, clock bar, how-to strip |
| `11-loop.js` | the frame loop, bloom, `A.open`/`A.close`, graphics quality (**G**), hub previews, HD fit |
| `12-hub.js` | boot: DOM events, profile chip, leaderboard modal, lobby grid, search, favourites, recently played |

`js/gx.js` is the shared art kit `A.gx` (gradients, glossy blocks, glow, HUD panels, cached backdrops) used by the game packs.

### Games and the manifest

A canvas game is an object registered with `A.add({id, name, cat, how, vs, make(){…}})`. `make()` returns a game with `update()`, `draw()`, `score` and `over` (a result string once the round ends). Games are grouped into "packs" in `games/*.js`.

`games/index.json` is the single list of what loads and in which order: the engine modules (`core`), the packs (`packs`) and late scripts (`after`). `tools/gen_docs.py` writes the `<script>` tags in `index.html` from it, and the tests and `tools/registry.js` load the same list in Node. To add a pack, add it to `games/index.json` and run `python3 tools/gen_docs.py`.

The 3D worlds also appear in the registry (in `games/threed4.js`) with `href`, `img`, `style` (the inspiration, shown in the README), `v` (the version that added or rebuilt it) and `tags`. The hub turns those into cards that link to the world's folder.

### Scores

Scores stay in `localStorage` (`pxd_profile`, `pxd_hs_<user>_<id>`). Posting a score opens a prefilled GitHub issue titled `[score] <id> <score>`; the leaderboard reads those issues through the GitHub search API. No server is involved.

## Full-3D worlds

Each world is a folder (`city/`, `zombies/`, `rocket/`…) with an `index.html`, a `game.js` entry module and its own modules. They use Three.js r160 from `vendor/` and `js/fx3d.js`, whose `cinematic()` sets up ACES tone mapping, ambient occlusion, bloom, a colour grade and SMAA (Subpixel Morphological Anti-Aliasing); `bindQualityKey()` makes **G** cycle low, medium and ultra.

Code the worlds share lives in `js/kit3d/`. So far that is `score.js`: the arcade profile (`addRound`), best scores (`bestScore`, `saveBest`, `bestKey`), the player's name (`userName`) and POST SCORE (`postScore`), using the same storage keys and issue title as the canvas engine. Pointer lock, gamepad, synthesized audio, procedural textures and the menu and results screens are still copied per world; they are the next candidates for the kit.

All worlds follow the same conventions: an original name and design, a round time limit with a results screen, CPU opponents with difficulty levels, `pxd_profile` and high-score updates, a POST SCORE button, a "← ARCADE" link back to the hub, local fonts from `fonts/`, synthesized audio, procedural textures, and `window.<ID>` test hooks. Folder names are part of public URLs, so they never change.

## Offline web app

`tools/make_pwa.py` writes two files from the repository contents:

- `sw.js`, from `sw.template.js`: caches the app shell (hub, engine, canvas packs, fonts, icons) on install, and every other file the first time it is visited (stale-while-revalidate).
- `offline.json`: every file the site needs. The hub's "⤓ Save all offline" button caches all of them (about 17 MB).

Run `python3 tools/build.py` after adding, moving or removing files; it calls `make_pwa.py` and also writes `dist/pixel-arcade.html`.

## Desktop app

`desktop/main.js` serves the site through a privileged `arcade://` scheme, because ES modules and `fetch()` need a real origin. `desktop/package.json`'s `extraResources` filter copies the site into the app and leaves out tests, tools and README images. `.github/workflows/desktop.yml` builds Windows (installer and portable), macOS (DMG) and Linux (AppImage and deb) when a `v*` tag is pushed, and attaches them to the release.

## Tests and tools

| Command | What it does |
|---|---|
| `node tests/test.js` | runs every canvas game in every mode with random input; fails on exceptions, bad results or NaN (Not a Number) draw calls. `RANGE=a:b` and `ONLY=id1,id2` pick games |
| `node tests/quality.js` | quality gate: responds to input, text stays on screen, a one-line how-to. Writes `docs/QUALITY.md` (pass `PART=file.json` to write elsewhere) |
| `node tests/scorecheck.js` | solo games must earn a score under scripted input |
| `node tests/quick.js id…` | quick per-game run with timings |
| `python3 tools/gen_docs.py` | counts, README tables, `docs/GAMES.md`, `index.html` script tags; `--art` redraws `docs/readme/`, `--check` fails when anything is stale |
| `python3 tools/thumbs.py` | prerenders hub thumbnails into `docs/thumbs/` (needs a local server) |
| `python3 tools/build.py` | `sw.js`, `offline.json` and the single-file build |

3D worlds are tested in headless Chromium with software WebGL (`--use-gl=swiftshader --enable-webgl --ignore-gpu-blocklist`). Override `requestAnimationFrame` and call the world's `step()` and `render()` yourself, because software rendering takes seconds per frame.
