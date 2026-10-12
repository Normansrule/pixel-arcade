# Contributing

Thanks for helping build the arcade. Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) first for how the pieces fit together.

## House rules

- **Original names, characters and designs.** Never use a trademark in a game's name, art or text. A franchise name may appear only in the hub search `tags` (and the `style` field of a 3D world), so players can find a game by what inspired it.
- **Every game has a time limit** and ends on a results screen.
- **Playable within seconds.** One short line of how-to (90 characters at most), skippable, concise text everywhere.
- **Shooters allow spam clicking and holding** to fire (`A.fire(rate)` in canvas games).
- **CPU opponents with selectable difficulty** wherever there is an opponent.
- **Scores go to GitHub** as issues titled `[score] <id> <score>`.
- **Offline-safe.** All assets local, relative paths, no CDNs (content delivery networks) and no network calls during play.
- **Test before shipping**: the automated tests, plus screenshots you actually look at.

## Add a canvas game

1. Copy `games/_template.js` into a pack in `games/` (or a new pack file) and change the `id`, `name`, `cat` and `how`.
   - `cat` is one of `CLASSICS`, `PUZZLE`, `SPORTS`, `ACTION`, `RETRO 3D`, `VERSUS`, `BOARD`, `SIM`, `PARTY`, `CARDS`.
   - Set `vs:1` for games against the CPU or a second player. Read `A.cpu`, `A.lvl` (0 easy, 1 normal, 2 hard) and drive the CPU with `A.bot({...})`. Give the game a `g.timeUp()` that returns the result text (for example `A.win(0)`) when the clock runs out; without it a timed-out versus round is a draw.
   - Set `time:` (seconds) if the category default round length does not suit the game.
   - Add `tags:'…'` with the names players might search for, including any franchise that inspired it.
2. If you made a new pack, add it to `"packs"` in `games/index.json`.
3. Run `python3 tools/gen_docs.py` to update `index.html`, the README counts and `docs/GAMES.md`.
4. Render its hub thumbnail: `python3 -m http.server 8765 &` then `python3 tools/thumbs.py`.
5. Run the checks in the testing checklist below.

**API:** `A.in(0)` held keys · `A.hit(0)` pressed this frame · `A.fire(rate)` hold-to-fire or spam-click · `A.mouse` pointer · `A.burst(x,y,colour)` particles · `A.shake` · `A.person(x,y,{c})` characters · `A.gx` art kit · `A.cpu` / `A.lvl` / `A.bot({...})` CPU input · `A.p3` `A.box3` `A.flush` pseudo-3D.

## Add a 3D world

1. Make a new folder named after the game in lowercase. **Never rename it afterwards**: the URL is shared in score issues and bookmarks, and GitHub Pages cannot redirect on the server. If a folder must move, leave an `index.html` with a meta refresh behind.
2. Start from the newest worlds (`arena/`, `zombies/`, `frontline/`, `strike/`) or `rocket/`. Load Three.js from `../vendor/three.module.min.js` and use `cinematic()` and `bindQualityKey()` from `../js/fx3d.js`.
3. Keep the conventions: round time limit and results screen, CPU difficulty, `pxd_profile` and high-score updates, a POST SCORE button, a "← ARCADE" link, local fonts from `../fonts/`, synthesized audio, procedural textures, and a `window.<ID>` test hook with `step()` and `render()`.
4. Register it in `games/threed4.js` with `href`, `img` (`docs/cards/<id>.jpg`, 960×540), `style` (the inspiration, for example `'Halo'`), `v` (the release number) and `tags`.
5. Add its card to the hub's FULL 3D grid in `index.html`, then run `python3 tools/gen_docs.py --art` and `python3 tools/build.py`.

## Testing checklist

- [ ] `node tests/test.js` passes (use `ONLY=id1,id2` while working; the full run is slow, so shard it with `RANGE=0:150` and so on).
- [ ] `ONLY=<id> PART=/tmp/q.json node tests/quality.js` passes (the `PART` keeps `docs/QUALITY.md` unchanged).
- [ ] Solo games: `ONLY=<id> node tests/scorecheck.js` earns a score.
- [ ] 3D worlds load in headless Chromium with zero page errors and zero external network requests.
- [ ] You played it and looked at screenshots of the title, play and results screens.
- [ ] `python3 tools/gen_docs.py --check` is clean and `python3 tools/build.py` has been run after any file move.
- [ ] After moving files, bump `version` in `desktop/package.json`.

Open a pull request; the template lists the same checks and CI runs the automated ones.
