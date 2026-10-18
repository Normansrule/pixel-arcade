# HARBOR PALS: slice notes

Atlas prototype D, "Three useful companions". Registry id `harborpals`, folder `critters/`.

## Slice plan

- **Player promise:** "I am a small harbor-hand who rescues a stranded boat with three helper creatures, each good at one thing."
- **Loop:** walk the harbor, find a problem, choose the pal whose ability fits it (or go and find that pal), see the world change, then move to the next problem before the tide comes in.
- **Camera:** a third-person follow camera behind and above the player. You can turn it with Z/C or a mouse drag, and zoom with the wheel. It pulls in when a house or cliff gets in the way. Any follower that stands between the camera and the player fades to 35%.
- **Essential controls:** move, E (use, talk, pet, or hold to crank), F (the active pal's ability), and 1/2/3 or Tab (choose the active pal).
- **Shared task:** rescue the Puffin before the tide covers the sandbar. There are five steps, shown with ✓/▶/○ symbols:
  1. Dig up the winch crank (**DIG**, Mollo). One of three beach mounds hides it.
  2. Hook the tow line to the Puffin. The pier is broken, so this needs **BRIDGE** (Stilt).
  3. Fit the crank to the winch.
  4. Power the winch, either by **ZAP** on the motor (Fizz, fast) or by holding E to hand-crank (slow, and longest on HARD).
  5. Winch the Puffin home up the slipway.

  Steps 1 and 2 can be done in either order. DIG and BRIDGE are required. ZAP is the optional fast route, and using all three abilities earns the third star.
- **Meaningful choices:**
  - **First pal.** It decides which problem you can solve first and where you must go to meet the others.
  - **The power route.** ZAP finishes the winch in 7 s; hand-cranking takes 16 s on EASY, 21 s on NORMAL and 26 s on HARD.
  - **Who leads.** The leader is the one whose ability is on F.
- **Success:** the Puffin reaches the top of the slipway. **Failure:** the tide clock runs out and the sandbar floods. The results screen shows both outcomes.
- **Recoverable mistakes:**
  - **Falling into the sea** (off the pier, into the gap, or down the slipway). You splash, return to the last safe spot, and lose 5, 8 or 12 s of tide. A tow line you were carrying slips back to the winch.
  - **Digging the wrong mound.** You find an old boot or a clam, and it only costs time.
  - **Using the wrong pal.** The prompt names the pal that is needed.
  - **Getting lost.** R twice returns you to the Pal Post.
  - **A stuck pal.** It teleports back to the trail.
  - **The bridge** can't be folded while the player is on it or on the sandbar, so there is no softlock.
- **Scope cuts:** no combat, no collection database, no dialogue trees, one route, one objective, and no co-op (the companions are AI followers, not players).

### Authoritative state

`run` in `game.js` holds the authoritative state:
- `crank`: buried, carried or fitted
- `rope`: winch, held or hooked
- `power`, `winch` (0 to 1), `dug[3]`, `real`
- `sel` (the active pal), `uses`, `used`, `falls`, `teleports`, `clock`

Several things read only from it:
- the objective list (`stepDone`)
- the HUD pal bar
- the prompts
- the marker
- the world props (mounds, crank, rope, motor bulb, boat position)
- the save

Each pal has a `mode`: wild, follow, work or bridge. The line of followers is `[sel, ...others]`, filtered to followers. The bridge exists in the collision regions only while Stilt is in bridge mode.

## References

| Role | Reference (atlas URL) | Observed | Original adaptation |
|---|---|---|---|
| Gameplay | 05. Pokemon HeartGold / SoulSilver: https://www.pokemon.co.jp/game/ds/hgss/ (official page), https://www.pokemon.co.jp/img/game/hgss/story01.jpg (illustrated environment art, not gameplay), https://www.gamereactor.eu/video/7127/Pokemon%2BHeart%2BGoldSoul%2BSilver%2B-%2BTrailer/ (third-party trailer archive, not watched end to end) | The atlas notes a creature that travels with you, recognisable silhouettes at small size, and understandable choices rather than stat charts. I looked only at the atlas text and the image link; I made no gameplay observation of the game itself. | Three original helpers, each with exactly one non-combat job and one obvious body shape. Instead of a type chart, the world tells you which job fits ("The broken pier needs BRIDGE"). Only the active pal leads the line, and the HUD, the floating "▲ NAME" tag, the F prompt and the save always agree on which one that is. No capture, no battles, no species, names or symbols from the reference. |
| Visual | Tinykin, supplied images `img/10_*`, `img/11_*`, `img/14_*`, `img/15_*` and the contact sheet. The atlas cites no URL for Tinykin; the images are the bundled local study files. | A small chibi hero among helpers with very different silhouettes (round, tall and spindly, horned, floating), helpers grouped around the hero, a large warm interior with pools of candle light, and helpers attached to objects. Note: in this pack the file names are offset by one from the captions. | A small yellow-raincoat harbor-hand in a large dusk harbor (houses, a lighthouse, a winch shed), with warm lamp pools and bunting. The three pals are low/wide, tall/long-legged and floating/glowing. Helpers attach to objects: Mollo digs into a mound, Stilt lies across the broken pier as a bridge, and Fizz arcs power into the motor. All art is procedural, and no Tinykin character, prop or interface is reused. |

## Controls

| Action | Keyboard / mouse | Gamepad | Touch |
|---|---|---|---|
| Move · jog | WASD / arrows · Shift | Left stick · RT/B | Left stick |
| Use / befriend / pet · hold to hand-crank | E | A | E button |
| Active pal's ability | F or Space | X | F button |
| Choose pal · cycle | 1 / 2 / 3 · Tab or Q (or click a pal card) | LB / RB, Y | PAL button |
| Camera turn · zoom | Z / C, mouse drag · wheel | Right stick | ⟳ button |
| Back to the Pal Post | R twice | n/a | n/a |
| Pause · graphics quality · stats | Esc / P · G · F3 | Start | II button |

## Asset manifest

All assets are original and generated in code. There are no image, model or audio files, and no network requests.

| Asset | Where | How |
|---|---|---|
| Flagstone, cobble, plank, roof-tile, sand, plaster textures | `world.js` `tex*()` | Canvas 2D, seeded random |
| Water ripple normal map | `world.js` `texWaterN()` | Sum of sines → normal map on canvas |
| Harbor geometry (terrace, stairs, quay, beach, slipway, pier, sandbar shelves, houses, sheds, lighthouse, rocks, headlands, props) | `world.js` | Three.js primitives merged per material (`Kit`, `mergeColored`) |
| Sky dome with dusk gradient, sun and clouds | `world.js` | GLSL shader; PMREM env map from it |
| Mollo, Stilt, Fizz, and the harbor-hand | `pals.js` | Primitive parts baked into vertex-coloured meshes (method adapted from `pets/models.js`) |
| The Puffin boat, winch, motor, crank, mounds | `world.js` | Primitives |
| Particles (dust, splash, sparkles, hearts), zap arc, rope, marker | `fx.js` | Canvas sprites, line and tube geometry |
| HUD silhouettes of the pals | `game.js` `SVG` | Inline SVG paths |
| All sound: waves, gulls, footsteps, three pal voices, dig, creak, zap, splash, winch, jingles, marimba loop | `sound.js` | WebAudio oscillators and noise via `js/kit3d/audio.js` |
| Fonts | `../fonts/` | The arcade's local OFL fonts (Anton, JetBrains Mono) |

## Test report

- **Environment:** Chromium 141.0.7390.37 (Playwright `chromium-1194`, headless), software WebGL through SwiftShader (`--use-gl=swiftshader --enable-webgl --ignore-gpu-blocklist`).
- **Server:** the served URL `http://127.0.0.1:8765/critters/`.
- **Method:** `requestAnimationFrame` is stubbed, and the game is driven through `window.HARBOR` (`step`, `render`, `walk`/`walkPath` steering a virtual stick, `interact`, `ability`, `select`, `hold`, `teleport`, `strand`, `setClock`, `sync`).
- **Location:** test scripts and screenshots are in `/tmp/claude-0/agents11/critters/`.

| Test | Steps | Observed |
|---|---|---|
| Page health | Load the menu, play, results, LOW quality, 390x844 touch, 800x500 | 0 page errors, 0 console errors and 0 non-local requests in every run. No horizontal scroll (`scrollWidth == clientWidth` at both sizes). |
| EASY playthrough from a clean save (`play.js 0`) | Mollo first. Terrace → stairs A → beach, dig a wrong mound (boot), dig the flagged mound, befriend Fizz in the net shed, fit the crank, take the line, ZAP the motor, befriend Stilt, BRIDGE the gap, cross, hook the line, motor winches | Won in 53 s of game time with 307 s of tide left. 3/3 stars, 3128 pts. Profile +5 tokens, 1 win. `pxd_hs_harborpals=3128`. Results screen shown. |
| HARD playthrough via the other route (`hard.js`) | Stilt first. Stairs B with the landing and corner, take the line, bridge, hook, walk to the beach, befriend Mollo, find the crank by Mollo's sniff (no flag on HARD), fit it, hand-crank with held E | Won with about 100 s of tide left (99.6 to 103 s across runs). 2/3 stars (no ZAP), 2600 to 2612 pts. Results screen shown. |
| Following on stairs and corners | During the stairs B walk, sample Stilt's position each step | 210 samples: 0 off-ground or floating, at most 3.45 m from the player, 0 teleports. |
| Stuck pal → safe teleport | `strand('stilt', -17.5, -9.5)` (inside the net shed, walls between it and the player on the pier) | Teleport count 0 → 1. Stilt ends 1.65 m from the player and back on the trail. |
| Plausible mistake | Carry the tow line and walk off the side of the pier | Splash, then respawn on the pier (ground 1.0). Falls 0 → 1, tide −8 s (NORMAL), line back at the winch. |
| Wrong pal / wrong mound | F with Stilt near the motor; dig a decoy mound | The prompt says "The winch motor needs ZAP…". The decoy gives a boot, the dig counts, and the crank stays buried. |
| Bridge safety | Press F to fold Stilt while standing on the sandbar | Refused ("holding"). The bridge stays. |
| Selection sync | Select via the hook and via the real Digit3 key; after reload/continue | `sync()` shows `sel == leader == HUD active == saved`, and the ability label matches. The menu choice can differ from the active pal (for example, menu Mollo while Stilt is active), as intended. |
| Save, reload mid-way | (1) Bridged on the sandbar, then `page.reload()`. (2) Crank fitted, motor powered, mound dug, all pals met, then reload and CONTINUE, then finish | (1) CONTINUE shows "NORMAL · TIDE 3:41". The run resumes with the same id and clock (±0.5 s). The player is placed safely on the pier, since a bridge is never saved. (2) Dug mound, fitted crank and green bulb are restored, and the HUD shows steps 1, 3 and 4 as done. Finishing then awarded once (+6 tokens). After a further reload the profile is unchanged, the run is cleared, and there is no CONTINUE. |
| No duplicated rewards | Reload after the results in each playthrough | The `pxd_profile` string is identical before and after. Awarded run ids are kept in the save. |
| Restart clears state | Restart mid-run (bridged, line dropped, a fall) | New run id, all mounds whole, no bridge region (ground at the gap is −99), crank hidden, boat back on the sandbar, tide −0.5, falls 0, teleports 0. |
| Time-out path | `setClock(1.5)` then step | "THE TIDE CAME IN", the sandbar floods, the results screen shows 0/3 stars, +1 token. |
| Pause | Dispatch window `blur`; real Esc key | State becomes `paused`, and Esc toggles back. |
| Real input | Click the pal card, HARD and SET OUT; press Space, W, 1, Esc, R R | Space does not restart (focus is released), W moves and stops at the rail, 1 on an unmet pal is refused with a hint, R R returns to the Pal Post. |
| LOW quality | `setQuality(0)` | Renders with no post-processing or shadows. The main pass is 87 draw calls and about 36.5k triangles (`renderer.info`). |

**Performance:** not measured on a GPU. SwiftShader timings are not meaningful, so frame-rate claims are unverified. The scene is built to stay light: static geometry is merged per material, LOW drops shadows, post-processing and the lamp point lights, and there are 4 pooled lamp lights plus Fizz's light.

The screenshots I examined were the menu, the start, the beach dig, the zap, the bridge, crossing the bridge, winching, the ending, the results (win and time-out), LOW quality, 390x844 touch and 800x500. The hub card is `card.jpg`. No video recording was made.

## Known issues

**Implemented**
- Three pals with distinct silhouettes, gaits, voices and reactions (pet, joy, sniff, head-shake, idle emotes).
- Trail following that survives stairs and corners, with side offsets, stuck detection and teleport recovery, plus a fade when a pal blocks the view.
- Meeting pals in the world, choosing a first pal, and swapping the active pal with everything kept in sync.
- The five-step tide rescue with two power routes.
- Difficulty: tide clock, hints (marker always, near, or never; the real mound's flag on EASY and NORMAL only) and hand-crank effort.
- Save and resume of met pals and run progress, with no duplicate rewards.
- Results screen with time, pals used and stars.
- Score, tokens and POST SCORE.
- Touch, gamepad and keyboard controls; G quality, F3 stats, reduced effects.

**Partial**
- Touch was tested only through Playwright's touch emulation layout plus hook-driven input. Real-device touch and real gamepads were not exercised.
- Audio was checked only for running without errors. It has not been listened to.
- The bridge pose is a stylised stretch of Stilt's shell, not a fully rigged animation.
- Camera collision samples region heights only, so thin props like lamp posts can still sit between the camera and the player.

**Planned (not built)**
- Lift/carry as a second Stilt use.
- More harbor tasks that reuse the same three abilities (a dark boathouse for Fizz's light, a tunnel for Mollo).
- An in-game reset of met pals per profile; today RESET SAVE in the menu clears everything.
