# Third-party software and fonts

Pixel Arcade's own code and art are under the [MIT licence](LICENSE). It ships these third-party files, all stored in the repository so the arcade works offline:

| What | Where | Licence |
|---|---|---|
| [Three.js](https://threejs.org/) r160 (core build) | `vendor/three.module.min.js` | MIT, Copyright 2010–2023 Three.js Authors |
| Three.js examples: controls, math, objects, post-processing passes and shaders | `vendor/jsm/` | MIT, Copyright 2010–2023 Three.js Authors |
| [Anton](https://github.com/googlefonts/AntonFont) | `fonts/anton-400.woff2` | SIL Open Font License (OFL) 1.1, see [fonts/OFL-Anton.txt](fonts/OFL-Anton.txt) |
| [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono) | `fonts/jetbrains-mono-*.woff2` | SIL Open Font License (OFL) 1.1, see [fonts/OFL-JetBrainsMono.txt](fonts/OFL-JetBrainsMono.txt) |

The desktop app is built with [Electron](https://www.electronjs.org/) and [electron-builder](https://www.electron.build/) (both MIT). They are development dependencies installed by `npm install` in `desktop/` and are not stored in the repository.

Game names, characters and designs are original. Franchise names appear only as search tags and "inspired by" labels so players can find a game by what inspired it; those names belong to their owners.
