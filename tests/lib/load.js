// Loads the canvas arcade headlessly in Node: the engine modules and every game pack, in the order
// listed in games/index.json (the same order index.html uses). Returns the global A.
// Paths in the tests stay relative to the repo root, so this also chdirs there.
const path = require('path'), fs = require('fs');
const ROOT = path.join(__dirname, '..', '..');
const manifest = () => JSON.parse(fs.readFileSync(path.join(ROOT, 'games', 'index.json'), 'utf8'));
function load() {
  process.chdir(ROOT);
  global.window = global;
  const m = manifest();
  for (const f of m.core) require(path.join(ROOT, f));
  const A = global.A;
  // record which pack registered each game (the browser gets this from document.currentScript)
  for (const f of m.packs) { const n = A.games.length; require(path.join(ROOT, f)); for (const g of A.games.slice(n)) g.src = g.src || f; }
  return A;
}
load.packs = () => manifest().packs;
load.ROOT = ROOT;
module.exports = load;
