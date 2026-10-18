#!/usr/bin/env python3
"""Regenerate everything in the repo that is derived from the game registry.

    python3 tools/gen_docs.py          # counts, README tables, docs/GAMES.md, index.html script tags
    python3 tools/gen_docs.py --art    # ...and the README art in docs/readme/ (needs Pillow)
    python3 tools/gen_docs.py --check  # exit 1 if anything is out of date (used by CI)

The registry is read by `node tools/registry.js`, which loads the engine and every pack listed in
games/index.json with the real A.add(), so names, categories, modes and tags always match the hub.
"""
import json, os, re, subprocess, sys
from collections import Counter, defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = 'https://normansrule.github.io/pixel-arcade/'
CAT_ORDER = ['CLASSICS', 'PUZZLE', 'SPORTS', 'ACTION', 'RETRO 3D', 'VERSUS', 'BOARD', 'SIM', 'PARTY', 'CARDS']
CHECK = '--check' in sys.argv
changed = []


def rel(p):
    return os.path.join(ROOT, p)


def write(path, text, binary=False):
    """Write only when the content changes; in --check mode just record the difference."""
    old = None
    if os.path.exists(rel(path)):
        old = open(rel(path), 'rb' if binary else 'r', encoding=None if binary else 'utf-8').read()
    if old == text:
        return
    changed.append(path)
    if not CHECK:
        if binary:
            open(rel(path), 'wb').write(text)
        else:
            open(rel(path), 'w', encoding='utf-8').write(text)


def registry():
    out = subprocess.run(['node', rel('tools/registry.js')], capture_output=True, text=True, check=True, cwd=ROOT).stdout
    return json.loads(out)


def title(name):
    """FOUR IN A ROW -> Four In A Row (keeps words with digits, like 2048 or 3D, as they are)."""
    return ' '.join(w if re.search(r'\d', w) else w[:1] + w[1:].lower() for w in name.split(' '))


def mode(g):
    return 'full 3D' if g['href'] else ('vs CPU · 2P' if g['vs'] else 'solo')


def link(g):
    return SITE + (g['href'] if g['href'] else '#' + g['id'])


def src(g):
    return g['href'] + 'game.js' if g['href'] else g['src']


def counts(games):
    worlds = [g for g in games if g['href']]
    canvas = [g for g in games if not g['href']]
    return {'total': len(games), 'worlds': len(worlds), 'canvas': len(canvas),
            'vs': sum(1 for g in games if g['vs']), 'cats': Counter(g['cat'] for g in canvas)}


def worlds_sorted(games):
    w = [g for g in games if g['href']]
    order = {g['id']: i for i, g in enumerate(w)}
    return sorted(w, key=lambda g: (-(g['v'] or 0), -order[g['id']]))


# ---------------------------------------------------------------- counts everywhere
def sync_counts(n):
    rules = {
        'README.md': [
            (r'### \d+ original games · \d+ full-3D worlds', f"### {n['total']} original games · {n['worlds']} full-3D worlds"),
            (r'badge/games-\d+-', f"badge/games-{n['total']}-"),
            (r'badge/full--3D_worlds-\d+-', f"badge/full--3D_worlds-{n['worlds']}-"),
            (r'## 🌍 \d+ full-3D worlds', f"## 🌍 {n['worlds']} full-3D worlds"),
            (r'#-\d+-full-3d-worlds', f"#-{n['worlds']}-full-3d-worlds"),
            (r'## 🕹️ \d+ arcade cabinets', f"## 🕹️ {n['canvas']} arcade cabinets"),
            (r'#-\d+-arcade-cabinets', f"#-{n['canvas']}-arcade-cabinets"),
            (r'alt="\d+ full-3D worlds"', f'alt="{n["worlds"]} full-3D worlds"'),
        ],
        'index.html': [
            (r'content="\d+ original browser games and \d+ full-3D worlds', f'content="{n["total"]} original browser games and {n["worlds"]} full-3D worlds'),
            (r'content="\d+ original browser games, \d+ full-3D worlds', f'content="{n["total"]} original browser games, {n["worlds"]} full-3D worlds'),
            (r'placeholder="Search \d+ games"', f'placeholder="Search {n["total"]} games"'),
            (r'<span>\d+ real-time 3D worlds\.', f'<span>{n["worlds"]} real-time 3D worlds.'),
        ],
        'desktop/package.json': [
            (r'Pixel Arcade: \d+ original games, \d+ full-3D worlds', f"Pixel Arcade: {n['total']} original games, {n['worlds']} full-3D worlds"),
        ],
        'manifest.webmanifest': [
            (r'\d+ original browser games, \d+ full-3D worlds', f"{n['total']} original browser games, {n['worlds']} full-3D worlds"),
        ],
    }
    for path, subs in rules.items():
        if not os.path.exists(rel(path)):
            continue
        s = open(rel(path), encoding='utf-8').read()
        for pat, rep in subs:
            s = re.sub(pat, rep, s)
        write(path, s)


