#!/usr/bin/env python3
"""Writes zbr-custom.min.css: zbr-custom.css without comments and extra whitespace.
Squarespace's Custom CSS box silently drops whatever goes past its size limit, so paste the .min.css file there.
Edit zbr-custom.css (the readable source); re-run this after every change."""
import re, pathlib
here = pathlib.Path(__file__).parent
src = (here / 'zbr-custom.css').read_text()
out, i, n = [], 0, len(src)
while i < n:                       # copy strings and url(...) untouched, drop /* comments */
    c = src[i]
    if c in '"\'':
        j = i + 1
        while j < n and src[j] != c:
            j += 2 if src[j] == '\\' else 1
        out.append(src[i:j + 1]); i = j + 1
    elif src.startswith('/*', i):
        j = src.find('*/', i + 2)
        i = n if j < 0 else j + 2
        out.append(' ')
    else:
        out.append(c); i += 1
css = ''.join(out)
# collapse whitespace outside strings
parts = re.split(r'("(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\')', css)
for k in range(0, len(parts), 2):
    p = re.sub(r'\s+', ' ', parts[k])
    p = re.sub(r' ?([{};]) ?', r'\1', p)
    p = re.sub(r';}', '}', p)
    parts[k] = p
css = ''.join(parts).strip() + '\n'
(here / 'zbr-custom.min.css').write_text(css)
print(len(src.encode()), '->', len(css.encode()), 'bytes')
