# BEACON RESCUE: notes

Registry id `beaconrescue` · folder `rescue/` · built for round 8 from the owner's Robot Rescue concept (atlas prototype B, "Three-room rescue puzzle").

## Slice plan

- **Player promise:** "I am a small repair robot who makes a dark lighthouse work again and gets its keeper home."
- **Loop (per room):** arrive, read the room's rule, experiment with carry/place/plug, see the mechanism change state, go through. Mistakes recover (reset key, objects return to their spot), and each room cleared becomes a checkpoint.
- **Camera:** third person, high three-quarter view of a dollhouse cutaway. The south walls are a low lip, the side walls are short, and a divider fades when the camera swings past it. The camera leans toward the next step's target so the robot and the next interaction stay on screen together. You can orbit about ±45° (drag, Z/X, right stick) and zoom (wheel).
- **Controls:** WASD/arrows move. E/Space/Enter is the single context action: pick up, place, plug, unplug or drop. R resets the room, H shows a hint, Esc/P pauses, G cycles quality.
- **Rooms:**
  1. **The Boathouse ("POWER TRAVELS").** Charge the flat battery on the generator's charger dock, set it in the cell cradle, then run a cable from the cradle port to the door socket. A cable plugged straight from the generator to the door is 6.5 m short, and the tether shows it.
  2. **The Storeroom ("A WEIGHT HOLDS").** A load pan lifts the iron gate only while something stays on it. Standing on the pan opens the gate, but it drops before WICK can reach it. The counterweight left on the pan holds it open.
  3. **The Lamp Stair ("POWER + HOLD").** A shutter blocks the ramp to the gallery. It opens while its socket is powered or while its pan is loaded. The lamp lights from a cable in its socket or from a charged battery in its cradle. There is one cable, one battery and one counterweight.
     - **Hold route:** counterweight on the shutter pan, then carry the generator cable's live end up to the lamp socket.
     - **Power route:** generator cable into the shutter socket, then charge the battery and carry it up to the lamp cradle.
     - A third mix also works: counterweight plus battery.
- **Success:** the lamp lights. A finale sweeps from the glowing lens out to the lighthouse on its rock. The beam sweeps across the sea and lights the waves, and a lifeboat heads in. The results screen follows.
- **Failure and recovery:** the storm clock runs out (results, "THE STORM WON"). Locally, R resets the current room. Anything dropped in the water slip or carried out of its room returns to its spawn point. From the gallery you can drop down to the floor, so being upstairs never softlocks. A door or shutter that closes on WICK pushes him clear.
- **Scope cuts:** no co-op, no general physics simulation (objects fall straight down and snap to devices), no inventory, one cable per room.

## Authoritative state

`G` (app/mode, storm clock, resets, hints, room, latched doors, run id), `P` (robot), `OB` (objects: `in` = device id or null, `carried`, `charge`), `TG` (devices), `CB` (cables). `evalPower()` derives everything else each frame from those:

- which ports are live
- which cables are lit
- which sinks are powered
- which pans are loaded
- the door targets and whether the lamp is lit

Doors animate toward those targets, and collision reads the animated door, so a door is never passable before it is visibly open. The HUD device list, the status discs (⚡ / ▲ / ✕), the socket LEDs, the cable glow and the hints all read the same state.

## References

| Role | Source | What was observed | How this game differs |
|---|---|---|---|
| Gameplay anchor | Atlas §03 Portal 2, https://www.thinkwithportals.com/about.php (mechanism videos: https://www.thinkwithportals.com/media.php). Not re-watched for this build; the atlas text was used. | The atlas notes a visible input, a device rule and a visible consequence, and teaching one rule before combining two. | No portals and no test-chamber framing. Three original rules (battery charge, cable power, pan hold) are taught in order, and room 3 has two solutions that combine them. |
| Visual anchor | Tinykin. The atlas has no URL for it; studied from the local pack images `09_Scale_repair…`, `10_Power_link…`, `11_Small_character…`, `13_Workshop_props…` and the contact sheet. | A bright magenta-to-cyan link line reads against a dark navy hex floor. A small character stands in a large warm room with hanging candle lamps and big props. Warm orange interiors contrast with cool shadows. | Original robot and keeper, a lighthouse setting, and cyan pulse cables instead of a link beam. Cool slate and blue-plank floors sit under warm amber lantern pools. Outlines are inverted hulls. No characters, props or UI were copied. |
| Supporting | I Am Future. No atlas URL; local images `18_Object_focused_disassembly_view`, `19_Exposed_components…`. | Exposed wiring and components frame the task. | The storeroom's pan→gate linkage (rod, pulleys, chain along the wall) is visible, the cradle and lamp show their state on LEDs, and plates name each device. |

## Controls

Keyboard: WASD/arrows move · E / Space / Enter use · R reset room · H hint · Z/X orbit · wheel zoom · Esc/P pause · G graphics quality · F3 stats. Mouse: drag to orbit. Touch: left-half stick, right-half drag orbits, USE / RESET / HINT / pause buttons. Gamepad: left stick move, right stick orbit, A use, Y reset, X hint, Start pause.

## Asset manifest

Everything is original and procedural. There are no image, audio or model files.