def replace_block(text, name, body):
    pat = re.compile(r'(<!-- gen:%s[^>]*-->\n)(?:.*?\n)?(<!-- /gen:%s -->)' % (name, name), re.S)
    if not pat.search(text):
        raise SystemExit(f'README.md is missing the <!-- gen:{name} --> block')
    return pat.sub(lambda m: m.group(1) + body + '\n' + m.group(2), text)


# ---------------------------------------------------------------- README blocks
def worlds_table(games):
    cells = []
    for g in worlds_sorted(games):
        cells.append(f'<td width="33%" align="center"><a href="{link(g)}"><img src="{g["img"]}" alt="{title(g["name"])}"></a>'
                     f'<br><b>{title(g["name"])}</b><br><sub>{g["style"]}-style</sub></td>')
    rows = ['<tr>\n' + '\n'.join(cells[i:i + 3]) + '\n</tr>' for i in range(0, len(cells), 3)]
    return '<table>\n' + '\n'.join(rows) + '\n</table>'


def cat_badges(n):
    out = []
    for c, k in sorted(n['cats'].items(), key=lambda x: -x[1]):
        out.append(f'![{c}](https://img.shields.io/badge/{c.replace(" ", "_")}-{k}-1a1a1a?style=flat-square&labelColor=ff4d00)')
    return ' '.join(out)


def progress_block(games, n):
    """Progress tracker from docs/progress.json: releases plus realism-pass status per 3D world."""
    p = json.load(open(rel('docs/progress.json'), encoding='utf-8'))
    worlds = [g for g in games if g['href']]
    real = {k: v for k, v in p['realism'].items() if not k.startswith('_')}
    unknown = [k for k in real if k not in {g['id'] for g in worlds}]
    if unknown:
        raise SystemExit('docs/progress.json names unknown 3D worlds: ' + ', '.join(unknown))
    done = sum(1 for g in worlds if g['id'] in real)
    pct = round(100 * done / len(worlds))
    bar = '█' * round(pct / 5) + '░' * (20 - round(pct / 5))
    latest = p['releases'][0]
    out = [f'![latest](https://img.shields.io/badge/latest-{latest["v"]}-ff4d00?style=flat-square) '
           f'![realism](https://img.shields.io/badge/realism_pass-{done}%2F{len(worlds)}_worlds-2fe8d0?style=flat-square)', '',
           f'**`{bar}` {done} of {len(worlds)} full-3D worlds have had the realism pass ({pct}%).**', '',
           '| Release | Date | Branch | Games | 3D | What it added |', '|---|---|---|---|---|---|']
    for i, r in enumerate(p['releases']):
        tot, wl = (n['total'], n['worlds']) if i == 0 else (r['games'], r['worlds'])
        out.append(f'| **{r["v"]}** | {r["date"]} | `{r["branch"]}` | {tot} | {wl} | {r["added"]} |')
    order = {r['v']: i for i, r in enumerate(p['releases'])}
    rows = sorted(worlds, key=lambda g: (order.get(real[g['id']]['v'], 99) if g['id'] in real else 999, title(g['name'])))
    out += ['', f'<details><summary><b>Realism pass by world</b> ({done} done · {len(worlds) - done} to do)</summary>', '',
            '| World | Style | Realism pass |', '|---|---|---|']
    for g in rows:
        r = real.get(g['id'])
        st = f'✅ {r["v"]}' + (f' · {r["passes"]} passes' if r['passes'] > 1 else '') if r else '○ to do'
        out.append(f'| [{title(g["name"])}]({link(g)}) | {g["style"]} | {st} |')
    out += ['', '</details>']
    return '\n'.join(out)


def readme(games, n):
    s = open(rel('README.md'), encoding='utf-8').read()
    s = replace_block(s, 'worlds', worlds_table(games))
    s = replace_block(s, 'cats', cat_badges(n))
    s = replace_block(s, 'progress', progress_block(games, n))
    write('README.md', s)


