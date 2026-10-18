# LANTERN STREET — notes

Full-3D festival-night slice (atlas prototype C "Festival neighborhood", built on the owner's Cardboard Kingdom concept). Three.js r160 from `../vendor/`, kit3d helpers from `../js/kit3d/`, structure adapted from `plaza/` (world/util/sound), `quest/` (dialogue + objectives) and `monsters/` (turn-based battle flow).

## Slice plan
1. **Street (explore):** one lantern street (gate → workshop → courtyard → canal steps → plaza with the parade float and bell; loft roof at the end via stairs). Every lantern starts dark.
2. **Residents:** Granny Fern (round, apron, dumpling stall), Teodor (tall, lanky, lantern maker, squeezebox), Juno (small, seven, fish lantern). Each has a first-meeting script and per-phase lines (before costume / costume built / street repaired). Lines hint at parts and Teodor hands over the costume plan.
3. **Costume:** three authored cardboard parts — BOX HELM (recycling nook), TOWER TUBE (courtyard), LID SHIELD (canal steps) — assembled at Teodor's workbench into the original **cardboard lighthouse knight** (short assembly cine).
4. **Field ability:** hold the lighthouse BEAM on the gloom knot on the loft stairs; a steady beam unties it and opens the path.
5. **Battle:** on the loft, the costume becomes its heroic battle form. Turn-based vs two Puffkins and Old Bellows (original mischief creatures who blew out the lanterns). Moves: LAMP BASH, BEACON SWEEP, KEEPER'S WALL, RELIGHT. Every attack and every defence has a timing ring (GREAT / GOOD / EARLY / LATE as words). Bellows telegraphs BIG HUFF with an INHALE turn. AUTO-TIMING assist always lands GOOD. Loss → retry at full strength or step back; progress kept.
6. **Restoration:** victory cine sends a relight wave out from the loft: 14 street lanterns plus string lights relight in order of distance, the stalls open, Juno's fish glows, residents switch to celebration routines (Fern ladles and waves, Teodor plays on the loft, Juno cheers and dances).
7. **Finish:** ring the parade bell → parade cine → results (time, parts found, battle grade, stars, tokens). The festival clock (time to the parade) is the limit; the clock tower hands show it too.

Difficulty: EASY 9:00 clock, softer foes, wide timing windows, objective marker always; NORMAL 6:30, marker only for places a neighbour told you about; HARD 4:30, tougher foes (HP x1.3, damage x1.35), narrow windows, no marker.

## References (from /tmp/claude-0/insp/reference_atlas.md)
- **§20 Costume Quest** — https://www.doublefine.com/games/costume-quest (trailer https://www.doublefine.com/dftv/costume-quest-trailer). *Observed:* homemade costumes in exploration become heroic forms in turn-based battles with timed button presses; a small neighbourhood with kids and adults to talk to. *Different here:* one original costume (cardboard lighthouse knight) whose same lamp is both the field ability (beam unties the knot) and the battle kit; an explicit timing ring with word results and an auto-timing assist; a festival clock instead of trick-or-treat; no franchise characters, names or art.
- **I Am Future (supplemental local images)** — /tmp/claude-0/insp/img/16_Warm_social_corner_inside_a_larger_rooft.jpg, 17_Garden_workbench_placement_and_functiona.jpg, 15_Character_concept_lineup_not_gameplay.jpg (no atlas URL; local study files). *Observed:* a warm social corner (sofa, fire, string lights) inside a larger rooftop; functional clutter (crates, tank, planters, workbench); warm pools of light against a cool night. *Different here:* the loft deck is the battle stage and the post-repair hangout (sofa, fire pit, water tank, planters, string-light poles); Teodor's workshop is an open pergola with sofa, cooler and half-made lanterns. No survival or ocean setting.
- **§12 Okami HD (optional)** — https://store.steampowered.com/app/587620/OKAMI_HD/. *Observed:* visible restoration that spreads out over the world. *Different here:* a relight wave radiating from the loft, per-lantern lit values and stall shutters animated by distance, not brushwork or a painted filter.

## Controls
- Walk: WASD / arrows · touch stick · gamepad left stick.
- Talk / pick up / use / advance dialogue: E / Space · ACT button · pad A.
- Beam: hold Q or F · hold BEAM · pad X (after the costume).
- Battle: 1-4 or click a move · ◀ ▶ / click a foe to target · Space / click / tap / pad A when the ring closes.
- Pause: Esc / P / II button (also auto-pauses on blur). R in the pause menu returns you to the gate (unstuck). G cycles graphics quality (F3 overlay).
- Menu: CLOCK (difficulty), TIMING (I'LL PRESS / AUTO-TIMING), EFFECTS (FULL / REDUCED).

## Asset manifest (all procedural and original)
- Geometry: built in code (boxes, cylinders, lathes, spheres) and merged per material in `world.js`/`chars.js`; lanterns are instanced with a per-instance lit attribute.
- Textures: canvas-generated — running-bond cobbles, plaster, roof tile, wood, stone, awnings, clock face, cardboard, stripes, emblem, knit, fish scales, whale paint, sky dome shader.
- Characters: Wren (paper lantern, cardboard parts), Lighthouse Knight, Granny Fern, Teodor, Juno, Puffkins, Old Bellows — all original primitive rigs.
- Audio: WebAudio synthesis only (`sound.js`): three music moods (night / fight / festival) and all effects; starts after the first gesture.
- Fonts: `../fonts/fonts.css` (shared arcade fonts). No CDN, no network requests.
- Writing: all dialogue and names original (`data.js`).

## Test report
Environment: Playwright (playwright-core) driving **Chromium headless with SwiftShader WebGL** (`/opt/pw-browsers/chromium`, swiftshader args, `requestAnimationFrame` stubbed, stepped through the `window.LANTERN` hook), served from http://127.0.0.1:8765/. Scripts and screenshots: /tmp/claude-0/agents11/festival/.
- **Zero page errors and zero non-local requests** in every run below.
- **Full playthroughs** (`play.js`): EASY, NORMAL and HARD all reach results (win, 14/14 lanterns, 3 parts, 3 residents met, grade S, 3 stars). EASY + AUTO-TIMING: every ring lands GOOD, grade B, 2 stars.
- **Steering-only route** (`walk.js`, no teleports, NORMAL): walks to every resident and part, builds the costume, unties the knot with the beam, climbs the stairs and triggers the battle by walking (about 56 s game time with instant dialogue).
- **Mistakes** (`tests.js` A): workbench without plan → "ASK TEODOR FOR THE PLAN"; with 1/3 parts → "NEED 3 PARTS (1/3)"; knot without costume → blocked; stairs without gate → player stays at street level.
- **Save / reload** (B): CONTINUE restores parts, met, talk positions, hints, blueprint, position and clock; collected parts stay hidden and cannot be picked twice; profile unchanged.
- **Restart** (C): clears parts, met, costume, blueprint, knot, clock, position.
- **Lose and recover** (D): losing shows the lose card (clock paused); STEP BACK returns to the stairs; re-engaging (tries 2) and winning gives grade A.
- **Repaired street persists** (E): reload after the win gives lit 14/14, stalls open, residents in post routines, same conversation indices, objective "Ring the parade bell". Finishing awards 14 tokens once; reload offers no continue and tokens stay 14.
- **Timeout** (F): HARD clock run out → results with why "time", 0 stars, partial tokens.
- **LOW quality** (G) renders; **layouts** 390x844 and 800x500 have no horizontal scroll (menu, street, dialogue, beam, battle, results).

## Known issues
**Implemented:** everything in the slice plan; difficulty table; assist; reduced effects; quality key; gamepad; touch controls; save/continue; no-duplicate rewards (done-run list); score via kit3d `addRound/saveBest/postScore` with id `lanternstreet`.

**Partial:**
- Saving during a battle stores the street state at the foot of the loft (the fight restarts on return rather than resuming mid-turn).
- Camera is a scripted follow with per-area offsets; there is no manual orbit, so a few tight corners (behind the workshop sofa) frame the player partly behind props.
- Performance measured only under SwiftShader; real-GPU frame timing not measured here.
- Residents' routines are short waypoint loops, not full schedules.

**Planned (not built):** more costumes / parts per run, a second encounter, voiced barks, a photo mode for the parade.
