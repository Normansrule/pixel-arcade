# Summit Rush - notes

Original snowboard race (inspiration tag: SSX). One file of game code (`game.js`), the page (`index.html`) and styles (`summit.css`).

- **Course:** `cx(z)` is the centre line, `hz(z)` the fall line, `side()` raises the valley walls. `ground(x,z)` = `base()` + `kick()`; kickers are part of the height field, so launches come from the physics, not from scripted jumps.
- **Rider physics:** a 60 Hz fixed step. Speed comes from slope gravity along the heading, minus quadratic drag (tuck lowers it) and carve friction. When the ground drops away faster than gravity, the rider is airborne. In the air A/D spins; a landing must be within 0.75 rad of a half turn or it is a wipeout.
- **CPU riders:** `think()` aims at the next gate or kicker, and difficulty sets their drag. A small rubber band keeps races close.
- **Scoring:** place points (1500/1000/600/300), 100 per gate, trick points `n*n*100+50n` for n half turns, and a time bonus.
- **Test hook:** `window.SUMMIT` has start, skipCount, autopilot, warp, step, endNow and setInput.
