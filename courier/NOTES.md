# TIDEWAY COURIER: notes

Atlas prototype A, "The delivery loop". This is a full 3D delivery kart race for Pixel Arcade. Registry id `tidewaycourier`.

## Slice plan

- **Player promise:** "I am a harbor courier racing three rivals around a sunny flooded town. I drift through the corners to earn boosts, and every lap I collect a parcel and drop it at the Post House."
- **Loop (one lap, about 27 s):**
  1. Leave the start line on Town Quay.
  2. Brake or drift through the **Lighthouse Hairpin** (corner 1).
  3. Drive through the yellow **PICK UP** pad at the Breakwater Depot.
  4. Cross the arched **Tide Bridge** to North Island.
  5. Hold a drift through the **Shallows Sweep** (corner 2), which has a shallow sand run-off on the outside: the recovery zone.
  6. Cross the plank bridge.
  7. Take the **Post House Turn** (corner 3).
  8. Drive through the green **DROP** pad in the Post House bay.
  9. Cross the line. The race is three laps.
- **Camera:** a third-person chase camera.
  - It follows the kart's heading with smoothing, and lags slightly while drifting.
  - It aims 30% of the way toward the road 16 m ahead, so it looks into each corner.
  - Speed and boosts widen the field of view a little.
  - The camera never drops below ground height.
  - Screenshots of all three corners (entry, apex, exit) show the road ahead.
- **Essential controls:** throttle, brake/reverse, steer, hold-to-drift, reset to the last gate, and pause.
- **Success condition:** finish 3 laps before the clock runs out. Your place, deliveries, drift boosts and the remaining time all score.
- **Failure and recovery:**
  - Walls (quay walls and bridge rails) take speed off and turn you along the road. The race never stops.
  - Run off an open edge into deep water and you splash and come back at the last numbered gate, losing about 1.3 s.
  - The shoal is shallow, so you can drive back out of it.
  - R or Y resets you to the last gate.
  - When the clock runs out, the results show TIME UP with your position on the road.
- **Scope cuts:**
  - One course and one kart model, with 4 colour and number variants.
  - No items, no vehicle choice, no split screen and no network play.
  - Rival couriers do not carry parcels.

## Authoritative state

- **Race flow:** `app` is menu → race → paused → results. Inside a race, `phase` is count → go → done.
- **Per racer:** `lap` counts completed laps. `next` is the next gate. `lastCp` is the respawn gate.
- **Player only:**
  - `parcel` (true while carrying).
  - `delivered[lap]`, which allows one delivery per lap.
  - `deliveries`.
  - `tiers[1..3]`, the boost counts per tier.
- **HUD and world are read from that state:**
  - the parcel box icon and the parcel visible on the kart's crate;
  - the pad beams, which show only while the pad is useful;
  - the objective line;
  - the minimap pins;
  - the gate flags, where the next gate glows;
  - the lap pill, "LAP x/3 · GATE n".

**Lap rule (kart.js `progress`):**

- Gates 0 to 5 sit at fixed arc-length positions. Crossing the next gate forward advances `next`.
- Crossing gate 0 with `next` at 6 counts a lap.
- Crossing backwards over the last gate you passed un-passes it. This includes the line itself, so a counted lap is removed.
- Teleports and respawns reset the crossing reference. A position jump of more than 25 m is ignored.
- The result: reversing over the line never adds a lap, and skipping gates never counts one.

## References (from the inspiration pack)

1. **Gameplay: atlas section "02. Mario Kart 8 Deluxe".**
   - Source URL: https://www.nintendo.com/jp/ichikara/aabpa/index_en.html (Nintendo tutorial page; tutorial image https://www.nintendo.com/jp/ichikara/aabpa/img/01/fig_chapter.jpg).
   - **What I used (from the atlas text, not from playing the game):**
     - Speed, steering, drift and recovery are taught through feedback: start boost, drift build-up and release, road-edge contrast.
     - The acceptance questions: when does a drift begin and end, can you recover from a wall, does reversing over the line count, and does the camera work at each corner.
   - **Not viewed:** I did not view the tutorial clips. No timing or handling values were taken from the game.
   - **How mine differs:**
     - An original courier theme and kart model.
     - No items.
     - A delivery objective inside the lap: an optional side-of-road pad choice that adds score and time.
     - A drift meter with labelled segments I/II/III and a rising whine pitch, so tiers are shown in three ways, not by colour alone.
     - A start boost with an on-screen hold meter that names the window ("HOLD GAS WHEN 1 SHOWS").
     - Ordered numbered gates.
