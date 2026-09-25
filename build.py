#!/usr/bin/env python3
"""Bundle the arcade into one self-contained file: dist/pixel-arcade.html"""
import re, os
src = open('index.html', encoding='utf-8').read()
src = src.replace('<link rel="stylesheet" href="style.css">', '<style>\n' + open('style.css', encoding='utf-8').read() + '</style>')
src = re.sub(r'<script src="([^"]+)"></script>', lambda m: '<script>\n' + open(m.group(1), encoding='utf-8').read() + '</script>', src)
import base64
if os.path.exists('docs/kart.png'):
    src = src.replace('src="docs/kart.png"', 'src="data:image/png;base64,' + base64.b64encode(open('docs/kart.png','rb').read()).decode() + '"')
src = src.replace('href="kart/"', 'href="https://normansrule.github.io/pixel-arcade/kart/"')
os.makedirs('dist', exist_ok=True)
open('dist/pixel-arcade.html', 'w', encoding='utf-8').write(src)
print('dist/pixel-arcade.html', len(src) // 1024, 'KB')
