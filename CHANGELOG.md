# Changelog

Release numbers follow the commit history on GitHub. Numbers that are missing from the list (v2, v6, v9, v11, v17, v18, v20, v21, v24) were working builds whose changes shipped in the next listed release.

## Unreleased (on branch `v29-heavy-3d`)

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
