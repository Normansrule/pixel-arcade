# Online multiplayer: options and trade-offs

Status: **option 1 is built for Four in a Row** (owner decision, 12 Oct 2026: codes only, no outside server). Everything else is single-player or local two-player. This page compares the ways to add online play to a static site served by GitHub Pages, so the owner can pick one before any code is written.

## The constraint

GitHub Pages serves files only. There is no server process, no WebSocket endpoint and no database. Browsers cannot open raw sockets to each other. So online play needs one of:

1. a direct browser-to-browser link (WebRTC, Web Real-Time Communication), which still needs a one-time *signaling* exchange to set up; or
2. a third-party relay or game server, which breaks the "no network calls, offline-safe" rule for that mode.

Whatever is chosen, online play must stay an optional mode: every game keeps working offline against the CPU.

## Option 1: WebRTC with copy-paste or QR signaling (no server at all)

How it works: player A clicks HOST and gets an offer code (a compressed session description, roughly 300 to 600 characters, or a QR code). Player B pastes or scans it and gets an answer code back, which A pastes. The browsers then talk directly over an `RTCDataChannel`.

| | |
|---|---|
| Server needed | None |
| Cost | Free forever |
| Player experience | Clunky: two codes swapped by chat or phone camera before each match |
| Connectivity | Works on most home networks through public STUN (Session Traversal Utilities for NAT) servers. Fails behind symmetric NAT (Network Address Translation), common on mobile data and some school or office networks, about 10 to 20% of pairs, unless a TURN (Traversal Using Relays around NAT) relay is added, which costs money |
| Players | Best for 1v1 or a host with up to 3 to 4 friends (star topology through the host) |
| Matchmaking | None; you play people you already know |
| Offline rule | The STUN request goes to a public server (for example Google's); that is the only outside call, made only when the player picks ONLINE |

## Option 2: WebRTC with a free signaling relay

Same peer-to-peer link, but the offer and answer travel through a public relay instead of copy-paste. Players share a short room code like `PX-4821`.

Candidates: public MQTT (Message Queuing Telemetry Transport) brokers over WebSocket, a free Firebase Realtime Database project, or a tiny Cloudflare Worker (free tier: 100,000 requests a day).

| | |
|---|---|
| Server needed | A third-party service; a Cloudflare Worker or Firebase project would be owned by the repo owner |
| Cost | Free tier is enough for hobby traffic |
| Player experience | Good: type a 4-digit room code |
| Connectivity | Same NAT limits as option 1 |
| Risks | Public brokers can vanish or rate-limit; any relay needs abuse limits; codes must expire |

## Option 3: an authoritative game server

A small Node server (on Fly.io, Render or a cheap VPS, virtual private server) runs the simulation; browsers send input and receive snapshots over WebSocket.

| | |
|---|---|
| Server needed | Yes, always on |
| Cost | Roughly 0 to 10 USD a month, plus upkeep |
| Player experience | Best: public matchmaking, anti-cheat, works on any network |
| Effort | Large: each game's simulation must run headless in Node, plus lag compensation and interpolation |
| Fit | Poor for this project; it contradicts the static, offline-first design |

## What each game type needs

- **Turn-based and puzzle versus games** (board games, cards, Four in a Row): tiny messages and lag-tolerant. Easy with option 1 or 2. The best first target.
- **Canvas real-time versus games** (pong family, fighting games): need input sync with rollback or a fixed input delay at 60 Hz. Feasible peer-to-peer for 1v1 because the canvas engine is deterministic apart from `Math.random`, which would need a shared seed.
- **3D shooters**: need host-authoritative snapshots at 20 to 30 Hz, client-side prediction and hit validation on the host. Feasible for 2 to 4 humans plus CPU bots per match on option 1 or 2; 5v5 or larger would need option 3.

## Recommendation

1. Start with **option 1 (copy-paste or QR)** for the turn-based versus cabinets. It needs no account or server, keeps the site static, and proves the shared networking layer (`js/net.js`: offer and answer codec, data channel, seeded random, input queue).
2. If people use it, add **option 2 with a Cloudflare Worker owned by the repo owner** for room codes, behind a clearly labelled ONLINE button.
3. Then bring 1v1 real-time canvas games (input delay), then a 2 to 4 player mode for one shooter, with the host running the bots.
4. Do not do option 3 unless the arcade gains a real player base.

## What is built

- `js/net.js`: the hub's **⇄ Play online** link opens a lobby. The host picks a game and gets an offer code plus a QR code that encodes a `#join=` link to the arcade; the guest pastes the code or scans the QR code, and sends back an answer code. Codes are the session description, deflate-compressed and base64url-encoded (about 600 characters). The QR encoder is built in (byte mode, error correction level L, versions 1 to 20).
- `RTCPeerConnection` is created with **no ICE (Interactive Connectivity Establishment) servers**, so no STUN request leaves the browser. That keeps the no-network rule, but it means the two players must be on the same network (same Wi-Fi or LAN); across the internet most connections will fail.
- A game opts in with `net:1` in its registry entry and reads `A.net`: `A.net.on`, `A.net.me` (0 host, 1 guest), `A.net.send(obj)` and `A.net.inbox`. Four in a Row sends the hovered column and each move; each browser applies the other's moves, so both boards stay identical.

Decisions taken: codes only, no outside server; first game Four in a Row. Earlier open questions, kept for reference: whether an outside STUN request and, later, a Worker are acceptable exceptions to the "no network calls" rule for the ONLINE mode only; and which game to pilot (suggested: Four in a Row or Checkers).
