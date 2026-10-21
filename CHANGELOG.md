# Changelog

Release numbers follow the commit history on GitHub. Numbers that are missing from the list (v2, v6, v9, v11, v17, v18, v20, v21, v24) were working builds whose changes shipped in the next listed release.

## Unreleased (on branch `round13`, which includes rounds 11 and 12)

### Round 13 (v36)

- **A front-page intro you fly into.** The hub now opens on the README's arcade room, live in 3D. Scrolling pins the scene and flies the camera through the ring of cabinets into the middle screen, which plays the console's attract demo. Meanwhile the PIXEL ARCADE title lifts away and four lines take the middle of the screen in turn (510 games, no installs, no accounts, every round ends on the clock), then the room fades into the console stage. Three.js loads only on a wide screen with WebGL, without reduced motion or data saver, and drops the glow and renders at 1x if the first second runs slow. Everyone else gets a still of the room (`docs/intro.jpg`) with the same scroll timeline, and with reduced motion it is one still screen.
- **The cabinet room is one shared module,** `js/arcade-scene.js`, used by both the intro and the README header renderer, so the two always match.
- **Motion everywhere else:** section headings decode from scrambled pixel glyphs as they scroll in, posters and sections rise in with a short stagger, a tilted cobalt marquee runs the world names between the console and the posters, and the title rises in on load.
- **Docs site:** a cinematic header (the arcade room behind a big DOCS wordmark), a reading-progress bar, and the same reveals and decoding headings.
- **README:** an intro flythrough GIF at the top of the front-page section, and the Design section covers the intro and the new motion.

### Round 12 (v35)

- **README header refurbished:** the ring of arcade cabinets and the big PIXEL ARCADE title are back, rebuilt in 3D. Each cabinet now has a real game on its screen, a lit marquee, controls and coin slots, standing on a reflective floor, with live counts of games, cabinets and 3D worlds. `tools/readme_hero.py` renders it from `tools/readme_hero.html`, so it can be regenerated after new games land.
- **Big box worlds:** the section is now a cinema band on a deeper night stage. Each world is a poster with its title over the screenshot, a numbered tag and a hover zoom; the first is a large feature. The first nine show by default, and **Show all 55 worlds** opens the rest.
- **Footer sign-off:** the PIXEL ARCADE wordmark from the README header, with a blinking FREE PLAY tag (still under reduced motion) and the live game and world counts.
- **Fixes:** the night footer now runs to the bottom of the page (a strip of stone showed under it); `tools/thumbs.py` works with the new library (it called a card method that round 11 removed).

### Round 11 (v34)

- **Cartridge Shelf redesign.** The hub is now a library of printed game packaging: one cobalt ink, with a night-navy stage (top bar, front page, footer) over warm stone shelves and no white anywhere. A full dark mode follows your system, or switch it in the top bar.
- **The console:** the front page has a console whose screen runs the games on the counter in attract mode, with a 20-second round clock that turns red for the last 10 seconds. Drag a cartridge into the slot (or tap it, or use the arrow keys and Enter) and the screen powers off, counts down and boots the game. Shuffle deals a new tray.
- **Shelves and boxes:** every game is a spine on a genre shelf, printed with its mode (1P, VS or 3D) and round length, with a print pattern per genre. Pick one and its box opens beside the shelf (a bottom sheet on phones) with a live preview, round length, mode, your best score, the rules, and Play, Favorite, Top 10 and Source. A Boxes view swaps the spines for box fronts with screenshots.
- **Type:** PA Pixel, a web font made from the engine's own bitmap lettering (`tools/pixelfont.py`), for labels, headings and the clock; Atkinson Hyperlegible Next for reading. Both ship in `fonts/`.
- **States:** a printed skeleton while the shelves load, an empty search with suggestions and a clear button, NO SIGNAL for a game with no screenshot, and a leaderboard error with Try again.
- **Keyboard and access:** arrow keys walk the shelves and the cartridge tray, `/` focuses search, Esc closes the box and the leaderboard, visible focus rings everywhere, WCAG AA (Web Content Accessibility Guidelines) contrast in both themes, and reduced motion holds the console on a still frame.
- **Docs site:** a new page at `docs/` (linked from the top bar and footer) covering play, controls, the library, building, installing, scores, development, project structure and the design.
- **Fixes:** the lobby leaderboard opens (it was hidden inside the game screen); "Save all offline" reports errors instead of failing silently.
- **Removed:** the Three.js cabinet ring (`js/hero.js`), the cursor trail (`js/trail.js`), pointer glow, parallax, name ticker, grain overlay and count-up stats.
- **README:** overview, features, new screenshots and an insert GIF, setup, project structure and a Design section for the new concept.