# ---------------------------------------------------------------- docs/GAMES.md
def games_md(games, n):
    by = defaultdict(list)
    for g in games:
        by[g['cat']].append(g)
    cats = sorted(by, key=lambda c: (CAT_ORDER.index(c) if c in CAT_ORDER else 99, c))
    L = ['# Every game', '',
         f"Pixel Arcade has **{n['total']} games**: {n['canvas']} canvas cabinets and {n['worlds']} full-3D worlds. "
         f"{n['vs']} of them can be played against the CPU or a second player. "
         'Every game runs against a round clock and ends on a results screen.', '',
         '_This file is generated by `python3 tools/gen_docs.py` from the game registry. Do not edit it by hand._', '',
         '**Jump to:** ' + ' · '.join(f'[{c.title()}](#{c.lower().replace(" ", "-")}--{len(by[c])})' for c in cats), '',
         '## Full-3D worlds', '',
         'Each one is its own folder of ES modules on Three.js. Search the hub for the inspiration to find it.', '',
         '| Game | Inspired by | Category | Since |', '|---|---|---|---|']
    for g in worlds_sorted(games):
        L.append(f"| [{title(g['name'])}]({link(g)}) | {g['style']} | {g['cat'].title()} | v{g['v']} |")
    L += ['', '## Rocket science, for real', '',
          f'[Orbit Lab]({SITE}orbit/) is a Kerbal-style rocket game where the maths is on screen: Tsiolkovsky gives your Δv, '
          'orbits are real two-body physics with patched conics, and a Hohmann helper works out each transfer burn. '
          'Ten space cabinets teach one physics idea each: gravity slingshots, docking, transfer windows, landers on eight worlds, '
          "Kepler's third law, solar sails, asteroid deflection, launch control, relativistic navigation and Δv-budget cargo runs.", '']
    for c in cats:
        L += [f'## {c.title()} · {len(by[c])}', '', '| Game | Mode | Round | Source |', '|---|---|---|---|']
        for g in sorted(by[c], key=lambda g: title(g['name'])):
            L.append(f"| [{title(g['name'])}]({link(g)}) | {mode(g)} | {'own clock' if g['href'] else str(g['time'] // 60) + ' min'} | [{src(g)}](../{src(g)}) |")
        L.append('')
    write('docs/GAMES.md', '\n'.join(L))


# ---------------------------------------------------------------- index.html script tags
def index_scripts():
    m = json.load(open(rel('games/index.json')))
    tags = '\n'.join(f'<script src="{p}"></script>' for p in m['core'] + m['packs'] + m['after'])
    s = open(rel('index.html'), encoding='utf-8').read()
    s = re.sub(r'(<!-- scripts:begin[^>]*-->\n).*?(\n<!-- scripts:end -->)', lambda x: x.group(1) + tags + x.group(2), s, flags=re.S)
    write('index.html', s)


