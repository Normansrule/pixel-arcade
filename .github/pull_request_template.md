## What changed

<!-- What a player or developer will notice. -->

## Checklist

- [ ] Original names and art; franchise names only in `tags` or `style`
- [ ] Every new game has a time limit and a results screen; CPU opponents have difficulty levels
- [ ] `node tests/test.js` passes (or the slices touched, with `ONLY=` / `RANGE=`)
- [ ] `node tests/quality.js` passes for new or changed cabinets (`PART=` keeps `docs/QUALITY.md` unchanged)
- [ ] 3D worlds load with zero page errors and zero external requests
- [ ] Screenshots of the title, play and results screens checked by eye
- [ ] `python3 tools/gen_docs.py --check` is clean; `python3 tools/build.py` run after moving or adding files
