# Online play

Anyone can play anyone, as a guest, from the web page or the desktop app. There are no accounts: each player picks a nickname, which is stored only on their own device (owner decision, 12 Nov 2026).

## Playing

1. Open **Play online** (the link under the shelves).
2. One player presses **CREATE ROOM** and sends the 6-character room code (or the link, or the QR code) to a friend.
3. The friend types the code and presses **JOIN**. Opening a room link only fills in the code; nothing connects until the player presses JOIN.
4. The host picks a game. Both screens start together. There is a chat box and quick emotes in the lobby; it stays open from the **ONLINE · chat** button while you play.

| Kind of cabinet | Online mode | How it works |
|---|---|---|
| 2-player cabinets (145) | **Head to head** | Lockstep: both browsers run the same game from the same random seed and swap only button presses, a few frames ahead. A state hash is compared every 2 seconds; if it ever differs, the players are told. The host is player 1 and, as in local 2-player, owns the mouse: the host's pointer is sent with its buttons. |
| Solo cabinets (399) | **Score duel** | Both players get the same seed and the same round clock, see each other's score live, and the results card names the winner. **SPACE** asks for a rematch. |
| 3D worlds (56) | not yet | They run their own engines; online play for them is future work. |

No internet server reachable (a school network, a LAN party)? **Swap codes instead** does the same setup by copy-paste or QR code, with no signaling server; it normally only works on one network.

## How it connects

```
host browser ──offer/answer (a few KB, once)──> free PeerJS signaling server <── guest browser
     │                                                                              │
     └───────────── direct WebRTC data channel: buttons, scores, chat ──────────────┘
```

- **Signaling:** the free public PeerJS server (`0.peerjs.com`). It only passes the two connection offers. As soon as the players are linked, both browsers leave it, so nobody else can join the room. Settings: `js/online/config.js`. If it is ever down, `node tools/signal-server.js` runs a compatible one with no dependencies.
- **STUN (Session Traversal Utilities for NAT, network address translation):** Google's and Cloudflare's public STUN servers tell each browser its public address. This works for most home networks. Some strict networks (some offices, schools and mobile carriers) block direct links; the lobby says so. A TURN (Traversal Using Relays around NAT) relay would fix that but needs an account with a provider.
- **Privacy:** game data never passes through a server. Like any direct link, each browser can see the other's internet address, so the lobby suggests playing with people you know.

## Security

Every input is treated as hostile: names, chat, room codes, copy-paste codes, network messages, scores, saved data and imported files.

- **Strict schemas.** Each data-channel message type has a schema in `js/online/safe.js` (`MSG`). A message with an unknown type, an unknown or missing field, a wrong type, a number out of range, or more than 2 KB is dropped. Keys like `__proto__` and `constructor` are rejected. Signaling-server messages and copy-paste codes have their own schemas; session descriptions must start with `v=0` and ICE (Interactive Connectivity Establishment) candidates must look like one, with no line breaks. Outgoing messages are validated too.
- **Sanitised text.** Names keep letters (any script), digits, spaces, dots, dashes and underscores, 16 at most. Chat is 120 characters at most. Both are Unicode-normalised (NFKC), and control characters, right-to-left overrides, zero-width characters and stacked combining marks ("zalgo") are removed.
- **No HTML from people.** Other players' text is only ever shown with `textContent` or drawn on the canvas. `js/net.js` builds its interface with `createElement` and never uses `innerHTML`.
- **Rate limits.** Per connection: 240 messages a second (input runs at 60), chat and emotes at about one every 1.7 seconds with a burst of 4, signaling at 30 a second. A peer that keeps sending bad data is disconnected. 
- **Content Security Policy (CSP).** The hub and the builder carry a policy (`tools/csp.py`) that only runs the site's own scripts plus their exact inline scripts (pinned by SHA-256 hash), blocks plugins, frames and form posts, and limits network calls to the site, the GitHub API, and the signaling server. `python3 tools/csp.py --check` runs in CI (continuous integration).
- **Saved data and files.** The profile, the GitHub username, leaderboard rows and the "My games" shelf are checked when they are read back (only `builder/` links and PNG/JPEG/WebP thumbnails are allowed). Builder imports go through the builder's own `PX.normalize`.
- **No database, no SQL.** There are no accounts and no server-side storage, so there is no SQL (Structured Query Language) or other query language to inject into. Leaderboards are read from GitHub's API and every row is checked.
- **No secrets in the repository.** Everything in `js/online/config.js` is public by design; there are no keys or passwords.
- **Desktop app.** Context isolation, sandbox, no Node.js in pages, no `<webview>`, permission requests denied except fullscreen, pointer lock and clipboard writes, only `https:` links open (in the system browser), and the file server refuses paths outside the app.

Tests: `node tests/safe.test.js` (sanitisers and schemas, 100+ checks), `node tests/net.test.js` (lockstep determinism of every online 2-player cabinet), `node tests/online.e2e.js` (two real browser tabs link through a local signaling server, chat, play a lockstep game and a score duel, and survive injection attempts; needs Playwright).
