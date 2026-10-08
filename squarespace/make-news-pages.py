#!/usr/bin/env python3
"""Walks the news pages of the live site and prints the JS snippet with every post's publish timestamp
(newest first), used by footer-code.html to build numbered pagination. Re-run after many new posts."""
import json, sys, time, urllib.request, urllib.error
BASE = sys.argv[1] if len(sys.argv) > 1 else 'https://www.zegemabeachrecords.com'
ts, url = [], BASE + '/?format=json'
def get(url):
    for wait in (2, 5, 15, 30, 60, 90):
        try:
            return json.load(urllib.request.urlopen(urllib.request.Request(url, headers={'user-agent': 'zbr-pages/1.0'}), timeout=60))
        except urllib.error.HTTPError as e:
            if e.code != 429: raise
            time.sleep(wait)
    raise SystemExit('rate limited')
while url:
    d = get(url)
    time.sleep(1.0)
    ts += [i['publishOn'] for i in d['items']]
    p = d.get('pagination', {})
    url = BASE + '/?format=json&offset=%d' % p['nextPageOffset'] if p.get('nextPage') else None
assert ts == sorted(ts, reverse=True), 'not newest-first'
def b36(n):
    s = ''
    while True:
        n, r = divmod(n, 36); s = '0123456789abcdefghijklmnopqrstuvwxyz'[r] + s
        if not n: return s
parts = [b36(ts[0])] + [b36(ts[i - 1] - ts[i]) for i in range(1, len(ts))]
print(','.join(parts))
sys.stderr.write('%d posts\n' % len(ts))
