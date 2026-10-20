#!/usr/bin/env python3
"""Walks the news pages of the live site and prints the JS snippet with every post's publish timestamp
(newest first), used by footer-code.html to build numbered pagination. Re-run only occasionally (e.g. once a year).

  python3 make-news-pages.py            prints the list (to paste after  window.__zbrTS =  in footer-code.html)
  python3 make-news-pages.py --write    puts the new list into footer-code.html for you
"""
import json, sys, time, urllib.request, urllib.error
WRITE = '--write' in sys.argv
args = [a for a in sys.argv[1:] if not a.startswith('--')]
BASE = args[0] if args else 'https://www.zegemabeachrecords.com'
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
listing = ','.join(parts)
if WRITE:
    import pathlib, re
    f = pathlib.Path(__file__).parent / 'footer-code.html'
    txt = f.read_text()
    new, n = re.subn(r"(window\.__zbrTS = ')[^']*(')", lambda m: m.group(1) + listing + m.group(2), txt, count=1)
    assert n == 1, 'window.__zbrTS line not found in footer-code.html'
    f.write_text(new)
    sys.stderr.write('footer-code.html updated\n')
else:
    print(listing)
sys.stderr.write('%d posts\n' % len(ts))