2. **Visual: I Am Future images, "Isolated destinations across water" and "Recognizable destination silhouette above flooded…".**
   - Source: the pack's contact sheet and `img/20_Isolated_destinations_across_water.jpg`.
   - The pack labels these as I Am Future reference artwork. The atlas lists them as supplemental local images and gives no URL for them.
   - **Observed in those images:**
     - Turquoise shallows with white foam rims around small islands.
     - A tall, readable landmark (a gate hall with a sign and towers) standing above flooded surroundings.
     - Warm pastel buildings, vines, piers and boats.
     - A high, bright, sunny camera.
   - **How mine differs, all original:**
     - A racing course that strings little islands together with an arched stone-and-timber bridge and a plank bridge.
     - The water is coloured by depth: deep blue, turquoise shallows, a sand tint and a foam rim at the shoreline.
     - Flooded pastel houses stand on plinths in the shallows, with plank walkways and ivy.
     - An original landmark, the **Tideway Post House**: a long arcaded hall with an arched gate, a clock tower with an orange spire and a flag, and a "TIDEWAY POST" sign. It is visible across the water from the north island and down the final straight.
     - A red-and-white lighthouse marks the hairpin.
   - No characters, logos, signs or layouts were copied.

## Controls

| Action | Keyboard | Gamepad (kit3d `playerPad`) | Touch |
|---|---|---|---|
| Gas | W / ↑ | A or RT | GAS |
| Brake / reverse | S / ↓ | B or LT | BRAKE |
| Steer | A D / ← → | left stick | ◀ ▶ |
| Hop + drift (hold, release to boost) | Space / Shift | X, RB or LB | DRIFT |
| Back to last gate | R | Y or Back | ↺ button |
| Pause | Esc / P | Start | II button |
| Music · graphics quality · perf overlay | M · G · F3 | | |

- **Start boost:** hold gas once "1" shows. Holding from "3" bogs the engine for 0.9 s.
- **Drift:** hold the drift button while steering above 36 km/h. The meter fills I → II → III. Release for a 0.7, 1.15 or 1.7 s boost.
- **Focus:** the race pauses on window blur or when the tab is hidden.

## Asset manifest (all original, all procedural)

| Asset | How it is made | File |
|---|---|---|
| Island heightfield, beaches and shoal | Arc-length stamps along the course plus islet blobs, with value-noise detail | track.js |
| Sea | Shader: depth texture from the heightfield, procedural waves, caustics, foam and fog | world.js |
| Sky and clouds | Gradient and FBM shader dome; instanced icosphere clouds | world.js |
| Road, timber deck, kerbs, quay walls, rails, piers | Ribbon geometry along the course with canvas textures | world.js |
| Houses, flooded houses, Post House, lighthouse, depot, boats, trees, palms, lamps, bunting, buoys, gulls | Merged or instanced three.js primitives with vertex colours; canvas façade texture | world.js |
| Signs (START · FINISH, TIDEWAY POST, BREAKWATER DEPOT, SHALLOWS · SAFE RUN-OFF, gate numbers, PICK UP and DROP pads) | Canvas text drawn with the arcade's local Anton font | world.js, util.js |
| Courier karts and the ghost | Primitives with vertex colours and a canvas number board | kart.js |
| Particles (drift sparks, boost flames, spray, dust, confetti) | Particles class adapted from kart/util.js | util.js, game.js |
| Audio (engine, drift whine, tier chimes, boost, wall, splash, gates, parcels, countdown, gulls, music loop) | WebAudio oscillators and noise through `js/kit3d/audio.js` | sound.js |
| Fonts | The repo's local `../fonts/fonts.css` (OFL) | — |

- There are no image or audio files and no network requests.
- Code adapted from repo worlds:
  - `kart/util.js`: maths, noise, canvas textures, geometry merge and particles.
  - `kart/world.js`: sky and sea shader structure.
  - `kart/physics.js`: the hop-drift tier model.
- The `gp/` and `drive/` worlds were studied for structure only.

## Storage

All storage calls are wrapped in try/catch.

| Key | Holds |
|---|---|
| `pxd_tidewaycourier_opt` | Difficulty |
| `pxd_tidewaycourier_rec` | Best score, best lap, career deliveries, races, and the ids of awarded races |
| `pxd_tidewaycourier_ghost` | Best-lap ghost: 10 Hz x, y, z and yaw |
| `pxd_tidewaycourier_run` | The in-progress race. It is saved at each gate, lap, pickup, drop and pause, and every 5 s. |

The arcade profile and high score go through `../js/kit3d/score.js` (`addRound`, `saveBest('tidewaycourier')`). POST SCORE uses `postButton`.

**No duplicated rewards:**

- Each race has an id. Tokens, career totals and the best score are applied only if that id is not already in `rec.done`.
- The run save is deleted when the race finishes, so a reload after finishing offers no resume.
- A resumed race restores `delivered[]`, so a parcel already delivered on a lap cannot be delivered again on that lap.

## Test report

**Setup:**

- Headless Chromium (`/opt/pw-browsers/chromium`) with SwiftShader software WebGL (`--use-gl=swiftshader --enable-webgl --ignore-gpu-blocklist`), via playwright-core.
- Served from the static server at http://127.0.0.1:8765/courier/.
- `requestAnimationFrame` was stubbed out and the game was driven through `window.COURIER.step/render`.
- Scripts and screenshots are in `/tmp/claude-0/agents11/courier/`. `accept.js` is the main suite.