# ---------------------------------------------------------------- README art
def art(games, n):
    from PIL import Image, ImageDraw, ImageFont
    import io
    D = lambda z: ImageFont.truetype(rel('fonts/anton-400.woff2'), z)
    M = lambda z, b=False: ImageFont.truetype(rel('fonts/jetbrains-mono-700.woff2' if b else 'fonts/jetbrains-mono-400.woff2'), z)
    ACC, BG = (255, 77, 0), (8, 8, 8)

    def header(d, x, y, idx, kicker, big):
        d.text((x, y), f'( {idx} )   {kicker}', font=M(22), fill=ACC)
        d.text((x - 4, y + 34), big, font=D(110), fill=(242, 242, 242))
        w = d.textlength(big, font=D(110))
        d.rectangle([x - 4 + w + 8, y + 34 + 118, x - 4 + w + 30, y + 34 + 140], fill=ACC)

    def shade(im, h):
        """darken the bottom of a tile so its label reads"""
        g = Image.linear_gradient('L').resize((im.width, h))
        black = Image.new('RGB', (im.width, h), (0, 0, 0))
        band = im.crop((0, im.height - h, im.width, im.height))
        im.paste(Image.composite(black, band, g.point(lambda v: int(v * .85))), (0, im.height - h))

    def jpg(im, q=82):
        b = io.BytesIO()
        im.save(b, 'JPEG', quality=q, optimize=True, progressive=True)
        return b.getvalue()

    # worlds.jpg: every 3D world (plus the builder) as a labelled card
    tiles = [(g['img'], g['style'] + '-style', title(g['name']).upper()) for g in worlds_sorted(games)]
    tiles.append(('docs/cards/builder3d.jpg', '2D + 3D editor', 'GAME BUILDER'))
    cols, tw, th, gap, pad = 4, 480, 270, 14, 26
    rows = (len(tiles) + cols - 1) // cols
    W = pad * 2 + cols * tw + (cols - 1) * gap
    top = 230
    im = Image.new('RGB', (W, top + rows * (th + gap) + pad - gap), BG)
    d = ImageDraw.Draw(im)
    header(d, pad + 4, 36, '01', 'FULL 3D', f"{n['worlds']} FULL-3D WORLDS")
    for i, (path, kicker, name) in enumerate(tiles):
        x, y = pad + (i % cols) * (tw + gap), top + (i // cols) * (th + gap)
        t = Image.open(rel(path)).convert('RGB').resize((tw, th), Image.LANCZOS)
        shade(t, 110)
        td = ImageDraw.Draw(t)
        td.text((14, th - 70), kicker.upper(), font=M(15, True), fill=ACC)
        td.text((14, th - 50), name, font=D(36), fill=(242, 242, 242))
        im.paste(t, (x, y))
        d.rectangle([x, y, x + tw - 1, y + th - 1], outline=(40, 40, 40))
    write('docs/readme/worlds.jpg', jpg(im), binary=True)

    # wall.jpg: a wall of canvas cabinet thumbnails, picked evenly across categories
    canvas = [g for g in games if not g['href'] and os.path.exists(rel(f"docs/thumbs/{g['id']}.jpg"))]
    by = defaultdict(list)
    for g in canvas:
        by[g['cat']].append(g)
    pick, i = [], 0
    while len(pick) < 72 and any(by.values()):
        for c in sorted(by):
            if i < len(by[c]) and len(pick) < 72:
                pick.append(by[c][i])
        i += 1
    cols, tw, th = 12, 160, 120
    im = Image.new('RGB', (1920, 230 + 6 * th), BG)
    d = ImageDraw.Draw(im)
    header(d, 30, 36, '02', 'ARCADE CABINETS', f"{n['canvas']} CANVAS CABINETS")
    for k, g in enumerate(pick):
        t = Image.open(rel(f"docs/thumbs/{g['id']}.jpg")).convert('RGB').resize((tw, th), Image.LANCZOS)
        im.paste(t, ((k % cols) * tw, 230 + (k // cols) * th))
    write('docs/readme/wall.jpg', jpg(im), binary=True)

    # reel.gif: one frame per 3D world, with its name and inspiration
    frames = []
    for g in worlds_sorted(games):
        f = Image.open(rel(g['img'])).convert('RGB').resize((600, 338), Image.LANCZOS)
        shade(f, 120)
        fd = ImageDraw.Draw(f)
        fd.ellipse([402, 20, 414, 32], fill=ACC)
        fd.text((422, 15), 'PIXEL ARCADE', font=M(17), fill=(242, 242, 242))
        fd.text((20, 250), (g['style'] + '-style').upper(), font=M(15, True), fill=ACC)
        nm = title(g['name']).upper()
        fd.text((18, 266), nm, font=D(48), fill=(242, 242, 242))
        w = fd.textlength(nm, font=D(48))
        fd.rectangle([18 + w + 4, 318, 18 + w + 14, 328], fill=ACC)
        frames.append(f.quantize(colors=128, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE))
    b = io.BytesIO()
    frames[0].save(b, 'GIF', save_all=True, append_images=frames[1:], duration=1300, loop=0, optimize=True)
    write('docs/readme/reel.gif', b.getvalue(), binary=True)


def main():
    reg = registry()
    games = reg['games']
    missing = [g['id'] for g in games if g['href'] and not g.get('style')]
    if missing:
        raise SystemExit('3D worlds need a style: field in their A.add(): ' + ', '.join(missing))
    n = counts(games)
    index_scripts()
    sync_counts(n)
    readme(games, n)
    games_md(games, n)
    if '--art' in sys.argv:
        art(games, n)
    print(f"{n['total']} games ({n['canvas']} canvas, {n['worlds']} 3D).",
          ('Out of date: ' if CHECK else 'Updated: ') + (', '.join(changed) or 'nothing'))
    if CHECK and changed:
        sys.exit(1)


if __name__ == '__main__':
    main()
