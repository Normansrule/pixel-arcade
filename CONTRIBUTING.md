# Add a game

1. Copy `games/_template.js` to `games/<name>.js`.
2. Add `<script src="games/<name>.js"></script>` to `index.html`.
3. Run `node test.js && node qa.js`.
4. Open a pull request. CI runs the same tests.

**API:** `A.in(0)` held keys · `A.hit(0)` pressed this frame · `A.fire(rate)` click-spam or hold-to-fire · `A.mouse` pointer · `A.burst(x,y,colour)` particles · `A.cpu` / `A.lvl` / `A.bot({...})` CPU input · `A.p3` `A.box3` `A.flush` 3D.
