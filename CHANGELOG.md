# Changelog

Release numbers follow the commit history on GitHub. Numbers that are missing from the list (v2, v6, v9, v11, v17, v18, v20, v21, v24) were working builds whose changes shipped in the next listed release.

## Unreleased (on branch `round30`, which includes rounds 11 to 30)

### Round 30, batch 7 (v70): the Townsfolk pack, 20 new games (581 in all)
- New `games/townsfolk.js`: trades and town life, drawn with the shared character kit.
- Solo: Baker's Dozen, Blacksmith, Lamplighter, Potter's Wheel, Clock Tower, Fire Brigade, Milk Round, Book Sort, Tailor's Seam, Window Washer, Bus Stop, Sawmill, Ice Cream Stack, Stargazer, Lobster Pots, Bell Ringer, Chimney Sweep.
- Versus CPU or 2 players: Pig Chase, Wood Chop, Cheese Roll.
- Spice Trader's "worth" readout no longer shows NaN.

### Round 30, batch 6 (v69): the Voyage pack, 20 new games (561 in all)
- New `games/voyage.js` built on the shared character kit, with a crowd helper and world-travel settings.
- Solo: Camel Caravan, Rickshaw Run, Panda Climb, Volcano Hop, Sand Glyphs, Koi Pond, Cable Car, Balloon Crossing, Carnival Parade, Penguin Slide, Snow Rescue, Canyon Bridge, Temple Torches, Lasso Loop, Topiary, Kite Surf, Spice Trader, Museum Guard.
- Versus CPU or 2 players: Dog Sled (each lane has its own camera), Fjord Race.