**Results:**

| Test | Steps | Observed |
|---|---|---|
| Clean playthrough, EASY | `localStorage.clear()`; start EASY; perfect start; pad-aware autopilot | Results screen. 1st place, 85.2 s, best lap 27.9 s, 3/3 deliveries, score 3870, +43 tokens, `pxd_profile.played` +1, best score saved, ghost stored |
| Clean playthrough, HARD | Same autopilot (it does not drift) | Results screen. 4th place (HARD rivals finish in about 81–83 s), 85.2 s, 3/3 deliveries, score 2170 |
| Ghost | Start the next race | The personal-best ghost is visible and replaying |
| Drift tiers | Hold drift through the Shallows Sweep | Meter fills I (blue sparks) then II (orange). On release: "BOOST II!", zipT 0.97 s, boost counted |
| Fall in the sea | Steer off the outside of the hairpin | Splash, respawn at the last gate, speed back to 27 m/s, race continues |
| Wall hit | Steer into the breakwater quay wall | Speed 24 → 15.7 m/s, kart turned along the wall, back to 26.9 m/s in 3 s; no restart |
| R reset | Press R mid-race | Kart placed at its last gate |
| Reverse over the line | Pass the line, reverse back over it, drive on | Lap stays 0 |
| Skip gates | Teleport from gate 1 to the line and cross it | Lap stays 0; next gate still 1 |
| Un-lap | Complete a real lap, drive back over the line, then forward again | Lap 1 → 0 → 1 (never 2) |
| Restart | Restart mid-race (lap 1, 1 delivery) | lap 0, deliveries 0, clock reset, timer 0, countdown, next gate 1 |
| Save and resume | Save at lap 2 with 2 deliveries; reload the page | Menu shows "RESUME SAVED RACE · LAP 2". Resume restores lap, deliveries, parcel, gate and clock. The race finishes with 3 deliveries (the maximum); profile +1 exactly once; the save is cleared; after another reload there is no resume |
| Time-out | HARD; set the clock to 1.5 s | Results show "TIME UP · 4TH ON THE ROAD" |
| Focus loss | Dispatch `blur` | Race pauses and race time stops |
| LOW quality | `setQuality(0)` then render | Renders correctly (screenshot checked) |
| Keyboard | W, D, Esc via page.keyboard | W accelerates to 23 m/s in 1.5 s; D steers right; Esc pauses |
| Gamepad | Fake `navigator.getGamepads` | A drives; stick steers; Start pauses and Start again resumes |
| Touch | 390×844 with touch | Touch buttons show; holding GAS drives (pointer events) |
| Layout | 960×540, 800×500, 390×844 | No horizontal scroll (scrollWidth equals clientWidth). Menu, HUD and results screenshots reviewed |
| Errors | Whole suite | Zero page errors and zero non-local requests |

**Renderer counters** (SwiftShader, 1280×720, mid-race; timings are not GPU performance):

| Quality | Draw calls | Triangles |
|---|---|---|
| ULTRA | ~204 | ~650 k |
| MEDIUM | ~130 | ~413 k |
| LOW | ~70 | ~237 k |

- Simulation costs about 0.28 ms per 1/60 s step.
- Frame rate on real hardware was **not measured**.

## Known issues

**Implemented:**

- One complete course, 3 laps, 6 ordered gates.
- Throttle, brake/reverse, steering, hop-drift with 3 tiers (colour, label, meter and pitch), start boost with a stall penalty.
- Wall slide recovery, sea fall with respawn, shallow recovery zone, manual reset.
- 3 CPU couriers at EASY, NORMAL and HARD (speed, cornering, drift use, rubber band, time limit 2:40, 2:10 or 1:50).
- Personal-best ghost lap.
- Parcel pickup and drop each lap; a delivery adds 500 points and 4 s.
- Results with position, total time, best lap, deliveries, drift boosts and the score breakdown.
- Tokens and best score through kit3d, POST SCORE.
- Keyboard, gamepad and touch controls.
- Pause on blur, mid-race save and resume, G quality levels.

**Partial:**

- CPU couriers race but do not carry parcels.
- The HARD autopilot without drifting finishes 4th. A human needs to use drift boosts and the start boost to win on HARD. Balance was tuned against the scripted driver only, not against people.
- The gamepad was tested with a simulated `navigator.getGamepads`, not with physical hardware.
- Touch was tested in emulated Chromium, not on a phone.

**Planned (not built):**

- Rival deliveries that block pads.
- More than one course.
- Kart choice.
- Replay of the full race ghost (only the best lap is stored).
- A colour-blind palette toggle. Information is already carried by text, letters, numbers and pitch.

**Other:**

- Wall contact can be heavy where a narrow bridge starts (the plank bridge entry rail ends). It is recoverable, but CPU karts sometimes scrape it.