## v33 update (released 18 Oct 2026 from branch `round10`)

- **README progress tracker:** a new 📈 Progress section shows every release from v29 on (date, branch, game counts, what it added) and which 3D worlds have had the realism pass, with a progress bar. `tools/gen_docs.py` builds it from the game registry and `docs/progress.json`, so the counts stay current.
- **Realism and depth pass on six more 3D games.** Heavier effects only switch on at MEDIUM and above; LOW quality is as light as before or lighter in every measured view. All checks were headless (software WebGL), not on a real GPU or phone.
- **STRIKER 11 (second pass):** floodlight pools with four-way player shadows, grass sheen and rain puddles, a closed truss roof and skyline, home and away crowd ends with scarves, better run and kick animation, a glass score bug and lower-thirds; a LEAGUE mode with six clubs and five matchdays, and faster loading.
- **IRON VANGUARD:** golden-hour sky, blended terrain with ruts, track scars and craters, a riveted truss bridge, swaying card trees, a detailed tank and new jeep, helicopter and jet, lit smoke and layered explosions; vehicle damage zones, bots that pull back for repairs, squad objective orders and multi-kill banners.
- **STORM ROYALE:** a procedural sky, splatted island terrain with paths, new trees, fresnel water with shore foam, detailed houses, destructible props, a swirling storm wall and loot halos; rarity now affects spread and reload, a FIZZ CAN heal and frag grenades, difficulty-scaled bot tactics, seven storm phases, a richer kill feed and a killer cam.
- **WILD QUEST:** carved rivers with stepped waterfalls and mist, baked ground textures, five procedural tree kinds, distant mountains, a cloth cloak and parafoil glider, armoured camp enemies; a Sunroot warm buff, a cold zone on the peaks, chained camp chests, wading and rain stealth.
- **KART GRAND PRIX:** per-track road surfaces, kerbs, grandstands with crowds and rebuilt karts with boost lights; slipstream, item dragging, tactical CPUs, time-trial medals and saved cup trophies.
- **ABYSS DIVER:** physically based underwater light with depth absorption, caustics, a Snell's window surface, soft shadows, textured sand and rock, arches and reef life, a rusted wreck and a remodelled diver, sub and pod; echo logs that unlock gear, an objective chain, a buildable seabed outpost, curious turtles, a territorial razorjaw and a third-person view.
- **SWELL GUARD** (new 3D world, `surf/`): a surfing lifeguard on a golden-hour beach. Ride breaking waves for carve, air and barrel combos while rip, sting and shark rescues, a lost child, a seagull thief and a contest heat pull you off the waves.

## v32 update (released 18 Oct 2026 from branch `round9`)

