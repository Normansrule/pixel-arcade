// Unit tests for js/online/safe.js: sanitisers, message schemas, rate limits.  node tests/safe.test.js
const S = require('../js/online/safe.js');
let fails = 0, n = 0;
const eq = (a, b, m) => { n++; const ok = JSON.stringify(a) === JSON.stringify(b); if (!ok) { fails++; console.log('FAIL', m, '\n  got ', JSON.stringify(a), '\n  want', JSON.stringify(b)); } };
const yes = (c, m) => eq(!!c, true, m), no = (c, m) => eq(!!c, false, m);
const U = cp => String.fromCodePoint(cp);

// ---- names ----
eq(S.cleanName('  Alek  '), 'Alek', 'trim');
eq(S.cleanName('<script>alert(1)</script>'), 'scriptalert1scri', 'markup characters removed, 16 max');
eq(S.cleanName('Bob' + U(0x202e) + 'evil'), 'Bobevil', 'right-to-left override removed');
eq(S.cleanName('a' + U(0x200b) + 'b' + U(0xfeff) + 'c'), 'abc', 'zero-width characters removed');
eq(S.cleanName("Robert'); DROP TABLE players;--"), 'Robert DROP TABL', 'SQL metacharacters removed');
eq(S.cleanName('${7*7}{{7*7}}'), '7777', 'template syntax removed');
eq(S.cleanName(''), 'Guest', 'empty becomes Guest');
eq(S.cleanName(null), 'Guest', 'null becomes Guest');
eq(S.cleanName({ toString() { return 'x'; } }), 'x', 'objects are stringified, not trusted');
eq(S.cleanName('Zoë Ñandú 李雷'), 'Zoë Ñandú 李雷', 'letters from any script are kept');
eq(S.cleanName('\uff57\uff49\uff44\uff45'), 'wide', 'full-width letters normalised (NFKC)');
eq([...S.cleanName('😀'.repeat(40), '')].length, 0, 'emoji are not name characters');
eq([...S.cleanName('x'.repeat(5000))].length, 16, 'very long input capped');
eq(S.cleanName('a\nb\tc'), 'abc', 'control characters removed');

// ---- chat ----
eq(S.cleanChat('<img src=x onerror=alert(1)>'), '<img src=x onerror=alert(1)>', 'chat keeps text as text (it is only ever shown with textContent)');
eq(S.cleanChat('  hi \n\n there  '), 'hi there', 'whitespace collapsed');
eq([...S.cleanChat('y'.repeat(999))].length, 120, 'chat capped at 120');
yes([...S.cleanChat('z' + U(0x301).repeat(50))].length <= 3, 'stacked combining marks limited (zalgo)');
eq(S.cleanChat(U(0x2066) + 'x' + U(0x2069)), 'x', 'bidi isolates removed');
eq(S.cleanChat(U(0x2028) + 'line' + U(0x2029)), 'line', 'unicode line separators removed');

// ---- room codes ----
eq(S.cleanRoom('k7qf2m'), 'K7QF2M', 'lower case accepted');
eq(S.cleanRoom('K7Q-F2M'), 'K7QF2M', 'dash ignored');
eq(S.cleanRoom(' K7Q F2M '), 'K7QF2M', 'spaces ignored');
eq(S.cleanRoom('K7QF2'), null, 'too short');
eq(S.cleanRoom('K7QF2MM'), null, 'too long');
eq(S.cleanRoom('K0QF2M'), null, 'ambiguous 0 rejected');
eq(S.cleanRoom("1' OR '1'='1"), null, 'injection rejected');
eq(S.cleanRoom('../../'), null, 'path rejected');
for (let i = 0; i < 200; i++) { const r = S.newRoom(); if (S.cleanRoom(r) !== r) { eq(r, 'valid', 'generated room code valid'); break; } }
yes(new Set(Array.from({ length: 500 }, () => S.newRoom())).size > 495, 'room codes are random');

// ---- ids and scores ----
eq(S.cleanGameId('four'), 'four', 'game id');
eq(S.cleanGameId('Four'), null, 'game id is lower case');
eq(S.cleanGameId('__proto__'), '__proto__', 'game id charset (lookup is by Array.find, not object key)');
eq(S.cleanGameId('a b'), null, 'game id no spaces');
eq(S.cleanScore(12.6), 13, 'score rounded');
eq(S.cleanScore(NaN), null, 'NaN rejected');
eq(S.cleanScore(Infinity), null, 'Infinity rejected');
eq(S.cleanScore('100'), null, 'string score rejected');
eq(S.cleanScore(2e9), null, 'huge score rejected');

