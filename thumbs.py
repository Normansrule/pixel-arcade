#!/usr/bin/env python3
"""Pre-render hub thumbnails for every canvas cabinet into docs/thumbs/<id>.jpg.
Run after adding or restyling games:  python3 -m http.server 8765 &  then  python3 thumbs.py"""
import asyncio, base64, os, sys
from playwright.async_api import async_playwright
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'docs', 'thumbs')
URL = next((a for a in sys.argv[1:] if a.startswith('http')), 'http://127.0.0.1:8765/')
async def main():
    os.makedirs(OUT, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        page = await b.new_page(viewport={'width': 1280, 'height': 900})
        await page.route('**/docs/thumbs/*.jpg', lambda r: r.fulfill(status=404, body=''))  # force live renders
        await page.goto(URL)
        await page.wait_for_function('window.A && A.ready', timeout=300000)
        ids = await page.evaluate("A.games.filter(g=>!g.href&&!g.img).map(g=>g.id)")
        if '--all' not in sys.argv:
            ids = [g for g in ids if not os.path.exists(os.path.join(OUT, g + '.jpg'))]  # resume; pass --all to redo every thumbnail
        for i, gid in enumerate(ids):
            d = await page.evaluate("""id=>{const el=document.querySelector('.cab[data-id="'+id+'"]');el.__live();
              const c=el.querySelector('canvas');return c.toDataURL('image/jpeg',0.82);}""", gid)
            open(os.path.join(OUT, gid + '.jpg'), 'wb').write(base64.b64decode(d.split(',')[1]))
            if i % 50 == 0: print(i, gid, flush=True)
        print('wrote', len(ids), 'thumbnails to', OUT)
        await b.close()
asyncio.run(main())