- **Realism and depth pass on six 3D games.** Heavier effects only switch on at MEDIUM and above; LOW quality is as light as before or lighter in every measured view. All checks were headless (software WebGL), not on a real GPU or phone.
- **FRONTLINE OPS:** baked surface textures with grime and decals, rebuilt soldiers, worn weapon finishes and a lit viewmodel, per-map lighting and colour grading, contact shadows, skylines and street clutter; nine weapon attachments, bot squads that flank, smoke and suppress, a new HARDPOINT mode and kill medals.
- **SIDEWAYS:** rebuilt cars with clearcoat paint and detailed wheels, a procedural sky for day, sunset, night and rain, textured asphalt with lasting skid marks, trackside detail and billowing smoke; tandem battles, an eight-event career, tuning presets, smarter CPU lines and a results replay.
- **STRIKER 11:** a mown pitch with wear, two-tier stands with a celebrating crowd, floodlight towers, LED boards, reacting nets, detailed kits and faces, a broadcast intro, goal replays and rain; team shape by difficulty, advantage, stamina, substitutions and better goalkeepers.
- **DUSTWATER:** blended desert terrain, banded sandstone cliffs, swaying vegetation, rock formations, height fog, a textured town and camps, better horses and riders, gunsmoke, dynamite and a kill cam; payroll strongbox stakes, reinforcements, flanking outlaws, a saved horse bond and reputation, and gangs that return stronger. HARD is now much tougher.
- **FAIRWAY LEGENDS:** a new sky and lighting, distinct turf and sand detail, layered cliffs, a wave-and-foam sea, real wind-bent pines and gorse instead of blob trees, a rebuilt golfer swing and divots; a Pro Tour with prize money and a gear shop, hole-by-hole weather, eight CPU personalities, shot replays and better putting reads.
- **NEON BAY:** seven building styles with lit interiors, textured roads, wet streets with reflections, ground fog, nine detailed car models, street furniture and better pedestrians; police that escalate to a helicopter, armoured enforcers and spike strips, three new vehicles, two new missions, speed traps and hidden tags.

## v31 update (released 18 Oct 2026 from branch `round8`)

- **New 3D game: BEACON RESCUE** (`rescue/`): a three-room lighthouse rescue puzzle. A small repair robot learns that power travels (battery, cable, socket), then that a weight holds a gate, then combines both in a final room with two valid solutions. Live cables glow, every room has a reset, lost objects return, progress checkpoints per room, the storm clock is set by difficulty, and the relit beam sweeps the sea at the end.
- **New 3D game: TIDEWAY COURIER** (`courier/`): a delivery kart race round a sunny flooded harbor of little islands and bridges. Three laps through six ordered checkpoints (reversing never counts), a three-tier drift shown by spark colour, meter and pitch, a start boost, wall and sea recovery, a parcel pickup and drop every lap, three CPU couriers (EASY/NORMAL/HARD), a personal-best ghost lap and a resumable race save.
- **New 3D game: HARBOR PALS** (`critters/`): three original helper creatures with different shapes and powers (Mollo digs, Stilt becomes a bridge, Fizz glows and zaps machines). Pick one, meet the others, swap the leader, and use at least two powers to winch a stranded boat ashore before the tide rises. Followers handle stairs and corners and teleport back if stuck; difficulty sets the tide, hints and crank effort; progress saves and resumes.
- **New 3D game: LANTERN STREET** (`festival/`): a lantern-festival street at night. Meet three neighbours, find three cardboard parts and build a lighthouse-knight costume whose beam opens the loft stairs, then fight the lantern-snuffing Puffkins in a turn-based battle with timed presses (and an auto-timing option). Winning relights fourteen lanterns, opens the stalls and changes what the neighbours do; the parade clock is set by difficulty, and the repaired street is saved.

## v30 update (released 18 Oct 2026 from branch `v30`)