### Round 30, batch 5 (v68): the Frontier pack, 20 new games (541 in all)
- New `games/frontier.js` with a shared character kit: `hero()` (outlined chibi people with blinking eyes, five hair styles, eight hats, capes, aprons and a held item), `critter()`, and scenery helpers (`tree`, `pine`, `cottage`, `cloud`).
- Solo: Lighthouse Keeper, Mushroom Forager, Train Hop, Sky Fisher, Night Market, Crystal Cave, Mail Owl, Gondola, Dino Dig, Storm Chaser, Yeti Escape, Treasure Dive, Firework Show, Lantern Float, Ice Fishing, Sheepdog, Tide Pool.
- Versus CPU or 2 players: Wizard Duel, Gnome Garden, Lance Tourney.
- Release zips older than round30-4 were deleted from the project files (owner's request) to free storage.

### Round 30, batch 4 (v67): showroom finish
- All full-3D worlds: the shared grade in `js/fx3d.js` adds vibrance, teal-and-gold split toning and luminance clarity (`cinematic({look:0})` turns it off, or pass `{look:{vib,split,clar}}` to tune it).
- Night Drive: lighter daytime asphalt with a dry sheen, and stronger afternoon sky fill so shaded streets no longer turn black.
- Firefly: moonbeams, a pond that mirrors the moon, ferns, and a lighter blue night so the forest reads.
- Word Guess: a lamp-lit board behind the grid, a tiled backdrop, a padded keyboard tray, a blinking caret and shine on revealed tiles.
- README: new "Showroom finish" section with a before/after.

### Round 30, batch 3 (v66): textured 3D walls and a richer README

- **Dungeon 3D:** the maze walls are now textured stone blocks with mortar, moss low down and soot near the ceiling, lit warm by your torch and fading into the dark. The textures are generated in code (a new shared `walltex`/`wallCol` kit in `js/gx.js`), so nothing extra is downloaded.
- **Strike Zone 3D:** riveted metal panels with lit seams, and red brick on some walls, tinted per wall and fogged with distance (GFX off keeps the old flat colours).
- **Hover Tank 3D:** a banded synthwave sun and two ridges of mountains on the horizon that slide as you turn, over a gradient plain.
- **README:** new sections with an animated reel of the five screen filters, a panel of real sound waveforms, a before/after strip for this round's graphics and a fresh shot of the Play anywhere section; the controls table lists V and X.

### Round 30, batch 2 (v65): screen filters

- **Screen filters for every arcade cabinet:** press **V** on the pause card (or on a game's title and result screens) to cycle CLEAN, POCKET (four shades of green with ordered dithering, like an old handheld), 8-COLOUR (each colour channel dithered on or off), PRINT (one-bit Atkinson dithering on warm paper) and ASCII (the picture rebuilt from coloured text characters). The clock, cards and menus stay sharp on top, the choice is remembered, and each filter costs 1 to 3.5 ms a frame whatever the window size.

### Round 30, batch 1 (v64): recorded sound and a Play anywhere section

- **Recorded sound effects:** 76 free CC0 (public domain) sounds by Kenney, taken from his Interface, Impact and Sci-Fi Sounds packs and his official starter kits, are now stored in `sfx/` (560 KB, works offline). Credits are in `THIRD_PARTY.md` and `sfx/LICENSE.txt`.
- **All 466 arcade cabinets** play recorded takes instead of single beeps: a random take each time with a slight pitch change, so repeated hits, coins and explosions don't sound copied. Press **X** on the pause card (or in the menus) to switch between **Studio** and **Retro** beeps; the choice is remembered.
- **Hub interface sounds:** a clunk when a cartridge goes into the console, ticks for the 3-2-1 countdown, a soft tick when hovering cartridges and a click when you go back to the lobby. Quiet, and only after your first click or key press.
- **11 3D worlds** layer recorded takes on their synthesized sounds: Nova Arena, Hardfall, Starfall Vanguard, Starwarden and Gloss Riot (gunfire, footsteps, landings, explosions, kills), Rocket Arena (metal clang on ball touches by impact speed, crunches for bumps, demolitions and goals), Critter Kart, Kart Grand Prix, Sideways and Night Drive (crashes, walls, cones) and Runline (footsteps, landings, breaks).
- **Play anywhere section** on the front page: the arcade shown on a laptop, a tablet and a phone over a moving, grainy colour field, fanning out as you scroll, with three short facts (offline, studio sound, light on hardware).


### Round 29, batch 5 (v63): last checks and polish

- **Every 3D world checked:** the five worlds that crashed or timed out in the test browser last time (Abyss Diver, Storm Royale, Frontline, Starfall, Strike Zone) were played again one at a time, with no errors. That covers all 55.
- **Full test suite:** every arcade cabinet passes in solo, CPU and two-player modes at two difficulty levels, with no crashes and no broken drawing.
- **Zombie Road:** redrawn with a dusk sky, a burning city in two parallax layers with smoke, an asphalt road with lane marks, and a shaded pickup truck with headlights and spoked wheels. The distance readout no longer goes negative when you roll backwards.
- **Cave Raid:** two layers of far cave wall scroll behind the play area, with glowing crystals and drifting spores.
- **Nova Arena:** the first-person guns were so metallic that they rendered almost black. They now pick up the room lighting.

### Round 29, batch 4 (v62): 3D world pass and Rocket Arena polish

- **3D worlds checked one by one:** all 52 other 3D worlds were started and played with random input, with screenshots of each one in play. None of them threw script errors.
- **Bastion Line:** the diorama now sits on a dark wooden war-room table with a soft shadow, so panning or turning the camera no longer shows the board floating in empty sky.
- **Longbow Keep:** the first-person bow now has tapered, more curved limbs with tips and a visible string (the old string was a one-pixel line), so it reads as a bow instead of a stick.
- **Rocket Arena:** a soft ring on the floor under a high ball shows where it is above the pitch, which helps you judge aerials (it takes the team colour when the ball is overcharged). When ball cam is off and the ball is off screen or behind you, an arrow at the screen edge points to it.

### Round 29, batch 3 (v61): clean-up sweep of the other games

- **Every game checked:** all 466 arcade cabinets were run with random input looking for frozen screens, games that never end and text drawn off screen, and the 3D worlds were opened and played past their menus.
- **Pop-ups stay on screen:** score, bonus and warning pop-ups (+10, GRAZE, NEAR PAD, HELP and so on) are kept inside the screen and below the top bar in every arcade game, instead of drifting off an edge.
- **Fix:** the first-person shooter cabinet showed negative health on the frame you died.
- **Tooling:** `tests/qa.js` now prints each flagged cabinet as it finds it and can be split across processes (`SHARDS=4 SH=0..3`).

### Round 29, batch 2 (v60): a readable intro and new README key art

- **Front-page intro, slowed down and explained:** the scroll is more than twice as long, and instead of four words flashing past there are five chapters (the games, the 3D worlds, no installs or accounts, the round clock, insert coin). Each one slides in, holds still for about half a screen of scrolling with a sentence of detail, then leaves. A dark reading panel sits behind the text, and a chapter rail on the right shows where you are; click a chapter to jump to it. Phones get the same chapters with dots along the bottom.
- **Fix:** the darkening layer meant to sit behind the intro text never showed, because its parent was fully transparent until the very end.
- **README key art:** the header is now a tilted wall of real 3D world screenshots drifting past behind the PIXEL ARCADE title, the counts and the address (a seamless 8 second loop, `tools/readme_wall.html`), instead of a crop of the intro. The same art is the social preview (`docs/screenshot.png`, 1280 x 640). The front-page section shows the new intro chapters.

### Round 29, batch 1 (v59): Rocket Arena rebuilt

- **No more clipping:** cars are solid boxes now. Eighteen points on the body are kept out of the floor, walls, ceiling, goal boxes, posts and crossbar every physics step, and four wheel rays read the surface under the car. Before, only the car's centre was checked, so the nose and corners sank up to 1.1 m into walls and floors; in a full 3v3 bot match the worst sink is now under 1 cm.
- **Driving:** the car rides ramps, walls and the ceiling smoothly without losing speed in the curves, steering eases in (no keyboard jerk) and is a little sharper at low and mid speed, and car-to-car bumps use capsules along each car instead of one small sphere.
- **Air and recovery:** optional landing assist (on by default) turns the wheels toward the ground when you let go, and stops held throttle from tipping the nose into the floor just before touchdown. On your roof or side? Press jump or wait half a second and the car flips back.
- **Camera:** closer, tighter chase cam; on walls the horizon follows the wall and the camera stays on the arena side of the car; inside goals and corners it swings up over the car instead of hiding it.
- **Overcharge (new twist):** three touches in a row by one team ignite the ball (team-coloured energy shell, sparks and trail). An ignited goal counts double; one touch from the other team defuses it, and it burns out after 12 seconds. Pips under the clock show the chain. Classic mode turns it off.
- **Match length:** 2, 3 (default) or 5 minutes, still with golden-goal overtime and the results screen.

### Round 27, batch 2 (v58): street trees and tidier palms

- **Night Drive:** street trees in iron-grated pavement pits line the midtown and downtown streets. They keep clear of lamps, the repair garages, street furniture and the pedestrian walking line, and they are solid like lamp posts.
- **Neon Bay:** the two palms that used to stand on each corner (one from each cross street) no longer cross fronds, palms keep their fronds out of shopfronts, and decorative trees, palms and pines from the different layout passes no longer grow inside each other. Sidewalk furniture also keeps clear of those trees.

### Rounds 27 and 28 together (v57)

- One build with both rounds: the cleaner worlds from v55 and the colourful cartridges from v56.

### Round 28 (v56): colourful cartridges with icons

- **Every cartridge has its own colour:** the grey spines are now bright plastic shells in 18 colours (red, orange, yellow, lime, green, teal, sky, blue, violet, purple, pink, coral and more). Colours are fixed per game and never repeat next to each other on a shelf.
- **A pixel icon on every label:** 60 pixel icons (ball, racket, car, rocket, ghost, sword, cards, dice, puzzle piece and so on), chosen from each game's name and tags, with hand picks where the words mislead. Drawn as crisp SVG (Scalable Vector Graphics) from 12 by 12 bitmaps in `js/carts.js`.
- **Bigger cartridges:** spines are wider and taller with a cream label sticker, a corner notch and a moulded edge; boxes view tiles are larger with the icon beside the name. The console tray cartridges use the same colours and icons.
- **Fix:** the black shelf planks drifted out of line from the third row down (on phones from the second); they now sit under every row.

### Round 27 (v55): cleaner worlds, no more clipping scenery

- **Shared placement guard:** `js/kit3d/place.js` reserves the footprint of every tree, rock, bin, bench, rooftop unit and parked car, so scenery no longer spawns inside other scenery, on pavements or on the track.
- **Night Drive:** rooftop units are packed onto the real roof (they used to hang in the air off setback towers and overlap the beacon masts), neon signs fit the wall they hang on, yard trees stay off the pavement and clear of houses, street furniture is spaced out, and every tree has a fuller three-part canopy.
- **Racing:** Kart Grand Prix props sit on the lowest ground under them and keep apart (palms through umbrellas are gone); Kart and Courier keep tree canopies off the track; Sideways spaces its forests and lays the distant city on a street grid so lit towers no longer cut through each other.
- **3D worlds:** trees and rocks no longer grow inside one another in Royale, Warfront, Nightfall and Plaza; Drop Zone rooftop units, park trees and parked cars keep clear of each other and of the fountains; Zenith and Frontline rooftops, Strike's background town and skyline, Frontline's outer greenery and the Siege skyline are tidied.
- Measured with a scene overlap scan: objects sunk inside each other dropped from 103 to 0 in Courier, 179 to 48 in Warfront, 186 to 85 in Royale (the rest is grass under trees), 35 to 4 in Plaza and 14 to 1 in Sideways.

### Round 26 (v54): a new README front page

- **Animated header:** the cabinet room and the big PIXEL ARCADE title, now a seamless loop. The camera drifts under light shafts, the neon hums, and the middle cabinet flips between real games in attract mode. The counts are live again (they still said 510).
- **LED ticker** of game names with chase lights, **arcade-button links** (Play now, Desktop app, Build a game) and a **counts strip**, all as SVG files in the repo instead of shields.io badges.
- **Feature grid** at the top of "What you get": 3D worlds, a wall of cabinet screens, the round clock, CPU levels, light hardware, the builder, online codes and platforms.
- `tools/readme_intro.js` draws all of it and replaces `tools/readme_hero.py`; `tools/gen_docs.py` keeps the ticker and counts in step with the registry.

### Round 24, batch 6 (v53): rivals, power-ups and changing rules

- **BLACK HOLE:** three rival holes (red, blue and orange) roam the city eating things too. Swallow a smaller rival for a big bonus, and run from a bigger one, because it can swallow you (three lives, and you shrink). Arrows at the screen edge show where the rivals are.
- **GALAXY WAVE:** shooting a diving enemy can drop a capsule: D gives a double shot for ten seconds, S a shield that takes one hit, L an extra ship. The top row now takes two hits.
- **COLOR RUSH:** the rule changes as the match goes on. Press on a match, then on a mismatch, then whenever the ink is gold, with a "NEW RULE!" banner each time.
- **SAFARI SNAP:** an album of species. A first photo of a species scores a bonus, more animals in the frame multiply the score, three sharp shots in a row add a streak bonus, and a full album scores +200.

### Round 24, batch 5 (v52): three more lives where one touch ended it

- **CROSSY 3D:** three lives. Getting squashed, splashing or falling behind sends you back to the last grass row with a moment of safety, instead of ending the run.
- **KNIFE HIT:** hitting another knife restarts the log (three lives) instead of ending the game.
- **FIREFLY:** three lives. When a spider catches you, a flare throws every spider back and refills your light.
- **LANE DODGE:** skimming past a car in the next lane scores a bonus that grows with distance, and after 2,000 metres a heart sometimes appears to win a life back.

### Round 25 (v51): racing-game realism pass

- **Camera lens for the 3D worlds (js/fx3d.js):** an optional lens pass adds speed motion blur toward the screen edges and a real camera's reaction to the sun: glare, a horizontal streak, a starburst and a chain of coloured flare ghosts. The flare reads the frame's own brightness at the sun, so trees, stands, bridges and buildings cut it off as they pass in front.
- **Sharper picture everywhere:** every 3D world gets a light sharpen after anti-aliasing (textures and edges no longer look soft), and the grade gains contrast and warmth controls that the racing games use.
- **Live car reflections (js/kit3d/reflect.js):** the player's car in SIDEWAYS and NIGHT DRIVE now reflects its real surroundings (walls, trees, containers, other cars) from a small cube camera, instead of only a sky map. ULTRA updates it every 2nd frame at 128 px, MEDIUM every 4th at 64 px, LOW keeps the old map.
- **Metallic flake paint (js/kit3d/paint.js):** NIGHT DRIVE car paint now has glittering metal under a mirror-smooth clear coat.
- **NIGHT DRIVE:** downtown glass towers are now mirror-like curtain walls with satin mullions that pick up the sky and the sun; office blocks get glossy windows. New sky with a brighter horizon band, deeper zenith, hot sun disc and sun-lit cloud edges.
- **SIDEWAYS, KART GRAND PRIX, CRITTER KART, NIGHT DRIVE, NEON BAY:** sun flare on, more contrast, speed blur in Critter Kart, Night Drive and Neon Bay (Sideways and Kart Grand Prix keep their own). SIDEWAYS daytime sky is clearer and bluer with less haze.

### Round 24, batch 4 (v50): no more one-mistake endings in the puzzle corner

- **HI-LO:** now has a real decision. Right guesses grow a pot (bigger with every step of the streak), a wrong guess loses the whole pot and a life, and B banks the pot into your score. The odds of higher and lower are shown for the cards left in the deck.
- **ECHO PADS:** three lives. A wrong pad, or waiting more than four seconds, replays the pattern instead of ending the game. Rounds with no mistake score double.
- **CHAIN REACTION:** three tries; a chain that comes up short replays the level. From level 2 a white super orb blasts almost twice as wide.
- **TERRITORY:** three lives. Getting cut off now costs a life and your trail but you keep the land you claimed, and you respawn inside it with a moment of safety.
- **CANDY ROPE:** three candies; a lost candy retries the level.
- **TIMING BAR:** from 10 points the green zone slides, eight hits in a row give a life back, and a miss is followed by a short pause so one panicked press cannot cost two lives.
- **GitHub checks fixed:** the `test` workflow failed because the Golf Duel and Fire Fighter how-to texts were longer than the 90 characters the quality check allows; both are shortened. The `desktop app` workflow failed on Linux because electron-builder needs an author email and a repository in `desktop/package.json` to build the .deb; both are added (a GitHub no-reply address). Workflows now use `actions/checkout@v5` and `actions/setup-node@v5`, which removes the Node.js 20 deprecation warnings.

### Round 24, batch 3 (v49): second chances and real puzzles

- **CUBE HOP, rebuilt:** an on-screen compass shows which arrow hops where (up and left go up the pyramid, down and right go down it). From pyramid 2 every cube needs two hops (orange, then yellow, then cyan), a purple coil hops after you and always picks the cube nearest you, and green orbs freeze every enemy for three seconds. Falling off or getting hit costs one of three hearts with a moment of safety, and a fast pyramid scores a time bonus.
- **STACK TOWER:** the overhang is now cut off like a real stacker, so the floor shrinks when you miss the middle. Three perfect drops in a row widen it again.
- **STACK 3D:** a missed block costs one of three spare blocks instead of ending the game, and every 10 floors gives a spare back.
- **ORBIT HOP:** the difficulty now really ramps (pads shrink and rings spin faster; before, every new ring was as easy as the first). A miss no longer moves you up a ring, a streak of landings multiplies the score up to X4, and the view smoothly follows you so you can always see the next two rings.
- **ROCKET LANDING:** three rockets; a crash retries the same ship instead of ending the run, and from ship 3 a crosswind pushes you sideways.
- **FRUIT SLICE:** a bomb is a strike (and -10 points) instead of an instant game over; three strikes from drops or bombs end it.
- **WORM ARENA:** three lives with a respawn at half length and a moment of safety, and +10 for every worm you cut off.
- **SORT IT:** now shows the par (fewest swaps possible) and scores each level, with a bonus for matching par. Before, the score was the number of swaps, so worse play scored higher.
- **SUM TEN:** quick pairs chain up to X5, each pair adds half a second, a wrong pick costs a second, and the board reshuffles if no pair is left.

### Round 24, batch 2 (v48): no more button mashing or one-touch deaths

- **100M DASH:** a steady left-right stride beats mashing (mashing tires you and halves your push), a reaction start (go too early and you false-start, go on the gun for a great start), a stamina bar, B dips at the line, and best of three heats.
- **ROWING:** one press per stroke as the marker crosses the green catch zone; perfect strokes surge, early ones are weak, and an extra press "catches a crab" and stops the boat. The zone narrows towards the finish.
- **ARM WRESTLE:** hold A to push and let go to rest; stamina runs out if you never rest. Arrow prompts appear and the first to hit the right arrow gets a surge (a wrong one slips).
- **CARD WAR:** now has decisions. Both players hold their top three cards face up and play one at the same time, so you read the rival's hand. The CPU reads yours on harder levels.
- **JAVELIN and SPEED SKATE:** the same steady-stride running as the dash.
- **LASER DODGE:** three shields, energy cells to collect, grazing a laser scores, and from wave 3 triple-laser walls; every wave gives a shield back.
- **PING BOUNCE:** three lives, stars to collect (every ten give a life back).
- **WALL JUMP:** three hearts, gems along the shaft, swinging saw blades, and falling puts you back on the last safe wall.
- **Three lives instead of one touch** in fifteen more quick-play games that used to end on the first mistake: Cave Copter, Paper Plane, Gravity Flip, Dash Jump, Color Switch, Piano Tiles, Rope Swing, Tower Stack, Frost Peak, Tunnel Run 3D, Jetpack Run, Temple Dash 3D, Meteor Shower, Bounce Ball and Cloud Hop. A hit costs a heart, flashes the screen red and puts you somewhere safe (back in the tunnel, on a fresh platform, or with a high bounce), and the hearts sit in the bottom-left corner.
- The "Fresh on the shelf" row now shows Arm Wrestle, Card War, Rowing, 100M Dash, Laser Dodge and Wall Jump.

### Round 24 (v47): unfinished games fixed

Games that ended within seconds or had only one rule got real gameplay this round: health instead of one-touch deaths, stages, pickups, combos and a reason to keep playing until the clock runs out.

- **CANYON RUN 3D, rebuilt:** up and down now change altitude, A boosts. Rock pillars, low rubble and high stone bridges to fly around, under or over; crystal trails that fill boost and build a combo up to X5; close passes and wall skimming score extra. Three hull points instead of instant death, a gate every 300 m that repairs the hull, and four sectors (Red Gorge, Dusk Pass, Moon Rift, Ember Deep) with their own sky, rock and river colours.
- **ROLLER 3D, rebuilt:** a five-lane floating track built from nine hand-made pieces (gaps, single-lane snakes, split paths, checkerboards, zigzags, bumpers, boost pads and launch pads), gems to collect, checkpoint flags and three balls: falling sends you back to the last flag instead of ending the game. Four zones that get faster.
- **CUBE FIELD 3D, rebuilt:** three shields, A brakes, walls of cubes with one gap from zone 2, near misses build a combo up to X8, gems, shield orbs and slow-motion pickups, and a fifth colour zone.
- **RING RACE 3D, rebuilt:** rings follow a flowing ribbon; every five in a row raises the multiplier, gold rings give a speed boost, floating mines cost three seconds, and the course moves through Green Valley, Sapphire Bay and Neon Night with trees, palms and towers.
- **DASH RUNNER, rebuilt:** three hearts, a double jump, tall crate stacks, drones to duck, pits and spikes, coin arcs, magnet and shield pickups, and four stages (Dusk Desert, Neon City, Snow Peaks, Ember Wastes) that each give a heart back.
- **FLAP BOT:** three batteries instead of one-touch deaths, bolts to collect (every eight refill a battery), moving pipes and narrower gaps as you go, and morning, sunset and night skies.
- **COLOR WHEEL:** three lives, rainbow balls that match any colour, and a streak bonus.
- **BALLOON BLITZ, rebuilt:** pumping on a steady beat gives big puffs while mashing heats the balloon until it pops. First to three rounds, each with a twist (leaky valves, a hot day, a golden beat), a beat ring around each pump, a crowd and confetti.
- The "Fresh on the shelf" row shows Canyon Run, Roller, Cube Field, Dash Runner, Balloon Blitz and Flap Bot.

### Round 23 (v46)

- **NEON FIGHTERS, rebuilt:** a rain-soaked rooftop at night with a moonlit skyline, neon signs (one of them flickers), a hologram billboard, a water tower, steam vents, a sweeping searchlight, lightning, puddles and a wet floor that reflects the fighters. The four fighters are now jointed figures in glowing suits with their own looks (Volta's spiky hair and visor, Brick's shoulder pads and headband, Sable's ponytail and scarf, Moss's hood and leaf cape). New moves and feel: DOWN+B sweep (knocks down, block it crouching), jump attacks, hit-stop on every blow, knockdowns, combo counter, chip damage, specials that clash in mid-air, and four elemental specials (arc ball and moon blade go high so you can duck them; rock roll and thorn wave go low so you jump them). Health bars with a white damage trail, special meters, round diamonds, a ROUND / FIGHT! / K.O. / PERFECT K.O. / TIME! banner and a winner's pose. The select screen shows each fighter on a card with speed, power and special, and picks for you after ten seconds.
- **CRATE PUSHER, rebuilt:** a lamp-lit warehouse with shelving in the dark around each room, raised walls with brick faces and hazard paint, scuffed concrete floors, yellow loading bays, wooden crates with metal corners that light up green on a bay, and a worker in a hard hat. A now undoes a move (B still resets), the score rewards solving a room in few moves, and three new rooms bring it to eight (all checked solvable by the test suite).
- **GOLF DUEL, rebuilt:** three themed holes (a meadow with a pond, a desert canyon with cacti, and a lantern-lit pond garden at dusk) with raised rails, mown stripes, brick and stone walls, sand traps that slow the ball, water that costs a stroke and puts you back, and bumpers that kick the ball away. A scorecard with par for every hole, birdie and hole-in-one calls, a power ring and aim arrow, and a ball trail. The CPU now plans a bank shot around walls instead of putting straight into them.
- **FIRE FIGHTER, rebuilt:** a suburban block that turns from dusk to night over the 90-second shift, houses with lit windows, fences, trees and street lamps, a fire truck with flashing lights where you refill, and a hose that trails behind you. Fires grow from the windows to the roof, blacken the house, throw smoke and embers and light up the street; water arcs, mists and hisses into steam. A fire left too long now spreads to the house next door, and lost houses smoulder as ruins.
- **The front-page "Freshly repainted" row** now starts with Neon Fighters, Crate Pusher, Golf Duel and Fire Fighter.

### Round 22 (v45)

- **BLOCK DROP, rebuilt:** cut-glass tiles with lit and shaded bevels, a well with rim lights, a sky behind it that changes with every level (violet nebula, deep sea, ember dusk, aurora, crimson storm) and slow aurora ribbons. New: a hold slot (UP), a three-piece preview, the seven-piece bag so no shape goes missing for long, a short lock delay so you can slide a piece into place, combos, back-to-back bonuses for clearing four rows twice in a row, a light beam across cleared rows, a stack that settles smoothly, and a red warning when the stack gets high.
- **MUNCH MAZE, rebuilt:** neon tube walls that glow and turn violet while you are powered up, a shaded chomping muncher with a light trail, jelly-like bugs with wobbling skirts, and a fourth bug. Each bug hunts its own way: one chases, one cuts you off, one is shy and one closes the pincer with the chaser. Bonus fruit appears twice a level, eaten bugs score 200, 400, 800 and 1600, and getting caught plays a death animation.
- **HELIX DROP, rebuilt:** a spinning 3D tower seen from above, with floors of twelve slices around a striped pole. Floors shatter outward when you drop through them, paint splats mark where you bounced, the colours change every five floors, and three clean drops in a row turn the ball into a fireball that smashes through the next floor, even a red one. Fifty floors to the finish.
- **ROAD HOPPER, rebuilt:** turtle rows where some turtles dive under (step off before they sink), a fly that sometimes waits in a lily dock for 200 points, logs with bark and moss, cars, racers and trucks with headlight beams, a dusk road with kerbs and puddles, a hop animation, and a time bonus for reaching a dock quickly.
- **The front-page "Freshly repainted" row** now starts with Helix Drop, Block Drop, Munch Maze and Road Hopper.


### Round 21 (v44)

- **New game: XENOSHIFT** (ACTION, 4:30 rounds, solo with easy/normal/hard). A story-driven side-scrolling adventure in three chapters. Jax finds an alien band in the woods of Bramble Bay, and the warlord Kragg wants it back. Press DOWN to pick an alien on the band's dial and B to transform (B again turns you back); aliens burn energy, the boy recharges it, and an empty band times you out. Seven aliens, each the answer to one obstacle: BLAZE burns thorn walls, GRANITE smashes rockslides, ZIPTAIL outruns bridges that crumble behind you, SKYWING flies over pits, MITE crawls through vents, VOLTEX powers laser gates and FROSTBYTE freezes water into a path of ice. A hint bubble over each obstacle shows which alien it wants. Chapters: Bramble Bay at dusk (boss SCRAPJAW, a drill tank that charges into the walls and lobs bombs), the Glowroot Caves (boss GLASSMAW, a crystal spider that drops from the roof), and Kragg's warship in orbit (KRAGG himself, a sword fighter who takes to his jetpack at half health). Story cards with portraits between chapters, enemies that drop energy orbs, three lives, and a time bonus for finishing. The difficulty setting changes how hard enemies and bosses hit, how fast they shoot and how much health the bosses have.
- **MORPHBAND, repainted:** bigger fighters with a rim light in their player colour, the pod lighting whoever stands near it, a living aurora over the junkyard, the pod's light beam reaching up into it, rolling ground fog, rain puddles, a far town skyline, a spinning DNA helix when you morph, and alien icons on the band dial.
- **BYTE SNAKE, rebuilt:** a sunny walled garden with mown stripes, daisies and clover; a snake that glides smoothly between cells, with a patterned body, a head that watches the food and a flicking tongue; apples, cherries (+1 length) and grapes (+2); mice that scurry away from you for 40 points; and mossy rocks that appear as you grow.
- **INVADER WAVE, rebuilt:** painted squid, crab and octopus aliens with two-frame animation, aliens that break formation and dive at you from wave 2 (bonus points if you shoot them mid-dive), shields as glowing domes, a city skyline under a ringed planet, and a double-cannon capsule dropped by the saucer.
- **The front-page "New on the shelf" spotlight** now plays Xenoshift, with Morphband beside it, and the "Freshly repainted" row starts with Byte Snake, Invader Wave and Morphband.

### Round 20 (v43)

- **New game: HEAT RUN** (VERSUS, 2:30 rounds, VS CPU with easy/normal/hard or 2 players). Two getaway drivers loose in a city at night, seen from above with buildings that lean out in 3D as the camera passes. Up is gas, down brakes and reverses, left and right steer, A burns nitro and B pulls a handbrake drift that leaves tyre marks on the road. Drive over cash bags (+100) and the gold case (+400), but every bag raises your wanted stars and the police send more cars, up to nine, plus a helicopter with a searchlight at four stars. Cops ram you and route round the city to cut you off; stop with one on your bumper and you are busted, run out of health and you are wrecked, and either way you drop 30% of your cash for your rival to grab. Ram a cop car until it burns for +50. Repair and nitro pickups appear on the streets. The camera frames both drivers and zooms out as they split up. The most cash at the end wins.
- **New game: FLOPPY HOOPS** (VERSUS, 2:00 rounds, VS CPU with easy/normal/hard or 2 players). Wobbly two-a-side basketball on one button: hold A to make both your players jump and swing their arms up, let go to throw. Bodies lean toward the ball (or the far hoop when you have it), so timing is everything; land badly and you fall flat. Grab the ball with a hand, swat it out of a rival's grip, dunk, or shoot from beyond the line for three. After every basket the rules change (big ball, moon gravity, beach ball, long arms, ice court, tall teams, bowling ball, mini players, super bounce) and so does the court (gym, beach at sunset, rooftop at night, street). First to 11 wins.
- **MOON LANDER, rebuilt:** three landing pads that pay x2, x3 and x5 (the smaller the pad, the bigger the score, with a 50% bonus for a perfect touchdown), a camera that zooms in when you are close to the ground, rough lit terrain with craters and boulders, a detailed lander with gold foil, thruster puffs when you tilt and a flame that blasts dust off the surface, a flag and an astronaut after a landing, the Earth and Milky Way in the sky, and three landers per game with fuel carried over.
- **BRICK BUSTER, rebuilt:** six brick maps (rainbow, pyramid, invader, heart, fortress, diamond) that drop in at the start of each level, metal bricks that crack, gold bricks that never break, bomb bricks that blow up their neighbours and mystery bricks that always drop a capsule; new capsules for twin lasers, catch, fireball (the ball smashes straight through) and extra life; combo scoring, shattering bricks, and a ball that lights the bricks around it.
- **The front-page "New on the shelf" spotlight** now plays Heat Run, with Floppy Hoops beside it, and the "Freshly repainted" row starts with Moon Lander and Brick Buster.


### Round 19 (v42)

- **New game: MORPHBAND** (VERSUS, 2:00 rounds, VS CPU with easy/normal/hard or 2 players). Two kids who found wrist bands in a crashed alien pod battle in the junkyard around it. Tap B to morph into the next of four aliens: EMBERCLAW throws fireballs, STONEHIDE takes half damage and slams the floor to send quake waves along it, RIPSTREAK runs fast, double jumps and dash-strikes, and HOWLWING flies while UP is held and screams a sonic cone. Down+B turns you back. Aliens drain the band; when it runs dry you time out back into the kid, who has to recharge before morphing again. The pod spits out energy orbs that refill the band and a little health. First to 5 knockouts, or the most when time runs out. The CPU picks the alien that suits the range, keeps that range, and dodges fireballs.
- **New game: OVERDRIVE AGENT** (VERSUS, 2:00 rounds, VS CPU with easy/normal/hard or 2 players on stacked lanes). An agent in an energy suit races a rival across a city freeway at dusk, and the suit's four modes each beat one kind of obstacle: STRENGTH (down) smashes steel walls and punches drones, SPEED (right) blitzes through laser gates, FLIGHT (up) hovers over gaps in the deck, and CANNON (left) shoots down drones before they shoot you. A jumps the low rails in any mode (and fires in cannon mode). Speed and flight burn turbo, the other two recharge it, and turbo cells along the road top it up. The wrong mode costs you time; first to the beacon tower wins. Easy CPUs react late and sometimes pick the wrong mode.
- **New game: NOVA REBELLION** (VERSUS, 2:30 rounds, VS CPU with easy/normal/hard or 2 players), a space saga in two acts. Act one is a starfighter battle under the enemy flagship: turn, thrust, fire twin cannons, barrel-roll on B, shoot down the rival ace (+3) and the flagship's drones (+1) while its guns lob plasma. After 70 seconds both pilots land in the flagship's hangar for act two, a light-blade duel: three-hit combos on A, guard on B (raise it at the last moment to parry and stagger the attacker), blades that clash and throw both fighters back, and a force push on Down+A once the focus meter is half full. Blade hits score 1, a defeat scores 4. Highest total wins.
- **TRENCH RUN 3D, rebuilt:** a steel trench with dark panel seams, pipes, vents and coloured wall lights instead of flat purple; barriers are now translucent energy curtains between pylons; turrets fire aimed bolts back at you; and every so often a reactor port sits in the floor. Fly low over the centre line and put a shot into it for 1,000 points and a speed-up.
- **STAR RUN 3D, rebuilt:** lumpy asteroids in three kinds of rock, lit from one side with shaded craters; raider fighters that swoop in, weave and fire plasma back down the lane (150 points each, two hits to kill); shield rings that restore a shield; and a wheel station in the nebula.
- **The front-page "New on the shelf" spotlight** now plays Morphband, with Nova Rebellion and Overdrive Agent beside it, and the "Freshly repainted" row starts with Trench Run 3D and Star Run 3D.

### Round 18 (v41)

- **New game: ROOFTOP SCRAMBLE** (VERSUS, 2:30 rounds, VS CPU with easy/normal/hard or 2 players). Two agents race across the rooftops of a city at dusk to reach the rope ladder hanging from an escape helicopter. Movement is a wobbly hop (left and right hop, up jumps high), so you lean, flail and sometimes land on your back and tumble. Crates parachute in with a pistol, a shotgun or a rocket launcher; with empty hands A is a shove. Every hit knocks the rival back, and a knock off the roof costs them time. Grabbing the ladder starts a two-second climb, and a hit on the way up knocks the climber off. A freight train runs along an elevated line below, and fire escapes lead back up. First to 3 escapes wins. Search "getaway shootout".
- **New game: NEBULA RUN** (VERSUS, 2:30 rounds, VS CPU with easy/normal/hard or 2 players on a split screen). Race down the inside of an eight-sided tile tunnel strung across deep space, 1,800 m to the gate. Whichever lane you stand on is the floor, so you run up the walls round the holes, and the tunnel rolls to follow you. Sections of holes, stripes, spirals and full gaps to jump, amber tiles that drop away as you come near, green boost pads and power cells. A fall into space costs a second and drops you back a few metres, and three falls at the same spot skip you ahead. Three sectors (teal, rose, amber) and a nebula backdrop with a ringed planet. Search "run 3".
- **ROCK BLASTER, rebuilt:** bigger asteroids lit from one side with sunlit rims and shaded craters, a ringed planet and a moon in the background, a new ship with wings and cockpit, and dust clouds when rocks break. New: flying saucers that fire at you (the small one aims well), power-ups from destroyed saucers (triple shot, rapid fire and a shield), and hyperspace on B.
- **TANK DUEL, rebuilt:** shells now ricochet off walls up to three times (and can hit you), wooden crates break after two hits, power-ups (spread shot, rapid fire, shield) appear on the field, and each round moves to the next of three maps (field, quarry and maze). Smoke, scorch marks and bigger tanks. The CPU now routes round the walls, dodges incoming shells and banks its shots off walls; on easy it aims loosely.
- **The front-page "New on the shelf" spotlight** now plays Nebula Run, with Rooftop Scramble beside it, and the "Freshly repainted" row starts with Rock Blaster and Tank Duel.

### Round 17 (v40)

- **New game: SINKHOLE CITY** (VERSUS, 2:00 rounds, VS CPU with easy/normal/hard or 2 players, mouse or keys). Steer a hole round a busy top-down city block of roads, crossings and a park. Anything smaller than your hole drops in: people (who run from you), cones, bins, benches, trees, cars, buses, kiosks, houses, shops and finally whole towers, each worth more the bigger it is. A hole well over a size bigger can swallow its rival, who comes back smaller with a few seconds' shield. People and traffic return soon and buildings are rebuilt, so the city never runs dry. Search "hole io".
- **New game: RIDGE RUNNER** (VERSUS, 2:30 rounds, VS CPU with easy/normal/hard or 2 players). A split-screen hill-climb race on one shared track through meadow, dusk dunes and a frosty night pass, 1,100 m to the flag. Real jeep physics with springy suspension: gas and brake drive on the ground and tilt you in the air, a roof landing is a crash back to your last checkpoint, and full flips and coins add to your score. Your rival shows as a ghost in your half. Search "hill climb".
- **SPACE DEFENDER, more to play:** three smart bombs on B that clear the screen and drop any pods being carried, landers that escape with a pod now come back as fast mutants that hunt you, green tractor beams when a lander locks on, the first wave arrives straight away, and a lit city skyline on the horizon.
- **FRUIT SLICE, repainted and livelier:** fruit is painted with the same shaded fruit as MELON DROP instead of emoji, sliced halves show their juicy cut faces, the first fruit flies at once, and a golden star fruit every 25 seconds starts a fruit frenzy thrown in from both sides.
- **The front-page "New on the shelf" spotlight** now plays Sinkhole City against itself, with Ridge Runner beside it, and the "Freshly repainted" row shows this round's and last round's repaints.

### Round 16 (v39)

- **A real arcade machine at the heart of the front page.** The intro's 3D room now centres on a fully modelled PIXEL ARCADE cabinet, a little forward and taller than the rest, with glowing orange T-molding, a lit ring on the floor and an orange underglow. Its screen still plays the console's attract demo and the camera still flies into it as you scroll.
- **Every cabinet in the room is rebuilt in detail** (`js/cabinet3d.js`): rounded side panels with printed art (sweeping stripes, a sliced synth sun, a pixel invader) edged in T-molding; a two-player control panel with a printed overlay, ball-top joysticks on dust washers, twelve domed buttons in bezels and lit start buttons; a curved CRT behind glass with scanlines that fade with distance, a slight barrel, rounded corners and a rolling band; an art bezel with neon corner brackets; a speaker visor; a backlit marquee with sunburst art and bevelled lettering between chrome retainers; and a steel coin door with lit 25¢ price plates. Chrome, glass and buttons reflect a small baked room map. Static parts are merged per material and shared between cabinets, so a cabinet costs about twenty draw calls, and the floor reflection leaves out lights and small parts.
- **The room is dressed:** a blacklight arcade carpet that glows faintly under the polish, a lighting truss with a hanging lamp over every front cabinet (the light shafts now fall from them), and a back wall with a PIXEL ARCADE neon sign, a high-score board, an OPEN ALL NIGHT sign and a TOKENS arrow, with a slight neon flicker.
- **New still of the room** (`docs/intro.jpg`) for phones, reduced motion and slow connections. The README header image is unchanged.
- **Graphics pass on three games shown on the cabinet screens**, draw code only: SPELL CASTER (aurora, crescent moon, moonlit ridges, pines, dressed-stone tower with a lit window and banner), BOWLING 3D (neighbouring lanes, gloss streak, ball returns, ceiling lights and a neon PIXEL LANES masking unit) and HOOPS 1 ON 1 (painted keys and three-point arcs, light reflections in the varnish, an LED ribbon board, padded courtside barrier and a hanging jumbotron). Their thumbnails are regenerated.

### Round 15 (v38)

- **New game: MELON DROP** (VERSUS, 3:00 rounds, VS CPU with easy/normal/hard or 2 players). Two glass jars side by side; drop fruit, and two of the same fruit touching merge into the next one up an 11-fruit chain from cherry to watermelon (two watermelons burst for 100). Real circle physics: fruits roll, stack, squash on landing and keep their smiling faces as they turn. Making a pear or bigger drops up to three cherries into your rival's jar. A jar that stays over the dashed line loses; otherwise the higher score wins when the clock runs out. The CPU reads the jar and looks for matching landings; easy is noisy and slow, hard is sharp. Search finds it as "suika" or "watermelon".
- **FRUIT MERGE** (the solo version) now uses the same painted fruit with faces instead of emoji, and is tagged for search too.
- **A "New on the shelf" spotlight** on the front page, between the console and the 3D worlds: a warm, light product tile with Melon Drop playing itself in high resolution, play buttons, round facts and a "Freshly repainted" row of upgraded cartridges.
- **Graphics pass on 22 more games**, draw code only: soccer, air hockey, ice hockey, rugby run, slopestyle, sailing, figure skating, canoe, sky fury, cavern quest, pop defense, laser tag, lane rush, terra block, lane defense, count dots, snap, spiral, firebird, room robots, race duel and spacewar (turf stripes, crowds and ad boards, lit water and snow, shaded sprites, glows and trails). Two old drawing bugs fixed on the way: the path in pop defense and the far spires in cavern quest were drawn to the wrong canvas and never showed.
- **Box art refreshed** for the 60 games repainted in rounds 14 and 15.

### Round 14 (v37)

- **Playable cabinets in the intro.** Point at a cabinet in the front-page room and its marquee lights up, its light shaft brightens and it lifts, with a label naming the game. Click it to start that game. The middle cabinet, which shows the console's demo, scrolls you down to the console. The cue under the title now says "Click a cabinet to play, or scroll to insert coin" (mouse only).
- **More depth in the room:** soft light shafts fall from the ceiling onto each front cabinet (a small shader fades them at the edges and towards the floor), and a warm spotlight follows the pointer across the floor.
- **Pointer tilt and light sweeps:** world posters, the console and the builder card lean a few degrees toward the pointer, and a band of light sweeps across a poster when you point at it. Both are off with reduced motion and on touch screens.
- **Game graphics pass on 38 games** that still looked flat next to the rest of the shelf. Only drawing changed; rules, speeds, controls and scoring are the same. Highlights: the first-person shooter has fogged, trimmed walls, shaded robot enemies and a proper rifle; the rhythm jumper is a synthwave run with a striped sun, a skyline and a scrolling neon floor; the moon buggy rides under the Milky Way and a lit Earth over three parallax hill layers; the digger's dirt has wavy layers, rocks, roots and fossils; the missile defense cities are lit skyscrapers that burn when hit; the jetpack lab, highway, zombie street, meteor field, star catcher, bullet hell, broadside sea, tanks, dodgeball court and most of the others gained lighting, shadows, glows, particles and HUD panels. Heavier extras run only on HIGH graphics. Games: survivors, beatjumper, cellgrow, gundungeon, bullethell, broadside, boomerang, lavarise, samuraislash, swing, firefly, painter, pingbounce, asteroidrain, lanes, meteors, catcher, fps, royale, zombies, brawl, snake, digger, shield, trails, tanks, snakeduel, paint, arena, dodgeball, territory, colorswitch, jetpack, roboriot, blobdrop, columns, mazebots, moonbuggy.
- **README:** the flythrough GIF is re-recorded with the light shafts, and the Design section covers the playable cabinets.

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