// ---- local URLs and images (My games shelf) ----
eq(S.safeLocalUrl('builder/?play#abc', 'builder/'), 'builder/?play#abc', 'builder link kept');
eq(S.safeLocalUrl('javascript:alert(1)', 'builder/'), null, 'javascript: URL rejected');
eq(S.safeLocalUrl('https://evil.example/', 'builder/'), null, 'outside URL rejected');
eq(S.safeLocalUrl('builder/\\\\evil', 'builder/'), null, 'backslash trick rejected');
eq(S.safeImage('data:image/png;base64,AAAA'), 'data:image/png;base64,AAAA', 'png data URL kept');
eq(S.safeImage('data:image/svg+xml;base64,AAAA'), '', 'SVG data URL rejected (can carry script)');
eq(S.safeImage('javascript:alert(1)'), '', 'javascript image rejected');

// ---- message schemas ----
const P = o => S.parse(typeof o === 'string' ? o : JSON.stringify(o));
eq(P({ t: 'chat', text: 'hello' }), { t: 'chat', text: 'hello' }, 'chat ok');
eq(P({ t: 'chat', text: 'hi', extra: 1 }), null, 'unknown field rejected');
eq(P('{"t":"chat","text":"hi","__proto__":{"admin":true}}'), null, '__proto__ key rejected');
eq(P({ t: 'chat', text: 'hi', constructor: 1 }), null, 'constructor key rejected');
eq(P({ t: 'chat', text: '   ' }), null, 'blank chat rejected');
eq(P({ t: 'chat', text: 5 }), null, 'wrong type rejected');
eq(P({ t: 'toString' }), null, 'inherited name is not a message type');
eq(P({ t: 'eval', code: 'alert(1)' }), null, 'unknown type rejected');
eq(P('[1,2]'), null, 'array rejected');
eq(P('null'), null, 'null rejected');
eq(P('{bad json'), null, 'bad JSON rejected');
eq(P(123), null, 'non-string rejected');
eq(P(JSON.stringify({ t: 'chat', text: 'a'.repeat(3000) })), null, 'oversized message rejected');
eq(P({ t: 'hi', v: 1, name: '<b>x</b>', app: '32' }), { t: 'hi', v: 1, name: 'bxb', app: '32' }, 'hi name cleaned');
eq(P({ t: 'hi', v: 1, name: 'x', app: '<x>' }), null, 'hi app version charset');
eq(P({ t: 'go', game: 'four', seed: 5, mode: 'lock', delay: 4, n: 1 }), { t: 'go', game: 'four', seed: 5, mode: 'lock', delay: 4, n: 1 }, 'go ok');
eq(P({ t: 'go', game: 'four;drop', seed: 5, mode: 'lock', delay: 4, n: 1 }), null, 'go bad game id');
eq(P({ t: 'go', game: 'four', seed: 5, mode: 'admin', delay: 4, n: 1 }), null, 'go bad mode');
eq(P({ t: 'go', game: 'four', seed: 5, mode: 'lock', delay: 400, n: 1 }), null, 'go delay range');
eq(P({ t: 'go', game: 'four', seed: 1.5, mode: 'lock', delay: 4, n: 1 }), null, 'go seed must be whole');
eq(P({ t: 'in', f: 10, k: [0, 63] }), { t: 'in', f: 10, k: [0, 63] }, 'input ok');
eq(P({ t: 'in', f: 10, k: [64] }), null, 'input bits range');
eq(P({ t: 'in', f: 10, k: [] }), null, 'empty input');
eq(P({ t: 'in', f: 10, k: Array(17).fill(1) }), null, 'input batch size');
eq(P({ t: 'in', f: -1, k: [1] }), null, 'negative frame');
eq(P({ t: 'sc', n: 1, s: 100 }), { t: 'sc', n: 1, s: 100 }, 'score ok');
eq(P({ t: 'sc', n: 1, s: 1e12 }), null, 'score range');
eq(P('{"t":"sc","n":1,"s":1e999}'), null, 'score infinity');
eq(P({ t: 'sc', n: 1, s: 5, done: true, over: 'time up\u202e' }), { t: 'sc', n: 1, s: 5, done: true, over: 'TIME UP' }, 'score over text cleaned');
eq(P({ t: 'emo', e: 8 }), null, 'emote index range');
eq(P({ t: 'h', f: 120, h: 4294967295 }), { t: 'h', f: 120, h: 4294967295 }, 'hash ok');
let deep = { t: 'chat', text: 'x' }; eq(P(JSON.stringify(deep).replace('}', ',"d":' + '['.repeat(200) + ']'.repeat(200) + '}')), null, 'deep nesting rejected');
// encode refuses to send bad messages
let threw = false; try { S.encode({ t: 'chat', text: 1 }); } catch (e) { threw = true; } yes(threw, 'encode validates outgoing');
threw = false; try { S.encode({ t: 'nope' }); } catch (e) { threw = true; } yes(threw, 'encode rejects unknown type');