- **Textures (`tex.js`, canvas):** planks, hex slate, whitewashed stone, painted iron, crate, hazard stripes, cable rubber, cable power-pulse, storm window, glow/blob/ring sprites, beam gradient, sign plates (Anton + JetBrains Mono from `../fonts/`), status discs.
- **Geometry (`world.js`, `actors.js`):** Three.js primitives, merged per material. Characters are WICK (robot) and the keeper, both built from primitives.
- **Shaders:** water slip, sea, sky, beam cones and the environment probe, all written inline.
- **Audio (`sound.js`):** WebAudio synthesis through `../js/kit3d/audio.js` (rain/wind/surf beds, thunder, motor, hum, UI blips, music-box loop, lamp swell).
- **Shared code used:** `../js/fx3d.js` (cinematic, bindQualityKey), `../js/kit3d/score.js`, `input.js`, `ui.js`, `audio.js`, `vendor/three.module.min.js`.

## Test report

All runs used headless Chromium (`/opt/pw-browsers/chromium`, Playwright) with SwiftShader software WebGL (`--use-gl=swiftshader`). The page was served from `http://127.0.0.1:8765/rescue/`, `requestAnimationFrame` was stubbed, and the game was driven through `window.BEACON`. Movement used `BEACON.drive()` (real input vector, collision, doors). Interactions used `goto` + `use`, which go through the same `use()` as the E key.

| Test | Steps | Observed |
|---|---|---|
| Load | open page, step, render | 0 page errors, 0 non-local requests in every run |
| EASY clean playthrough | drive + use through all 3 rooms, hold route + cable to lamp | Room 1 door opened (cable lit, sink D0s). Standing on the gate pan opened the gate, it shut again before WICK reached it, and he was blocked 2.15 m short. The counterweight held it. The shutter was held by the weight, the cable reached the lamp at 10.3 / 11.5 m, the finale played, results showed BEACON LIT, 3★, 3,958 pts, +20 tokens, and the save was cleared. |
| HARD clean playthrough | real menu clicks (HARD, NEW RESCUE), real key presses (D held, E, H, Esc), then power route | Clock 3:30. The H hint cost 0:10. Esc paused and RESUME resumed, and a window blur paused. Cable to the shutter socket and the battery charged and carried to the lamp cradle reached results: POWER ROUTE · LAMP BY BATTERY, 3★, 4,556 pts. |
| Mistakes recover | battery dropped into the water slip; cable plugged generator→door; R | The battery sank and returned to spawn (toast "FELL IN THE SLIP"). The cable stopped at 6.5 m with the toast "CABLE AT FULL LENGTH" and the prompt offered only DROP. R put every object back, put WICK at the entry and set resets to 1. |
| Unexpected order / corners / gallery | cable first, then battery; flat battery in cradle; drops into room corners; flat battery in the lamp cradle; drive off the gallery edge; shutter closing on WICK | Power only flowed once the battery was full. Corner drops stayed reachable. The flat battery did not light the lamp. WICK fell to the floor still carrying the battery. The shutter pushed WICK clear onto the ramp side. |
| Save / reload | clear rooms 1–2, reload page | Menu showed "CONTINUE · ROOM 3 · 4:35 LEFT". Continue restored room 3 with the same clock (274.7 s), resets=1, doors 1 and 2 latched, and the solved layout of rooms 1–2. |
| No duplicate reward | finish; restore the old checkpoint; finish again | The first finish paid +16 tokens. The second finish of the same run id paid 0 ("REWARD ALREADY PAID FOR THIS RUN") and the profile stayed at 16. |
| Restart clears state | start HARD after a win | Room 0, no latches, doors closed, clock 210, resets 0, every object at spawn with charge 0, lamp dark |
| Time-out | setClock(.5), step | Results "THE STORM WON", 0★, +2 tokens |
| LOW quality | setQuality(0), play | Renders without the post stack or shadows; screenshot checked |
| Layout | 960×540, 800×500, 390×844 (also with touch emulation) | No horizontal scroll (scrollWidth equals innerWidth). On touch, the USE and RESET buttons worked. |

Performance: not measured on real GPU hardware. SwiftShader frame times are not meaningful, so no FPS claim is made. LOW drops shadows, the post stack and the pixel ratio, and the F3 overlay is available for measuring.

## Known issues

- **Implemented:** three rooms with their rules; two (three) solutions in room 3; carry/place/plug/drop with prompts; cable tether and drag; charging; per-room reset; spawn recovery; per-room checkpoints; storm clock with difficulty-scaled clock, hints and charge time; results with time, resets, stars, route and tokens; finale with the beam sweeping a lit sea; keyboard, mouse, touch and gamepad paths; reduced-effects option (no lightning flashes).
- **Partial:**
  - Gamepad mappings are wired but were not exercised with a real pad.
  - Touch was tested only under emulation.
  - The cable is drawn as a straight sagging curve. It can clip through railings, and its length is measured in a straight line, not along the path.
  - Objects don't stack and have no physics beyond falling.
  - When a plug and a battery sit close together, the context action picks the nearer one; you choose by where you stand.
- **Planned / not done:**
  - A dialogue beat with the keeper.
  - A real-device performance pass.
  - A recording of a playthrough (headless capture only, so none was made).
