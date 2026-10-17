// Prints the game registry as JSON: loads js/engine.js and every pack listed in games/index.json
// headlessly and records what each A.add() registered. Used by tools/gen_docs.py and the tests.
//   node tools/registry.js > registry.json
const path = require('path'), fs = require('fs');
const ROOT = path.join(__dirname, '..');
const load = require('../tests/lib/load.js');
const A = load({ quiet: true });
const games = A.games.map(g => ({
  id: g.id, name: g.name, cat: g.cat, vs: !!g.vs, how: g.how || '', tags: g.tags || '',
  style: g.style || null, v: g.v || null, href: g.href || null, img: g.img || null, src: g.src || null, time: A.limitOf(g),
}));
process.stdout.write(JSON.stringify({ games, packs: load.packs() }, null, 1) + '\n');