- **New 3D game: BASTION LINE** (`bastion/`): 3D tower defense on three diorama maps. Seven towers with two upgrade paths each, two levelling heroes, armoured, flying, shielded, splitting and healer enemies, a Juggernaut every tenth wave and a final Iron Colossus. An adaptive enemy warlord (EASY/NORMAL/HARD) counters your defence; targeting priorities, x2/x3 speed, interest, mouse, touch and keyboard controls, and a star-rated results screen.
- **New 3D game: FAIRWAY LEGENDS** (`links/`): 3D links golf on a nine-hole coastal course (or a quick three). Thirteen clubs plus putter, draw/fade and spin, a 3-click meter or drag tempo swing, wind, Magnus-lift ball flight, lies, water and out-of-bounds drops, putting grid, hole flyovers and green-read camera. CPU rivals (EASY/NORMAL/HARD) plan shots with the real physics; up to four golfers hot-seat, each on a round clock, with a full scorecard and stats at the end.
- **COURT KINGS:** shot contests are averaged between gather and release, threes fall at about 35% instead of 22-32%, dunks drop from up to 60% of shots to about 12%, layups leave from in front of the rim, CPU shot choice and defence scale with difficulty, and a late free throw no longer crashes the game. Phone and 800x500 menus fit.
- **SILENT CONTRACT:** a first-objective panel and waypoint guide you to the late guest's dinner jacket, both arrivals face the villa gate, the menu camera looks over the villa to the sea, and the phone HUD no longer overlaps.
- **3D post-processing:** the ambient occlusion pass no longer re-renders shadow maps or makes an extra full-screen copy (for example 505 to 373 draw calls in DUSTWATER at HIGH); the look is unchanged.
- **Art pass (43 canvas games):** balloon pop, millipede, cube hop, miner, chopper, depth charge, boss rush, traffic, runner, skee-ball, rail, drone, laser maze, shuffleboard, soda slide, tube wars, columns, stack tower, color switch, knife hit, poker, blackjack, crazy eights, paint, dots, mancala, ultimate tic-tac-toe, ice slide, pipes, memory, hex mines, penalty, badminton, cricket, bocce, cornhole, penalty duel, hammer, rocket landing, ski jump, long drive, trench run and mesh drift.
- **Fixes:** cornhole hole now scores, ski jump inrun slopes the right way, badminton shuttle bounces off the net, hammer, code breaker, FreeCell and pipe flow now post real scores, drone winch works.

## v29 update (released 17 Oct 2026 from branch `v29-heavy-3d`)

