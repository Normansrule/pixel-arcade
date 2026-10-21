#!/usr/bin/env python3
"""Render the README header (docs/screenshot.png): a 3D ring of arcade cabinets showing real game screens,
with the PIXEL ARCADE title and live counts. The scene is tools/readme_hero.html (Three.js from vendor/).
Run:  python3 -m http.server 8765 &  then  python3 tools/readme_hero.py"""
import asyncio, io, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gen_docs import registry, counts, ROOT
from playwright.async_api import async_playwright
from PIL import Image
BASE = next((a for a in sys.argv[1:] if a.startswith('http')), 'http://127.0.0.1:8765/').rstrip('/')
async def main():
    n = counts(registry()['games'])
    url = f"{BASE}/tools/readme_hero.html?games={n['total']}&cabs={n['canvas']}&worlds={n['worlds']}"
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'])
        page = await b.new_page(viewport={'width': 1280, 'height': 800}, device_scale_factor=2)  # render at 2x, downscale for clean edges
        await page.goto(url)
        await page.wait_for_function('window.HERO_READY', timeout=120000)
        png = await page.screenshot()
        await b.close()
    out = os.path.join(ROOT, 'docs', 'screenshot.png')
    Image.open(io.BytesIO(png)).convert('RGB').resize((1280, 800), Image.LANCZOS).save(out, optimize=True)
    print('wrote', out)
asyncio.run(main())
