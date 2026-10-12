#!/usr/bin/env python3
"""Regenerate sw.js (offline app shell) and offline.json (every file, for "save all games offline").
Run after adding files; build.py calls it automatically."""
import os, json, time, hashlib
ROOT = os.path.dirname(os.path.abspath(__file__))
SKIP_DIRS = {'.git', '.github', 'dist', 'desktop', 'node_modules', '__pycache__'}
SKIP_EXT = {'.py', '.sh', '.md', '.mjs', '.orig', '.bak', '.log'}
SKIP_FILES = {'test.js', 'quality.js', 'quick.js', 'scorecheck.js', 'sim2.js', 'qa.js', 'sw.js', 'LICENSE', '.nojekyll'}
files = []
for d, dirs, fs in os.walk(ROOT):
    dirs[:] = sorted(x for x in dirs if x not in SKIP_DIRS)
    for f in sorted(fs):
        rel = os.path.relpath(os.path.join(d, f), ROOT).replace(os.sep, '/')
        if f in SKIP_FILES or os.path.splitext(f)[1] in SKIP_EXT or rel.startswith(('games/_template', 'docs/readme/', 'docs/QUALITY')) or (rel.startswith('docs/') and rel.count('/') == 1 and rel.endswith('.png')):
            continue
        files.append(rel)
# full-size docs/*.png screenshots are for the README only; the hub uses docs/cards/*.jpg
# the app shell: hub + engine + every canvas game + fonts + icons (small; the 3D worlds and thumbnails cache on first visit)
core = ['./'] + [f for f in files if f in ('index.html', 'style.css', 'manifest.webmanifest') or f.startswith(('js/', 'games/', 'fonts/', 'docs/icons/'))]
h = hashlib.sha1(''.join(sorted(files)).encode() + b''.join(open(os.path.join(ROOT, f), 'rb').read() for f in core if f != './')).hexdigest()[:10]
json.dump({'version': h, 'files': files}, open(os.path.join(ROOT, 'offline.json'), 'w'))
sw = open(os.path.join(ROOT, 'sw.template.js')).read().replace('__VERSION__', h).replace('__CORE__', json.dumps(core))
open(os.path.join(ROOT, 'sw.js'), 'w').write(sw)
print('sw.js', h, len(core), 'core files;', 'offline.json', len(files), 'files')