- **Repository layout:** tests moved to `tests/`, Python and Node tools to `tools/`.
- **Engine:** `js/engine.js` split into 13 modules in `js/engine/`; the `A.gx` art kit moved from `games/sports1.js` to `js/gx.js`.
- **3D kit:** all 31 worlds now share `js/kit3d/score.js` for the arcade profile, best scores and POST SCORE.
- **3D kit, part 2:** new shared `js/kit3d/input.js` (keys, mouse, pointer lock, held and spam-click fire, gamepad), `audio.js` (WebAudio helpers and a spatial sound base class) and `ui.js` (saved options, menu pickers, POST SCORE button, toasts). Ten worlds use them (arena, zombies, frontline, strike, titans, ink, campaign, looter, extract, breach) with identical behaviour.
- **3D kit, part 3:** thirty more worlds now use the shared input, audio and UI modules (every 3D world except the builder), each checked old-against-new through its test hook. Bespoke menus, sounds and controls that don't fit the kit stay in their worlds.
- **Canvas art pass, round 2:** 30 more of the plainest cabinets get themed stages, glossy pieces, particles and feedback (puzzle, party, card, track and field, rowing, skating, climbing and more). Fixes along the way: unreadable answers in NEXT NUMBER, overlapping dots in COUNT FAST, COLOR WHEEL running off screen and the skating finish line. LIGHTS OUT, COLOR FLOOD and MEMORY GRID score progress so partial play earns points.
- **Canvas art pass, round 3:** 24 more cabinets restyled (sniper, flight, kart and other retro-3D games, rhythm, orbit, chain, gravity and dash runners, swimming, diving, wall jump, aim trainer, sudoku, water sort, balance, nim, tug of war, pig, pyramid, echo, pegs). Fixes: SNIPER ALLEY's scope covered the whole screen, WALL JUMP could never climb, the diver fell through the board, and RHYTHM's hit text vanished after a few frames. KART CUP and SUDOKU 6 now score partial progress.
- **Offline fonts:** the hub, the builder and 14 older worlds no longer load Google Fonts; they use the local copies through `fonts/fonts.css`.
- **Manifest:** `games/index.json` lists the engine modules and game packs in load order; `index.html`'s script tags, the tests and the docs generator all read it.
- **Docs:** `tools/gen_docs.py` regenerates README counts and tables, `docs/GAMES.md` and the README art. New `docs/ARCHITECTURE.md`, `THIRD_PARTY.md`, this changelog, issue and pull request templates.
- **CI (continuous integration):** the canvas game test runs in four parallel slices and checks that generated docs are current.
- **3D performance:** **F3** shows frames per second (FPS), draw calls and triangles in every world; graphics quality steps down on its own when a world stays under 45 FPS (pressing **G** turns that off).
- **Neon Bay:** see-through car windows with a driver at the wheel; police officers get out of their cruisers and chase you on foot, then return to their cars when you drive off.
- **Voxel Frontier:** leaves and glass cast cut-out shadows instead of solid blocks.
- **Exfil:** CPU raiders follow you up and down stairs and fight on your floor.
- **Longbow Keep:** CPU teams push for the flag (bot-only captures went from 0.9 to about 2.2 per match) and walk around barricades instead of chopping them.
- **Long Shot:** people no longer walk through walls or each other; the logarithmic depth buffer is gone, which is faster on real graphics cards.
- **Nightfall:** real jumping; climb onto crates, tables and the truck. Zombies climb after you.
- **Ironclad:** shell hits follow the hull's tilt on slopes.
- **Strike Zone:** bots no longer stand on Skyline's roof-edge walls.
- **Voxel Frontier:** old saves carry over (score, nights and items) into a fresh world.
- **Frontline Ops:** forward respawns, so most 75-kill deathmatches finish before the clock.
- **Graphics upgrade for the eight v27-look worlds:** Night Drive (profiled cars, street lamps, wet streets), Penguin Plaza (sparkling snow, ice, feathered penguins), Pet Brawl (textured stage, meadow, battle effects), Skate City (detailed skater and board, park props), Storm Royale (swaying grass, new trees, storm wall, characters), Striker 11 (shaped players, fabric kits, stadium aisles), Tumble Royale (glossy toy plastic, stadium sky), Wild Quest (leaf-card trees, water, armoured hero).
- **All 3D worlds:** a negative first-frame time no longer crashes the menu camera.
- **Canvas art pass on the 16 plainest cabinets:** Stack 3D, Tilt Maze 3D, Tower Stack, Cloud Hop, Piano Tiles, Paper Plane, Laser Dodge, Bounce Ball, Ping Bounce, Paddle Duel, Triple Pong, Quad Pong, Flip Disks, Maze Dash, Mini Golf and Curling get new backdrops, lit objects, particles and feedback. Maze Dash and Tilt Maze 3D gain gem pickups (+25). Their hub thumbnails are re-rendered.
- **New 3D game: HARDFALL** (`titans/`): pilots wall-run, slide and shoot, then call a war frame down from orbit and climb in. 6v6 Attrition with grunts, two maps, CPU on both teams. Titanfall-style.
- **New 3D game: GLOSS RIOT** (`ink/`): 4v4 turf war in glossy ink. Paint the ground in your crew's colour, swim through it to refill and move fast, and out-cover the rival crew before the 3-minute whistle. CPU teammates and rivals. Splatoon-style.
- **New 3D game: STARFALL VANGUARD** (`campaign/`): a 3-mission sci-fi campaign on a ring-world with four CPU marines, recharging shields, overheating alien guns, a turret buggy, a hover tank and a boss fight. Four difficulties, a time limit per mission and campaign results with a rank. Halo-style.
- **New 3D game: STARWARDEN** (`looter/`): a co-op looter shooter. Run timed strikes with two CPU guardians across three destinations, break elemental shields, beat a two-phase boss, and collect guns with random perks and rarities. Three subclasses and three difficulties. Destiny-style.
- **New 3D game: IRON VANGUARD** (`warfront/`): 16v16 Conquest over five flags in a 700 m river valley. Four classes, tickets and revives, and tanks, jeeps, attack helicopters and jets for both the player and the CPU. Three round lengths and three difficulties. Battlefield-style.
- **IRON VANGUARD:** crews are now drawn in tanks, helicopters and jets behind see-through canopies; jeep drivers and gunners can be shot (including the player), the jet hull no longer renders inside out, and a gap in the jeep's hit volume is closed.
- **New 3D game: ZENITH PROTOCOL** (`heroes/`): a 5v5 hero shooter against CPU squads. Seven heroes (tanks, damage and supports) with abilities and ultimates, Payload Attack, Payload Defend and Control on two maps, and a results screen with per-hero stats and awards. Overwatch-style.
- **ZENITH PROTOCOL:** fixed projectiles that flew off wildly near an enemy barrier or dome and could freeze the match; HARD Control and Payload are now winnable (about half of HARD Control matches in testing).
- **New 3D game: DROPZONE** (`dropzone/`): a 40-player battle royale against 39 CPU operators in an original port city. Parachute drop, loot in five rarity tiers with attachments, armour plates, buy stations and loadout drops, seven gas phases, drivable rovers, and a 1v1 cage duel that sends the winner back in. 12-minute limit. Warzone-style.
- **DROPZONE:** CPU players now drive the rovers to rotate with the gas, with a visible driver behind see-through glass, and the HUD shows players waiting for the cage separately (ALIVE · CAGE).
- **DROPZONE:** bots no longer stand still in the gas (thin walls block the nav grid, sealed rooms are bridged, stuck bots escape); gas deaths per match fall from about 10 to 1 and bots take rovers about three times as often.
- **IRON VANGUARD:** grenade and explosion splash now hurts exposed jeep riders, and the tank commander stows his rifle in the hatch.
- **STARWARDEN:** ADEPT enemies hit harder (about twice the damage taken), and the results screen fits a 540 px window.
- **VOIDWING:** the setup menu fits 960x540 and 1280x720 without scrolling.
- **STARFALL VANGUARD:** glowing spawn and explosion spheres fade into the ground instead of showing flat discs.
- **New 3D game: VOIDWING** (`void/`): cockpit starfighter combat. Three ship classes per faction, power routing, boost and drift, overheating lasers, lock-on missiles and countermeasures; 5v5 Dogfight and a Fleet Battle where you strip a capital ship's shields and subsystems. Two sectors, three difficulties. Squadrons-style.
- **New 3D game: HALCYON HEIST** (`heist/`): a first-person co-op heist with three CPU crew. Case the bank or the jewellers, go quiet (cameras, guards, pagers, hostages) or loud (police waves, a jamming drill), bag the loot and reach the van. Results grade the take, stealth bonus and kills. Payday-style.
- **New 3D game: ASHEN VIGIL** (`ashen/`): a third-person souls-like in a ruined cathedral-keep. Stamina combat with light and heavy attacks, rolls, parries and ripostes, lock-on and flasks; shrines, shortcuts, three bosses and a final boss with phase changes. Three weapon styles and three difficulties. Dark Souls-style.
- **New 3D game: AEONFALL** (`moba/`): a 5v5 top-down battle arena against CPU teams. Ten champions with passives and four abilities, three lanes with towers and inhibitors, a jungle with two buff bosses, levels, gold, a shop, wards, fog of war and a minimap. Classic or WASD controls, 12 to 30 minute matches. League of Legends-style.
- **AEONFALL:** smarter CPU champions: they time last hits (about double the farm), push lanes after winning trades, group for towers and bosses, walk into the enemy base and defend their own. Most 20-minute matches now end with a core destroyed. Champions that walked home also now heal at the fountain.
- **New 3D game: SHARDWAR** (`rts/`): real-time strategy with two asymmetric factions, two resources, supply, fog of war, a minimap, upgrades and unit counters. 1v1 and 2v2 maps against CPU at three difficulties; win by razing every enemy building or on score at time. StarCraft-style.
- **New 3D game: TEMPEST FIST** (`fight/`): a 3D one-on-one fighter with nine original fighters. Strings, throws and breaks, launchers into juggles, specials, rage and cinematic supers, high/low blocking and sidesteps. Arcade ladder with a boss, local 2-player versus and training mode with frame data. Tekken-style.
- **New 3D game: HOLLOW MANOR** (`manor/`): first-person survival horror in a four-floor manor lit by a draining flashlight. Find three sigils and escape before dawn while a stalker hunts by sound and light (EASY/NORMAL/HARD). Hiding spots, held breath, a fuse box, a note-clue safe, a rotating-portrait lock, positional synthesized audio and a graded results screen.
- **New 3D game: DUSTWATER** (`west/`): open-world western. Take one of three bounty contracts, call and ride your horse out to the gang's camp, fight with revolver, lever rifle and slow-motion Dead Eye, then lasso the leader and bring him in alive or win a quick-draw duel. A frontier town, a looping steam train, a day-to-dusk sundown timer, outlaw difficulty EASY/NORMAL/HARD and a bounty results screen.
- **New 3D game: COURT KINGS** (`hoops/`): 3D basketball. 5v5 arena with timed quarters, shot clock, fouls and free throws, or 3v3 street to 21. Shot meter with green releases, dribble moves, lead passes, dunks and alley-oops with replays, blocks, steals and box-outs. CPU teams run pick and roll and help defence at EASY/NORMAL/HARD; local 2-player versus with keyboard or gamepads; box-score results screen.
- **New 3D game: SILENT CONTRACT** (`shadow/`): third-person stealth assassination at a cliffside villa gala. Two targets on timed routines, six disguises with enforcers who see through them, instinct vision, suspicion meters, bodies that must be hidden, coin/radio/fuse distractions and three staged-accident opportunities. Guard AI at EASY/NORMAL/HARD, timed contract and a rating from SILENT ASSASSIN to BUTCHER.
- **Online play (first step):** **⇄ Play online** in the hub footer links two browsers on the same network with a copy-paste or QR code, no server. Four in a Row is the first online game. See `docs/MULTIPLAYER.md`.
- **Engine:** small automatic score pops show at most once every 36 frames, so fast-ticking scores no longer stack a cloud of +1s.

