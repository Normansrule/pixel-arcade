#!/usr/bin/env python3
"""Content Security Policy (CSP) for the arcade's pages that handle other people's input: the hub (online play,
chat, names) and the game builder (imported projects and shared play links).

GitHub Pages cannot send HTTP headers, so the policy is a <meta http-equiv> tag. Scripts may only come from the
site itself plus the exact inline <script> blocks of each page (pinned by SHA-256 hash), so injected markup can
never run code. Network calls are limited to the site, the GitHub API (leaderboards), the signaling server named
in js/online/config.js.

    python3 tools/csp.py          rewrite the tags after editing an inline <script>
    python3 tools/csp.py --check  fail if a tag is missing or stale (run by the tests and CI)
"""
import base64, hashlib, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = ['index.html', 'builder/index.html']

def signal_hosts():
    cfg = open(os.path.join(ROOT, 'js', 'online', 'config.js'), encoding='utf-8').read()
    m = re.search(r"signal:\{host:'([a-z0-9.-]+)',port:(\d+),path:'[^']*',key:'[^']*',secure:(true|false)\}", cfg)
    if not m:
        raise SystemExit('tools/csp.py: could not read signal host from js/online/config.js')
    host, port, secure = m.group(1), m.group(2), m.group(3) == 'true'
    hp = host if port in ('443', '80') else f'{host}:{port}'
    return [('wss://' if secure else 'ws://') + hp, ('https://' if secure else 'http://') + hp]

def policy(html):
    hashes = []
    for m in re.finditer(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>', html, re.S):
        h = base64.b64encode(hashlib.sha256(m.group(1).encode('utf-8')).digest()).decode()
        hashes.append(f"'sha256-{h}'")
    connect = ["'self'", 'https://api.github.com'] + signal_hosts()
    rules = [
        "default-src 'self'",
        "script-src 'self' " + ' '.join(hashes),
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https://github.com https://avatars.githubusercontent.com",
        "font-src 'self'",
        "media-src 'self' data: blob:",
        'connect-src ' + ' '.join(connect),
        "worker-src 'self'",
        "manifest-src 'self'",
        "frame-src 'none'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'none'",
    ]
    return '; '.join(r.strip() for r in rules)

TAG = re.compile(r'<meta http-equiv="Content-Security-Policy" content="[^"]*">\n?')

def main():
    check = '--check' in sys.argv
    bad = []
    for page in PAGES:
        path = os.path.join(ROOT, page)
        html = open(path, encoding='utf-8').read()
        body = TAG.sub('', html)
        tag = f'<meta http-equiv="Content-Security-Policy" content="{policy(body)}">\n'
        new = re.sub(r'(<meta charset="utf-8">\n)', lambda m: m.group(1) + tag, body, count=1)
        if new == body:
            raise SystemExit(f'{page}: no <meta charset="utf-8"> line to put the policy after')
        if new != html:
            if check:
                bad.append(page)
            else:
                open(path, 'w', encoding='utf-8').write(new)
                print('CSP updated:', page)
    if bad:
        raise SystemExit('Content Security Policy is missing or stale in: ' + ', '.join(bad) + ' (run python3 tools/csp.py)')
    if check:
        print('CSP ok:', ', '.join(PAGES))

if __name__ == '__main__':
    main()
