#!/usr/bin/env python3
"""footer-code.template.html + the post-time table from make-news-pages.py  ->  footer-code.html"""
import pathlib, subprocess, sys
here = pathlib.Path(__file__).parent
ts = sys.argv[1] if len(sys.argv) > 1 else subprocess.run([sys.executable, str(here / 'make-news-pages.py')], capture_output=True, text=True, check=True).stdout.strip()
t = (here / 'footer-code.template.html').read_text()
assert '__NEWS_TS__' in t
(here / 'footer-code.html').write_text(t.replace('__NEWS_TS__', ts))
print('footer-code.html written;', len(ts), 'chars of post times')
