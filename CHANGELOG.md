# Changelog

Release numbers follow the commit history on GitHub. Numbers that are missing from the list (v2, v6, v9, v11, v17, v18, v20, v21, v24) were working builds whose changes shipped in the next listed release.

## Unreleased (on branch `v29-heavy-3d`)

- **Repository layout:** tests moved to `tests/`, Python and Node tools to `tools/`.
- **Engine:** `js/engine.js` split into 13 modules in `js/engine/`; the `A.gx` art kit moved from `games/sports1.js` to `js/gx.js`.
- **3D kit:** all 31 worlds now share `js/kit3d/score.js` for the arcade profile, best scores and POST SCORE.
- **Offline fonts:** the hub, the builder and 14 older worlds no longer load Google Fonts; they use the local copies through `fonts/fonts.css`.
- **Manifest:** `games/index.json` lists the engine modules and game packs in load order; `index.html`'s script tags, the tests and the docs generator all read it.
- **Docs:** `tools/gen_docs.py` regenerates README counts and tables, `docs/GAMES.md` and the README art. New `docs/ARCHITECTURE.md`, `THIRD_PARTY.md`, this changelog, issue and pull request templates.
- **CI (continuous integration):** the canvas game test runs in four parallel slices and checks that generated docs are current.
- **3D performance:** **F3** shows frames per second (FPS), draw calls and triangles in every world; graphics quality steps down on its own when a world stays under 45 FPS (pressing **G** turns that off).
- **Neon Bay:** see-through car windows with a driver at the wheel; police officers get out of their cruisers and chase you on foot, then return to their cars when you drive off.
- **Voxel Frontier:** leaves and glass cast cut-out shadows instead of solid blocks.

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