## v29 (12 Oct 2026)

- Ten new full-3D games: Neon Bay (open-world city), Nightfall (round-based undead survival), Exfil (extraction shooter), Ironclad (5v5 tank battles), Sky Lancers (air combat), Nova Arena (jetpack arena shooter), Longbow Keep (castle archery capture the flag), Long Shot (sniper missions with wind and drop), Sideways (drift racing), Runline (first-person parkour).
- Rebuilt: Strike Zone (now an arena FPS), Critter Kart, Voxel Frontier, Abyss Diver, Frontline Ops, Starship Suspects, Platform Brawl.
- Installable offline web app (service worker and "Save all offline"); Electron desktop app with GitHub Actions release builds.
- Local fonts, hub card images compressed from 24 MB to 2.3 MB, refreshed README art and full game list.
- Also includes the v28 work: Kart Grand Prix, Breach Point, Fortress Breach, Orbit Lab, Block Beasts and the 3D game builder improvements.
- 486 games, 31 full-3D worlds.

## v27 (2 Oct 2026)

- Remastered Strike Zone, Night Drive, Critter Kart and Pet Brawl.

## v26 (1 Oct 2026)

- 463 games, 12 new 3D games, UI and art overhaul.

## v25 (1 Oct 2026)

- Rocket Arena, the 3D game builder, better search.

