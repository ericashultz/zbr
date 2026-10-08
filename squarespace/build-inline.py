#!/usr/bin/env python3
"""Builds store-grid-inline.html: the grid as one block to paste into a Squarespace Code Block
(no Vercel needed). Reads the products straight from the Squarespace site it is pasted into."""
import re, pathlib
here = pathlib.Path(__file__).parent
js = (here / 'store-grid.js').read_text()
js = re.sub(r'^/\*.*?\*/\s*', '', js, count=1, flags=re.S)        # header comment mentions </script>
assert 'var SITE_MODE = false;' in js
js = js.replace('var SITE_MODE = false;', 'var SITE_MODE = true;')  # always read from this site
assert '</script' not in js.lower()
html = '<div id="zbr-store"></div>\n<script>\n' + js.strip() + '\n</script>\n'
(here / 'store-grid-inline.html').write_text(html)
print(len(html), 'bytes ->', here / 'store-grid-inline.html')
