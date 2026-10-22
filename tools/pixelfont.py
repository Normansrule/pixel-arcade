#!/usr/bin/env python3
"""Turn the engine's 3x5 bitmap font (FONT in js/engine/01-draw.js) into a web font: fonts/pa-pixel.woff2.

The hub uses it for cartridge labels, stickers and the round clock, so the lettering outside the games is
the same lettering the games draw. Needs fontTools and brotli (pip install fonttools brotli).
    python3 tools/pixelfont.py
"""
import os, re
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(ROOT, 'js/engine/01-draw.js'), encoding='utf-8').read()
body = re.search(r'const FONT=\{(.*?)\};', src, re.S).group(1)
FONT = {(a or b or c): d for a, b, c, d in re.findall(r"""(?:'(.)'|"(.)"|(\w)):'(\d{5})'""", body)}

PX, ADV, ASC, DESC = 140, 4 * 140, 980, -280   # one pixel = 140 units; 3 px glyph + 1 px gap


def glyph(rows):
    pen = TTGlyphPen(None)
    for r, bits in enumerate(rows):
        b, c = int(bits), 0
        while c < 3:
            if b & (4 >> c):
                start = c
                while c < 3 and b & (4 >> c):
                    c += 1
                x0, x1 = start * PX, c * PX
                y1 = (5 - r) * PX
                y0 = y1 - PX
                # clockwise outer contour (TrueType)
                pen.moveTo((x0, y0)); pen.lineTo((x0, y1)); pen.lineTo((x1, y1)); pen.lineTo((x1, y0)); pen.closePath()
            else:
                c += 1
    return pen.glyph()


names, cmap, glyphs, metrics = ['.notdef', 'space'], {32: 'space'}, {}, {}
glyphs['.notdef'] = glyph(['77777'[i] if i in (0, 4) else '5' for i in range(5)])
glyphs['space'] = TTGlyphPen(None).glyph()
for ch, rows in sorted(FONT.items()):
    n = 'g%04x' % ord(ch)
    names.append(n)
    glyphs[n] = glyph(rows)
    cmap[ord(ch)] = n
    if ch.isalpha():
        cmap[ord(ch.lower())] = n          # the engine font is caps only; lowercase maps to the same shapes
for n in names:
    metrics[n] = (ADV, 0)

fb = FontBuilder(1000, isTTF=True)
fb.setupGlyphOrder(names)
fb.setupCharacterMap(cmap)
fb.setupGlyf(glyphs)
fb.setupHorizontalMetrics(metrics)
fb.setupHorizontalHeader(ascent=ASC, descent=DESC)
fb.setupNameTable({'familyName': 'PA Pixel', 'styleName': 'Regular',
                   'copyright': 'Pixel Arcade contributors, MIT licence (drawn from the engine bitmap font)'})
fb.setupOS2(sTypoAscender=ASC, sTypoDescender=DESC, sTypoLineGap=0, usWinAscent=ASC, usWinDescent=-DESC,
            sCapHeight=5 * PX, sxHeight=5 * PX)
fb.setupPost()
fb.font.flavor = 'woff2'
out = os.path.join(ROOT, 'fonts/pa-pixel.woff2')
fb.save(out)
print(out, os.path.getsize(out), 'bytes,', len(FONT), 'glyphs')
