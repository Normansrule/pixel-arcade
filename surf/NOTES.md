# SWELL GUARD — notes

Full-3D surf + lifeguard game (id `swellguard`, SPORTS). You are the tower-7 lifeguard on a golden-hour point break. You surf for score between duties. Rip-current victims, events and a contest heat keep pulling you off the waves, and missed rescues cost reputation.

## Slice plan
1. **Wave model.** An analytic peeling wave (lefts, rights and A-frames) shared by the JS physics and the GLSL ocean. Curling lip ribbons. Whitewater bore and foam.
2. **Surfer physics.** Paddle, pop-up, then ride in the wave frame: gravity down the face, fin grip, stall and crouch. Turn classification (bottom turn, snap, cutback, roundhouse, re-entry), airs with spin/flip/grab, barrels, wipeouts, combo banking.
3. **Rigged characters.** One SkinnedMesh per person, procedural poses and leg IK. The baked beach crowd uses lower tessellation.
4. **Duty layer.** Swimmers drift in a rip field. Victim types are rip, bodyboard, inflatable, shark, sting and tumble. You grab, tow to the sand and hand off to the partner lifeguard. The whistle clears the water. Reputation tracks your performance.
5. **Events:**
   - shark fin
   - jellyfish bloom
   - seagull thief
   - lost child
   - big-set warning
   - contest heat vs 3 CPU surfers (the partner covers the tower, so incidents slow down)
   - dolphin pod
6. **Shell.** Menu, intro, HUD, results screen with stars, career save, mid-shift autosave/resume, touch controls and synth audio.
7. **Polish.** Sky/IBL, water shading, beach props, spray, quality tiers.

## References
No art atlas or external assets were used. Everything is procedural (textures baked once in `tex.js`, ≤1024 px).

Inspiration is the general feel of arcade surf games of the Pro Surfer era: trick names, combo multiplier, barrels and airs. Lifeguard TV dramas inspired the tower, flags and red-vest rescues.

It differs from both. Waves are a continuous peeling simulation you read and position on, not a fixed half-pipe. Surfing competes for your time with an incident system that has real costs (reputation, stars capped by misses, failure state "RELIEVED OF DUTY").

## Controls
| Action | Keyboard | Gamepad |
|---|---|---|
| Run / paddle / steer | W A S D | L-stick |
| Stand up / duck-dive / launch | Space | A |
| Crouch (speed, barrel) | Shift | RT |
| Stall | Q | LT |
| Air: spin / flip / grabs | A D / W S / J K L | — |
| Grab swimmer / help kid | E | X |
| Whistle | F | Y |
| Camera / map / music / pause | C / M / N / Esc | — |
| Quality | G | — |

On touch screens there is a virtual stick and buttons. The F3 key toggles stats.

## Asset manifest
- **Code:** index.html, surf.css, game.js, ocean.js, scene.js, world.js, rig.js, surfer.js, ai.js, duty.js, fx.js, sound.js, tex.js, merge.js.
- **Shared repo modules:** ../vendor/three.module.min.js, ../js/kit3d/{score,input,ui,audio,fx3d}.js, ../fonts/fonts.css.
- **Textures:** all procedural canvases baked at load: water normals, foam lace, clouds, sand and sand normals, rock, grass, palm frond, wood, boards, umbrellas, towels, flags, vest and the tower sign.
- **Audio:** all WebAudio synthesis: surf roar bed, crashes, whistle, horn, gulls, cheers, rail hiss and the groove music.
- **No image or audio files and no network calls.**
- **Save key:** `pxd_swellguard` holds options, career, the mid-shift snapshot and an awarded-run id list. Every storage access is in try/catch.

## Test report
All testing was done in headless Chromium (Playwright) with **SwiftShader** software WebGL, with requestAnimationFrame stubbed and frames stepped through `window.SWELL`. No real GPU, phone or touch hardware was tested. Every run below had 0 page errors and 0 non-local requests.

**Full shifts**
- EASY autopilot: reaches results, 15,970–17,165 points, 1–2 stars.
- HARD autopilot: reaches results, 15,159–22,117 points, 6–8 rescues.

**Failure and recovery paths**
- Time-out: `setClock` takes the run to "END OF SHIFT" and the results screen.
- Reputation 0: "RELIEVED OF DUTY" with 0 stars.
- Wipeout in deep water: the rider is back to paddling after about 1.5 s.
- Wipeout in the shore-break: the rider washes onto the sand on foot.
- Dropped victim: can be grabbed again.

**Saving and restarting**
- Save/resume: autosave every 3 s. A reload then RESUME restores clock, surf, duty, rescues and rep exactly.
- Replaying an old snapshot of an already-awarded run does not add career shifts, rescues or tokens a second time.
- Restart clears victims, events, tow and score.

**Settings and layout**
- G cycles quality 2→1→0. A hidden tab pauses.
- LOW quality renders and plays correctly.
- Layouts at 800×500 and 390×844 (menu, play with a heat card, results, pause) have no horizontal scroll.

**Render cost.** Measured with renderer.info, one frame mid-ride, world built at that quality:

| Quality | Draw calls (incl. shadows) | Triangles | Main-pass calls | Main-pass triangles |
|---|---|---|---|---|
| LOW | 36 | 185k | 36 | 185k |
| HIGH | 88 | 716k | 36 | 480k |

Before the crowd LOD fix, LOW was 530k triangles and HIGH was 1.10M.

## Known issues
**Implemented**
- Surfing, tricks, combos, barrels, airs and wipeouts.
- All three rescue types plus shark, sting and tumble victims.
- All 7 events with real mechanics.
- Difficulty scaling: wave size, rival skill, incident and event frequency, victim timers, shift length.
- Results screen, stars, POST SCORE, save/resume, LOW quality without reflections and with a coarser mesh.

**Partial**
- Resume restores the run's numbers and clock but not the live beach state. Swimmers and victims respawn fresh.
- The autopilot (attract and test mode) puts duty first. On HARD, incidents are nearly continuous, so it rarely surfs and its surf score can be 0. A no-incident run confirms it does catch and score waves.
- The lip ribbon can read as a pale translucent sheet when seen from inside the tube at some angles.
- Faint foam lace remains on the face behind broken sections.

**Planned**
- Rival name tags.
- Better underside shading on the lip.
- Restoring people and victims on resume.
- Testing on a real GPU and on mobile hardware.