## v23 (30 Sep 2026)

- Water, clouds, wind, TNT, Bloaters, bubbles and plankton.

## v22 (30 Sep 2026)

- Crafting, tools, torches, sonar, beacons, favourites.

## v19 (29 Sep 2026)

- 272 games, including chess, Temple Dash and Candy Rope; detailed people everywhere.

## v16 (28 Sep 2026)

- Pet Brawl auto-battler, detailed people, spawn-timer fixes, scoring sweep.

## v15 (28 Sep 2026)

- 241 games, attract-mode title screens, CRT power-on effect, score pop-ups.

## v14 (27 Sep 2026)

- Unified quality layer for all games, the quality gate, 20 new games.

## v13 (26 Sep 2026)

- Night Drive, an open-city 3D taxi game.

## v12 (26 Sep 2026)

- 200 games, studio redesign, high-definition (HD) rendering, Strike Zone 3D.

## v10 (26 Sep 2026)

- Bug fixes, mouse aiming and rapid fire, 3D cabinet lobby, CI.

## v8 (24 Sep 2026)

- Showcase lobby with live previews, party pack, 140 games.

## v7 (24 Sep 2026)

- Critter Kart, a full-3D WebGL kart racer with eight animal racers.

## v5 (24 Sep 2026)

- HD polygon renderer with fog, lighting, shadows and detailed meshes.

## v4 (24 Sep 2026)

- 100 games, search, deep links, new README.

## v3 (24 Sep 2026)

- 58 games, polygon 3D, concise UI.

## v1 (24 Sep 2026)

- Pixel Arcade: 43 original retro games.
