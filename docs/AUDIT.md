# Round 35 audit

Generated 22 Nov 2026 by a headless sweep of all 544 canvas cabinets (the 56 full-3D worlds are tracked in `docs/progress.json` under "realism").

Each cabinet was played for 25 seconds with random input from a fixed seed and drawn at three moments. Scores are percentiles (0 to 100) against the rest of the arcade:

- **Graphics**: colour variety, detail (edge density), draw calls per frame, how much of the screen is one flat colour, and gradient lighting.
- **Gameplay**: depth of the game code, whether score moves under play, whether the screen changes over time, and whether versus games scale with the CPU (Central Processing Unit) difficulty setting.
- **Story**: no canvas cabinet had any story framing before this round; only a one-line how-to. Round 35 adds a mission briefing to every cabinet.

Numbers are a triage aid, not a verdict: pink frames are often a hit flash, and board games score low on "score moved" by design. Every repaint is checked by eye first.

## Weakest 120, worst first

| # | Game | Category | Total | Graphics | Gameplay | Pack |
|---|---|---|---|---|---|---|
| 1 | BEE DANCE (`beedance`) | PUZZLE | 17 | 10 | 25 | seasons.js |
| 2 | AIR TRAFFIC (`airtraffic`) | SIM | 20 | 5 | 38 | tabletop.js |
| 3 | MUSEUM GUARD (`museumguard`) | ACTION | 21 | 14 | 29 | voyage.js |
| 4 | HANGMAN (`hangman`) | PUZZLE | 24 | 23 | 26 | popular4.js |
| 5 | WORD SCRAMBLE (`wordscramble`) | PUZZLE | 24 | 15 | 36 | puzzle5.js |
| 6 | NEST BUILDER (`nestbuilder`) | ACTION | 25 | 8 | 46 | seasons.js |
| 7 | SKY CAB (`skycab`) | CLASSICS | 26 | 22 | 32 | retro5.js |
| 8 | CHECKERS (`checkers`) | BOARD | 27 | 34 | 19 | versus2.js |
| 9 | SNOWBALL FIGHT (`snowball`) | VERSUS | 28 | 25 | 31 | versus3.js |
| 10 | CITY CRUISER 3D (`city`) | RETRO 3D | 29 | 20 | 39 | threed2.js |
| 11 | SKY JOUST (`joust`) | VERSUS | 29 | 27 | 32 | versus3.js |
| 12 | PATH LINK (`pathlink`) | PUZZLE | 29 | 29 | 28 | puzzle4.js |
| 13 | SWORD DUEL (`swordduel`) | VERSUS | 29 | 17 | 44 | versus4.js |
| 14 | LIGHT UP (`lightup`) | PUZZLE | 29 | 30 | 28 | puzzle5.js |
| 15 | WORD SEARCH (`wordsearch`) | PUZZLE | 29 | 27 | 32 | puzzle5.js |
| 16 | TRIVIA NIGHT (`trivia`) | PARTY | 29 | 27 | 31 | misc6.js |
| 17 | RPS SHOWDOWN (`rps`) | VERSUS | 30 | 30 | 29 | versus3.js |
| 18 | UNTANGLE (`untangle`) | PUZZLE | 30 | 30 | 31 | puzzle5.js |
| 19 | ROLL THE BLOCK (`rollblock`) | PUZZLE | 30 | 21 | 41 | puzzle5.js |
| 20 | CAMEL CARAVAN (`camelcaravan`) | CLASSICS | 30 | 15 | 49 | voyage.js |
| 21 | TIC TAC TOE (`ttt`) | BOARD | 31 | 30 | 32 | puzzle.js |
| 22 | QUICK MATH (`math`) | PUZZLE | 31 | 18 | 47 | puzzle2.js |
| 23 | SNOW RESCUE (`snowrescue`) | ACTION | 32 | 26 | 40 | voyage.js |
| 24 | TEMPLE TORCHES (`templetorch`) | PUZZLE | 32 | 40 | 22 | voyage.js |
| 25 | SPACE MINER 3D (`spaceminer`) | RETRO 3D | 33 | 20 | 49 | more.js |
| 26 | DICE POKER (`dicepoker`) | BOARD | 33 | 37 | 28 | versus3.js |
| 27 | TRIPLE PONG (`triplepong`) | VERSUS | 33 | 29 | 37 | versus4.js |
| 28 | DICE KINGS (`dicekings`) | BOARD | 33 | 44 | 19 | tabletop.js |
| 29 | SLIDING KING (`slidingking`) | PUZZLE | 33 | 32 | 34 | puzzle5.js |
| 30 | BASKET TOSS (`toss`) | PARTY | 34 | 39 | 28 | party.js |
| 31 | BUMPER CARS (`bumper`) | VERSUS | 34 | 29 | 41 | versus4.js |
| 32 | KNIFE HIT (`knifehit`) | CLASSICS | 34 | 16 | 56 | popular3.js |
| 33 | CRYSTAL CAVE (`crystalcave`) | ACTION | 34 | 12 | 61 | frontier.js |
| 34 | TAILOR'S SEAM (`tailorshop`) | SIM | 34 | 27 | 43 | townsfolk.js |
| 35 | PIG CHASE (`pigchase`) | VERSUS | 34 | 37 | 31 | townsfolk.js |
| 36 | HI-LO (`hilo`) | CARDS | 35 | 30 | 41 | cards.js |
| 37 | MEMORY GRID (`memgrid`) | PUZZLE | 35 | 28 | 43 | puzzle3.js |
| 38 | GOLF TOUR (`golftour`) | SPORTS | 35 | 17 | 58 | tabletop.js |
| 39 | BALLOON CROSSING (`ballooncross`) | CLASSICS | 35 | 28 | 44 | voyage.js |
| 40 | CHEESE ROLL (`cheeseroll`) | VERSUS | 35 | 29 | 43 | townsfolk.js |
| 41 | SAWMILL (`sawmill`) | SIM | 35 | 24 | 48 | townsfolk.js |
| 42 | SANDCASTLE (`sandcastle`) | CLASSICS | 35 | 27 | 45 | seasons.js |
| 43 | SCARECROW (`scarecrow`) | PARTY | 35 | 30 | 41 | seasons.js |
| 44 | COURT TENNIS (`tennis`) | SPORTS | 36 | 39 | 32 | sports1.js |
| 45 | LUDO RACE (`ludo`) | BOARD | 36 | 45 | 26 | tabletop.js |
| 46 | SHEEPDOG (`sheepdog`) | ACTION | 36 | 37 | 35 | frontier.js |
| 47 | ECHO PADS (`echo`) | PUZZLE | 37 | 22 | 56 | puzzle.js |
| 48 | SHUFFLEBOARD (`shuffle`) | PARTY | 37 | 34 | 40 | party.js |
| 49 | LASER MAZE (`lasermaze`) | PUZZLE | 37 | 32 | 43 | more.js |
| 50 | TIMING BAR (`timing`) | PUZZLE | 37 | 23 | 54 | arcade4.js |
| 51 | HELI DUEL (`heliduel`) | VERSUS | 37 | 37 | 37 | versus4.js |
| 52 | SKATE PARK (`skatepark`) | SPORTS | 37 | 28 | 47 | popular5.js |
| 53 | TUBE WARS (`tubewars`) | CLASSICS | 37 | 22 | 55 | retro4.js |
| 54 | GO 7X7 (`go7`) | BOARD | 37 | 53 | 17 | board2.js |
| 55 | SAND GLYPHS (`sandglyph`) | PUZZLE | 37 | 40 | 34 | voyage.js |
| 56 | BUS STOP (`busstop`) | SIM | 37 | 47 | 24 | townsfolk.js |
| 57 | NEON TRAILS (`trails`) | VERSUS | 38 | 29 | 49 | classics2.js |
| 58 | BOMB PASS (`bombpass`) | PARTY | 38 | 28 | 50 | party.js |
| 59 | TABLE TENNIS (`tabletennis`) | SPORTS | 38 | 35 | 42 | sports4.js |
| 60 | DOMINOES (`dominoes`) | BOARD | 38 | 45 | 30 | popular4.js |
| 61 | ARROW ESCAPE (`arrowescape`) | PUZZLE | 38 | 23 | 57 | puzzle5.js |
| 62 | MATH GRID (`mathgrid`) | PUZZLE | 38 | 34 | 42 | puzzle5.js |
| 63 | SNAKE DUEL (`snakeduel`) | VERSUS | 39 | 28 | 52 | versus2.js |
| 64 | POOL SHARK (`pool`) | PARTY | 39 | 29 | 51 | party.js |
| 65 | TURF TAG (`tag`) | PARTY | 39 | 35 | 43 | party.js |
| 66 | SUSHI STACK (`sushi`) | PUZZLE | 39 | 29 | 52 | more.js |
| 67 | NEXT NUMBER (`sequence`) | PUZZLE | 39 | 37 | 41 | puzzle4.js |
| 68 | MARBLE CHAIN (`marblechain`) | CLASSICS | 39 | 26 | 55 | popular5.js |
| 69 | BOMB HERO (`bombhero`) | CLASSICS | 39 | 29 | 51 | retro5.js |
| 70 | LINES OF ACTION (`linesofaction`) | BOARD | 39 | 61 | 11 | board2.js |
| 71 | QUEENS (`queens`) | PUZZLE | 39 | 45 | 31 | puzzle5.js |
| 72 | PUMP IT (`balloonpump`) | PARTY | 39 | 41 | 36 | misc6.js |
| 73 | SEED SPIT (`seedspit`) | SPORTS | 39 | 37 | 41 | seasons.js |
| 74 | LEAF PILE (`leafpile`) | ACTION | 39 | 38 | 41 | seasons.js |
| 75 | PADDLE DUEL (`pong`) | SPORTS | 40 | 38 | 43 | sports1.js |
| 76 | FOUR IN A ROW (`four`) | BOARD | 40 | 53 | 24 | puzzle.js |
| 77 | NIM STICKS (`nim`) | BOARD | 40 | 59 | 16 | versus2.js |
| 78 | PIG DICE (`pig`) | BOARD | 40 | 60 | 16 | versus3.js |
| 79 | MAGIC SQUARE (`magicsquare`) | PUZZLE | 40 | 54 | 23 | puzzle4.js |
| 80 | WORD GUESS (`wordguess`) | PUZZLE | 40 | 37 | 43 | popular2.js |
| 81 | SKY FISHER (`skyfisher`) | CLASSICS | 40 | 49 | 30 | frontier.js |
| 82 | DINO DIG (`dinodig`) | PUZZLE | 40 | 33 | 49 | frontier.js |
| 83 | PENGUIN SLIDE (`penguinslide`) | CLASSICS | 40 | 19 | 65 | voyage.js |
| 84 | CHIMNEY SWEEP (`chimneysweep`) | CLASSICS | 40 | 37 | 43 | townsfolk.js |
| 85 | COCOA CAFE (`cocoacafe`) | SIM | 40 | 51 | 27 | seasons.js |
| 86 | DUNGEON 3D (`dungeon`) | RETRO 3D | 41 | 40 | 43 | threed.js |
| 87 | SPACE DEFENDER (`defender`) | CLASSICS | 41 | 15 | 73 | classics3.js |
| 88 | SEA BATTLE (`battleship`) | BOARD | 41 | 48 | 32 | versus3.js |
| 89 | ULTIMATE TTT (`uttt`) | BOARD | 41 | 37 | 46 | versus4.js |
| 90 | PIANO TILES (`pianotiles`) | CLASSICS | 41 | 19 | 67 | popular3.js |
| 91 | SNOW ROLLER 3D (`snowroll3d`) | RETRO 3D | 41 | 24 | 62 | threed5.js |
| 92 | LANTERN FLOAT (`lanternfloat`) | CLASSICS | 41 | 37 | 46 | frontier.js |
| 93 | BEACH VOLLEY (`volley`) | SPORTS | 42 | 47 | 37 | sports1.js |
| 94 | PEG JUMP (`pegs`) | PUZZLE | 42 | 52 | 30 | puzzle2.js |
| 95 | COLOR WHEEL (`colorwheel`) | PUZZLE | 42 | 31 | 56 | arcade4.js |
| 96 | DASH PEAK (`dashpeak`) | ACTION | 42 | 23 | 66 | action3.js |
| 97 | FJORD RACE (`fjordrace`) | VERSUS | 42 | 41 | 44 | voyage.js |
| 98 | BLACKSMITH (`forge`) | SIM | 42 | 35 | 50 | townsfolk.js |
| 99 | PETAL DUEL (`petalduel`) | VERSUS | 42 | 42 | 41 | seasons.js |
| 100 | HURDLES (`hurdles`) | SPORTS | 43 | 58 | 24 | sports3.js |
| 101 | PARKING JAM (`parking`) | PUZZLE | 43 | 41 | 46 | puzzle3.js |
| 102 | SPEED CLIMB (`climb`) | SPORTS | 43 | 46 | 39 | sports5.js |
| 103 | CABLE CAR (`cablecar`) | CLASSICS | 43 | 55 | 28 | voyage.js |
| 104 | SEED SOWER (`seedsower`) | SIM | 43 | 60 | 23 | seasons.js |
| 105 | POWER TILES (`tiles`) | PUZZLE | 44 | 38 | 52 | puzzle.js |
| 106 | BRICK BREAKER 3D (`bricks3d`) | RETRO 3D | 44 | 39 | 49 | threed3.js |
| 107 | ARTILLERY DUEL (`artillery`) | VERSUS | 44 | 39 | 50 | versus3.js |
| 108 | GRAVITY FLIP (`gravflip`) | CLASSICS | 44 | 33 | 57 | arcade5.js |
| 109 | FIREFLY (`firefly`) | CLASSICS | 44 | 15 | 79 | arcade5.js |
| 110 | DASH JUMP (`dashjump`) | CLASSICS | 44 | 27 | 65 | arcade5.js |
| 111 | CAPTURE FLAG (`ctf`) | VERSUS | 44 | 43 | 45 | versus4.js |
| 112 | CHESS (`chess`) | BOARD | 44 | 39 | 51 | popular4.js |
| 113 | STAR NAVIGATOR (`starnav`) | PUZZLE | 44 | 8 | 87 | space1.js |
| 114 | DOG SLED DASH (`dogsled`) | VERSUS | 44 | 43 | 46 | voyage.js |
| 115 | APPLE BOBBING (`applebob`) | VERSUS | 44 | 45 | 42 | seasons.js |
| 116 | SNOWPLOW (`snowplow`) | ACTION | 44 | 47 | 41 | seasons.js |
| 117 | HOVER TANK 3D (`hover`) | RETRO 3D | 45 | 27 | 66 | threed3.js |
| 118 | QUAD PONG (`quadpong`) | PARTY | 45 | 34 | 59 | party.js |
| 119 | COIN DASH 3D (`coindash`) | RETRO 3D | 45 | 34 | 59 | more.js |
| 120 | ORBIT GUARD (`orbitguard`) | CLASSICS | 45 | 31 | 63 | arcade4.js |