// ---- signaling server messages ----
const SG = o => S.parseSignal(JSON.stringify(o));
eq(SG({ type: 'OPEN' }), { type: 'OPEN' }, 'OPEN');
eq(SG({ type: 'OFFER', src: 'pxarc32-gabc123def456', payload: { k: 'o', sdp: 'v=0\r\no=- 1 2 IN IP4 0.0.0.0\r\n' } }).type, 'OFFER', 'offer ok');
eq(SG({ type: 'OFFER', src: 'pxarc32-gabc123def456', payload: { k: 'o', sdp: '<script>' } }), null, 'offer sdp must be SDP');
eq(SG({ type: 'OFFER', src: 'pxarc32-gabc123def456', payload: { k: 'a', sdp: 'v=0\r\n' } }), null, 'offer marked as answer rejected');
eq(SG({ type: 'OFFER', src: '../admin', payload: { k: 'o', sdp: 'v=0\r\n' } }), null, 'bad peer id');
eq(SG({ type: 'OFFER', src: 'pxarc32-gabc123def456', payload: { k: 'o', sdp: 'v=0\r\no=- 1 2 IN', name: '<i>Eve</i>' } }).payload.name, 'iEvei', 'offer name cleaned');
eq(SG({ type: 'CANDIDATE', src: 'pxarc32-abcdef', payload: { c: 'candidate:1 1 udp 1 1.2.3.4 5 typ host', m: '0', i: 0 } }).type, 'CANDIDATE', 'candidate ok');
eq(SG({ type: 'CANDIDATE', src: 'pxarc32-abcdef', payload: { c: 'evil', m: '0', i: 0 } }), null, 'candidate must look like one');
eq(SG({ type: 'CANDIDATE', src: 'pxarc32-abcdef', payload: { c: 'candidate:x\r\na=evil', m: '0', i: 0 } }), null, 'candidate line injection rejected');
eq(SG({ type: 'ERROR', payload: { msg: '<b>down</b>' } }), { type: 'ERROR', payload: { msg: '<b>down</b>' } }, 'error text kept as text');
eq(SG({ type: 'SHELL' }), null, 'unknown signal type');
eq(S.parseSignal('x'.repeat(30000)), null, 'oversized signal');

// ---- copy-paste codes ----
eq(S.parseCode({ t: 'o', s: 'v=0\r\nabc' }), { t: 'o', s: 'v=0\r\nabc' }, 'code ok');
eq(S.parseCode({ t: 'o', s: 'v=0\r\nabc', run: 'x' }), null, 'code extra field');
eq(S.parseCode({ t: 'x', s: 'v=0\r\nabc' }), null, 'code type');

// ---- rate limiter ----
const b = new S.Bucket(2, 3); let got = 0; for (let i = 0; i < 10; i++) if (b.take(1000)) got++;
eq(got, 3, 'burst limited');
yes(!b.take(1100), 'no refill after 0.1 s at 2/s'); yes(b.take(1600), 'refills over time');

// ---- seeded random and hash ----
const r1 = S.mulberry(42), r2 = S.mulberry(42); let same = true; for (let i = 0; i < 1000; i++) if (r1() !== r2()) same = false; yes(same, 'seeded random repeats');
const r3 = S.mulberry(43); no(S.mulberry(42)() === r3(), 'different seeds differ');
eq(S.stateHash({ a: 1, b: [1, 2, { c: 3 }], s: 'text', f() {} }), S.stateHash({ a: 1, b: [1, 2, { c: 3 }], s: 'other', f() {} }), 'hash ignores strings and functions');
no(S.stateHash({ a: 1 }) === S.stateHash({ a: 2 }), 'hash sees numbers');
const cyc = { a: 1 }; cyc.self = cyc; yes(Number.isInteger(S.stateHash(cyc)), 'hash survives cycles');

// 3D world duel and hand-off messages
yes(P({ t: 'w3d', game: 'orbitlab', room: 'K7QF2M' }), 'world hand-off accepted');
no(P({ t: 'w3d', game: 'orbitlab', room: 'k7qf2m' }), 'hand-off room must be a clean upper-case code');
no(P({ t: 'w3d', game: 'orbitlab', room: 'K7QF0M' }), 'hand-off room rejects 0/O/1/I');
no(P({ t: 'w3d', game: '../city', room: 'K7QF2M' }), 'hand-off game id cannot be a path');
no(P({ t: 'w3d', game: 'orbitlab', room: 'K7QF2M', href: 'https://evil.example/' }), 'hand-off cannot carry a URL');
yes(P({ t: 'wh', world: 'orbit' }), 'world name accepted');
no(P({ t: 'wh', world: '../../etc' }), 'world name cannot be a path');
no(P({ t: 'wh', world: 'Orbit' }), 'world name is lower case');

console.log(n + ' checks, ' + fails + ' failed'); process.exit(fails ? 1 : 0);
